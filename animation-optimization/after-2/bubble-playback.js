/*
 * AFTER 2 — a steady conversation, with progress inside each reply.
 *    0ms   reveal the next reply container with a quiet “Thinking…” status
 *  900ms   first reply replaces that status in the same container
 * +700ms   pause after arrival, then think for 1300–1700ms
 *          sent messages have one subtle entrance; reply text never animates
 * +850ms   reaction appears with a short fade; original reading pauses remain
 *          the shared motion controller owns following and “Jump to latest”
 */
(() => {
  'use strict';
  const TIMING = Object.freeze({
    firstArrival: 900,
    afterArrival: 700,
    typingMinimum: 1300,
    typingMaximum: 1700,
    characterDelay: 1.2,
    userArrival: 1300,
    previewArrival: 1000,
    reactionDelay: 850,
    reactionEntrance: 650, // Retain the original demonstration's reading rhythm.
    reactionHold: 1500,
    connectorEntrance: 650,
    connectorHold: 400,
    accentFade: 180,
    reply: 2000
  });
  // A timeline message can contain several bubbles and cards. Reveal the
  // complete message once, while keeping standalone context and dates in order.
  const UNITS = '.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue, .timeline-message, .timeline-link-chip, .timeline-card, .timeline-context, .timeline-reference, .timeline-date, .timeline-new';
  const WRAPPERS = '.pen-bubble-group, .unfurl-thread-detail, .timeline-section, .timeline-group';
  const OUTGOING = '.unfurl-user-turn, .user-message, .timeline-outgoing';
  const isAssistant = node => node.matches('.pen-bubble, .assistant-message') ||
    (node.matches('.timeline-message') && !node.matches(OUTGOING));

  function create({ messages, scroll, reducedMotion, motion }) {
    let sequence = null;
    let timer = 0;
    let pendingStep = null;
    let pendingDelay = 0;
    const pendingChildren = new Map();
    const accentAnimations = new Set();
    const change = (update, options) => motion ? motion.change(update, options) : update();

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

    function revealParents(node) {
      sequence?.wrappers.forEach(wrapper => {
        if (wrapper.contains(node)) wrapper.hidden = false;
      });
    }

    function showTyping(node) {
      if (!node || pendingChildren.has(node)) return;
      const bubble = node.matches('.timeline-message')
        ? node.querySelector('.assistant-message') || node : node;
      pendingChildren.set(node, {
        children: [...node.childNodes],
        bubble,
        bubbleChildren: [...bubble.childNodes],
        bubbleParent: bubble.parentElement,
        bubbleSiblings: [...(bubble.parentElement?.childNodes || [])]
      });
      const status = document.createElement('div');
      status.className = 'reply-progress';
      status.setAttribute('role', 'status');
      status.textContent = 'Thinking…';
      // Keep the first real article for both progress and the final reply,
      // including when it starts inside one of the source's nested groups.
      bubble.replaceChildren(status);
      if (bubble !== node) node.replaceChildren(bubble);
      node.classList.add('reply-pending');
      node.setAttribute('aria-busy', 'true');
    }

    function restoreReply(node) {
      const pending = pendingChildren.get(node);
      if (!pending) return;
      const { children, bubble, bubbleChildren, bubbleParent, bubbleSiblings } = pending;
      bubble.replaceChildren(...bubbleChildren);
      if (bubble !== node && bubbleParent !== node) {
        bubbleParent.replaceChildren(...bubbleSiblings);
      }
      node.replaceChildren(...children);
      node.classList.remove('reply-pending');
      node.removeAttribute('aria-busy');
      pendingChildren.delete(node);
    }

    function hideTyping() {
      [...pendingChildren.keys()].forEach(restoreReply);
    }

    function finish({ revealRemaining = true } = {}) {
      clearTimeout(timer);
      pendingStep = null;
      accentAnimations.forEach(animation => animation.cancel());
      accentAnimations.clear();
      if (!sequence) { hideTyping(); return; }
      // The timeline is the complete shared source history, not disposable demo
      // content. User participation may stop its playback but must retain it.
      const revealAll = revealRemaining || sequence.timeline;
      change(() => {
        hideTyping();
        sequence.units.forEach(node => {
          if (!revealAll && node.hidden) node.remove();
          else node.hidden = false;
        });
        sequence.wrappers.forEach(node => {
          if (!revealAll && node.hidden) node.remove();
          else node.hidden = false;
        });
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

    function fadeAccent(node) {
      if (reducedMotion.matches || document.hidden) return;
      const animation = node.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: TIMING.accentFade, easing: 'ease-out'
      });
      accentAnimations.add(animation);
      const release = () => accentAnimations.delete(animation);
      animation.addEventListener('finish', release, { once: true });
      animation.addEventListener('cancel', release, { once: true });
    }

    function revealConnectors(connectors) {
      if (!sequence) return;
      change(() => connectors.forEach(node => {
        node.removeAttribute('hidden');
        fadeAccent(node);
      }));
      continueSequence(TIMING.connectorEntrance + TIMING.connectorHold);
    }

    function revealReactions(reactions, connectors) {
      if (!sequence) return;
      change(() => reactions.forEach(node => {
        node.hidden = false;
        fadeAccent(node);
      }));
      const delay = TIMING.reactionEntrance + TIMING.reactionHold;
      if (connectors.length) schedule(() => revealConnectors(connectors), delay);
      else continueSequence(delay);
    }

    function reveal() {
      if (!sequence) return;
      const node = sequence.units[sequence.stage];
      const update = () => {
        revealParents(node);
        restoreReply(node);
        node.hidden = false;
      };
      if (isAssistant(node) && motion) motion.reply(node, update);
      else if (node.matches(OUTGOING) && motion) motion.send(node, update);
      else change(update, { notify: true });
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
      const characters = node.textContent.trim().length;
      if (assistant) change(() => {
        revealParents(node);
        showTyping(node);
        node.hidden = false;
      }, { notify: true });
      const delay = sequence.stage === 0 ? TIMING.firstArrival : assistant
        ? Math.min(TIMING.typingMaximum, TIMING.typingMinimum + characters * TIMING.characterDelay)
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
      sequence = { units, wrappers, reactions, connectors, timeline: transcript.matches('.reply-timeline'), stage: 0 };
      units.forEach(node => { node.hidden = true; });
      wrappers.forEach(node => { node.hidden = true; });
      reactions.forEach(node => { node.hidden = true; });
      connectors.forEach(node => node.setAttribute('hidden', ''));
      messages.dataset.playback = 'playing';
      scroll.classList.add('is-bubble-playback');
      // The full source transcript was taller than the fresh playback. Start
      // following only after its future messages have left the visible flow.
      motion?.reset();
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

    return Object.freeze({ play, finish, showTyping, hideTyping, replyDelay: TIMING.reply });
  }
  window.MVPBubblePlayback = Object.freeze({ create });
})();
