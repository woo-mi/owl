/*
 * AFTER 1 — motion tuner.
 *
 * Add ?tune to the page URL to open it. Every control edits the live MOTION
 * table in chat-motion.js, so the next motion you trigger uses the new value.
 * Dashed lines are the values measured from the iMessage recording. Settings
 * persist in this browser only; "Copy values" copies the whole table as JSON.
 *
 * Springs are tuned the way UIKit and SwiftUI name them: response (the period of
 * the undamped spring) and damping (1 means no bounce).
 */
(() => {
  'use strict';
  const engine = window.OwlChatMotion;
  if (!engine || !new URLSearchParams(location.search).has('tune')) return;
  const { MOTION, DEFAULTS, curves } = engine;
  const STORE = 'owl.after-1.motion';
  const STORE_REPLAY = 'owl.after-1.motion.replay';
  const SVG = 'http://www.w3.org/2000/svg';
  const CURVE_LOW = -0.25;
  const CURVE_HIGH = 1.25;
  document.body.classList.add('motion-tuning');

  // ---------------------------------------------------------------- helpers
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const round = (value, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits;
  const clone = value => JSON.parse(JSON.stringify(value));
  const lookup = (root, path) => path.split('.').reduce((node, key) => node[key], root);
  const fixed = (value, digits = 2) => String(round(value, digits)).replace(/^(-?)0\./, '$1.');

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'text') element.textContent = value;
      else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? '' : value);
    }
    element.append(...children.flat().filter(Boolean));
    return element;
  }

  function s(tag, attributes = {}) {
    const element = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  }

  function assign(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object') assign(target[key], source[key]);
      else target[key] = source[key];
    }
  }

  function merge(target, source) {
    for (const key of Object.keys(target)) {
      if (!(key in source)) continue;
      const mine = target[key], theirs = source[key];
      if (Array.isArray(mine)) {
        if (Array.isArray(theirs) && theirs.length === mine.length && theirs.every(Number.isFinite)) mine.splice(0, mine.length, ...theirs);
      } else if (mine && typeof mine === 'object') {
        if (theirs && typeof theirs === 'object') merge(mine, theirs);
      } else if (typeof mine === typeof theirs && (typeof mine !== 'number' || Number.isFinite(theirs))) target[key] = theirs;
    }
  }

  function changes(now, was) {
    if (Array.isArray(now)) return now.reduce((count, value, i) => count + (value !== was[i] ? 1 : 0), 0);
    if (now && typeof now === 'object') return Object.keys(now).reduce((count, key) => count + changes(now[key], was[key]), 0);
    return now !== was ? 1 : 0;
  }

  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* private mode: tuning still works for this visit */ } };

  try {
    const saved = JSON.parse(read(STORE) || 'null');
    if (saved && typeof saved === 'object') merge(MOTION, saved);
  } catch { /* ignore a corrupt saved table */ }

  // ------------------------------------------------------------------ state
  const redraws = [];
  let replayOnRelease = read(STORE_REPLAY) !== '0';
  let replayTimer = 0;
  let status = null;
  let resetButton = null;
  const refresh = () => {
    redraws.forEach(redraw => redraw());
    if (!resetButton) return;
    const edited = changes(MOTION, DEFAULTS);
    resetButton.textContent = edited ? `Reset all (${edited})` : 'Reset all';
    resetButton.disabled = !edited;
  };

  function changed(section, released) {
    write(STORE, JSON.stringify(MOTION));
    refresh();
    if (!released || !replayOnRelease || !section.replay) return;
    clearTimeout(replayTimer);
    replayTimer = setTimeout(section.replay, 150);
  }

  // --------------------------------------------------------------- controls
  function range({ object, key, label, min, max, step, unit = '', digits = 2 }, section) {
    const slider = h('input', { type: 'range', min, max, step, 'aria-label': label });
    const number = h('input', { type: 'number', min, max, step, 'aria-label': `${label}, exact value` });
    const redraw = () => {
      slider.value = object[key];
      number.value = round(object[key], digits);
    };
    const commit = (value, released) => {
      const next = Number(value);
      if (!Number.isFinite(next)) return redraw();
      object[key] = clamp(next, min, max);
      changed(section, released);
    };
    slider.addEventListener('input', () => commit(slider.value, false));
    slider.addEventListener('change', () => commit(slider.value, true));
    number.addEventListener('change', () => commit(number.value, true));
    redraws.push(redraw);
    redraw();
    return h('div', { class: 'mt-row' }, h('span', { class: 'mt-label', text: label }), slider, number, h('span', { class: 'mt-unit', text: unit }));
  }

  function toggle({ object, key, label }, section) {
    const box = h('input', { type: 'checkbox' });
    const redraw = () => { box.checked = Boolean(object[key]); };
    box.addEventListener('change', () => {
      object[key] = box.checked;
      changed(section, true);
    });
    redraws.push(redraw);
    redraw();
    return h('label', { class: 'mt-toggle' }, box, h('span', { text: label }));
  }

  // A cubic-bezier editor: drag the two handles, or type the four numbers.
  function curveEditor({ curve, reference, label }, section) {
    const plot = s('svg', { viewBox: `-0.1 ${CURVE_LOW} 1.2 ${CURVE_HIGH - CURVE_LOW}`, class: 'mt-curve', role: 'img', 'aria-label': `${label} curve` });
    const path = s('path', { class: 'mt-curve-line' });
    const ghost = s('path', { class: 'mt-curve-ref' });
    const arms = [s('path', { class: 'mt-curve-arm' }), s('path', { class: 'mt-curve-arm' })];
    const handles = [0, 1].map(i => s('circle', { class: 'mt-handle', r: 0.055, tabindex: 0, 'data-index': i, role: 'slider', 'aria-label': `${label} handle ${i + 1}` }));
    plot.append(
      s('rect', { class: 'mt-curve-box', x: 0, y: 0, width: 1, height: 1 }),
      s('line', { class: 'mt-curve-diagonal', x1: 0, y1: 1, x2: 1, y2: 0 }),
      ghost, ...arms, path, ...handles
    );
    const readout = h('code', { class: 'mt-readout' });
    const fields = ['x1', 'y1', 'x2', 'y2'].map((name, i) => {
      const input = h('input', { type: 'number', step: 0.01, min: i % 2 ? CURVE_LOW : 0, max: i % 2 ? CURVE_HIGH : 1, 'aria-label': `${label} ${name}` });
      input.addEventListener('change', () => {
        const next = Number(input.value);
        if (Number.isFinite(next)) curve[i] = round(clamp(next, i % 2 ? CURVE_LOW : 0, i % 2 ? CURVE_HIGH : 1));
        changed(section, true);
      });
      return input;
    });
    const trace = c => `M0 1 C${c[0]} ${1 - c[1]}, ${c[2]} ${1 - c[3]}, 1 0`;
    const redraw = () => {
      path.setAttribute('d', trace(curve));
      ghost.setAttribute('d', trace(reference));
      arms[0].setAttribute('d', `M0 1 L${curve[0]} ${1 - curve[1]}`);
      arms[1].setAttribute('d', `M1 0 L${curve[2]} ${1 - curve[3]}`);
      handles.forEach((handle, i) => {
        handle.setAttribute('cx', curve[i * 2]);
        handle.setAttribute('cy', 1 - curve[i * 2 + 1]);
        handle.setAttribute('aria-valuetext', `x ${fixed(curve[i * 2])}, y ${fixed(curve[i * 2 + 1])}`);
      });
      fields.forEach((input, i) => { if (document.activeElement !== input) input.value = fixed(curve[i]); });
      readout.textContent = `cubic-bezier(${curve.map(v => fixed(v)).join(', ')})`;
    };
    arms.forEach(arm => arm.setAttribute('fill', 'none'));

    const move = (index, x, y, released) => {
      curve[index * 2] = round(clamp(x, 0, 1));
      curve[index * 2 + 1] = round(clamp(y, CURVE_LOW, CURVE_HIGH));
      changed(section, released);
    };
    let dragging = null;
    plot.addEventListener('pointerdown', event => {
      const handle = event.target.closest('.mt-handle');
      if (!handle) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      handle.focus();
      dragging = Number(handle.dataset.index);
    });
    plot.addEventListener('pointermove', event => {
      if (dragging === null) return;
      const point = plot.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(plot.getScreenCTM().inverse());
      move(dragging, local.x, 1 - local.y, false);
    });
    const release = () => {
      if (dragging === null) return;
      dragging = null;
      changed(section, true);
    };
    plot.addEventListener('pointerup', release);
    plot.addEventListener('pointercancel', release);
    plot.addEventListener('keydown', event => {
      const handle = event.target.closest('.mt-handle');
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
      if (!handle || !arrows) return;
      event.preventDefault();
      const index = Number(handle.dataset.index);
      const stepSize = event.shiftKey ? 0.05 : 0.01;
      move(index, curve[index * 2] + arrows[0] * stepSize, curve[index * 2 + 1] + arrows[1] * stepSize, true);
    });
    redraws.push(redraw);
    redraw();
    return h('div', { class: 'mt-curve-wrap' }, plot, h('div', { class: 'mt-curve-side' }, h('div', { class: 'mt-curve-fields' }, fields), readout));
  }

  // The step response of a spring, with its overshoot and settling time read out.
  function springEditor({ object, reference }, section) {
    const plot = s('svg', { viewBox: '0 -0.5 1 1.7', preserveAspectRatio: 'none', class: 'mt-spring', role: 'img', 'aria-label': 'Spring response' });
    const line = s('path', { class: 'mt-curve-line' });
    const ghost = s('path', { class: 'mt-curve-ref' });
    plot.append(s('line', { class: 'mt-curve-diagonal', x1: 0, y1: 0, x2: 1, y2: 0 }), s('line', { class: 'mt-curve-diagonal', x1: 0, y1: 1, x2: 1, y2: 1 }), ghost, line);
    const readout = h('code', { class: 'mt-readout' });
    const delayOf = params => params.delay || 0;
    const trace = (params, span) => {
      const progress = curves.spring(params);
      return Array.from({ length: 121 }, (_, i) => {
        const t = (i / 120) * span;
        return `${i ? 'L' : 'M'}${round(i / 120, 4)} ${round(1 - progress((t - delayOf(params)) / 1000), 4)}`;
      }).join(' ');
    };
    const redraw = () => {
      const span = Math.max(400, delayOf(object) + curves.settleOf(object), delayOf(reference) + curves.settleOf(reference));
      line.setAttribute('d', trace(object, span));
      ghost.setAttribute('d', trace(reference, span));
      const progress = curves.spring(object);
      let peak = 0;
      for (let t = 0; t < 2000; t += 5) peak = Math.max(peak, progress(t / 1000));
      readout.textContent = `overshoot ${Math.round((peak - 1) * 100)}% · settles ${Math.round(delayOf(object) + curves.settleOf(object))} ms`;
    };
    redraws.push(redraw);
    redraw();
    const response = {
      get value() { return (2 * Math.PI / object.omega) * 1000; },
      set value(ms) { object.omega = 2 * Math.PI / (ms / 1000); }
    };
    return h('div', { class: 'mt-spring-wrap' },
      plot, readout,
      range({ object: response, key: 'value', label: 'Response', min: 150, max: 1200, step: 5, unit: 'ms', digits: 0 }, section),
      range({ object, key: 'zeta', label: 'Damping', min: 0.2, max: 1, step: 0.01 }, section));
  }

  function build(spec, object, reference, section) {
    if (spec.type === 'curve') {
      const key = spec.key || 'curve';
      return curveEditor({ curve: object[key], reference: reference[key], label: spec.label || 'Easing' }, section);
    }
    if (spec.type === 'spring') return springEditor({ object, reference }, section);
    if (spec.type === 'toggle') return toggle({ object, key: spec.key, label: spec.label }, section);
    return range({ object, ...spec }, section);
  }

  function keysOf(group) {
    return group.controls.flatMap(spec => spec.type === 'spring' ? ['zeta', 'omega'] : [spec.key || 'curve']);
  }

  function groupElement(group, section) {
    const object = lookup(MOTION, group.path);
    const reference = lookup(DEFAULTS, group.path);
    const reset = h('button', { type: 'button', class: 'mt-link', text: 'Reset' });
    reset.addEventListener('click', () => {
      keysOf(group).forEach(key => {
        if (Array.isArray(reference[key])) assign(object[key], clone(reference[key]));
        else object[key] = reference[key];
      });
      changed(section, false);
    });
    return h('div', { class: 'mt-group' },
      h('div', { class: 'mt-group-head' }, h('span', { text: group.title }), reset),
      group.controls.map(spec => build(spec, object, reference, section)));
  }

  // ------------------------------------------------------------- scenarios
  const SAMPLES = ['What changed since yesterday?', 'Which accounts are at risk this week?', 'Summarize pipeline coverage by segment'];
  let sample = 0;
  let run = 0;
  const playback = () => window.MVPBubblePlayback && window.MVPBubblePlayback.current;
  const bottom = () => { const scroll = $('chat-scroll'); scroll.scrollTop = scroll.scrollHeight; };

  // Back to the finished transcript, pinned to the bottom, with nothing pending.
  async function clear() {
    document.querySelector('[data-nav="New"]')?.click();
    bottom();
    await wait(80);
  }

  function assistant(text) {
    const now = new Date();
    return h('article', { class: 'message assistant-message', 'data-demo-message': 'true' },
      h('div', { class: 'message-meta' }, h('span', { class: 'message-author', text: 'Owl' }),
        h('time', { class: 'message-time', datetime: now.toISOString(), text: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) })),
      h('div', { class: 'message-copy', text }));
  }

  async function send() {
    const token = ++run;
    await clear();
    if (token !== run) return;
    const input = $('message-input');
    input.value = SAMPLES[sample++ % SAMPLES.length];
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  }

  async function dots() {
    const token = ++run;
    await clear();
    const pb = playback();
    if (token !== run || !pb) return;
    pb.change(() => pb.showTyping(), { pin: true });
    await wait(1300);
    if (token !== run) return;
    const reply = assistant('Coverage is healthy at 3.4x. Two late-stage deals need attention before Friday.');
    pb.change(() => { pb.hideTyping(); $('messages').append(reply); }, { incoming: [reply], pin: true });
  }

  async function arrival() {
    const token = ++run;
    await clear();
    const pb = playback();
    if (token !== run || !pb) return;
    const bubble = assistant('Quick note: the EMEA forecast call moved to Thursday at 10:00.');
    pb.change(() => $('messages').append(bubble), { incoming: [bubble], pin: true });
  }

  async function conversation() {
    const token = ++run;
    await clear();
    if (token === run) playback()?.play();
  }

  async function scrollJump() {
    const scroll = $('chat-scroll');
    scroll.scrollTop = 0;
    scroll.dispatchEvent(new Event('scroll'));
    await wait(150);
    document.querySelector('[data-nav="Owls"]')?.click();
  }

  // ----------------------------------------------------------------- layout
  const range$ = (key, label, min, max, step, unit = 'ms', digits = 0) => ({ type: 'range', key, label, min, max, step, unit, digits });
  const glide = path => ({ title: 'Thread glide', path, controls: [{ type: 'curve' }, range$('duration', 'Duration', 80, 900, 5), range$('delay', 'Delay', 0, 300, 5)] });
  const sections = [
    { id: 'send', title: 'Send', replay: send, open: true, groups: [
      glide('send.shift'),
      { title: 'Bubble spring', path: 'send.flight', controls: [{ type: 'spring' }, range$('delay', 'Delay', 0, 300, 5)] },
      { title: 'Composer bar', path: 'send.bar', controls: [
        { type: 'toggle', key: 'enabled', label: 'Bar leaves the composer' }, { type: 'curve' },
        range$('duration', 'Collapse', 40, 400, 2), range$('alpha', 'Start opacity', 0.2, 1, 0.01, '', 2)] },
      { title: 'Bubble growth', path: 'send.grow', controls: [
        range$('from', 'Start scale', 0.4, 1, 0.01, '', 2), { type: 'curve' },
        range$('delay', 'Delay', 0, 300, 2), range$('duration', 'Duration', 60, 900, 5)] }
    ] },
    { id: 'typing', title: 'Typing dots', replay: dots, groups: [
      glide('typing.shift'),
      { title: 'Dots pop spring', path: 'typing.pop', controls: [
        { type: 'spring' }, range$('delay', 'Delay', 0, 400, 5), range$('from', 'Start scale', 0, 0.6, 0.01, '', 2), range$('fade', 'Fade in', 40, 400, 5)] }
    ] },
    { id: 'reply', title: 'Reply', replay: dots, groups: [
      { title: 'Reply fade', path: 'reply.fade', controls: [{ type: 'curve' }, range$('duration', 'Duration', 60, 800, 5)] },
      { title: 'Reply scale', path: 'reply.scale', controls: [range$('from', 'Start scale', 0.7, 1, 0.005, '', 3), { type: 'curve' }, range$('duration', 'Duration', 20, 400, 5)] },
      { title: 'Typing bubble out', path: 'reply', controls: [range$('ghostFade', 'Fade out', 40, 600, 5)] }
    ] },
    { id: 'arrive', title: 'Arrival', replay: arrival, groups: [
      glide('arrive.shift'),
      { title: 'Fade in', path: 'arrive.fade', controls: [{ type: 'curve' }, range$('duration', 'Duration', 60, 900, 5)] }
    ] },
    { id: 'scroll', title: 'Scroll jumps', replay: scrollJump, groups: [
      { title: 'Show more and back to bottom', path: 'scroll', controls: [
        { type: 'curve' }, range$('base', 'Base', 100, 800, 5), range$('perPx', 'Per pixel', 0, 1, 0.01, 'ms', 2), range$('extra', 'Longest extra', 0, 800, 10)] }
    ] }
  ];

  function sectionElement(section) {
    return h('details', { class: 'mt-section', open: section.open },
      h('summary', {}, h('span', { text: section.title }), section.replay ? h('button', { type: 'button', class: 'mt-play', 'aria-label': `Replay ${section.title}`, text: '▶', onclick: event => { event.preventDefault(); section.replay(); } }) : null),
      section.groups.map(group => groupElement(group, section)));
  }

  function button(label, onclick, extra = '') {
    return h('button', { type: 'button', class: `mt-btn ${extra}`.trim(), text: label, onclick });
  }

  // Where the clipboard is blocked, show the JSON preselected so it can be copied by hand.
  const exportBox = h('textarea', { class: 'mt-export', readonly: true, hidden: true, rows: 8, 'aria-label': 'Motion values as JSON' });
  exportBox.addEventListener('blur', () => { exportBox.hidden = true; });

  async function copyValues() {
    const text = JSON.stringify(MOTION, null, 2);
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
    if (ok) status.textContent = 'Copied';
    else {
      exportBox.value = text;
      exportBox.hidden = false;
      exportBox.focus();
      exportBox.select();
      status.textContent = 'Press ⌘C';
    }
    setTimeout(() => { status.textContent = ''; }, 2400);
  }

  function resetAll() {
    assign(MOTION, clone(DEFAULTS));
    changed({}, false);
  }

  resetButton = button('Reset all', resetAll, 'is-quiet');
  status = h('span', { class: 'mt-status', 'aria-live': 'polite' });
  const replayBox = h('input', { type: 'checkbox' });
  replayBox.checked = replayOnRelease;
  replayBox.addEventListener('change', () => {
    replayOnRelease = replayBox.checked;
    write(STORE_REPLAY, replayOnRelease ? '1' : '0');
  });
  const body = h('div', { class: 'mt-body' }, sections.map(sectionElement));
  const panel = h('aside', { class: 'mt-panel', 'aria-label': 'Motion tuner' },
    h('div', { class: 'mt-head' },
      h('div', {}, h('div', { class: 'mt-title', text: 'Motion tuner' }), h('div', { class: 'mt-sub', text: 'v2 · applies to the next motion' })),
      h('div', { class: 'mt-head-actions' },
        h('button', { type: 'button', class: 'mt-icon', 'aria-label': 'Collapse panel', text: '–', onclick: () => panel.classList.toggle('is-collapsed') }),
        h('button', { type: 'button', class: 'mt-icon', 'aria-label': 'Close panel', text: '×', onclick: () => { panel.remove(); document.body.classList.remove('motion-tuning'); } }))),
    h('div', { class: 'mt-bar' },
      h('div', { class: 'mt-play-row', role: 'group', 'aria-label': 'Play a motion' },
        button('Send', send), button('Dots + reply', dots), button('Arrival', arrival), button('Full run', conversation), button('Clear', clear, 'is-quiet')),
      h('div', { class: 'mt-foot-row' },
        h('label', { class: 'mt-toggle' }, replayBox, h('span', { text: 'Replay on release' })),
        h('span', { class: 'mt-spacer' }),
        status,
        button('Copy values', copyValues, 'is-quiet'),
        resetButton),
      exportBox),
    body);
  document.body.append(panel);
  refresh();
  // The page re-renders its transcript while loading, so settle at the bottom once it has.
  const settleAtBottom = () => setTimeout(bottom, 60);
  if (document.readyState === 'complete') settleAtBottom();
  else window.addEventListener('load', settleAtBottom, { once: true });
})();
