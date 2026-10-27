(() => {
  'use strict';
  const views = Object.freeze([
    Object.freeze({ view: 'text-only', label: 'Text only' }),
    Object.freeze({ view: 'furling-v1', label: 'Unfurling v1' }),
    Object.freeze({ view: 'furling-v2', label: 'Unfurling v2' }),
    Object.freeze({ view: 'text-furling', label: 'Text + Unfurling' }),
    Object.freeze({ view: 'multiple-bubbles', label: 'Multiple bubbles' }),
    Object.freeze({ view: 'full-screen-workspace', label: 'Full Screen Workspace' }),
    Object.freeze({ view: 'latest-oct-27', label: 'the latest Oct 27', bubbleFormat: 'aligned' })
  ]);
  const bubbleFormats = Object.freeze([
    Object.freeze({ id: 'original', label: 'Original', bullets: true, split: false }),
    Object.freeze({ id: 'no-bullet', label: 'no bullet', bullets: false, split: false }),
    Object.freeze({ id: 'no-bullet-break-replies', label: 'no bullet · break replies', bullets: false, split: true }),
    Object.freeze({ id: 'bullet', label: 'bullet', bullets: true, split: false }),
    Object.freeze({ id: 'bullet-break-replies', label: 'bullet · break replies', bullets: true, split: true }),
    Object.freeze({ id: 'bullet-break-replies-character', label: 'bullet · break replies · character', bullets: true, split: true }),
    Object.freeze({ id: 'bullet-break-replies-character-tilt', label: 'bullet · break replies · character tilt', bullets: true, split: true }),
    Object.freeze({ id: 'bullet-break-replies-more-characters', label: 'bullet · break replies · more characters', bullets: true, split: true }),
    Object.freeze({ id: 'aligned', label: 'Aligned', bullets: true, split: true })
  ]);
  const normalizeView = value => typeof value === 'string' ? value.trim().replace(/[\s,]+$/, '') : value;
  const findView = value => views.find(item => item.view === normalizeView(value));
  const findFormat = value => bubbleFormats.find(item => item.id === normalizeView(value));
  const defaultBubbleFormat = findFormat('original');
  const readView = () => findView(new URL(location.href).searchParams.get('view')) || views[0];
  const readFormat = () => findFormat(new URL(location.href).searchParams.get('bubbles')) || defaultBubbleFormat;
  let current = readView();
  const initialURL = new URL(location.href);
  const initialValue = initialURL.searchParams.get('view');
  let canonicalizeInitialURL = false;
  if (findView(initialValue) && initialValue !== current.view) {
    initialURL.searchParams.set('view', current.view);
    canonicalizeInitialURL = true;
  }
  const initialFormatValue = initialURL.searchParams.get('bubbles');
  const initialFormat = findFormat(initialFormatValue);
  if (initialFormat && initialFormatValue !== initialFormat.id) {
    initialURL.searchParams.set('bubbles', initialFormat.id);
    canonicalizeInitialURL = true;
  }
  if (canonicalizeInitialURL) {
    history.replaceState(history.state, '', initialURL.pathname + initialURL.search + initialURL.hash);
  }
  let currentFormat = current.view === 'multiple-bubbles' ? readFormat() : defaultBubbleFormat;
  const activeBubbleFormat = () => findFormat(current.bubbleFormat) || currentFormat;
  const chevron = '<svg class="prototype-version-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>';
  const control = document.createElement('nav');
  control.className = 'prototype-versions';
  control.setAttribute('aria-label', 'Prototype controls');
  control.innerHTML = `
    <div class="prototype-control prototype-format-control" hidden>
      <button class="prototype-version-trigger prototype-format-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="prototype-format-menu">
        <span class="prototype-format-label"></span>${chevron}
      </button>
      <ul id="prototype-format-menu" class="prototype-version-menu prototype-format-menu" role="menu" aria-label="Multiple bubbles format" hidden></ul>
    </div>
    <div class="prototype-control prototype-view-control">
      <button class="prototype-version-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="prototype-version-menu">
        <span class="prototype-version-label"></span>${chevron}
      </button>
      <ul id="prototype-version-menu" class="prototype-version-menu" role="menu" aria-label="Prototype versions" hidden></ul>
    </div>`;
  const viewControl = control.querySelector('.prototype-view-control');
  const formatControl = control.querySelector('.prototype-format-control');
  const trigger = viewControl.querySelector('button');
  const label = viewControl.querySelector('.prototype-version-label');
  const menu = viewControl.querySelector('[role="menu"]');
  const formatTrigger = formatControl.querySelector('button');
  const formatLabel = formatControl.querySelector('.prototype-format-label');
  const formatMenu = formatControl.querySelector('[role="menu"]');
  const options = views.map(view => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const link = document.createElement('a');
    link.className = 'prototype-version-option';
    link.setAttribute('role', 'menuitem');
    link.tabIndex = -1;
    link.dataset.view = view.view;
    link.textContent = view.label;
    item.append(link);
    menu.append(item);
    return link;
  });
  const formatOptions = bubbleFormats.map(format => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prototype-format-option';
    button.setAttribute('role', 'menuitemradio');
    button.tabIndex = -1;
    button.dataset.bubbleFormat = format.id;
    button.textContent = format.label;
    item.append(button);
    formatMenu.append(item);
    return button;
  });
  document.body.append(control);
  document.body.classList.add('has-mvp-versions');

  function applyFormatToURL(url, view) {
    if (view === 'multiple-bubbles' && currentFormat.id !== defaultBubbleFormat.id) url.searchParams.set('bubbles', currentFormat.id);
    else url.searchParams.delete('bubbles');
  }

  function updateControl() {
    label.textContent = current.label;
    trigger.setAttribute('aria-label', `Switch prototype version, ${current.label}`);
    document.body.dataset.prototypeView = current.view;
    const hasFormat = current.view === 'multiple-bubbles';
    const fixedFormat = findFormat(current.bubbleFormat);
    const activeFormat = activeBubbleFormat();
    formatControl.hidden = !hasFormat;
    formatLabel.textContent = activeFormat.label;
    formatTrigger.setAttribute('aria-label', `Multiple bubbles format, ${activeFormat.label}`);
    if (hasFormat || fixedFormat) {
      document.body.dataset.bubbleFormat = activeFormat.id;
    } else {
      delete document.body.dataset.bubbleFormat;
    }
    if (!hasFormat) setMenuOpen(formatGroup, false);
    formatOptions.forEach(option => option.setAttribute('aria-checked', String(option.dataset.bubbleFormat === activeFormat.id)));
    window.dispatchEvent(new Event('mvp-bubble-format-change'));
    options.forEach(option => {
      const url = new URL(location.href);
      url.searchParams.set('view', option.dataset.view);
      url.searchParams.delete('thread');
      applyFormatToURL(url, option.dataset.view);
      url.hash = '';
      option.href = `${url.pathname}${url.search}${url.hash}`;
      if (option.dataset.view === current.view) option.setAttribute('aria-current', 'page');
      else option.removeAttribute('aria-current');
    });
  }

  const viewGroup = { wrapper: viewControl, trigger, menu, options, selected: () => options.find(option => option.dataset.view === current.view) };
  const formatGroup = { wrapper: formatControl, trigger: formatTrigger, menu: formatMenu, options: formatOptions, selected: () => formatOptions.find(option => option.dataset.bubbleFormat === currentFormat.id) };
  const groups = [viewGroup, formatGroup];
  function setMenuOpen(group, open, restoreFocus = false) {
    if (open) groups.filter(other => other !== group).forEach(other => setMenuOpen(other, false));
    group.menu.hidden = !open;
    group.trigger.setAttribute('aria-expanded', String(open));
    if (open) group.selected()?.focus({ preventScroll: true });
    else if (restoreFocus) group.trigger.focus({ preventScroll: true });
  }

  function notify() {
    window.dispatchEvent(new CustomEvent('mvp-view-change', {
      detail: { view: current.view, label: current.label }
    }));
  }

  function setView(value, { replace = false, dispatch = true } = {}) {
    const next = findView(value);
    if (!next) return false;
    const changed = current.view !== next.view;
    current = next;
    const url = new URL(location.href);
    url.searchParams.set('view', current.view);
    const leavingReplies = url.searchParams.has('thread');
    url.searchParams.delete('thread');
    applyFormatToURL(url, current.view);
    url.hash = '';
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path !== `${location.pathname}${location.search}${location.hash}`) history[replace ? 'replaceState' : 'pushState'](null, '', path);
    updateControl();
    groups.forEach(group => setMenuOpen(group, false));
    if (dispatch && (changed || leavingReplies)) notify();
    return true;
  }

  function setBubbleFormat(value) {
    const next = findFormat(value);
    if (!next || current.view !== 'multiple-bubbles') return false;
    currentFormat = next;
    const url = new URL(location.href);
    applyFormatToURL(url, current.view);
    // Preserve the reply-history entry; the renderer restores this format's own state.
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
    updateControl();
    setMenuOpen(formatGroup, false, true);
    return true;
  }

  groups.forEach(group => {
    group.trigger.addEventListener('click', () => setMenuOpen(group, group.menu.hidden));
    group.trigger.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      setMenuOpen(group, true);
      group.options[event.key === 'ArrowDown' ? 0 : group.options.length - 1].focus({ preventScroll: true });
    });
    group.menu.addEventListener('keydown', event => {
      const index = group.options.indexOf(document.activeElement);
      if (event.key === ' ' && index >= 0) {
        event.preventDefault();
        group.options[index].click();
        return;
      }
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % group.options.length;
      if (event.key === 'ArrowUp') next = (index - 1 + group.options.length) % group.options.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = group.options.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        group.options[next].focus({ preventScroll: true });
      }
      if (event.key === 'Tab') setMenuOpen(group, false, true);
    });
  });
  options.forEach(option => option.addEventListener('click', event => {
    // Keep standard new-tab and modifier-click behavior for shareable view links.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setView(option.dataset.view);
    trigger.focus({ preventScroll: true });
  }));
  formatOptions.forEach(option => option.addEventListener('click', () => setBubbleFormat(option.dataset.bubbleFormat)));
  document.addEventListener('pointerdown', event => groups.forEach(group => {
    if (!group.wrapper.contains(event.target)) setMenuOpen(group, false);
  }));
  document.addEventListener('focusin', event => groups.forEach(group => {
    if (!group.wrapper.contains(event.target)) setMenuOpen(group, false);
  }));
  document.addEventListener('keydown', event => {
    const openGroup = groups.find(group => !group.menu.hidden);
    if (event.key === 'Escape' && openGroup) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setMenuOpen(openGroup, false, true);
    }
  });
  window.addEventListener('mvp-workspace-open', () => groups.forEach(group => setMenuOpen(group, false)));
  window.addEventListener('popstate', () => {
    const next = readView();
    const changed = next.view !== current.view;
    current = next;
    if (current.view === 'multiple-bubbles') currentFormat = readFormat();
    updateControl();
    groups.forEach(group => setMenuOpen(group, false));
    if (changed) notify();
  });

  window.MVPVersions = Object.freeze({
    views,
    getCurrent: () => ({ view: current.view, label: current.label }),
    setView,
    bubbleFormats,
    getBubbleFormat: () => ({ ...activeBubbleFormat() }),
    setBubbleFormat
  });
  updateControl();
  requestAnimationFrame(notify);
})();
