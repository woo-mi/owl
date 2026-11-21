(() => {
  'use strict';

  const dock = document.querySelector('.pet-dock');
  if (!dock) return;
  const find = selector => dock.querySelector(selector);
  const fab = find('.pet-fab');
  const toolbar = find('.pet-toolbar');
  const edit = find('.pet-edit');
  const hide = find('.pet-hide');
  const options = find('.pet-options');
  const optionsMenu = find('.pet-options-menu');
  const sidebarReturn = document.querySelector('.pet-sidebar-return');
  const sidebarUnreadBadge = sidebarReturn?.querySelector('.pet-sidebar-unread');
  const sidebarActions = document.querySelector('.pet-sidebar-actions');
  const sidebarChat = document.querySelector('.pet-sidebar-chat');
  const sidebarFloat = document.querySelector('.pet-sidebar-float');
  const composer = find('.pet-composer');
  const input = find('#pet-message');
  const send = find('.pet-send');
  const chatHeader = find('.pet-chat-header');
  const chatThread = find('.pet-chat-thread');
  const chatClose = find('.pet-chat-close');
  const chatStop = find('.pet-chat-stop');
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
    stop, followup, followupInput, followupSend, announcement,
    chatHeader, chatThread, chatClose, chatStop].every(Boolean)) return;

  const HOVER_CLOSE_DELAY = 200;
  const SIMULATED_WORK_DURATION = 6000;
  const HORIZONTAL_MARGIN = 12;
  const VERTICAL_MARGIN = 8;
  const PANEL_GAP = 12;
  const STATUS_GAP = 16;
  const TOOLBAR_WIDTH = 117;
  const NOTICE_TOOLBAR_WIDTH = 117;
  const MESSAGE_WIDTH = 480;
  const PANEL_HEIGHT = 42;
  const COMPOSER_HEIGHT = 64;
  const CONVERSATION_HEIGHT = 600;
  const MAX_CONVERSATION_HEIGHT = 600;
  const MIN_CONVERSATION_HEIGHT = 180;
  const COMPOSER_GAP = 12;
  const STATUS_HEIGHT = 65;
  const REPLY_HEIGHT = 117;
  const INDICATOR_HEIGHT = 4;
  const DOCK_FLIGHT = { duration: 900, arcHeight: 120, frames: 60 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(Math.max(min, max), Math.max(min, value));
  const toolbarStages = new Set(['hover', 'done-hover', 'notice', 'reply']);
  const noticeStages = new Set(['done-hover', 'notice', 'reply']);
  const cardStages = new Set(['working', 'notice', 'reply']);

  /* ANIMATION STORYBOARD
   * Default  Show the compact 32px Owl and green unread bar.
   *   Hover  Reveal the toolbar and expand the Owl to 56px.
   *   Click  Expand upward into the conversation; mark the notice read.
   * Hover and keyboard focus keep the toolbar available while interacting.
   */
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
  let conversation = [];
  let hasOpenedConversation = false;
  let optionsOpen = false;
  let dockingFlight = null;
  let sidebarChatOpen = false;
  let sidebarCloseTimer = null;

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
  function setOptionsOpen(open, restoreFocus = false) {
    cancelClose();
    optionsOpen = open;
    optionsMenu.dataset.open = String(open);
    setAccessible(optionsMenu, open);
    options.setAttribute('aria-expanded', String(open));
    if (open) optionsMenu.querySelector('[role="menuitem"]').focus({ preventScroll: true });
    else if (restoreFocus) options.focus({ preventScroll: true });
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
    setAccessible(noticeToggle, toolbarVisible);
    setAccessible(indicator, available && Boolean(task?.unread) && ['done', 'done-hover'].includes(stage));
    setAccessible(card, cardVisible);
    if (task && task.status === 'done' && (stage === 'notice' || stage === 'reply')) {
      resultLink.href = 'https://woo-mi.github.io/owl/for-dev/';
    } else resultLink.removeAttribute('href');
    card.tabIndex = cardVisible && stage === 'working' ? 0 : -1;
    setAccessible(followup, available && stage === 'reply');
    noticeToggle.setAttribute('aria-expanded', String(stage === 'compose'));
    fab.setAttribute('aria-expanded', String(toolbarVisible || (available && stage === 'compose')));
    const unread = Boolean(task && task.status === 'done' && task.unread);
    dock.dataset.unread = String(unread);
    unreadBadge.textContent = unread ? '1' : '';
    unreadBadge.hidden = !unread;
    if (sidebarUnreadBadge) {
      sidebarUnreadBadge.textContent = unread ? '1' : '';
      sidebarUnreadBadge.hidden = !unread;
    }
    sidebarReturn?.setAttribute('aria-label', unread ? 'Open Owl chat, 1 unread' : 'Open Owl chat');
    sidebarReturn?.setAttribute('aria-expanded', String(sidebarChatOpen));
    sidebarChat?.setAttribute('aria-label', unread ? 'Open Owl chat, 1 unread' : 'Open Owl chat');
    noticeToggle.setAttribute('aria-label', unread ? 'Open conversation, 1 unread' : 'Open conversation');
    updateStatusAccess();
  }
  function renderStatus() {
    if (!task) return;
    title.textContent = task.title;
    statusText.textContent = task.status === 'working' ? 'Thinking' : task.preview;
  }
  function renderConversation(scrollToLatest = true) {
    const expanded = conversation.length > 0;
    dock.dataset.conversation = String(expanded);
    chatHeader.hidden = !expanded;
    chatThread.hidden = !expanded;
    chatThread.replaceChildren();
    conversation.forEach(entry => {
      if (entry.role === 'date') {
        const separator = document.createElement('div');
        separator.className = 'pet-chat-date';
        separator.textContent = entry.text;
        chatThread.append(separator);
        return;
      }
      const fromOwl = entry.role === 'owl';
      const row = document.createElement('div');
      row.className = `pet-chat-message pet-chat-message--${fromOwl ? 'owl' : 'user'}`;
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', fromOwl ? 'Owl' : 'Woo-Mi');
      const body = document.createElement('div');
      body.className = 'pet-chat-message-body';
      const text = document.createElement('div');
      text.className = entry.working ? 'pet-chat-text pet-chat-thinking' : 'pet-chat-text';
      text.textContent = entry.working ? 'Thinking…' : entry.text;
      body.append(text);
      row.append(body);
      chatThread.append(row);
    });
    chatThread.scrollTop = scrollToLatest ? chatThread.scrollHeight : 0;
    requestAnimationFrame(() => {
      if (stage === 'compose') reposition();
      chatThread.scrollTop = scrollToLatest ? chatThread.scrollHeight : 0;
    });
  }
  function conversationHeight(panelWidth) {
    // Measure after the panel has reached its target width so wrapped messages
    // do not temporarily inflate the height during the opening transition.
    if (Math.abs(chatThread.clientWidth - (panelWidth - 2)) > 1) return CONVERSATION_HEIGHT;
    const threadStyle = getComputedStyle(chatThread);
    const contentHeight = Array.from(chatThread.children).reduce((height, row) => {
      const style = getComputedStyle(row);
      return height + row.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    }, parseFloat(threadStyle.paddingTop) + parseFloat(threadStyle.paddingBottom));
    // Natural row heights avoid feeding the growing scroll container back into itself.
    return clamp(contentHeight + chatHeader.offsetHeight + COMPOSER_HEIGHT + 2,
      CONVERSATION_HEIGHT, MAX_CONVERSATION_HEIGHT);
  }
  function reposition() {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    if (dock.dataset.sidebarChat === 'true') {
      const rail = sidebarReturn.closest('[data-pencil-name="Navigation rail"]');
      const railRight = rail?.getBoundingClientRect().right ?? 48;
      const left = Math.min(railRight + 12, Math.max(12, viewportWidth - 180));
      const width = Math.min(MESSAGE_WIDTH, viewportWidth - left - 12);
      dock.style.setProperty('--sidebar-chat-left', `${left}px`);
      dock.style.setProperty('--panel-width', `${width}px`);
      dock.style.setProperty('--panel-height', `${Math.min(CONVERSATION_HEIGHT, viewportHeight - 48)}px`);
      dock.style.setProperty('--panel-x', '0px');
      dock.style.setProperty('--panel-y', '0px');
      dock.style.setProperty('--panel-origin', '0px');
      dock.style.setProperty('--panel-origin-y', 'bottom');
      return;
    }
    const dockRect = dock.getBoundingClientRect();
    const owl = fab.getBoundingClientRect();
    const availableWidth = Math.max(1, viewportWidth - HORIZONTAL_MARGIN * 2);
    const targetPanelWidth = stage === 'compose' ? MESSAGE_WIDTH
      : noticeStages.has(stage) ? NOTICE_TOOLBAR_WIDTH : TOOLBAR_WIDTH;
    const panelWidth = Math.min(targetPanelWidth, availableWidth);
    const statusWidth = Math.min(MESSAGE_WIDTH, availableWidth);
    // Use target dimensions, not the interpolated size during CSS transitions.
    const statusHeight = stage === 'reply' ? REPLY_HEIGHT : STATUS_HEIGHT;
    let panelHeight = PANEL_HEIGHT;
    let panelGap = PANEL_GAP;
    let preferAbove = false;
    if (stage === 'compose') {
      panelGap = COMPOSER_GAP;
      const desiredHeight = conversation.length ? conversationHeight(panelWidth) : COMPOSER_HEIGHT;
      const aboveSpace = Math.max(0, owl.top - 16 - panelGap - VERTICAL_MARGIN);
      const belowSpace = Math.max(0, viewportHeight - VERTICAL_MARGIN - owl.bottom - panelGap);
      preferAbove = aboveSpace >= desiredHeight || aboveSpace >= belowSpace;
      const minimumHeight = conversation.length ? MIN_CONVERSATION_HEIGHT : COMPOSER_HEIGHT;
      panelHeight = Math.min(desiredHeight, viewportHeight - VERTICAL_MARGIN * 2,
        Math.max(minimumHeight, preferAbove ? aboveSpace : belowSpace));
    }
    const panelBelow = owl.bottom + panelGap;
    const panelAbove = owl.top - 16 - panelGap - panelHeight;
    const statusAbove = owl.top - STATUS_GAP - statusHeight;
    const statusBelow = owl.bottom + STATUS_GAP;
    const fits = (top, height) => top >= VERTICAL_MARGIN && top + height <= viewportHeight - VERTICAL_MARGIN;
    let panelTop = stage === 'compose' ? (preferAbove ? panelAbove : panelBelow)
      : fits(panelBelow, panelHeight) ? panelBelow : panelAbove;
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
    const panelLeft = owl.right - panelWidth;
    const statusLeft = owl.right + (stage === 'notice' || stage === 'reply' ? 28 : 3) - statusWidth;
    const constrainX = (left, width) => clamp(left, HORIZONTAL_MARGIN, viewportWidth - width - HORIZONTAL_MARGIN);
    const constrainY = (top, height) => clamp(top, VERTICAL_MARGIN, viewportHeight - height - VERTICAL_MARGIN);
    const finalPanelLeft = constrainX(panelLeft, panelWidth);
    const indicatorBelow = owl.bottom + 9;
    const indicatorTop = fits(indicatorBelow, INDICATOR_HEIGHT) ? indicatorBelow : owl.top - 9 - INDICATOR_HEIGHT;
    dock.style.setProperty('--panel-width', `${panelWidth}px`);
    dock.style.setProperty('--panel-height', `${panelHeight}px`);
    dock.style.setProperty('--panel-x', `${finalPanelLeft - dockRect.left}px`);
    const panelOffsetY = constrainY(panelTop, panelHeight) - dockRect.top;
    dock.style.setProperty('--panel-y', `${panelOffsetY}px`);
    if (stage !== 'compose') dock.style.setProperty('--menu-anchor-y', `${panelOffsetY}px`);
    dock.style.setProperty('--panel-origin', `${clamp(owl.left + owl.width / 2 - finalPanelLeft, 0, panelWidth)}px`);
    dock.style.setProperty('--panel-origin-y', panelTop < owl.top ? 'bottom' : 'top');
    dock.style.setProperty('--working-width', `${statusWidth}px`);
    dock.style.setProperty('--working-x', `${constrainX(statusLeft, statusWidth) - dockRect.left}px`);
    dock.style.setProperty('--working-y', `${constrainY(statusTop, statusHeight) - dockRect.top}px`);
    dock.style.setProperty('--status-height', `${statusHeight}px`);
    dock.style.setProperty('--indicator-y', `${constrainY(indicatorTop, INDICATOR_HEIGHT) - dockRect.top}px`);
  }
  function setStage(next) {
    cancelClose();
    if (!toolbarStages.has(next) && optionsOpen) setOptionsOpen(false);
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
    (petVisible ? fab : sidebarReturn)?.focus({ preventScroll: true });
    restoringFocus = false;
  }
  function collapse(restoreFocus = false) {
    if (sidebarChatOpen) {
      closeSidebarChat(restoreFocus);
      return;
    }
    suppressHoverUntilLeave = pointerInside;
    setStage(idleStage());
    if (restoreFocus) returnFocus();
  }
  function scheduleClose() {
    cancelClose();
    if (optionsOpen) return;
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
    const working = task?.status === 'working';
    send.disabled = !input.value.trim() || working;
    send.hidden = working;
    chatStop.hidden = !working;
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
  function startTask(message, keepConversationOpen = false) {
    if (task?.status === 'working') return;
    window.clearTimeout(workTimer);
    announcement.textContent = '';
    pendingCompletion = false;
    const greeting = /^(hi|hello|hey)( there)?[\s!.,?]*$/i.test(message);
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
    conversation.push({ role: 'user', text: message });
    const reply = { role: 'owl', text: '', working: true, taskId };
    conversation.push(reply);
    renderConversation();
    input.value = '';
    followupInput.value = '';
    updateInputs();
    setStage(keepConversationOpen ? 'compose' : 'working');
    if (keepConversationOpen) input.focus({ preventScroll: true });
    else returnFocus();
    workTimer = window.setTimeout(() => {
      if (!task || task.id !== taskId || task.status !== 'working') return;
      workTimer = null;
      task.status = 'done';
      task.unread = stage !== 'compose';
      reply.text = task.preview;
      reply.working = false;
      renderConversation();
      updateInputs();
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
    conversation = [];
    renderConversation();
    pendingCompletion = false;
    followupInput.value = '';
    updateInputs();
  }
  function finishDockingFlight(restoreFocus = true) {
    const flight = dockingFlight;
    if (!flight) return;
    dockingFlight = null;
    flight.animation?.cancel();
    flight.image?.remove();
    if (!petVisible && !sidebarChatOpen) {
      clearTimeout(hideTimer);
      dock.hidden = true;
    }
    dock.classList.remove('is-docking', 'is-undocking');
    dock.inert = !petVisible && !sidebarChatOpen;
    sidebarReturn.classList.remove('is-landing');
    sidebarReturn.inert = false;
    if (restoreFocus && flight.restoreFocus
      && (document.activeElement === document.body || document.activeElement === sidebarReturn)) {
      returnFocus();
    }
  }
  function dockInSidebar() {
    if (!petVisible || dockingFlight) return;
    const restoreFocus = dock.contains(document.activeElement);
    setOptionsOpen(false);
    if (!sidebarReturn || reducedMotion.matches) {
      setPetVisibility(false, true);
      return;
    }
    // Lift away from the corner, sweep left in an arc, then settle into the rail.
    // Capture the visible size before the dock changes to its compact state.
    const source = find('.pet-visual').getBoundingClientRect();
    const flight = { restoreFocus, direction: 'dock' };
    dockingFlight = flight;
    sidebarReturn.classList.add('is-landing');
    sidebarReturn.inert = true;
    dock.classList.add('is-docking');
    setPetVisibility(false, true);
    const destination = sidebarReturn.querySelector('img').getBoundingClientRect();
    animateOwlFlight(source, destination, flight);
  }
  function floatInCorner() {
    if (petVisible || dockingFlight) return;
    const source = sidebarReturn.querySelector('img').getBoundingClientRect();
    const restoreFocus = sidebarReturn === document.activeElement || sidebarActions?.contains(document.activeElement);
    setSidebarActions(false);
    if (reducedMotion.matches) {
      setPetVisibility(true);
      returnFocus();
      return;
    }
    dock.classList.add('is-undocking');
    setPetVisibility(true);
    dock.inert = true;
    const owl = fab.getBoundingClientRect();
    // Return to the compact resting size, keeping its bottom-right anchor fixed.
    const destination = { left: owl.right - 32, top: owl.bottom - 32, width: 32, height: 32 };
    const flight = { restoreFocus, direction: 'float' };
    dockingFlight = flight;
    animateOwlFlight(source, destination, flight);
  }
  function animateOwlFlight(source, destination, flight) {
    if (!source.width || !destination.width) {
      finishDockingFlight();
      return;
    }
    const image = find('.pet-head img').cloneNode(false);
    image.removeAttribute('id');
    image.className = 'pet-docking-flight';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.style.width = `${source.width}px`;
    image.style.height = `${source.height}px`;
    document.body.append(image);
    flight.image = image;
    const start = { x: source.left + source.width / 2, y: source.top + source.height / 2 };
    const end = { x: destination.left + destination.width / 2, y: destination.top + destination.height / 2 };
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const arcHeight = Math.min(DOCK_FLIGHT.arcHeight, distance * .18, Math.max(0, Math.min(start.y, end.y) - source.height));
    const smooth = value => value * value * (3 - 2 * value);
    const easeTravel = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
    const frames = Array.from({ length: DOCK_FLIGHT.frames + 1 }, (_, index) => {
      const progress = index / DOCK_FLIGHT.frames;
      const travel = easeTravel(clamp((progress - .06) / .8, 0, 1));
      const x = start.x + (end.x - start.x) * travel;
      const y = start.y + (end.y - start.y) * smooth(progress) - Math.sin(Math.PI * progress) * arcHeight;
      const scale = 1 + (destination.width / source.width - 1) * smooth(progress * progress);
      return {
        offset: progress,
        transform: `translate3d(${x - source.width / 2}px, ${y - source.height / 2}px, 0) scale(${scale})`,
      };
    });
    flight.animation = image.animate(frames, { duration: DOCK_FLIGHT.duration, easing: 'linear', fill: 'both' });
    flight.animation.finished.then(() => {
      if (dockingFlight === flight) finishDockingFlight();
    }).catch(() => { /* A restore, resize, or reduced-motion change already cleaned up. */ });
  }
  function setPetVisibility(visible, preserveConversation = false) {
    if (visible === petVisible) return;
    if (visible || dockingFlight?.direction === 'float') finishDockingFlight(false);
    setSidebarActions(false);
    sidebarChatOpen = false;
    dock.dataset.sidebarChat = 'false';
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
      setStage(idleStage());
      dock.classList.remove('is-hiding');
    } else {
      if (!preserveConversation) clearTask();
      setStage('default');
      announcement.textContent = '';
      if (dock.contains(document.activeElement)) {
        document.activeElement.blur();
        if (!dockingFlight) sidebarReturn?.focus({ preventScroll: true });
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
  function setSidebarActions(open) {
    window.clearTimeout(sidebarCloseTimer);
    sidebarCloseTimer = null;
    if (!sidebarActions) return;
    const visible = open && !petVisible && !sidebarChatOpen && !dockingFlight;
    sidebarActions.dataset.open = String(visible);
    setAccessible(sidebarActions, visible);
  }
  function scheduleSidebarClose() {
    window.clearTimeout(sidebarCloseTimer);
    sidebarCloseTimer = window.setTimeout(() => {
      const focused = keyboardInteraction && (document.activeElement === sidebarReturn || sidebarActions?.contains(document.activeElement));
      const hovered = sidebarReturn?.matches(':hover') || sidebarActions?.matches(':hover');
      if (!focused && !hovered) setSidebarActions(false);
    }, HOVER_CLOSE_DELAY);
  }
  function openSidebarChat() {
    if (petVisible || dockingFlight) return;
    sidebarChatOpen = true;
    setSidebarActions(false);
    window.clearTimeout(hideTimer);
    hideTimer = null;
    dock.dataset.sidebarChat = 'true';
    dock.hidden = false;
    dock.inert = false;
    dock.removeAttribute('aria-hidden');
    dock.classList.remove('is-hiding');
    openComposer();
  }
  function closeSidebarChat(restoreFocus = false) {
    if (!sidebarChatOpen) return;
    sidebarChatOpen = false;
    setStage(idleStage());
    dock.inert = true;
    dock.setAttribute('aria-hidden', 'true');
    dock.classList.add('is-hiding');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (!petVisible && !sidebarChatOpen) dock.hidden = true;
      hideTimer = null;
    }, reducedMotion.matches ? 0 : 180);
    if (restoreFocus) returnFocus();
  }
  function openNotice() {
    openComposer();
  }
  function openComposer(prefill) {
    if (typeof prefill === 'string') input.value = prefill;
    if (task?.status === 'done') task.unread = false;
    renderConversation(hasOpenedConversation);
    hasOpenedConversation = true;
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
    if (event.defaultPrevented || dragging) return;
    if (stage === 'compose') collapse(true);
    else openComposer();
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
    if (optionsOpen && !dock.contains(event.relatedTarget)) setOptionsOpen(false);
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
  hide.addEventListener('click', dockInSidebar);
  options.addEventListener('click', () => setOptionsOpen(!optionsOpen));
  options.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOptionsOpen(true);
  });
  optionsMenu.addEventListener('keydown', event => {
    const items = [...optionsMenu.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      items[event.key === 'Home' ? 0 : items.length - 1].focus();
    }
  });
  optionsMenu.addEventListener('focusout', event => {
    if (!event.relatedTarget || dock.contains(event.relatedTarget)) return;
    setOptionsOpen(false);
    scheduleClose();
  });
  sidebarReturn?.addEventListener('click', () => {
    if (sidebarChatOpen) closeSidebarChat(true);
    else openSidebarChat();
  });
  sidebarChat?.addEventListener('click', openSidebarChat);
  sidebarFloat?.addEventListener('click', floatInCorner);
  [sidebarReturn, sidebarActions].filter(Boolean).forEach(element => {
    element.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') {
        keyboardInteraction = false;
        setSidebarActions(true);
      }
    });
    element.addEventListener('pointerleave', scheduleSidebarClose);
    element.addEventListener('focusin', () => {
      if (!restoringFocus) setSidebarActions(true);
    });
    element.addEventListener('focusout', scheduleSidebarClose);
  });
  document.addEventListener('pet:visibility-request', event => {
    if (typeof event.detail?.visible === 'boolean') setPetVisibility(event.detail.visible);
  });
  input.addEventListener('input', updateInputs);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (input.value.trim() && stage === 'compose' && task?.status !== 'working') composer.requestSubmit();
    }
  });
  chatClose.addEventListener('click', () => collapse(true));
  chatStop.addEventListener('click', () => {
    if (task?.status !== 'working') return;
    window.clearTimeout(workTimer);
    workTimer = null;
    const reply = conversation.find(entry => entry.taskId === task.id);
    if (reply) {
      reply.working = false;
      reply.stopped = true;
      reply.text = 'Response stopped.';
    }
    task.status = 'stopped';
    task.unread = false;
    renderConversation();
    updateInputs();
    input.focus({ preventScroll: true });
    announce('Response stopped.');
  });
  followupInput.addEventListener('input', updateInputs);
  composer.addEventListener('submit', event => {
    event.preventDefault();
    const message = input.value.trim();
    if (message && stage === 'compose') startTask(message, true);
  });
  followup.addEventListener('submit', event => {
    event.preventDefault();
    const message = followupInput.value.trim();
    if (message && stage === 'reply') startTask(message);
  });
  indicator.addEventListener('click', openNotice);
  noticeToggle.addEventListener('click', openNotice);
  statusReturn.addEventListener('click', () => {
    if (!task) return;
    if (stage === 'working') openComposer();
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
    if (sidebarReturn?.contains(event.target) || sidebarActions?.contains(event.target)) return;
    setSidebarActions(false);
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
    if (event.key === 'Escape' && sidebarActions?.dataset.open === 'true') {
      event.preventDefault();
      setSidebarActions(false);
      returnFocus();
      return;
    }
    if (event.key === 'Escape' && optionsOpen && !event.defaultPrevented) {
      event.preventDefault();
      setOptionsOpen(false, true);
      return;
    }
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
  window.addEventListener('resize', () => {
    finishDockingFlight();
    reposition();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) finishDockingFlight();
  });
  window.addEventListener('pagehide', () => finishDockingFlight(false));
  let threadResizeFrame = 0;
  const threadResizeObserver = new ResizeObserver(() => {
    if (stage !== 'compose' || !conversation.length || threadResizeFrame) return;
    threadResizeFrame = requestAnimationFrame(() => {
      threadResizeFrame = 0;
      if (stage !== 'compose' || !conversation.length) return;
      reposition();
    });
  });
  threadResizeObserver.observe(chatThread);
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

  // Sample history is part of the prototype's default unread state.
  conversation = [
    { role: 'date', text: 'Yesterday' },
    { role: 'user', text: 'Which lead sources brought in the most contacts last quarter?' },
    { role: 'owl', text: 'Organic search led with 4,812 new contacts, ahead of paid social at 3,140 and webinars at 2,276. Referrals were the smallest source but converted best: 18% became opportunities.' },
    { role: 'user', text: 'How did webinars trend month over month?' },
    { role: 'owl', text: 'Webinar contacts grew every month: 610 in July, 742 in August and 924 in September. That is a 51% rise across the quarter.' },
    { role: 'date', text: 'Today' },
    { role: 'owl', text: 'Your Monday pipeline check is ready. Open pipeline is $4.2M across 138 deals, up 6% on last week. 23 deals have had no activity for 30 days, and 9 of those belong to one owner.' },
  ];
  task = {
    id: ++taskSequence,
    status: 'done',
    title: 'Monday pipeline check',
    preview: conversation[conversation.length - 1].text,
    unread: true,
  };
  input.placeholder = 'Give your Owl something to do...';
  optionsMenu.hidden = false;
  setOptionsOpen(false);
  dock.dataset.visible = 'true';
  renderConversation(false);
  updateInputs();
  setStage(idleStage());
})();
