/*
 * AFTER 2 — Codex-style send transition.
 *
 * Source: a screen recording of the Codex desktop app (Nov 24, 2026, 11:10 AM).
 * The recorder kept only five frames of the glide, so its curve is an estimate;
 * add ?tune to the URL to match it by eye. The rest was read frame by frame.
 *
 * SEND          0ms  the composer clears and the sent bubble joins the thread below the fold
 *               0ms  the whole thread glides up until the bubble parks near the top
 *                    (about 600pt in ~440ms: a soft start, a quick middle, a long landing;
 *                    longer moves take longer)
 *             200ms  "Thinking" appears under the bubble
 *            1140ms  a highlight sweeps once across it, left to right (830ms), then every 3.2s
 * REPLY         0ms  "Thinking" fades out and the reply fades in at the same spot
 *
 * Only transform and opacity move. The final scroll position lands at once, then the
 * difference is animated away on the compositor, so the browser's own smooth scroll is
 * never involved. Blank runway under the thread lets even a short thread park the bubble
 * at the top; it shrinks as the reply grows.
 */
(() => {
  'use strict';

  function deepFreeze(object) {
    Object.values(object).forEach(value => { if (value && typeof value === 'object') deepFreeze(value); });
    return Object.freeze(object);
  }

  // The values read from the recording. curve: cubic-bezier control points.
  // glide takes base + perPx * distance ms, capped at max. All times are milliseconds.
  const DEFAULTS = deepFreeze({
    glide: { delay: 0, base: 180, perPx: .42, max: 560, curve: [.30, 0, .20, 1] },
    land: { top: 130 },
    thinking: { delay: 200, fade: 110, shimmerDelay: 940, sweep: 830, period: 3200 },
    reply: { fade: 240, labelOut: 120 }
  });
  // The live table. The tuning panel (?tune) edits it in place, and every send reads it as it starts.
  const MOTION = JSON.parse(JSON.stringify(DEFAULTS));

  const css = curve => `cubic-bezier(${curve.join(', ')})`;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  function create({ messages, scroll, reducedMotion }) {
    // The whole scroll content moves as one piece, so every row stays rigid.
    const content = messages.closest('.conversation') || messages;
    const runway = document.createElement('div');
    runway.className = 'send-runway';
    runway.setAttribute('aria-hidden', 'true');
    content.append(runway);
    let park = null;          // scroll position that parks the sent bubble at the landing spot
    let anchor = null;        // the sent bubble the thread is parked on
    let pinned = false;       // stays true from a send until the reader scrolls
    let label = null;         // the "Thinking" row
    let glideAnimation = null;
    let thinkingTimer = 0;
    const cleanups = new Set();
    const motionOff = () => reducedMotion.matches || document.hidden;

    // How far the thread is currently displaced from its resting place.
    function threadOffset() {
      const transform = getComputedStyle(content).transform;
      return transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m42 : 0;
    }

    function cancelGlide() {
      glideAnimation?.cancel();
      glideAnimation = null;
    }

    // Blank space under the thread so scrolling to `park` stays possible. It shrinks as content arrives.
    function refit() {
      if (park === null) {
        runway.style.height = '0px';
        return;
      }
      const natural = content.offsetHeight - runway.offsetHeight;
      runway.style.height = `${Math.max(0, park + scroll.clientHeight - natural)}px`;
    }

    // Content above the bubble can still change height after the send (images loading, say).
    // Keep the bubble on its landing spot until the reader scrolls, once any glide is over.
    function reanchor() {
      if (!pinned || !anchor?.isConnected || glideAnimation?.playState === 'running') return;
      const top = anchor.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
      const wanted = Math.max(0, Math.round(top - MOTION.land.top));
      if (wanted === park) return;
      park = wanted;
      refit();
      scroll.scrollTo({ top: park, behavior: 'instant' });
    }

    function glide(delta) {
      if (Math.abs(delta) < 1) return;
      const { delay, base, perPx, max, curve } = MOTION.glide;
      const duration = Math.round(Math.min(max, base + Math.abs(delta) * perPx));
      glideAnimation = content.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0px)' }],
        { duration, delay, easing: css(curve), fill: 'backwards' });
    }

    function send(node, append) {
      const animated = !motionOff();
      const startTop = scroll.scrollTop;
      // Measure the presentation as the reader currently sees it, even mid-glide.
      const carried = animated ? threadOffset() : 0;
      cancelGlide();
      clearThinking();
      runway.style.height = '0px';
      append();
      const top = node.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
      park = Math.max(0, Math.round(top - MOTION.land.top));
      refit();
      // The scroll position lands at once; the glide below hides the jump.
      scroll.scrollTo({ top: park, behavior: 'instant' });
      anchor = node;
      pinned = true;
      // A very long jump would only blur past: skip the far part and glide the last stretch.
      const reach = scroll.clientHeight * 1.2;
      if (animated) glide(clamp(carried + (scroll.scrollTop - startTop), -reach, reach));
      glideAnimation?.addEventListener('finish', reanchor, { once: true });
    }

    function buildLabel() {
      const element = document.createElement('div');
      element.className = 'thinking-label';
      element.setAttribute('role', 'status');
      element.textContent = 'Thinking';
      return element;
    }

    function showThinking() {
      clearThinking();
      const add = () => {
        thinkingTimer = 0;
        label = buildLabel();
        messages.append(label);
        refit();
        if (motionOff()) return;
        const { fade, shimmerDelay, sweep, period } = MOTION.thinking;
        label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fade, easing: 'ease-out', fill: 'backwards' });
        // One highlight pass, then a long rest, as in the recording.
        const start = clamp(shimmerDelay / period, 0, .98);
        const end = clamp((shimmerDelay + sweep) / period, start + .001, .999);
        label.animate([
          { backgroundPosition: '90% 0', offset: 0 },
          { backgroundPosition: '90% 0', offset: start },
          { backgroundPosition: '10% 0', offset: end },
          { backgroundPosition: '10% 0', offset: 1 }
        ], { duration: period, iterations: Infinity, easing: 'linear' });
      };
      if (motionOff()) add();
      else thinkingTimer = setTimeout(add, MOTION.thinking.delay);
    }

    function clearThinking() {
      clearTimeout(thinkingTimer);
      thinkingTimer = 0;
      label?.remove();
      label = null;
    }

    // A copy of the label, pinned where it was, so it can fade out after the real one is gone.
    function ghostOf(node) {
      const rect = node.getBoundingClientRect();
      const frame = messages.getBoundingClientRect();
      const clone = node.cloneNode(true);
      clone.classList.add('is-ghost');
      clone.removeAttribute('role');
      clone.setAttribute('aria-hidden', 'true');
      Object.assign(clone.style, {
        position: 'absolute', left: `${rect.left - frame.left}px`, top: `${rect.top - frame.top}px`,
        width: `${rect.width}px`, margin: '0', pointerEvents: 'none'
      });
      return clone;
    }

    function reply(node, append) {
      const ghost = label && !motionOff() ? ghostOf(label) : null;
      clearThinking();
      append();
      refit();
      if (motionOff()) return;
      node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION.reply.fade, easing: 'ease-out', fill: 'backwards' });
      if (!ghost) return;
      messages.append(ghost);
      const fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MOTION.reply.labelOut, easing: 'ease-in-out', fill: 'forwards' });
      const remove = () => {
        ghost.remove();
        cleanups.delete(remove);
      };
      cleanups.add(remove);
      fade.addEventListener('finish', remove, { once: true });
      fade.addEventListener('cancel', remove, { once: true });
    }

    // Back to a plain thread: no label, no runway, no glide in flight.
    function reset() {
      cancelGlide();
      clearThinking();
      [...cleanups].forEach(cleanup => cleanup());
      park = null;
      anchor = null;
      pinned = false;
      refit();
    }

    const settle = () => {
      refit();
      reanchor();
    };
    const release = () => { pinned = false; };
    scroll.addEventListener('wheel', release, { passive: true });
    scroll.addEventListener('touchstart', release, { passive: true });
    scroll.addEventListener('pointerdown', release, { passive: true });
    scroll.addEventListener('keydown', release);
    window.addEventListener('resize', settle);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelGlide(); });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(settle).observe(messages);
    return Object.freeze({ send, showThinking, reply, reset });
  }

  window.OwlSendMotion = Object.freeze({ create, MOTION, DEFAULTS });
})();
