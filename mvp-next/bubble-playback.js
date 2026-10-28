/*
 * ANIMATION STORYBOARD — automatic, once per fresh conversation
 *    0ms   hide upcoming bubbles; show the three-dot typing indicator
 *  650ms   first bubble rises 14px and settles from scale .96 → 1
 * +420ms   pause after each arrival, then type before the next assistant bubble
 * +900ms   next assistant bubble arrives (up to 1400ms for longer messages)
 *          follow new messages until the reader scrolls back
 */
(() => {
  'use strict';
  const TIMING = Object.freeze({
    firstArrival: 650,     // Initial typing pause.
    afterArrival: 420,     // Let a delivered bubble settle before the next turn.
    typingMinimum: 900,    // Short assistant messages.
    typingMaximum: 1400,   // Cap the pause for longer report bubbles.
    characterDelay: 2,     // Extra milliseconds per character.
    userArrival: 650,      // Pause before a blue outgoing bubble.
    previewArrival: 450,   // Links and cards follow their message.
    entrance: 360,         // Soft iMessage-style rise and settle.
    reply: 1100           // Typing pause for a locally generated reply.
  });
  const BUBBLE = Object.freeze({ offsetY: 14, initialScale: .96, settleY: -1, settleScale: 1.005 });
  const UNITS = '.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue';

  function create({ messages, scroll, reducedMotion }) {
    let sequence = null;
    let timer = 0;
    let pendingStep = null;
    let pendingDelay = 0;
    let follow = true;
    let lastScrollTop = 0;
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

    function followLatest() {
      if (follow) scroll.scrollTo({ top: scroll.scrollHeight, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }

    function enter(node) {
      if (reducedMotion.matches) return;
      const outgoing = node.matches('.unfurl-user-turn, .user-message');
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
      clearTimeout(timer);
      pendingStep = null;
      hideTyping();
      if (!sequence) return;
      sequence.units.forEach(node => { node.hidden = false; });
      sequence.wrappers.forEach(node => { node.hidden = false; });
      sequence = null;
      delete messages.dataset.playback;
      scroll.classList.remove('is-bubble-playback');
    }

    function reveal() {
      if (!sequence) return;
      const node = sequence.units[sequence.stage];
      hideTyping();
      node.hidden = false;
      enter(node);
      sequence.stage += 1;
      followLatest();
      if (sequence.stage < sequence.units.length) schedule(prepareNext, TIMING.afterArrival);
      else finish();
    }

    function prepareNext() {
      if (!sequence) return;
      const node = sequence.units[sequence.stage];
      sequence.wrappers.forEach(wrapper => {
        if (wrapper.contains(node)) wrapper.hidden = false;
      });
      const assistant = node.matches('.pen-bubble');
      if (assistant) showTyping(node);
      const delay = sequence.stage === 0 ? TIMING.firstArrival : assistant
        ? Math.min(TIMING.typingMaximum, TIMING.typingMinimum + node.textContent.trim().length * TIMING.characterDelay)
        : node.matches('.unfurl-user-turn') ? TIMING.userArrival : TIMING.previewArrival;
      followLatest();
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
      sequence = { units, wrappers, stage: 0 };
      units.forEach(node => { node.hidden = true; });
      wrappers.forEach(node => { node.hidden = true; });
      messages.dataset.playback = 'playing';
      scroll.classList.add('is-bubble-playback');
      follow = true;
      lastScrollTop = scroll.scrollTop;
      prepareNext();
    }

    scroll.addEventListener('scroll', () => {
      const top = scroll.scrollTop;
      if (top < lastScrollTop - 2) {
        if (follow) scroll.scrollTo({ top, behavior: 'instant' });
        follow = false;
      } else if (top > lastScrollTop && scroll.scrollHeight - scroll.clientHeight - top < 4) follow = true;
      lastScrollTop = top;
    }, { passive: true });
    scroll.addEventListener('wheel', event => {
      if (event.deltaY < 0) {
        if (follow) scroll.scrollTo({ top: scroll.scrollTop, behavior: 'instant' });
        follow = false;
      }
    }, { passive: true });
    messages.addEventListener('click', event => {
      if (event.target.closest('.unfurl-show-more')) finish();
    }, true);
    window.addEventListener('mvp-workspace-open', finish);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finish(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(timer);
      else if (pendingStep) schedule(pendingStep, pendingDelay);
    });

    return Object.freeze({ play, finish, enter, showTyping, hideTyping, replyDelay: TIMING.reply });
  }
  window.MVPBubblePlayback = Object.freeze({ create });
})();
