/*
 * ANIMATION STORYBOARD — automatic, once per fresh conversation
 *    0ms   hide upcoming bubbles; show the three-dot typing indicator
 *  900ms   first bubble rises 14px and settles from scale .96 → 1
 * +700ms   pause after each arrival, then type for 1300–1700ms
 *          normal bubbles arrive about two seconds apart
 * +850ms   after a reacted-to message, its emoji pops in separately
 * +650ms   emoji bounces and tilts into place, then stays for another 1500ms
 * +650ms   curved connector draws toward the reply, then holds for 400ms
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
    entrance: 360,         // Soft iMessage-style rise and settle.
    reactionDelay: 850,    // Let the message arrive before its reaction.
    reactionEntrance: 650, // A separate tapback-style bounce and tilt.
    reactionHold: 1500,    // Keep the settled emoji in view before continuing.
    connectorEntrance: 650, // Draw the curved thread line after its emoji.
    connectorHold: 400,    // Give the completed connector its own moment.
    reply: 2000           // Typing pause for a locally generated reply.
  });
  const BUBBLE = Object.freeze({ offsetY: 14, initialScale: .96, settleY: -1, settleScale: 1.005 });
  const REACTION = Object.freeze({ initialScale: .22, offsetY: 8, initialTilt: -14, overshoot: 1.22, overshootTilt: 8, settleScale: .94, settleTilt: -4 });
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
    const scrollFollow = window.OwlScrollFollow.create({ scroll, reducedMotion });
    const accentAnimations = new Set();
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

    const followLatest = (options) => scrollFollow.followLatest(options);

    function enter(node) {
      if (reducedMotion.matches) return;
      const outgoing = node.matches(OUTGOING);
      node.animate([
        { opacity: 0, transform: `translateY(${BUBBLE.offsetY}px) scale(${BUBBLE.initialScale})`, transformOrigin: outgoing ? 'bottom right' : 'bottom left' },
        { opacity: 1, transform: `translateY(${BUBBLE.settleY}px) scale(${BUBBLE.settleScale})`, offset: .8, transformOrigin: outgoing ? 'bottom right' : 'bottom left' },
        { opacity: 1, transform: 'translateY(0) scale(1)', transformOrigin: outgoing ? 'bottom right' : 'bottom left' }
      ], { duration: TIMING.entrance, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }

    function hideTyping() { typing.remove(); }
    function showTyping(before) {
      hideTyping();
      if (before) before.before(typing);
      else messages.append(typing);
    }

    function finish() {
      scrollFollow.cancel();
      clearTimeout(timer);
      pendingStep = null;
      hideTyping();
      accentAnimations.forEach(animation => animation.cancel());
      accentAnimations.clear();
      if (!sequence) return;
      sequence.units.forEach(node => { node.hidden = false; });
      sequence.wrappers.forEach(node => { node.hidden = false; });
      sequence.reactions.forEach(node => { node.hidden = false; });
      sequence.connectors.forEach(node => node.removeAttribute('hidden'));
      sequence = null;
      delete messages.dataset.playback;
      scroll.classList.remove('is-bubble-playback');
    }

    function continueSequence(delay) {
      if (!sequence) return;
      const hasNext = sequence.stage < sequence.units.length;
      // Let the last reply's slower glide finish before playback cleanup.
      const finalPause = Math.max(delay, window.OwlScrollFollow.TIMING.settle + 50);
      schedule(hasNext ? prepareNext : finish, hasNext ? delay : finalPause);
    }

    function revealConnectors(connectors) {
      if (!sequence) return;
      connectors.forEach(node => {
        node.removeAttribute('hidden');
        if (reducedMotion.matches) return;
        node.querySelectorAll('path').forEach(path => {
          const length = path.getTotalLength();
          const dash = `${length} ${length}`;
          const animation = path.animate([
            { strokeDasharray: dash, strokeDashoffset: length, opacity: 0 },
            { strokeDasharray: dash, strokeDashoffset: 0, opacity: 1 }
          ], { duration: TIMING.connectorEntrance, easing: 'cubic-bezier(.22, .7, .35, 1)' });
          accentAnimations.add(animation);
          animation.onfinish = () => accentAnimations.delete(animation);
        });
      });
      continueSequence(TIMING.connectorEntrance + TIMING.connectorHold);
    }

    function revealReactions(reactions, connectors) {
      if (!sequence) return;
      reactions.forEach(node => {
        node.hidden = false;
        if (reducedMotion.matches) return;
        const animation = node.animate([
          { opacity: 0, transform: `translateY(${REACTION.offsetY}px) scale(${REACTION.initialScale}) rotate(${REACTION.initialTilt}deg)` },
          { opacity: 1, transform: `translateY(-2px) scale(${REACTION.overshoot}) rotate(${REACTION.overshootTilt}deg)`, offset: .46 },
          { opacity: 1, transform: `translateY(0) scale(${REACTION.settleScale}) rotate(${REACTION.settleTilt}deg)`, offset: .72 },
          { opacity: 1, transform: 'translateY(0) scale(1) rotate(0deg)' }
        ], { duration: TIMING.reactionEntrance, easing: 'cubic-bezier(.22, .7, .35, 1)' });
        accentAnimations.add(animation);
        animation.onfinish = () => accentAnimations.delete(animation);
      });
      const delay = TIMING.reactionEntrance + TIMING.reactionHold;
      if (connectors.length) schedule(() => revealConnectors(connectors), delay);
      else continueSequence(delay);
    }

    function reveal() {
      if (!sequence) return;
      const node = sequence.units[sequence.stage];
      hideTyping();
      node.hidden = false;
      enter(node);
      sequence.stage += 1;
      followLatest();
      const reactions = [...node.querySelectorAll('.unfurl-reaction')];
      const connectors = [...node.querySelectorAll('.unfurl-thread-connector')];
      if (reactions.length) schedule(() => revealReactions(reactions, connectors), TIMING.reactionDelay);
      else if (connectors.length) schedule(() => revealConnectors(connectors), TIMING.afterArrival);
      else continueSequence(TIMING.afterArrival);
    }

    function prepareNext() {
      if (!sequence) return;
      const node = sequence.units[sequence.stage];
      sequence.wrappers.forEach(wrapper => {
        if (wrapper.contains(node)) wrapper.hidden = false;
      });
      const assistant = isAssistant(node);
      if (assistant) showTyping(node);
      const delay = sequence.stage === 0 ? TIMING.firstArrival : assistant
        ? Math.min(TIMING.typingMaximum, TIMING.typingMinimum + node.textContent.trim().length * TIMING.characterDelay)
        : node.matches(OUTGOING) ? TIMING.userArrival : TIMING.previewArrival;
      followLatest();
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
      units.forEach(node => { node.hidden = true; });
      wrappers.forEach(node => { node.hidden = true; });
      reactions.forEach(node => { node.hidden = true; });
      connectors.forEach(node => node.setAttribute('hidden', ''));
      messages.dataset.playback = 'playing';
      scroll.classList.add('is-bubble-playback');
      scrollFollow.resetFollowing(true);
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
        accentAnimations.forEach(animation => animation.pause());
      } else {
        accentAnimations.forEach(animation => animation.play());
        if (pendingStep) schedule(pendingStep, pendingDelay);
      }
    });

    return Object.freeze({ play, finish, enter, showTyping, hideTyping, followLatest, replyDelay: TIMING.reply });
  }
  window.MVPBubblePlayback = Object.freeze({ create });
})();
