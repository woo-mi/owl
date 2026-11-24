/*
 * AFTER 1 — one clock for conversation growth and its scroll position.
 * 0ms       measure the current, possibly interrupted presentation
 * 0–480ms   conversation, scroll, and message placement settle on one curve
 * 0–480ms   typing pill expands into the reply; outgoing bubbles lift into place
 * 0–100ms   typing dots dissolve as the bubble opens
 * 80–300ms  reply text fades in at its final size, without scaling or reflow
 * settled   release all temporary geometry; the layout is natural again
 */
(() => {
  'use strict';
  const MOTION = Object.freeze({
    layout: 480,
    entrance: 300,
    textDelay: 80,
    dotsExit: 100,
    offset: 18,
    sendLift: 48,
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
    let animationStart = null;
    const animations = new Set();
    const cleanups = new Set();
    const surfaces = new Map();
    const originalHeight = messages.style.height;
    const units = () => [...messages.querySelectorAll('.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue, .bubble-typing, [data-demo-message]')]
      .filter(node => !node.closest('[hidden]') && !node.parentElement.closest('.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue'));
    const maxScroll = () => Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    const writeScroll = top => {
      scroll.scrollTop = top;
      expectedTop = scroll.scrollTop;
    };

    function track(animation) {
      if (animationStart !== null) animation.startTime = animationStart;
      animations.add(animation);
      const release = () => animations.delete(animation);
      animation.addEventListener('finish', release, { once: true });
      animation.addEventListener('cancel', release, { once: true });
      return animation;
    }

    function enter(node, { outgoing = false } = {}) {
      if (reducedMotion.matches || document.hidden) return;
      // Enter below the new row, then follow the shared upward scroll. Keeping
      // its place in the flow avoids overlapping the preceding message.
      const offset = outgoing ? MOTION.sendLift : MOTION.offset;
      track(node.animate([
        { opacity: 0, transform: `translateY(${offset}px)` },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: MOTION.layout, easing: MOTION.easing }));
    }

    function morph(node, origin) {
      const bounds = messages.getBoundingClientRect();
      const destination = node.getBoundingClientRect();
      const appearance = getComputedStyle(node);
      const shell = document.createElement('div');
      shell.className = 'bubble-morph-shell';
      shell.setAttribute('aria-hidden', 'true');
      Object.assign(shell.style, {
        left: `${destination.left - bounds.left}px`,
        top: `${destination.top - bounds.top}px`,
        width: `${destination.width}px`,
        height: `${destination.height}px`,
        borderRadius: appearance.borderRadius,
        backgroundColor: appearance.backgroundColor
      });
      const dots = document.createElement('div');
      dots.className = 'bubble-morph-dots';
      dots.innerHTML = '<span></span><span></span><span></span>';
      shell.append(dots);
      messages.append(shell);
      surfaces.set(node, shell);
      const background = appearance.backgroundColor;
      node.classList.add('is-morphing-bubble');
      const restore = () => {
        node.classList.remove('is-morphing-bubble');
        shell.remove();
        if (surfaces.get(node) === shell) surfaces.delete(node);
        cleanups.delete(restore);
      };
      cleanups.add(restore);
      const animation = track(shell.animate([
        {
          width: `${origin.width}px`, height: `${origin.height}px`,
          transform: `translate(${origin.left - destination.left}px, ${origin.top + origin.scrollTop - destination.top - scroll.scrollTop}px)`,
          borderRadius: origin.radius, backgroundColor: origin.background
        },
        {
          width: `${destination.width}px`, height: `${destination.height}px`,
          transform: 'translate(0, 0)', borderRadius: appearance.borderRadius,
          backgroundColor: background
        }
      ], { duration: MOTION.layout, easing: MOTION.easing }));
      animation.addEventListener('finish', restore, { once: true });
      animation.addEventListener('cancel', restore, { once: true });
      track(dots.animate([{ opacity: origin.resume ? 0 : 1 }, { opacity: 0 }], {
        duration: MOTION.dotsExit, easing: 'ease-out', fill: 'forwards'
      }));
      track(node.animate([{ opacity: origin.opacity ?? 0 }, { opacity: 1 }], {
        delay: origin.resume ? 0 : MOTION.textDelay, duration: MOTION.entrance - MOTION.textDelay,
        easing: MOTION.easing, fill: 'backwards'
      }));
      track(node.animate([
        { clipPath: `inset(0 ${Math.max(0, destination.width - origin.width)}px ${Math.max(0, destination.height - origin.height)}px 0 round ${origin.radius})` },
        { clipPath: 'inset(0 0 0 0 round 0px)' }
      ], { duration: MOTION.layout, easing: MOTION.easing }));
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
      cleanups.forEach(cleanup => cleanup());
      complete?.(false);
    }

    function change(update, { incoming = [], pin = false, target = null, morphFrom = null } = {}) {
      const startHeight = messages.getBoundingClientRect().height;
      const startTop = scroll.scrollTop;
      const origin = morphFrom?.isConnected ? {
        ...morphFrom.getBoundingClientRect().toJSON(),
        scrollTop: startTop,
        radius: getComputedStyle(morphFrom).borderRadius,
        background: getComputedStyle(morphFrom).backgroundColor
      } : null;
      // A second send can interrupt a reply mid-expansion. Carry its visible
      // surface into the next layout instead of snapping it to full size.
      const continuing = [...surfaces].map(([node, shell]) => [node, {
        ...shell.getBoundingClientRect().toJSON(), scrollTop: startTop,
        radius: getComputedStyle(shell).borderRadius,
        background: getComputedStyle(shell).backgroundColor,
        opacity: Number(getComputedStyle(node).opacity), resume: true
      }]);
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

      // WAAPI and requestAnimationFrame must share an actual start timestamp,
      // especially when a long transcript is revealed by an interrupted send.
      const started = document.timeline?.currentTime ?? performance.now();
      animationStart = started;

      // FLIP existing rows so inserting content above them never teleports text.
      for (const [node, top] of positions) {
        if (!node.isConnected || node.closest('[hidden]')) continue;
        const offset = top - (node.getBoundingClientRect().top + scroll.scrollTop);
        if (Math.abs(offset) > .5) track(node.animate([
          { transform: `translateY(${offset}px)` }, { transform: 'translateY(0)' }
        ], { duration: MOTION.layout, easing: MOTION.easing }));
      }
      const reply = origin && incoming.find(node => node.matches('.pen-bubble, .assistant-message'));
      continuing.forEach(([node, surface]) => {
        if (node !== reply && node.isConnected && !node.closest('[hidden]')) morph(node, surface);
      });
      if (reply) morph(reply, origin);
      incoming.forEach(node => {
        if (node === reply) return;
        enter(node, {
          outgoing: node.matches('.user-message, .unfurl-user-turn')
        });
      });
      animationStart = null;
      messages.classList.add('is-changing-height');
      messages.style.height = `${startHeight}px`;
      writeScroll(startTop);
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
    function resetFollowing(pin = false) {
      expectedTop = scroll.scrollTop;
      follow = pin || maxScroll() - expectedTop <= MOTION.bottomThreshold;
    }
    function settle() {
      const pinned = follow;
      cancel();
      if (pinned) writeScroll(maxScroll());
      else expectedTop = scroll.scrollTop;
    }
    function endTouch() {
      touching = false;
      resetFollowing();
    }
    scroll.addEventListener('wheel', event => { if (event.deltaY < 0) stopFollowing(); }, { passive: true });
    scroll.addEventListener('touchstart', () => { touching = true; stopFollowing(); }, { passive: true });
    scroll.addEventListener('touchend', endTouch, { passive: true });
    scroll.addEventListener('touchcancel', endTouch, { passive: true });
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
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) settle(); });
    window.addEventListener('resize', settle);
    window.addEventListener('pagehide', cancel);
    document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
    // Sidebar/workspace reflow changes width without a window resize event.
    if (typeof ResizeObserver !== 'undefined') {
      let width = messages.getBoundingClientRect().width;
      new ResizeObserver(entries => {
        const nextWidth = entries[0].contentRect.width;
        if (Math.abs(nextWidth - width) > .5) { width = nextWidth; settle(); }
      }).observe(messages);
    }
    return Object.freeze({ change, enter, cancel, track, toBottom, stopFollowing, resetFollowing });
  }
  window.OwlChatMotion = Object.freeze({ create });
})();
