/*
 * REVEAL STORYBOARD — one clock for the message area and its scroll position
 *
 *    0ms   apply the new content; retain the currently allocated message height
 *  0–360ms expand to its natural height while the new message fades and rises 6px
 *  360ms   release temporary geometry; text has stayed at its normal size
 *
 * A reader scrolling away interrupts following and keeps the visible anchor.
 */
(() => {
  'use strict';

  const TIMING = Object.freeze({ reveal: 360 });
  const REVEAL = Object.freeze({ offsetY: 6, bottomThreshold: 32, curve: [.22, 1, .36, 1] });
  const ROWS = '.timeline-message, .timeline-date, .timeline-new, .timeline-context, .timeline-reference, .timeline-link-chip, .timeline-card, .pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue, .bubble-typing, [data-demo-message]';
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  function ease(progress) {
    if (progress <= 0 || progress >= 1) return clamp(progress, 0, 1);
    const [x1, y1, x2, y2] = REVEAL.curve;
    const sample = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
    let low = 0, high = 1;
    for (let index = 0; index < 18; index += 1) {
      const middle = (low + high) / 2;
      if (sample(middle, x1, x2) < progress) low = middle;
      else high = middle;
    }
    return sample((low + high) / 2, y1, y2);
  }

  function create({ messages, scroll, reducedMotion }) {
    let following = true;
    let touching = false;
    let expectedTop = scroll.scrollTop;
    let frame = 0;
    let layout = null;
    let originalHeight = null;
    const entrances = new Map();
    const maxScroll = () => Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    const nearBottom = () => maxScroll() - scroll.scrollTop <= REVEAL.bottomThreshold;
    const motionOff = () => reducedMotion.matches || document.hidden;
    scroll.classList.add('has-reveal-motion');

    function writeScroll(top) {
      scroll.scrollTop = clamp(top, 0, maxScroll());
      expectedTop = scroll.scrollTop;
    }

    function captureAnchor() {
      const viewport = scroll.getBoundingClientRect();
      const bottom = Math.min(viewport.bottom, messages.getBoundingClientRect().bottom);
      for (const node of messages.querySelectorAll(ROWS)) {
        if (node.closest('[hidden]') || entrances.has(node)) continue;
        const rect = node.getBoundingClientRect();
        if (rect.height > 0 && rect.bottom > viewport.top && rect.top < bottom) {
          return { node, top: rect.top, scrollTop: scroll.scrollTop };
        }
      }
      return { node: null, top: 0, scrollTop: scroll.scrollTop };
    }

    function restoreAnchor(anchor) {
      if (anchor.node?.isConnected && !anchor.node.closest('[hidden]')) {
        writeScroll(scroll.scrollTop + anchor.node.getBoundingClientRect().top - anchor.top);
      } else writeScroll(anchor.scrollTop);
    }

    function releaseHeight() {
      if (originalHeight !== null) messages.style.height = originalHeight;
      originalHeight = null;
      messages.classList.remove('is-reveal-resizing');
    }

    function lockHeight(height) {
      if (originalHeight === null) originalHeight = messages.style.height;
      messages.classList.add('is-reveal-resizing');
      messages.style.height = `${Math.max(0, height)}px`;
    }

    function restoreEntrance(node, entry) {
      node.style.opacity = entry.opacity;
      node.style.transform = entry.transform;
      entrances.delete(node);
    }

    function stopFrame() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (layout) layout.resolve(false);
      layout = null;
    }

    // Releasing a partial reveal must not move the line the reader is watching.
    function settle() {
      const anchor = captureAnchor();
      stopFrame();
      entrances.forEach((entry, node) => restoreEntrance(node, entry));
      releaseHeight();
      restoreAnchor(anchor);
      following = following && nearBottom();
    }

    function startEntrance(node, now) {
      if (!node?.isConnected || node.closest('[hidden]') || entrances.has(node)) return;
      const computed = getComputedStyle(node);
      const opacity = Number.parseFloat(computed.opacity);
      entrances.set(node, {
        start: now,
        opacity: node.style.opacity,
        transform: node.style.transform,
        baseOpacity: Number.isFinite(opacity) ? opacity : 1,
        baseTransform: computed.transform === 'none' ? '' : computed.transform
      });
      paintEntrance(node, entrances.get(node), 0);
    }

    function paintEntrance(node, entry, progress) {
      node.style.opacity = `${entry.baseOpacity * progress}`;
      node.style.transform = `${entry.baseTransform} translateY(${REVEAL.offsetY * (1 - progress)}px)`.trim();
    }

    function tick(now) {
      frame = 0;
      const active = layout;
      if (active) {
        const progress = ease((now - active.start) / TIMING.reveal);
        lockHeight(active.from + (active.to - active.from) * progress);
        if (following) writeScroll(maxScroll() - active.gap * (1 - progress));
        else restoreAnchor(active.anchor);
        if (progress >= 1) {
          const anchor = captureAnchor();
          layout = null;
          releaseHeight();
          if (following) writeScroll(maxScroll());
          else restoreAnchor(anchor);
          active.resolve(true);
        }
      }
      entrances.forEach((entry, node) => {
        const progress = ease((now - entry.start) / TIMING.reveal);
        if (progress >= 1 || !node.isConnected) restoreEntrance(node, entry);
        else paintEntrance(node, entry, progress);
      });
      if (layout || entrances.size) frame = requestAnimationFrame(tick);
    }

    function queueFrame() {
      if (!frame && (layout || entrances.size)) frame = requestAnimationFrame(tick);
    }

    function change(update, { incoming = [], animate = true } = {}) {
      const anchor = captureAnchor();
      const from = messages.getBoundingClientRect().height;
      const startTop = scroll.scrollTop;
      const gap = Math.max(0, maxScroll() - startTop);
      stopFrame();
      if (!animate || motionOff()) {
        entrances.forEach((entry, node) => restoreEntrance(node, entry));
        releaseHeight();
        update();
        if (following) writeScroll(maxScroll());
        else restoreAnchor(anchor);
        return Promise.resolve(true);
      }

      // Measure the new natural height without painting it, then resume from
      // the currently visible height rather than an interrupted target.
      lockHeight(from);
      update();
      messages.style.height = originalHeight;
      const to = messages.getBoundingClientRect().height;
      lockHeight(from);
      restoreAnchor(anchor);
      const now = performance.now();
      incoming.forEach(node => startEntrance(node, now));
      const finished = new Promise(resolve => {
        layout = { from, to, start: now, gap, anchor, resolve };
      });
      queueFrame();
      return finished;
    }

    // Bulk transcript completion and view changes preserve the reading position,
    // even if the reader was previously at the bottom of a shorter transcript.
    function preserve(update) {
      const anchor = captureAnchor();
      stopFrame();
      entrances.forEach((entry, node) => restoreEntrance(node, entry));
      releaseHeight();
      update();
      restoreAnchor(anchor);
      following = following && nearBottom();
    }

    function enter(node) {
      if (motionOff()) return;
      startEntrance(node, performance.now());
      queueFrame();
    }

    function resetFollowing(value = true) {
      following = Boolean(value);
      expectedTop = scroll.scrollTop;
    }

    function toBottom(explicit = true) {
      if (!explicit && !following) return Promise.resolve(false);
      following = true;
      return change(() => {});
    }

    function interrupt() {
      following = false;
      settle();
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
      if (Math.abs(top - expectedTop) < 1) return;
      if (top < expectedTop || touching) interrupt();
      else {
        following = nearBottom();
        if (!following && layout) interrupt();
      }
      expectedTop = scroll.scrollTop;
    }, { passive: true });
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) settle(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
    window.addEventListener('pagehide', settle);
    window.addEventListener('resize', settle);
    if (typeof ResizeObserver !== 'undefined') {
      let width = messages.getBoundingClientRect().width;
      new ResizeObserver(entries => {
        const nextWidth = entries[0].contentRect.width;
        if (Math.abs(nextWidth - width) > .5) { width = nextWidth; settle(); }
      }).observe(messages);
    }

    return Object.freeze({ change, preserve, settle, resetFollowing, cancel: settle, enter, toBottom });
  }

  window.OwlRevealMotion = Object.freeze({ create, TIMING, REVEAL });
})();
