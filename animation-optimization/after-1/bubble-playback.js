/* AFTER 1: coordinated height/scroll changes; restrained arrivals and reactions. */
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
    reactionEntrance: 320, // A small, quiet reaction reveal.
    reactionHold: 1500,    // Keep the settled emoji in view before continuing.
    connectorEntrance: 420, // Draw the curved thread line after its emoji.
    connectorHold: 400,    // Give the completed connector its own moment.
    reply: 2000           // Typing pause for a locally generated reply.
  });
  const UNITS = '.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue';

  function create({ messages, scroll, reducedMotion }) {
    let sequence = null;
    let timer = 0;
    let pendingStep = null;
    let pendingDelay = 0;
    const motion = window.OwlChatMotion.create({ messages, scroll, reducedMotion });
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

    const enter = motion.enter;

    function hideTyping() { typing.remove(); }
    function showTyping(before) {
      hideTyping();
      if (before) before.before(typing);
      else messages.append(typing);
    }

    function finish({ cancelMotion = true } = {}) {
      if (cancelMotion) motion.cancel();
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
      schedule(sequence.stage < sequence.units.length ? prepareNext : finish, delay);
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
          { opacity: 0, transform: 'translateY(3px) scale(.88)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: TIMING.reactionEntrance, easing: 'cubic-bezier(.2, .8, .2, 1)' });
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
      motion.change(() => {
        hideTyping();
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
      const assistant = node.matches('.pen-bubble');
      motion.change(() => {
        sequence.wrappers.forEach(wrapper => {
          if (wrapper.contains(node)) wrapper.hidden = false;
        });
        if (assistant) showTyping(node);
      });
      const delay = sequence.stage === 0 ? TIMING.firstArrival : assistant
        ? Math.min(TIMING.typingMaximum, TIMING.typingMinimum + node.textContent.trim().length * TIMING.characterDelay)
        : node.matches('.unfurl-user-turn') ? TIMING.userArrival : TIMING.previewArrival;
      schedule(reveal, delay);
    }

    function play() {
      finish();
      if (reducedMotion.matches) return;
      const transcript = messages.querySelector('.pen-frame-transcript');
      if (!transcript) return;
      const units = [...transcript.querySelectorAll(UNITS)].filter(node =>
        !node.closest('[hidden]') && !node.parentElement.closest(UNITS));
      if (!units.length) return;
      const wrappers = [...transcript.querySelectorAll('.pen-bubble-group, .unfurl-thread-detail')].filter(node => !node.hidden);
      const reactions = units.flatMap(node => [...node.querySelectorAll('.unfurl-reaction')]).filter(node => !node.hidden);
      const connectors = units.flatMap(node => [...node.querySelectorAll('.unfurl-thread-connector')]).filter(node => !node.hasAttribute('hidden'));
      sequence = { units, wrappers, reactions, connectors, stage: 0 };
      units.forEach(node => { node.hidden = true; });
      wrappers.forEach(node => { node.hidden = true; });
      reactions.forEach(node => { node.hidden = true; });
      connectors.forEach(node => node.setAttribute('hidden', ''));
      messages.dataset.playback = 'playing';
      scroll.classList.add('is-bubble-playback');
      prepareNext();
    }

    messages.addEventListener('click', event => {
      const link = event.target.closest('.unfurl-show-more');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      // Reveal pending items and approach the existing detail anchor together.
      motion.change(() => finish({ cancelMotion: false }), { pin: true, target });
      history.replaceState(history.state, '', link.hash);
    }, true);
    window.addEventListener('mvp-workspace-open', finish);
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

    return Object.freeze({ play, finish, enter, showTyping, hideTyping, change: motion.change, toBottom: motion.toBottom, replyDelay: TIMING.reply });
  }
  window.MVPBubblePlayback = Object.freeze({ create });
})();
