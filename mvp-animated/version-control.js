(() => {
  'use strict';
  // This independent snapshot always renders the copied Oct 28 V2 experience.
  const views = Object.freeze([
    Object.freeze({ view: 'latest-oct-28', label: 'Oct 28 V2', bubbleFormat: 'aligned' })
  ]);
  const variants = Object.freeze([
    Object.freeze({ id: 'v2', label: 'V2' })
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
  const findVariant = value => variants.find(item => item.id === normalizeView(value));
  const findFormat = value => bubbleFormats.find(item => item.id === normalizeView(value));
  const defaultBubbleFormat = findFormat('original');
  const readView = () => findView(new URL(location.href).searchParams.get('view')) || views[0];
  const readFormat = () => findFormat(new URL(location.href).searchParams.get('bubbles')) || defaultBubbleFormat;
  const readVariant = view => view === 'latest-oct-28' ? (findVariant(new URL(location.href).searchParams.get('variant')) || variants[0]).id : 'v1';
  let current = readView();
  let currentVariant = readVariant(current.view);
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
  const initialVariantValue = initialURL.searchParams.get('variant');
  if (initialVariantValue !== null && (currentVariant !== 'v2' || initialVariantValue !== currentVariant)) {
    if (current.view === 'latest-oct-28' && currentVariant === 'v2') initialURL.searchParams.set('variant', 'v2');
    else initialURL.searchParams.delete('variant');
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
    </div>
    <div class="prototype-control prototype-variant-control" hidden>
      <button class="prototype-version-trigger prototype-variant-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="prototype-variant-menu">
        <span class="prototype-variant-label"></span>${chevron}
      </button>
      <ul id="prototype-variant-menu" class="prototype-version-menu prototype-variant-menu" role="menu" aria-label="Animated prototype variation" hidden></ul>
    </div>`;
  const viewControl = control.querySelector('.prototype-view-control');
  const formatControl = control.querySelector('.prototype-format-control');
  const variantControl = control.querySelector('.prototype-variant-control');
  const variantTrigger = variantControl.querySelector('button');
  const variantLabel = variantControl.querySelector('.prototype-variant-label');
  const variantMenu = variantControl.querySelector('[role="menu"]');
  const trigger = viewControl.querySelector('button');
  const label = viewControl.querySelector('.prototype-version-label');
  const menu = viewControl.querySelector('[role="menu"]');
  const formatTrigger = formatControl.querySelector('button');
  const formatLabel = formatControl.querySelector('.prototype-format-label');
  const formatMenu = formatControl.querySelector('[role="menu"]');
  const menuViews = [...[{"view":"source-text-only","label":"Text only","href":"../mvp-new/?view=text-only"},{"view":"source-furling-v1","label":"Unfurling v1","href":"../mvp-new/?view=furling-v1"},{"view":"source-furling-v2","label":"Unfurling v2","href":"../mvp-new/?view=furling-v2"},{"view":"source-text-furling","label":"Text + Unfurling","href":"../mvp-new/?view=text-furling"},{"view":"source-multiple-bubbles","label":"Multiple bubbles","href":"../mvp-new/?view=multiple-bubbles"},{"view":"source-full-screen-workspace","label":"Full Screen Workspace","href":"../mvp-new/?view=full-screen-workspace"},{"view":"source-latest-oct-27","label":"Oct 27","href":"../mvp-new/?view=latest-oct-27"},{"view":"source-latest-oct-28","label":"Oct 28 (the latest)","href":"../mvp-new/?view=latest-oct-28&variant=v2"}], ...views];
  const options = menuViews.map(view => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const link = document.createElement('a');
    link.className = 'prototype-version-option';
    link.setAttribute('role', 'menuitem');
    link.tabIndex = -1;
    link.dataset.view = view.view;
    if (view.href) link.dataset.prototypeHref = view.href;
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
  const variantOptions = variants.map(variant => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const link = document.createElement('a');
    link.className = 'prototype-version-option prototype-variant-option';
    link.setAttribute('role', 'menuitemradio');
    link.tabIndex = -1;
    link.dataset.variant = variant.id;
    link.textContent = variant.label;
    item.append(link);
    variantMenu.append(item);
    return link;
  });
  // Keep the animated prototype controls detached while retaining the copied view state and layout.
  document.body.classList.add('has-mvp-versions');

  function applyFormatToURL(url, view) {
    if (view === 'multiple-bubbles' && currentFormat.id !== defaultBubbleFormat.id) url.searchParams.set('bubbles', currentFormat.id);
    else url.searchParams.delete('bubbles');
  }

  function applyVariantToURL(url, view, variant = currentVariant) {
    if (view === 'latest-oct-28' && variant === 'v2') url.searchParams.set('variant', 'v2');
    else url.searchParams.delete('variant');
  }

  function updateControl({notifyFormat = true} = {}) {
    label.textContent = current.label;
    trigger.setAttribute('aria-label', `Switch prototype version, ${current.label}`);
    document.body.dataset.prototypeView = current.view;
    const hasVariant = current.view === 'latest-oct-28';
    variantControl.hidden = !hasVariant;
    variantLabel.textContent = currentVariant.toUpperCase();
    variantTrigger.setAttribute('aria-label', `Animated prototype variation, ${currentVariant.toUpperCase()}`);
    if (hasVariant) document.body.dataset.prototypeVariant = currentVariant;
    else delete document.body.dataset.prototypeVariant;
    if (!hasVariant) setMenuOpen(variantGroup, false);
    variantOptions.forEach(option => {
      const url = new URL(location.href);
      url.searchParams.set('view', 'latest-oct-28');
      applyVariantToURL(url, 'latest-oct-28', option.dataset.variant);
      option.href = `${url.pathname}${url.search}${url.hash}`;
      option.setAttribute('aria-checked', String(option.dataset.variant === currentVariant));
    });
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
    if (notifyFormat) window.dispatchEvent(new Event('mvp-bubble-format-change'));
    options.forEach(option => {
      if (option.dataset.prototypeHref) {
        option.href = new URL(option.dataset.prototypeHref, location.href).href;
        return;
      }
      const url = new URL(location.href);
      url.searchParams.set('view', option.dataset.view);
      url.searchParams.delete('thread');
      applyFormatToURL(url, option.dataset.view);
      applyVariantToURL(url, option.dataset.view);
      url.hash = '';
      option.href = `${url.pathname}${url.search}${url.hash}`;
      if (option.dataset.view === current.view) option.setAttribute('aria-current', 'page');
      else option.removeAttribute('aria-current');
    });
  }

  const viewGroup = { wrapper: viewControl, trigger, menu, options, selected: () => options.find(option => option.dataset.view === current.view) };
  const formatGroup = { wrapper: formatControl, trigger: formatTrigger, menu: formatMenu, options: formatOptions, selected: () => formatOptions.find(option => option.dataset.bubbleFormat === currentFormat.id) };
  const variantGroup = { wrapper: variantControl, trigger: variantTrigger, menu: variantMenu, options: variantOptions, selected: () => variantOptions.find(option => option.dataset.variant === currentVariant) };
  const groups = [viewGroup, formatGroup, variantGroup];
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

  function notifyVariant() {
    window.dispatchEvent(new CustomEvent('mvp-variant-change', {detail: {variant: currentVariant}}));
  }

  function setView(value, { replace = false, dispatch = true } = {}) {
    const next = findView(value);
    if (!next) return false;
    const changed = current.view !== next.view;
    const previousVariant = currentVariant;
    current = next;
    if (current.view !== 'latest-oct-28') currentVariant = 'v1';
    const url = new URL(location.href);
    url.searchParams.set('view', current.view);
    const leavingReplies = url.searchParams.has('thread');
    url.searchParams.delete('thread');
    applyFormatToURL(url, current.view);
    applyVariantToURL(url, current.view);
    url.hash = '';
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path !== `${location.pathname}${location.search}${location.hash}`) history[replace ? 'replaceState' : 'pushState'](null, '', path);
    updateControl();
    groups.forEach(group => setMenuOpen(group, false));
    if (dispatch && (changed || leavingReplies)) notify();
    if (dispatch && previousVariant !== currentVariant) notifyVariant();
    return true;
  }

  function setVariant(value, {replace = false} = {}) {
    const next = findVariant(value);
    if (!next || current.view !== 'latest-oct-28') return false;
    const changed = currentVariant !== next.id;
    currentVariant = next.id;
    const url = new URL(location.href);
    applyVariantToURL(url, current.view);
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path !== `${location.pathname}${location.search}${location.hash}`) history[replace ? 'replaceState' : 'pushState'](null, '', path);
    updateControl({notifyFormat:false});
    setMenuOpen(variantGroup, false, true);
    if (changed) notifyVariant();
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
    if (option.dataset.prototypeHref) return;
    // Keep standard new-tab and modifier-click behavior for shareable view links.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setView(option.dataset.view);
    trigger.focus({ preventScroll: true });
  }));
  formatOptions.forEach(option => option.addEventListener('click', () => setBubbleFormat(option.dataset.bubbleFormat)));
  variantOptions.forEach(option => option.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setVariant(option.dataset.variant);
  }));
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
    const previousVariant = currentVariant;
    current = next;
    currentVariant = readVariant(current.view);
    if (current.view === 'multiple-bubbles') currentFormat = readFormat();
    updateControl();
    groups.forEach(group => setMenuOpen(group, false));
    if (changed) notify();
    if (previousVariant !== currentVariant) notifyVariant();
  });

  window.MVPVersions = Object.freeze({
    views,
    getCurrent: () => ({ view: current.view, label: current.label }),
    setView,
    variants,
    getVariant: () => currentVariant,
    setVariant,
    bubbleFormats,
    getBubbleFormat: () => ({ ...activeBubbleFormat() }),
    setBubbleFormat
  });
  updateControl();
  requestAnimationFrame(notify);
})();
