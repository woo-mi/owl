/*
 * AFTER 2 — motion tuner.
 *
 * Add ?tune to the page URL to open it. Every control edits the live MOTION
 * table in send-transition.js, so the next send uses the new value. Dashed lines
 * are the values read from the Codex recording. Settings persist in this browser
 * only; "Copy values" copies the whole table as JSON.
 */
(() => {
  'use strict';
  const engine = window.OwlSendMotion;
  if (!engine || !new URLSearchParams(location.search).has('tune')) return;
  const { MOTION, DEFAULTS } = engine;
  const STORE = 'owl.after-2.motion';
  const STORE_REPLAY = 'owl.after-2.motion.replay';
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

  function build(spec, object, reference, section) {
    if (spec.type === 'curve') {
      const key = spec.key || 'curve';
      return curveEditor({ curve: object[key], reference: reference[key], label: spec.label || 'Easing' }, section);
    }
    return range({ object, ...spec }, section);
  }

  const keysOf = group => group.controls.map(spec => spec.key || 'curve');

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
  const bottom = () => { const scroll = $('chat-scroll'); scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'instant' }); };

  // Back to the finished transcript, pinned to the bottom, with nothing pending.
  async function clear() {
    document.querySelector('[data-nav="New"]')?.click();
    bottom();
    await wait(80);
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

  // ----------------------------------------------------------------- layout
  const range$ = (key, label, min, max, step, unit = 'ms', digits = 0) => ({ type: 'range', key, label, min, max, step, unit, digits });
  const sections = [
    { id: 'glide', title: 'Send glide', replay: send, open: true, groups: [
      { title: 'Thread glide', path: 'glide', controls: [
        { type: 'curve' }, range$('base', 'Base', 80, 800, 5), range$('perPx', 'Per pixel', 0, 0.6, 0.01, 'ms', 2),
        range$('max', 'Longest', 200, 1000, 10), range$('delay', 'Delay', 0, 300, 5)] },
      { title: 'Landing spot', path: 'land', controls: [range$('top', 'Below top', 40, 320, 2, 'px')] }
    ] },
    { id: 'thinking', title: 'Thinking label', replay: send, groups: [
      { title: 'Appearance', path: 'thinking', controls: [range$('delay', 'Appears after', 0, 800, 10), range$('fade', 'Fade in', 0, 500, 5)] },
      { title: 'Highlight sweep', path: 'thinking', controls: [
        range$('shimmerDelay', 'Starts after', 0, 3000, 50), range$('sweep', 'Sweep', 200, 2500, 50), range$('period', 'Repeats every', 1000, 8000, 100)] }
    ] },
    { id: 'reply', title: 'Reply', replay: send, groups: [
      { title: 'Reply', path: 'reply', controls: [range$('fade', 'Fade in', 0, 800, 10), range$('labelOut', 'Label out', 0, 500, 10)] }
    ] }
  ];

  function sectionElement(section) {
    return h('details', { class: 'mt-section', open: section.open },
      h('summary', {}, h('span', { text: section.title }),
        h('button', { type: 'button', class: 'mt-play', 'aria-label': `Replay ${section.title}`, text: '▶', onclick: event => { event.preventDefault(); section.replay(); } })),
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
      h('div', {}, h('div', { class: 'mt-title', text: 'Motion tuner' }), h('div', { class: 'mt-sub', text: 'after 2 · applies to the next send' })),
      h('div', { class: 'mt-head-actions' },
        h('button', { type: 'button', class: 'mt-icon', 'aria-label': 'Collapse panel', text: '–', onclick: () => panel.classList.toggle('is-collapsed') }),
        h('button', { type: 'button', class: 'mt-icon', 'aria-label': 'Close panel', text: '×', onclick: () => { panel.remove(); document.body.classList.remove('motion-tuning'); } }))),
    h('div', { class: 'mt-bar' },
      h('div', { class: 'mt-play-row', role: 'group', 'aria-label': 'Play a motion' }, button('Send', send), button('Clear', clear, 'is-quiet')),
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
