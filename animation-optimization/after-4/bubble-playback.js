/*
 * AFTER 4 — coordinated, quiet reveals on the complete timeline.
 *    0ms   hide upcoming bubbles; show the three-dot typing indicator
 *  900ms   first message replaces typing in one measured layout change
 * +700ms   pause after each arrival, then type for 1300–1700ms
 *          normal bubbles arrive about two seconds apart
 * +850ms   after a reacted-to message, its emoji fades in separately
 * +650ms   retain the original reading pause, then hold another 1500ms
 * +650ms   the connector appears quietly, then holds for 400ms
 *          only then does the next reply begin typing and arrive
 *          follow new messages until the reader scrolls back
 */
(() => {
  'use strict';
  const TIMING = Object.freeze({
    firstArrival: 900,     // Initial typing pause.
    afterArrival: 700,     // Combined with typing, approximately two seconds per bubble.
    typingMinimum: 1300,   // Short assistant messages.
    typingMaximum: 1700,   // Slightly more reading time for longer report bubbles.
    characterDelay: 1.2,   // Extra milliseconds per character.
    userArrival: 1300,     // Blue outgoing bubbles follow the same two-second pace.
    previewArrival: 1000,  // Links and cards follow their message.
    reactionDelay: 850,    // Let the message arrive before its reaction.
    reactionEntrance: 650, // Keep Version 3's pacing, with a quieter reveal.
    reactionHold: 1500,    // Keep the settled emoji in view before continuing.
    connectorEntrance: 650, // Reveal the curved thread line after its emoji.
    connectorHold: 400,    // Give the completed connector its own moment.
    reply: 2000           // Typing pause for a locally generated reply.
  });
  // A timeline message can contain several bubbles and cards. Reveal the
  // complete message once, while keeping standalone context and dates in order.
  const UNITS = '.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue, .timeline-message, .timeline-link-chip, .timeline-card, .timeline-context, .timeline-reference, .timeline-date, .timeline-new';
  const WRAPPERS = '.pen-bubble-group, .unfurl-thread-detail, .timeline-section, .timeline-group';
  const OUTGOING = '.unfurl-user-turn, .user-message, .timeline-outgoing';
  const isAssistant = node => node.matches('.pen-bubble, .assistant-message') ||
    (node.matches('.timeline-message') && !node.matches(OUTGOING));

  function create({ messages, scroll, reducedMotion }) {
    let sequence = null;
    let timer = 0;
    let pendingStep = null;
    let pendingDelay = 0;
    const motion = window.OwlRevealMotion.create({ messages, scroll, reducedMotion });
    const typing = document.createElement('div');
    typing.className = 'bubble-typing';
    typing.setAttribute('role', 'status');
    typing.setAttribute('aria-label', 'Owl is typing');
    typing.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';

    function schedule(step, delay) {
      clearTimeout(timer);
      pendingStep = step;
      pendingDelay = delay;
      if (document.hidden) return;
      timer = setTimeout(() => {
        pendingStep = null;
        step();
      }, delay);
    }

    // Manual sends use this same transaction boundary, including a typing
    // indicator inserted by their update. The controller owns every animation.
    function change(update, options = {}) {
      const incoming = [...(options.incoming || [])];
      const wasTyping = typing.isConnected;
      return motion.change(() => {
        update();
        if (!wasTyping && typing.isConnected && !incoming.includes(typing)) incoming.push(typing);
      }, { ...options, incoming });
    }

    function hideTyping() { typing.remove(); }
    function showTyping(before) {
      hideTyping();
      if (before) before.before(typing);
      else messages.append(typing);
    }

    function revealParents(node) {
      sequence?.wrappers.forEach(wrapper => {
        if (wrapper.contains(node)) wrapper.hidden = false;
      });
    }

    function finish({ onlyPlayback = false } = {}) {
      if (onlyPlayback && !sequence) return;
      clearTimeout(timer);
      pendingStep = null;
      motion.settle();
      // Stopping the demo reveals the full source history. Keep the reader at
      // the same position instead of following that bulk reveal to its end.
      motion.preserve(() => {
        hideTyping();
        if (!sequence) return;
        sequence.units.forEach(node => { node.hidden = false; });
        sequence.wrappers.forEach(node => { node.hidden = false; });
        sequence.reactions.forEach(node => { node.hidden = false; });
        sequence.connectors.forEach(node => node.removeAttribute('hidden'));
        sequence = null;
        delete messages.dataset.playback;
        scroll.classList.remove('is-bubble-playback');
      });
    }

    function continueSequence(delay) {
      if (!sequence) return;
      schedule(sequence.stage < sequence.units.length ? prepareNext : finish, delay);
    }

    function revealConnectors(connectors) {
      if (!sequence) return;
      change(() => connectors.forEach(node => node.removeAttribute('hidden')), { incoming: connectors });
      continueSequence(TIMING.connectorEntrance + TIMING.connectorHold);
    }

    function revealReactions(reactions, connectors) {
      if (!sequence) return;
      change(() => reactions.forEach(node => { node.hidden = false; }), { incoming: reactions });
      const delay = TIMING.reactionEntrance + TIMING.reactionHold;
      if (connectors.length) schedule(() => revealConnectors(connectors), delay);
      else continueSequence(delay);
    }

    function reveal() {
      if (!sequence) return;
      const node = sequence.units[sequence.stage];
      change(() => {
        hideTyping();
        revealParents(node);
        node.hidden = false;
      }, { incoming: [node] });
      sequence.stage += 1;
      const reactions = [...node.querySelectorAll('.unfurl-reaction')];
      const connectors = [...node.querySelectorAll('.unfurl-thread-connector')];
      if (reactions.length) schedule(() => revealReactions(reactions, connectors), TIMING.reactionDelay);
      else if (connectors.length) schedule(() => revealConnectors(connectors), TIMING.afterArrival);
      else continueSequence(TIMING.afterArrival);
    }

    function prepareNext() {
      if (!sequence) return;
      const node = sequence.units[sequence.stage];
      const assistant = isAssistant(node);
      if (assistant) change(() => {
        revealParents(node);
        showTyping(node);
      }, { incoming: [typing] });
      const delay = sequence.stage === 0 ? TIMING.firstArrival : assistant
        ? Math.min(TIMING.typingMaximum, TIMING.typingMinimum + node.textContent.trim().length * TIMING.characterDelay)
        : node.matches(OUTGOING) ? TIMING.userArrival : TIMING.previewArrival;
      schedule(reveal, delay);
    }

    function play() {
      finish();
      if (reducedMotion.matches) return;
      const transcript = messages.querySelector('.reply-timeline, .pen-frame-transcript');
      if (!transcript) return;
      const units = [...transcript.querySelectorAll(UNITS)].filter(node =>
        !node.closest('[hidden]') && !node.parentElement.closest(UNITS));
      if (!units.length) return;
      // Groups inside a message belong to that unit, so never hide them
      // independently: revealing their parent must reveal all original content.
      const wrappers = [...transcript.querySelectorAll(WRAPPERS)].filter(node =>
        !node.closest('[hidden]') && !node.closest(UNITS));
      const reactions = units.flatMap(node => [...node.querySelectorAll('.unfurl-reaction')]).filter(node => !node.hidden);
      const connectors = units.flatMap(node => [...node.querySelectorAll('.unfurl-thread-connector')]).filter(node => !node.hasAttribute('hidden'));
      sequence = { units, wrappers, reactions, connectors, stage: 0 };
      motion.preserve(() => {
        units.forEach(node => { node.hidden = true; });
        wrappers.forEach(node => { node.hidden = true; });
        reactions.forEach(node => { node.hidden = true; });
        connectors.forEach(node => node.setAttribute('hidden', ''));
        messages.dataset.playback = 'playing';
        scroll.classList.add('is-bubble-playback');
      });
      motion.resetFollowing(true);
      prepareNext();
    }

    messages.addEventListener('click', event => {
      if (event.target.closest('.unfurl-show-more')) finish();
    }, true);
    window.addEventListener('mvp-workspace-open', finish);
    window.addEventListener('animation-timeline-open', () => finish());
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finish(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(timer);
        motion.settle();
      } else {
        if (pendingStep) schedule(pendingStep, pendingDelay);
      }
    });

    return Object.freeze({
      play, finish, change, showTyping, hideTyping, replyDelay: TIMING.reply,
      enter: motion.enter, preserve: motion.preserve, settle: motion.settle,
      resetFollowing: motion.resetFollowing, toBottom: motion.toBottom
    });
  }
  window.MVPBubblePlayback = Object.freeze({ create });
})();
