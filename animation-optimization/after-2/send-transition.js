/*
 * AFTER 2 — steady conversation motion.
 * Send: one 8px / 180ms entrance on the new message only.
 * Reply: progress and streamed text update in the same container, without animation.
 * Reading: preserve the visible message; follow growth only when already at the bottom.
 * Jump to latest: a short, explicit scroll that the reader can interrupt.
 */
(() => {
  'use strict';

  const DEFAULTS = Object.freeze({
    entrance: Object.freeze({ duration: 180, offset: 8, curve: Object.freeze([.2, .7, .2, 1]) }),
    jump: Object.freeze({ duration: 220, threshold: 32 })
  });
  const MOTION = JSON.parse(JSON.stringify(DEFAULTS));
  const ROWS = '.timeline-message, .pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue, [data-demo-message], .message';

  function create({ messages, scroll, reducedMotion, dock: composerDock = null }) {
    let following = nearBottom();
    let unseen = false;
    let expectedTop = scroll.scrollTop;
    let touching = false;
    let jumpFrame = 0;
    let jumping = false;
    const animations = new Set();
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.className = 'jump-to-latest';
    jump.textContent = '↓ Jump to latest';
    jump.hidden = true;
    jump.setAttribute('aria-label', 'Jump to latest messages');
    const surface = scroll.closest('.main') || scroll.parentElement;
    const dock = composerDock || surface?.querySelector('.composer-dock');
    if (dock) dock.prepend(jump);
    else {
      jump.classList.add('jump-to-latest-fallback');
      surface?.append(jump);
    }

    function maxScroll() { return Math.max(0, scroll.scrollHeight - scroll.clientHeight); }
    function nearBottom() { return maxScroll() - scroll.scrollTop <= MOTION.jump.threshold; }
    function syncJump() { jump.hidden = !unseen || following; }
    function writeScroll(top) {
      scroll.scrollTop = Math.max(0, Math.min(maxScroll(), top));
      expectedTop = scroll.scrollTop;
    }
    function cancelJump() {
      cancelAnimationFrame(jumpFrame);
      jumpFrame = 0;
      jumping = false;
    }
    function track(animation) {
      animations.add(animation);
      const release = () => animations.delete(animation);
      animation.addEventListener('finish', release, { once: true });
      animation.addEventListener('cancel', release, { once: true });
    }
    function cancelEntrances() {
      [...animations].forEach(animation => animation.cancel());
      animations.clear();
    }

    // Keep a DOM anchor and its screen position only for this synchronous mutation.
    // Snapshots used across threads contain no nodes from another conversation.
    function capture() {
      const bounds = scroll.getBoundingClientRect();
      const rows = [...messages.querySelectorAll(ROWS)].filter(node =>
        !node.closest('[hidden]') && !node.parentElement.closest(ROWS));
      const anchor = rows.find(node => {
        const rect = node.getBoundingClientRect();
        return rect.bottom > bounds.top && rect.top < bounds.bottom;
      });
      return {
        scrollTop: scroll.scrollTop,
        following: jumping || (following && nearBottom()),
        jumping,
        anchor,
        top: anchor?.getBoundingClientRect().top
      };
    }
    function keepPosition(before) {
      following = before.following;
      if (following) {
        writeScroll(maxScroll());
        unseen = false;
      } else if (before.anchor?.isConnected && messages.contains(before.anchor)) {
        writeScroll(scroll.scrollTop + before.anchor.getBoundingClientRect().top - before.top);
      } else writeScroll(before.scrollTop);
      syncJump();
    }
    function entrance(node) {
      if (!node?.isConnected || reducedMotion.matches || document.hidden) return;
      const { duration, offset, curve } = MOTION.entrance;
      track(node.animate([
        { opacity: 0, transform: `translateY(${offset}px)` },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration, easing: `cubic-bezier(${curve.join(',')})` }));
    }

    function change(update, { incoming = null, notify = false } = {}) {
      const before = capture();
      const result = update();
      // Streaming must not finish or restart an explicit jump on every batch.
      // Its next frame reads the new bottom while the current reading point holds.
      if (before.jumping) {
        keepPosition({ ...before, following: false });
        following = true;
        unseen = false;
      } else keepPosition(before);
      if (notify && !following) unseen = true;
      syncJump();
      if (incoming) (Array.isArray(incoming) ? incoming : [incoming]).forEach(entrance);
      return result;
    }
    function send(node, append) { return change(append, { incoming: node, notify: true }); }
    function reply(_node, update) { return change(update, { notify: true }); }
    function preserve(update) { return change(update); }

    function snapshot() {
      return { scrollTop: scroll.scrollTop, following: following && nearBottom(), unseen };
    }
    function restore(state = {}) {
      cancelJump();
      cancelEntrances();
      writeScroll(Number.isFinite(state.scrollTop) ? state.scrollTop : 0);
      following = typeof state.following === 'boolean' ? state.following && nearBottom() : nearBottom();
      unseen = Boolean(state.unseen) && !following;
      syncJump();
    }
    function reset() {
      cancelJump();
      cancelEntrances();
      unseen = false;
      touching = false;
      following = nearBottom();
      expectedTop = scroll.scrollTop;
      syncJump();
    }

    function showLatest() {
      cancelJump();
      following = true;
      unseen = false;
      syncJump();
      const startTop = scroll.scrollTop;
      if (reducedMotion.matches || document.hidden || Math.abs(maxScroll() - startTop) < 1) {
        writeScroll(maxScroll());
        return;
      }
      const started = performance.now();
      jumping = true;
      function tick(now) {
        const progress = Math.min(1, Math.max(0, (now - started) / MOTION.jump.duration));
        const eased = 1 - (1 - progress) ** 3;
        writeScroll(startTop + (maxScroll() - startTop) * eased);
        if (progress < 1) jumpFrame = requestAnimationFrame(tick);
        else {
          jumpFrame = 0;
          jumping = false;
          writeScroll(maxScroll());
        }
      }
      jumpFrame = requestAnimationFrame(tick);
    }
    jump.addEventListener('click', showLatest);

    function release() {
      const wasJumping = jumping;
      cancelJump();
      following = false;
      if (wasJumping && !nearBottom()) unseen = true;
      syncJump();
    }
    scroll.addEventListener('wheel', event => {
      if (event.deltaY < 0 || jumping) release();
      else if (event.deltaY > 0 && nearBottom()) {
        following = true;
        unseen = false;
        syncJump();
      }
    }, { passive: true });
    scroll.addEventListener('touchstart', () => { touching = true; release(); }, { passive: true });
    const endTouch = () => {
      touching = false;
      if (maxScroll() - scroll.scrollTop <= 1) {
        following = true;
        unseen = false;
      }
      expectedTop = scroll.scrollTop;
      syncJump();
    };
    scroll.addEventListener('touchend', endTouch, { passive: true });
    scroll.addEventListener('touchcancel', endTouch, { passive: true });
    scroll.addEventListener('keydown', event => {
      if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) release();
    });
    scroll.addEventListener('scroll', () => {
      const top = scroll.scrollTop;
      if (Math.abs(top - expectedTop) < 1) return;
      const down = top > expectedTop;
      if (jumping) release();
      following = !touching && down && nearBottom();
      if (following) unseen = false;
      expectedTop = top;
      syncJump();
    }, { passive: true });
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      const wasJumping = jumping;
      cancelJump();
      cancelEntrances();
      if (wasJumping) showLatest();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      cancelEntrances();
      if (jumping) showLatest();
    });
    window.addEventListener('pagehide', () => { cancelJump(); cancelEntrances(); });

    return Object.freeze({ change, send, reply, preserve, snapshot, restore, reset, showLatest });
  }

  window.OwlSendMotion = Object.freeze({ create, MOTION, DEFAULTS });
})();
