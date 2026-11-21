(() => {
  'use strict';

  const dock = document.querySelector('.pet-dock');
  if (!dock) return;
  const find = selector => dock.querySelector(selector);
  const fab = find('.pet-fab');
  const toolbar = find('.pet-toolbar');
  const edit = find('.pet-edit');
  const hide = find('.pet-hide');
  const sidebarReturn = document.querySelector('.pet-sidebar-return');
  const composer = find('.pet-composer');
  const input = find('#pet-message');
  const send = find('.pet-send');
  const noticeToggle = find('.pet-notice-toggle');
  const unreadBadge = find('.pet-unread');
  const indicator = find('.pet-done-indicator');
  const card = find('.pet-working');
  const resultLink = find('.pet-status-copy');
  const title = find('.pet-working-title');
  const statusText = find('.pet-status-text');
  const statusActions = find('.pet-status-actions');
  const dismiss = find('.pet-status-dismiss');
  const statusReturn = find('.pet-status-return');
  const stop = find('.pet-stop');
  const followup = find('.pet-followup');
  const followupInput = find('#pet-followup');
  const followupSend = find('.pet-followup-send');
  const announcement = find('.pet-announcement');
  if (![fab, toolbar, edit, hide, composer, input, send, noticeToggle, unreadBadge,
    indicator, card, resultLink, title, statusText, statusActions, dismiss, statusReturn,
    stop, followup, followupInput, followupSend, announcement].every(Boolean)) return;

  const HOVER_CLOSE_DELAY = 200;
  const SIMULATED_WORK_DURATION = 6000;
  const HORIZONTAL_MARGIN = 12;
  const VERTICAL_MARGIN = 8;
  const PANEL_GAP = 8;
  const STATUS_GAP = 16;
  const TOOLBAR_WIDTH = 95.205;
  const NOTICE_TOOLBAR_WIDTH = 144;
  const MESSAGE_WIDTH = 380;
  const PANEL_HEIGHT = 47;
  const STATUS_HEIGHT = 65;
  const REPLY_HEIGHT = 117;
  const INDICATOR_HEIGHT = 8;
  const clamp = (value, min, max) => Math.min(Math.max(min, max), Math.max(min, value));
  const toolbarStages = new Set(['hover', 'done-hover', 'notice', 'reply']);
  const noticeStages = new Set(['done-hover', 'notice', 'reply']);
  const cardStages = new Set(['working', 'notice', 'reply']);

  // Storyboard: approach -> actions; Edit -> type; Send -> working; completion
  // folds the panels into a green marker. Hover reveals the bell, which opens
  // the completed preview. Reply expands upward and submits another task.
  // Task progress lives separately from the view so typing and dragging are
  // never interrupted by the six-second prototype completion.
  let stage = 'default';
  let task = null;
  let taskSequence = 0;
  let workTimer = null;
  let closeTimer = null;
  let hideTimer = null;
  let petVisible = true;
  let dragging = false;
  let pendingCompletion = false;
  let pointerInside = false;
  let pointerFocusPending = false;
  let keyboardInteraction = false;
  let suppressHoverUntilLeave = false;
  let restoringFocus = false;
  let lastPointerType = '';
  let statusPointerInside = false;
  let statusTouchOpen = false;
  let workingActionsVisible = false;
  let actionPointerInside = false;

  const idleStage = () => task && task.status === 'done' && task.unread ? 'done' : 'default';
  const actionStage = () => task && task.status === 'done' ? 'done-hover' : 'hover';
  function setAccessible(element, active) {
    element.inert = !active;
    element.setAttribute('aria-hidden', String(!active));
  }
  function cancelClose() {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
  function announce(message) {
    announcement.textContent = message;
  }
  function updateStatusAccess() {
    const visible = cardStages.has(stage) && !dragging;
    const focused = card.contains(document.activeElement);
    const hot = visible && (statusPointerInside || focused || statusTouchOpen);
    const controlsVisible = hot || (visible && stage === 'reply');
    dock.dataset.statusHover = String(hot);
    setAccessible(statusActions, controlsVisible);
    setAccessible(statusReturn, controlsVisible);
    setAccessible(stop, controlsVisible && stage === 'working');
    stop.disabled = stage !== 'working' || !task || task.status !== 'working';
    setAccessible(dismiss, controlsVisible);
    statusReturn.setAttribute('aria-label', stage === 'working' ? 'Return to message' : 'Reply to result');
    statusReturn.title = stage === 'working' ? 'Return to message' : 'Reply to result';
    dismiss.setAttribute('aria-label', stage === 'working' ? 'Hide running activity' : 'Dismiss completed result');
  }
  function syncAccess() {
    const available = !dragging;
    const cardVisible = available && cardStages.has(stage);
    const toolbarVisible = available && (toolbarStages.has(stage) || (stage === 'working' && workingActionsVisible));
    dock.dataset.workingHover = String(available && workingActionsVisible);
    setAccessible(toolbar, toolbarVisible);
    setAccessible(composer, available && stage === 'compose');
    setAccessible(noticeToggle, available && noticeStages.has(stage));
    setAccessible(indicator, available && stage === 'done');
    setAccessible(card, cardVisible);
    if (task && task.status === 'done' && (stage === 'notice' || stage === 'reply')) {
      resultLink.href = 'https://woo-mi.github.io/owl/for-dev/';
    } else resultLink.removeAttribute('href');
    card.tabIndex = cardVisible && stage === 'working' ? 0 : -1;
    setAccessible(followup, available && stage === 'reply');
    noticeToggle.setAttribute('aria-expanded', String(stage === 'notice' || stage === 'reply'));
    fab.setAttribute('aria-expanded', String(toolbarVisible || (available && stage === 'compose')));
    const unread = Boolean(task && task.status === 'done' && task.unread);
    unreadBadge.textContent = unread ? '1' : '';
    unreadBadge.hidden = !unread;
    noticeToggle.setAttribute('aria-label', stage === 'notice' || stage === 'reply'
      ? 'Collapse completed result' : unread ? 'Open completed result, 1 unread' : 'Open completed result');
    updateStatusAccess();
  }
  function renderStatus() {
    if (!task) return;
    title.textContent = task.title;
    statusText.textContent = task.status === 'working' ? 'Thinking' : task.preview;
  }
  function reposition() {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const dockRect = dock.getBoundingClientRect();
    const owl = fab.getBoundingClientRect();
    const availableWidth = Math.max(1, viewportWidth - HORIZONTAL_MARGIN * 2);
    const targetPanelWidth = stage === 'compose' ? MESSAGE_WIDTH
      : noticeStages.has(stage) ? NOTICE_TOOLBAR_WIDTH : TOOLBAR_WIDTH;
    const panelWidth = Math.min(targetPanelWidth, availableWidth);
    const statusWidth = Math.min(MESSAGE_WIDTH, availableWidth);
    // Use target dimensions, not the interpolated size during CSS transitions.
    const statusHeight = stage === 'reply' ? REPLY_HEIGHT : STATUS_HEIGHT;
    const panelBelow = owl.bottom + PANEL_GAP;
    const panelAbove = owl.top - PANEL_GAP - PANEL_HEIGHT;
    const statusAbove = owl.top - STATUS_GAP - statusHeight;
    const statusBelow = owl.bottom + STATUS_GAP;
    const fits = (top, height) => top >= VERTICAL_MARGIN && top + height <= viewportHeight - VERTICAL_MARGIN;
    let panelTop = fits(panelBelow, PANEL_HEIGHT) ? panelBelow : panelAbove;
    let statusTop = fits(statusAbove, statusHeight) ? statusAbove : statusBelow;
    if (cardStages.has(stage)) {
      const placements = [
        [panelBelow, statusAbove],
        [panelAbove, statusBelow],
        [panelAbove, panelAbove - PANEL_GAP - statusHeight],
        [panelBelow, panelBelow + PANEL_HEIGHT + PANEL_GAP],
      ];
      const placement = placements.find(([panelY, statusY]) => fits(panelY, PANEL_HEIGHT) && fits(statusY, statusHeight));
      if (placement) [panelTop, statusTop] = placement;
    }
    const panelLeft = stage === 'compose' ? owl.right + 24 - panelWidth
      : owl.left + (owl.width - panelWidth) / 2;
    const statusLeft = owl.right + (stage === 'notice' || stage === 'reply' ? 28 : 3) - statusWidth;
    const constrainX = (left, width) => clamp(left, HORIZONTAL_MARGIN, viewportWidth - width - HORIZONTAL_MARGIN);
    const constrainY = (top, height) => clamp(top, VERTICAL_MARGIN, viewportHeight - height - VERTICAL_MARGIN);
    const finalPanelLeft = constrainX(panelLeft, panelWidth);
    const indicatorBelow = owl.bottom + 9;
    const indicatorTop = fits(indicatorBelow, INDICATOR_HEIGHT) ? indicatorBelow : owl.top - 9 - INDICATOR_HEIGHT;
    dock.style.setProperty('--panel-width', `${panelWidth}px`);
    dock.style.setProperty('--panel-x', `${finalPanelLeft - dockRect.left}px`);
    dock.style.setProperty('--panel-y', `${constrainY(panelTop, PANEL_HEIGHT) - dockRect.top}px`);
    dock.style.setProperty('--panel-origin', `${clamp(owl.left + owl.width / 2 - finalPanelLeft, 0, panelWidth)}px`);
    dock.style.setProperty('--working-width', `${statusWidth}px`);
    dock.style.setProperty('--working-x', `${constrainX(statusLeft, statusWidth) - dockRect.left}px`);
    dock.style.setProperty('--working-y', `${constrainY(statusTop, statusHeight) - dockRect.top}px`);
    dock.style.setProperty('--status-height', `${statusHeight}px`);
    dock.style.setProperty('--indicator-y', `${constrainY(indicatorTop, INDICATOR_HEIGHT) - dockRect.top}px`);
  }
  function setStage(next) {
    cancelClose();
    if (stage !== next || next !== 'working') workingActionsVisible = false;
    if (stage !== next) {
      statusPointerInside = false;
      statusTouchOpen = false;
    }
    stage = next;
    dock.dataset.stage = next;
    renderStatus();
    syncAccess();
    reposition();
  }
  function returnFocus() {
    restoringFocus = true;
    fab.focus({ preventScroll: true });
    restoringFocus = false;
  }
  function collapse(restoreFocus = false) {
    suppressHoverUntilLeave = pointerInside;
    setStage(idleStage());
    if (restoreFocus) returnFocus();
  }
  function scheduleClose() {
    cancelClose();
    if (!['hover', 'done-hover', 'working'].includes(stage)) return;
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      if (stage === 'working') {
        const actionFocus = document.activeElement === fab || toolbar.contains(document.activeElement);
        if (!actionPointerInside && !(keyboardInteraction && actionFocus)) {
          workingActionsVisible = false;
          syncAccess();
        }
        return;
      }
      const keyboardFocusInside = keyboardInteraction && dock.contains(document.activeElement);
      if (['hover', 'done-hover'].includes(stage) && !pointerInside && !keyboardFocusInside) setStage(idleStage());
    }, HOVER_CLOSE_DELAY);
  }
  function revealActions() {
    if (dragging || suppressHoverUntilLeave) return;
    if (stage === 'default' || stage === 'done') setStage(actionStage());
    else if (stage === 'working') {
      workingActionsVisible = true;
      syncAccess();
    }
  }
  function updateInputs() {
    send.disabled = !input.value.trim();
    const hasFollowup = Boolean(followupInput.value.trim());
    followupSend.disabled = !hasFollowup;
    followup.dataset.hasValue = String(hasFollowup);
  }
  function showCompletion() {
    const hadControlFocus = dock.contains(document.activeElement) && document.activeElement !== fab;
    suppressHoverUntilLeave = false;
    setStage(idleStage());
    if (hadControlFocus) returnFocus();
  }
  function startTask(message) {
    window.clearTimeout(workTimer);
    announcement.textContent = '';
    pendingCompletion = false;
    const greeting = /^(hi|hello)[\s!.,?]*$/i.test(message);
    const priority = /\bpriorit(?:y|ies)\b/i.test(message);
    task = {
      id: ++taskSequence,
      status: 'working',
      message,
      title: greeting ? 'Respond to greeting' : priority ? 'Find today’s priority' : message,
      preview: greeting ? 'Hi! What can I help you with?' : priority
        ? 'Your top work priority today: close the remaining launch review action items.'
        : 'Your request is ready to review. Add a follow-up to continue.',
      unread: false,
    };
    const taskId = task.id;
    input.value = '';
    followupInput.value = '';
    updateInputs();
    setStage('working');
    returnFocus();
    workTimer = window.setTimeout(() => {
      if (!task || task.id !== taskId || task.status !== 'working') return;
      workTimer = null;
      task.status = 'done';
      task.unread = true;
      announce(`Completed: ${task.title}`);
      if (dragging) pendingCompletion = true;
      else if (stage !== 'compose' && stage !== 'reply') showCompletion();
      else syncAccess();
    }, SIMULATED_WORK_DURATION);
  }
  function clearTask() {
    window.clearTimeout(workTimer);
    workTimer = null;
    taskSequence += 1;
    task = null;
    pendingCompletion = false;
    followupInput.value = '';
    updateInputs();
  }
  function setPetVisibility(visible) {
    if (visible === petVisible) return;
    petVisible = visible;
    window.clearTimeout(hideTimer);
    hideTimer = null;
    dock.dataset.visible = String(visible);
    pointerInside = false;
    actionPointerInside = false;
    pointerFocusPending = false;
    suppressHoverUntilLeave = false;
    if (sidebarReturn) sidebarReturn.hidden = visible;
    if (visible) {
      dock.hidden = false;
      dock.inert = false;
      dock.removeAttribute('aria-hidden');
      setStage('default');
      dock.classList.remove('is-hiding');
    } else {
      clearTask();
      setStage('default');
      announcement.textContent = '';
      if (dock.contains(document.activeElement)) {
        document.activeElement.blur();
        sidebarReturn?.focus({ preventScroll: true });
      }
      dock.inert = true;
      dock.setAttribute('aria-hidden', 'true');
      dock.classList.add('is-hiding');
      const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
      hideTimer = window.setTimeout(() => {
        dock.hidden = true;
        hideTimer = null;
      }, delay);
    }
    document.dispatchEvent(new CustomEvent('pet:visibilitychange', { detail: { visible } }));
  }
  function openNotice(fromKeyboard = false) {
    if (!task || task.status !== 'done') return;
    task.unread = false;
    setStage('notice');
    if (fromKeyboard) resultLink.focus({ preventScroll: true });
  }
  function openComposer(prefill) {
    if (typeof prefill === 'string') input.value = prefill;
    updateInputs();
    setStage('compose');
    input.focus({ preventScroll: true });
  }

  dock.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    pointerInside = true;
    if (stage !== 'working' || actionPointerInside) cancelClose();
  });
  dock.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    pointerInside = false;
    suppressHoverUntilLeave = false;
    scheduleClose();
  });
  [fab, toolbar].forEach(element => {
    element.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      actionPointerInside = true;
      keyboardInteraction = false;
      cancelClose();
      if (element === fab) revealActions();
    });
    element.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch') return;
      actionPointerInside = false;
      scheduleClose();
    });
  });
  fab.addEventListener('pointermove', event => {
    // A completion still shows its marker when the cursor is already over the
    // Owl; the next deliberate movement reveals the completed action pill.
    if (event.pointerType !== 'touch' && (stage === 'done' || stage === 'working')) revealActions();
  });
  fab.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType;
    pointerFocusPending = true;
  });
  fab.addEventListener('pointerup', () => { pointerFocusPending = false; });
  fab.addEventListener('pointercancel', () => { pointerFocusPending = false; });
  fab.addEventListener('click', event => {
    // The drag controller suppresses a drop's click in its capture listener.
    if (event.defaultPrevented || dragging) return;
    if (stage === 'default' || stage === 'done') {
      suppressHoverUntilLeave = false;
      revealActions();
    } else if (stage === 'working') {
      if (lastPointerType === 'touch' && event.detail !== 0 && workingActionsVisible) {
        workingActionsVisible = false;
        syncAccess();
      } else {
        suppressHoverUntilLeave = false;
        revealActions();
      }
    } else if (['hover', 'done-hover'].includes(stage) && lastPointerType === 'touch' && event.detail !== 0) collapse();
  });
  dock.addEventListener('focusin', event => {
    if (stage !== 'working' || event.target === fab || toolbar.contains(event.target)) cancelClose();
    else scheduleClose();
    if (event.target === fab && !restoringFocus && !pointerFocusPending && !dragging) {
      if (stage === 'default' || stage === 'done') setStage(actionStage());
      else if (stage === 'working') revealActions();
    }
  });
  dock.addEventListener('focusout', event => {
    if (stage === 'working' || !dock.contains(event.relatedTarget)) scheduleClose();
  });
  card.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    statusPointerInside = true;
    updateStatusAccess();
  });
  card.addEventListener('pointerleave', () => {
    statusPointerInside = false;
    updateStatusAccess();
  });
  card.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') {
      statusTouchOpen = true;
      updateStatusAccess();
    }
  });
  card.addEventListener('focusin', updateStatusAccess);
  card.addEventListener('focusout', () => queueMicrotask(updateStatusAccess));

  edit.addEventListener('click', () => openComposer());
  hide.addEventListener('click', () => setPetVisibility(false));
  sidebarReturn?.addEventListener('click', () => {
    setPetVisibility(true);
    returnFocus();
  });
  document.addEventListener('pet:visibility-request', event => {
    if (typeof event.detail?.visible === 'boolean') setPetVisibility(event.detail.visible);
  });
  input.addEventListener('input', updateInputs);
  followupInput.addEventListener('input', updateInputs);
  composer.addEventListener('submit', event => {
    event.preventDefault();
    const message = input.value.trim();
    if (message && stage === 'compose') startTask(message);
  });
  followup.addEventListener('submit', event => {
    event.preventDefault();
    const message = followupInput.value.trim();
    if (message && stage === 'reply') startTask(message);
  });
  indicator.addEventListener('click', event => openNotice(event.detail === 0));
  noticeToggle.addEventListener('click', event => {
    if (stage === 'notice' || stage === 'reply') collapse(event.detail === 0);
    else openNotice(event.detail === 0);
  });
  statusReturn.addEventListener('click', () => {
    if (!task) return;
    if (stage === 'working') openComposer(task.message);
    else if (stage === 'notice' || stage === 'reply') {
      setStage('reply');
      followupInput.focus({ preventScroll: true });
    }
  });
  stop.addEventListener('click', () => {
    if (!task || task.status !== 'working') return;
    clearTask();
    collapse(true);
    announce('Task stopped.');
  });
  dismiss.addEventListener('click', () => {
    if (stage === 'notice' || stage === 'reply') clearTask();
    // Dismissing a running card only hides it; its task can still complete.
    collapse(true);
  });

  document.addEventListener('pointerdown', event => {
    keyboardInteraction = false;
    if (dock.contains(event.target)) return;
    if (stage === 'working') {
      workingActionsVisible = false;
      syncAccess();
    }
    statusTouchOpen = false;
    updateStatusAccess();
    if (['compose', 'hover', 'done-hover', 'notice', 'reply'].includes(stage)) collapse();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') keyboardInteraction = true;
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || dragging || ['default', 'done'].includes(stage)) return;
    event.preventDefault();
    if (stage === 'working' && workingActionsVisible) {
      workingActionsVisible = false;
      suppressHoverUntilLeave = pointerInside;
      syncAccess();
      returnFocus();
      return;
    }
    collapse(true);
  });
  dock.addEventListener('pet:dragstart', () => {
    dragging = true;
    workingActionsVisible = false;
    actionPointerInside = false;
    suppressHoverUntilLeave = true;
    cancelClose();
    if (stage !== 'working') setStage(idleStage());
    syncAccess();
  });
  dock.addEventListener('pet:dragend', event => {
    dragging = false;
    pointerFocusPending = false;
    if (event.detail && event.detail.moved) suppressHoverUntilLeave = true;
    if (pendingCompletion && task && task.status === 'done') {
      pendingCompletion = false;
      setStage(idleStage());
    } else setStage(stage);
  });
  dock.addEventListener('pet:move', reposition);
  window.addEventListener('resize', reposition);
  window.addEventListener('blur', () => {
    pointerInside = false;
    actionPointerInside = false;
    workingActionsVisible = false;
    pointerFocusPending = false;
    statusPointerInside = false;
    statusTouchOpen = false;
    if (stage === 'hover' || stage === 'done-hover') collapse();
    else syncAccess();
  });

  input.placeholder = 'give me more info';
  dock.dataset.visible = 'true';
  updateInputs();
  setStage('default');
})();
