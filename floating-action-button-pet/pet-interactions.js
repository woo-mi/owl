(() => {
  'use strict';

  const dock = document.querySelector('.pet-dock');
  if (!dock) return;
  const fab = dock.querySelector('.pet-fab');
  const surface = dock.querySelector('.pet-surface');
  const toolbar = dock.querySelector('.pet-toolbar');
  const edit = dock.querySelector('.pet-edit');
  const composer = dock.querySelector('.pet-composer');
  const input = dock.querySelector('#pet-message');
  const send = dock.querySelector('.pet-send');
  const working = dock.querySelector('.pet-working');
  const workingTitle = dock.querySelector('.pet-working-title');
  if (![fab, surface, toolbar, edit, composer, input, send, working, workingTitle].every(Boolean)) return;

  const HOVER_CLOSE_DELAY = 200;
  const VIEWPORT_MARGIN = 12;
  const VERTICAL_MARGIN = 8;
  const PANEL_GAP = 8;
  const TOOLBAR_WIDTH = 95.205;
  const MESSAGE_WIDTH = 380;
  const COMPOSER_RIGHT_OVERHANG = 24;
  const WORKING_RIGHT_OVERHANG = 3;
  const WORKING_TOP_OFFSET = 86;
  const clamp = (value, min, max) => Math.min(Math.max(min, max), Math.max(min, value));

  // Storyboard: approach the Owl -> reveal the compact action pill; Edit ->
  // expand the same pill into a composer; Send -> show Thinking above the Owl
  // and return the pill to actions. A new Edit starts another draft. Dragging
  // keeps the Owl stable and temporarily conceals the surrounding panels.
  let stage = 'default';
  let closeTimer = null;
  let dragging = false;
  let pointerInside = false;
  let pointerFocusPending = false;
  let keyboardInteraction = false;
  let suppressHoverUntilLeave = false;
  let restoringFocus = false;
  let lastPointerType = '';

  function cancelClose() {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }

  function setAccessible(element, active) {
    element.inert = !active;
    element.setAttribute('aria-hidden', String(!active));
  }

  function reposition() {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const dockRect = dock.getBoundingClientRect();
    const fabRect = fab.getBoundingClientRect();
    const availableWidth = Math.max(1, viewportWidth - VIEWPORT_MARGIN * 2);
    const panelWidth = Math.min(stage === 'compose' ? MESSAGE_WIDTH : TOOLBAR_WIDTH, availableWidth);
    const workingWidth = Math.min(MESSAGE_WIDTH, availableWidth);
    const panelHeight = surface.offsetHeight || 47;
    const workingHeight = working.offsetHeight || 64.485;
    const panelBelow = fabRect.bottom + PANEL_GAP;
    const panelAbove = fabRect.top - panelHeight - PANEL_GAP;
    const statusAbove = fabRect.top - WORKING_TOP_OFFSET;
    const statusBelow = fabRect.bottom + PANEL_GAP;
    const fits = (top, height) => top >= VERTICAL_MARGIN && top + height <= viewportHeight - VERTICAL_MARGIN;
    let panelTop = fits(panelBelow, panelHeight) ? panelBelow : panelAbove;
    let workingTop = fits(statusAbove, workingHeight) ? statusAbove : statusBelow;

    if (stage === 'working') {
      // Prefer opposite sides. At an edge, stack both panels on the available
      // side so a dragged Owl never puts its toolbar over its status text.
      const placements = [
        [panelBelow, statusAbove],
        [panelAbove, statusBelow],
        [panelAbove, panelAbove - PANEL_GAP - workingHeight],
        [panelBelow, panelBelow + panelHeight + PANEL_GAP],
      ];
      const placement = placements.find(([panelY, statusY]) => fits(panelY, panelHeight) && fits(statusY, workingHeight));
      if (placement) [panelTop, workingTop] = placement;
    }

    const panelLeft = stage === 'compose'
      ? fabRect.right + COMPOSER_RIGHT_OVERHANG - panelWidth
      : fabRect.left + (fabRect.width - panelWidth) / 2;
    const workingLeft = fabRect.right + WORKING_RIGHT_OVERHANG - workingWidth;
    const constrainX = (left, width) => clamp(left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN);
    const constrainY = (top, height) => clamp(top, VERTICAL_MARGIN, viewportHeight - height - VERTICAL_MARGIN);
    const finalPanelLeft = constrainX(panelLeft, panelWidth);
    dock.style.setProperty('--panel-width', `${panelWidth}px`);
    dock.style.setProperty('--panel-x', `${finalPanelLeft - dockRect.left}px`);
    dock.style.setProperty('--panel-y', `${constrainY(panelTop, panelHeight) - dockRect.top}px`);
    dock.style.setProperty('--panel-origin', `${clamp(fabRect.left + fabRect.width / 2 - finalPanelLeft, 0, panelWidth)}px`);
    dock.style.setProperty('--working-width', `${workingWidth}px`);
    dock.style.setProperty('--working-x', `${constrainX(workingLeft, workingWidth) - dockRect.left}px`);
    dock.style.setProperty('--working-y', `${constrainY(workingTop, workingHeight) - dockRect.top}px`);
  }

  function setStage(next) {
    cancelClose();
    stage = next;
    dock.dataset.stage = next;
    fab.setAttribute('aria-expanded', String(next !== 'default'));
    setAccessible(toolbar, next === 'hover' || next === 'working');
    setAccessible(composer, next === 'compose');
    setAccessible(working, next === 'working');
    reposition();
  }

  function returnFocus() {
    restoringFocus = true;
    fab.focus({ preventScroll: true });
    restoringFocus = false;
  }

  function closeToDefault(restoreFocus = false) {
    suppressHoverUntilLeave = pointerInside;
    setStage('default');
    if (restoreFocus) returnFocus();
  }

  function scheduleClose() {
    cancelClose();
    if (stage !== 'hover') return;
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      const keyboardFocusInside = keyboardInteraction && dock.contains(document.activeElement);
      if (stage === 'hover' && !pointerInside && !keyboardFocusInside) setStage('default');
    }, HOVER_CLOSE_DELAY);
  }

  function updateSend() {
    send.disabled = !input.value.trim();
  }

  dock.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    pointerInside = true;
    cancelClose();
    if (stage === 'default' && !dragging && !suppressHoverUntilLeave) setStage('hover');
  });
  dock.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    pointerInside = false;
    suppressHoverUntilLeave = false;
    scheduleClose();
  });
  fab.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType;
    pointerFocusPending = true;
  });
  fab.addEventListener('pointerup', () => { pointerFocusPending = false; });
  fab.addEventListener('pointercancel', () => { pointerFocusPending = false; });
  fab.addEventListener('click', event => {
    // pet-drag suppresses the click emitted by a drop in its capture listener.
    if (event.defaultPrevented || dragging) return;
    if (stage === 'default') {
      suppressHoverUntilLeave = false;
      setStage('hover');
    } else if (stage === 'hover' && lastPointerType === 'touch' && event.detail !== 0) {
      closeToDefault();
    }
  });

  dock.addEventListener('focusin', event => {
    cancelClose();
    if (event.target === fab && stage === 'default' && !restoringFocus && !pointerFocusPending && !dragging) {
      setStage('hover');
    }
  });
  dock.addEventListener('focusout', event => {
    if (!dock.contains(event.relatedTarget)) scheduleClose();
  });

  edit.addEventListener('click', () => {
    if (stage === 'working') input.value = '';
    updateSend();
    setStage('compose');
    input.focus({ preventScroll: true });
  });
  input.addEventListener('input', updateSend);
  composer.addEventListener('submit', event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || stage !== 'compose') return;
    workingTitle.textContent = /^(hi|hello)[\s!.,?]*$/i.test(message) ? 'Respond to greeting' : message;
    setStage('working');
    returnFocus();
  });

  document.addEventListener('pointerdown', event => {
    keyboardInteraction = false;
    if (!dock.contains(event.target) && (stage === 'compose' || stage === 'hover')) closeToDefault();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') keyboardInteraction = true;
    if (event.key !== 'Escape' || event.defaultPrevented || stage === 'default' || dragging) return;
    event.preventDefault();
    closeToDefault(true);
  });

  dock.addEventListener('pet:dragstart', () => {
    dragging = true;
    suppressHoverUntilLeave = true;
    cancelClose();
    if (stage === 'hover' || stage === 'compose') setStage('default');
    setAccessible(toolbar, false);
    setAccessible(composer, false);
    setAccessible(working, false);
  });
  dock.addEventListener('pet:dragend', event => {
    dragging = false;
    pointerFocusPending = false;
    if (event.detail && event.detail.moved) suppressHoverUntilLeave = true;
    setStage(stage);
  });
  dock.addEventListener('pet:move', reposition);
  window.addEventListener('resize', reposition);
  window.addEventListener('blur', () => {
    pointerInside = false;
    pointerFocusPending = false;
    if (stage === 'hover') closeToDefault();
  });

  input.placeholder = 'give me more info';
  updateSend();
  setStage('default');
})();
