/*
 * AFTER 1 — one clock for conversation growth and its scroll position.
 * 0ms       measure the current, possibly interrupted presentation
 * 0–420ms   grow to the new content height with a gentle deceleration
 * 0–300ms   incoming content fades in and rises 8px, without scaling text
 * settled   release all temporary geometry; the layout is natural again
 */
(() => {
  'use strict';
  const MOTION = Object.freeze({
    layout: 420,
    entrance: 300,
    offset: 8,
    easing: 'cubic-bezier(.2, .8, .2, 1)',
    bottomThreshold: 32
  });
  // The same cubic curve as the CSS animations, sampled for height + scroll.
  function ease(progress) {
    let low = 0, high = 1, t = progress;
    const cubic = (a, b, v) => 3 * (1 - v) ** 2 * v * a + 3 * (1 - v) * v ** 2 * b + v ** 3;
    for (let i = 0; i < 14; i++) {
      if (cubic(.2, .2, t) < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return progress === 1 ? 1 : cubic(.8, 1, t);
  }

  function create({ messages, scroll, reducedMotion }) {
    let frame = 0;
    let follow = true;
    let expectedTop = scroll.scrollTop;
    let touching = false;
    let finishLayout = null;
    const animations = new Set();
    const originalHeight = messages.style.height;
    const units = () => [...messages.querySelectorAll('.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue, [data-demo-message]')]
      .filter(node => !node.closest('[hidden]') && !node.parentElement.closest('.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue'));
    const maxScroll = () => Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    const writeScroll = top => {
      scroll.scrollTop = top;
      expectedTop = scroll.scrollTop;
    };

    function track(animation) {
      animations.add(animation);
      const release = () => animations.delete(animation);
      animation.addEventListener('finish', release, { once: true });
      animation.addEventListener('cancel', release, { once: true });
      return animation;
    }

    function enter(node) {
      if (reducedMotion.matches || document.hidden) return;
      track(node.animate([
        { opacity: 0, transform: `translateY(${MOTION.offset}px)` },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: MOTION.entrance, easing: MOTION.easing }));
    }

    function cancel() {
      cancelAnimationFrame(frame);
      frame = 0;
      const complete = finishLayout;
      finishLayout = null;
      messages.style.height = originalHeight;
      messages.classList.remove('is-changing-height');
      animations.forEach(animation => animation.cancel());
      animations.clear();
      complete?.(false);
    }

    function change(update, { incoming = [], pin = false, target = null } = {}) {
      const startHeight = messages.getBoundingClientRect().height;
      const startTop = scroll.scrollTop;
      const positions = new Map(units().map(node => [node, node.getBoundingClientRect().top + startTop]));
      cancel();
      if (pin) follow = true;
      update();
      const endHeight = messages.getBoundingClientRect().height;
      const endTop = target
        ? Math.max(0, Math.min(maxScroll(), target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 100))
        : follow ? maxScroll() : startTop;
      if (reducedMotion.matches || document.hidden) {
        writeScroll(endTop);
        if (target) follow = false;
        return Promise.resolve(true);
      }

      // FLIP existing rows so inserting content above them never teleports text.
      for (const [node, top] of positions) {
        if (!node.isConnected || node.closest('[hidden]')) continue;
        const offset = top - (node.getBoundingClientRect().top + scroll.scrollTop);
        if (Math.abs(offset) > .5) track(node.animate([
          { transform: `translateY(${offset}px)` }, { transform: 'translateY(0)' }
        ], { duration: MOTION.layout, easing: MOTION.easing }));
      }
      incoming.forEach(enter);
      messages.classList.add('is-changing-height');
      messages.style.height = `${startHeight}px`;
      writeScroll(startTop);
      const started = performance.now();
      const shouldScroll = follow || Boolean(target);
      return new Promise(resolve => {
        finishLayout = resolve;
        function tick(now) {
          const progress = Math.min(1, (now - started) / MOTION.layout);
          const eased = ease(progress);
          messages.style.height = `${startHeight + (endHeight - startHeight) * eased}px`;
          // A deliberate reader scroll interrupts following, not the expansion.
          if (shouldScroll && follow) writeScroll(startTop + (endTop - startTop) * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
          else {
            frame = 0;
            messages.style.height = originalHeight;
            messages.classList.remove('is-changing-height');
            if (shouldScroll && follow) writeScroll(endTop);
            if (target) follow = false;
            finishLayout = null;
            resolve(true);
          }
        }
        frame = requestAnimationFrame(tick);
      });
    }

    function toBottom() { return change(() => {}, { pin: true }); }
    function stopFollowing() { follow = false; }
    scroll.addEventListener('wheel', event => { if (event.deltaY < 0) stopFollowing(); }, { passive: true });
    scroll.addEventListener('touchstart', () => { touching = true; stopFollowing(); }, { passive: true });
    scroll.addEventListener('touchend', () => { touching = false; }, { passive: true });
    scroll.addEventListener('keydown', event => {
      if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
      if (['ArrowUp', 'PageUp', 'Home', 'ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) stopFollowing();
    });
    scroll.addEventListener('scroll', () => {
      const top = scroll.scrollTop;
      // Ignore our own writes and scroll-range clamping during a height change.
      if (Math.abs(top - expectedTop) < 2) return;
      if (!touching && top > expectedTop && maxScroll() - top <= MOTION.bottomThreshold) follow = true;
      else if (top < expectedTop || touching) follow = false;
      expectedTop = top;
    }, { passive: true });
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) cancel(); });
    window.addEventListener('resize', cancel);
    window.addEventListener('pagehide', cancel);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
    return Object.freeze({ change, enter, cancel, track, toBottom, stopFollowing });
  }
  window.OwlChatMotion = Object.freeze({ create });
})();
