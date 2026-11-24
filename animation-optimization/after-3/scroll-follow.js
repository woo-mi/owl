/*
 * V3 SCROLL STORYBOARD — the existing bubble animation stays unchanged
 *
 *    0ms   a typing indicator or reply extends the bottom of the conversation
 *  0–460ms follow that bottom with a critically damped, non-bouncing glide
 *  460ms   finish at the exact bottom; an interrupted glide stops immediately
 *
 * New arrivals retarget the same clock from the current position and velocity.
 */
(() => {
  'use strict';

  const TIMING = Object.freeze({ settle: 460 });
  const SCROLL = Object.freeze({
    frequency: 20,       // Critical spring frequency, radians per second.
    bottomThreshold: 32, // Returning this close to the bottom resumes following.
    positionEpsilon: .5,
    velocityEpsilon: 3
  });

  function create({ scroll, reducedMotion }) {
    let following = true;
    let touching = false;
    let expectedTop = scroll.scrollTop;
    let frame = 0;
    let glide = null;
    const maxScroll = () => Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    const nearBottom = () => maxScroll() - scroll.scrollTop <= SCROLL.bottomThreshold;
    scroll.classList.add('has-smooth-follow');

    function writeScroll(top) {
      scroll.scrollTop = Math.max(0, Math.min(top, maxScroll()));
      expectedTop = scroll.scrollTop;
    }

    function stop(completed = false) {
      cancelAnimationFrame(frame);
      frame = 0;
      const previous = glide;
      glide = null;
      previous?.resolve(completed);
      expectedTop = scroll.scrollTop;
    }

    function cancel() { stop(false); }

    function settle() {
      if (following && !touching && !document.hidden) writeScroll(maxScroll());
      stop(true);
    }

    function retarget(now) {
      const target = maxScroll();
      if (Math.abs(target - glide.target) > SCROLL.positionEpsilon) {
        glide.target = target;
        glide.deadline = now + TIMING.settle;
      }
      return target;
    }

    function tick(now) {
      frame = 0;
      if (!glide) return;
      if (!following || touching || document.hidden) { cancel(); return; }
      if (reducedMotion.matches) { settle(); return; }
      const target = retarget(now);
      const current = scroll.scrollTop;
      const distance = target - current;
      if (distance <= SCROLL.positionEpsilon || now >= glide.deadline) {
        writeScroll(target);
        stop(true);
        return;
      }

      // Exact integration of a critically damped spring. Keeping its velocity
      // when the target grows avoids restarting or backing up between arrivals.
      const elapsed = Math.max(0, now - glide.lastTime) / 1000;
      const omega = SCROLL.frequency;
      const displacement = current - target;
      const combined = glide.velocity + omega * displacement;
      const decay = Math.exp(-omega * elapsed);
      const next = target + (displacement + combined * elapsed) * decay;
      glide.velocity = (glide.velocity - omega * combined * elapsed) * decay;
      glide.lastTime = now;
      writeScroll(Math.max(current, Math.min(target, next)));
      if (target - scroll.scrollTop <= SCROLL.positionEpsilon && Math.abs(glide.velocity) <= SCROLL.velocityEpsilon) {
        writeScroll(target);
        stop(true);
        return;
      }
      frame = requestAnimationFrame(tick);
    }

    function followLatest({ force = false } = {}) {
      if (force) following = true;
      if (!following || touching || document.hidden) return Promise.resolve(false);
      if (reducedMotion.matches) {
        writeScroll(maxScroll());
        stop(true);
        return Promise.resolve(true);
      }
      const now = performance.now();
      if (glide) {
        retarget(now);
        return glide.finished;
      }
      const target = maxScroll();
      if (target - scroll.scrollTop <= SCROLL.positionEpsilon) {
        writeScroll(target);
        return Promise.resolve(true);
      }
      let resolve;
      const finished = new Promise(done => { resolve = done; });
      glide = { target, velocity: 0, lastTime: now, deadline: now + TIMING.settle, finished, resolve };
      frame = requestAnimationFrame(tick);
      return finished;
    }

    function resetFollowing(value = true) {
      cancel();
      following = Boolean(value);
    }

    function interrupt() {
      following = false;
      cancel();
    }
    scroll.addEventListener('wheel', event => { if (event.deltaY < 0) interrupt(); }, { passive: true });
    scroll.addEventListener('touchstart', () => { touching = true; interrupt(); }, { passive: true });
    const endTouch = () => { touching = false; following = nearBottom(); expectedTop = scroll.scrollTop; };
    scroll.addEventListener('touchend', endTouch, { passive: true });
    scroll.addEventListener('touchcancel', endTouch, { passive: true });
    scroll.addEventListener('keydown', event => {
      if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
    });
    scroll.addEventListener('scroll', () => {
      const top = scroll.scrollTop;
      if (Math.abs(top - expectedTop) <= SCROLL.positionEpsilon) return;
      const maximum = maxScroll();
      // Replacing a typing row with a shorter reply can clamp the scroll range.
      // That browser adjustment is not the reader choosing to scroll upward.
      if (!touching && expectedTop > maximum && Math.abs(top - maximum) <= SCROLL.positionEpsilon) {
        expectedTop = top;
        return;
      }
      if (top < expectedTop || touching) interrupt();
      else {
        following = nearBottom();
        if (!following) cancel();
      }
      expectedTop = scroll.scrollTop;
    }, { passive: true });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches && glide) settle();
      else cancel();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
    window.addEventListener('pagehide', cancel);
    window.addEventListener('resize', cancel);

    return Object.freeze({ followLatest, resetFollowing, cancel, settle });
  }

  window.OwlScrollFollow = Object.freeze({ create, TIMING, SCROLL });
})();
