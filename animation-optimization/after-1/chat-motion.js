/*
 * AFTER 1 — iMessage motion, measured frame by frame.
 *
 * Source: a 60fps screen recording of Messages on macOS (Nov 23, 2026, 9:20 PM).
 * Bubble positions and opacities were tracked in every frame and fitted to the
 * curves below, so these numbers are measurements, not taste.
 *
 * SEND            0ms  the typed text becomes a blue bar over the composer
 *                 0ms  the thread glides up for 370ms on cubic-bezier(.30, .86, .37, 1)
 *                25ms  the bubble rises from the composer on a spring
 *                      (damping .72, 554ms period, ~4% overshoot)
 *            0–158ms   the bar collapses toward the bubble and hands off at 0.76 scale
 *          210–560ms   the bubble grows from 0.76 to full size
 * TYPING DOTS    40ms  the thread glides up for 290ms
 *               140ms  the bubble pops in on a spring (damping .51, 324ms period, ~17% overshoot)
 * REPLY           0ms  the reply fades in over 280ms and scales .944 → 1 over 90ms
 *                 0ms  the typing bubble fades out beneath it
 * ARRIVAL        90ms  the thread glides up for 215ms; the bubble fades in over 310ms
 *                      and rides the thread with no lift of its own
 * SWITCHING       0ms  a hard cut. The recording shows no transition at all.
 *
 * Only transform and opacity move. The final layout and scroll position land
 * immediately, then the visual difference is animated away on the compositor.
 * Nothing animates height or scrollTop frame by frame, so a busy main thread
 * cannot make the thread and its bubbles drift apart.
 */
(() => {
  'use strict';

  function deepFreeze(object) {
    Object.values(object).forEach(value => { if (value && typeof value === 'object') deepFreeze(value); });
    return Object.freeze(object);
  }

  // The values measured from the recording. curve: cubic-bezier control points.
  // zeta/omega: damping ratio and natural frequency (rad/s) of a spring; how long
  // a spring takes to settle follows from them. All times are milliseconds.
  const DEFAULTS = deepFreeze({
    sampleMs: 12,
    bottomThreshold: 32,
    send: {
      shift: { delay: 0, duration: 370, curve: [.30, .86, .37, 1] },
      flight: { delay: 25, zeta: .72, omega: 11.34 },
      bar: { enabled: true, duration: 158, curve: [.63, .57, .46, .70], inset: 14, alpha: .62 },
      grow: { from: .76, delay: 52, duration: 354, curve: [.26, .20, .35, 1] },
      minFlight: 24
    },
    typing: {
      shift: { delay: 40, duration: 290, curve: [.68, .36, .32, .70] },
      pop: { delay: 140, zeta: .51, omega: 19.4, from: .1, fade: 110 }
    },
    reply: {
      fade: { duration: 280, curve: [.36, .065, .43, 1] },
      scale: { from: .944, duration: 90, curve: [.20, .80, .20, 1] },
      ghostFade: 200
    },
    arrive: {
      shift: { delay: 90, duration: 215, curve: [0, .35, .76, .70] },
      fade: { duration: 310, curve: [.57, .66, .48, 1] }
    },
    scroll: { base: 240, perPx: .35, extra: 320, curve: [.30, .86, .37, 1] }
  });
  // The live table. The tuning panel (?tune) edits it in place, and every motion reads it as it starts.
  const MOTION = JSON.parse(JSON.stringify(DEFAULTS));

  const css = curve => `cubic-bezier(${curve.join(', ')})`;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  // Progress (0 → 1) of a cubic-bezier timing function, matching the browser's own.
  function bezier([x1, y1, x2, y2]) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const x = s => ((ax * s + bx) * s + cx) * s;
    const y = s => ((ay * s + by) * s + cy) * s;
    const slope = s => (3 * ax * s + 2 * bx) * s + cx;
    return progress => {
      if (progress <= 0) return 0;
      if (progress >= 1) return 1;
      let s = progress;
      for (let i = 0; i < 8; i++) {
        const error = x(s) - progress;
        if (Math.abs(error) < 1e-6) return y(s);
        const d = slope(s);
        if (Math.abs(d) < 1e-6) break;
        s -= error / d;
      }
      let low = 0, high = 1;
      s = progress;
      for (let i = 0; i < 24; i++) {
        const error = x(s) - progress;
        if (Math.abs(error) < 1e-6) break;
        if (error > 0) high = s; else low = s;
        s = (low + high) / 2;
      }
      return y(s);
    };
  }

  // Step response of a damped spring, 0 → 1, overshooting when zeta < 1. Time is in seconds.
  function spring({ zeta, omega }) {
    if (zeta < 1) {
      const damped = omega * Math.sqrt(1 - zeta * zeta);
      const ratio = zeta * omega / damped;
      return t => t <= 0 ? 0 : 1 - Math.exp(-zeta * omega * t) * (Math.cos(damped * t) + ratio * Math.sin(damped * t));
    }
    if (zeta === 1) return t => t <= 0 ? 0 : 1 - (1 + omega * t) * Math.exp(-omega * t);
    const root = Math.sqrt(zeta * zeta - 1);
    const slow = -omega * (zeta - root), fast = -omega * (zeta + root);
    return t => t <= 0 ? 0 : 1 - (fast * Math.exp(slow * t) - slow * Math.exp(fast * t)) / (fast - slow);
  }

  // Milliseconds until a spring stays within 0.2% of its target.
  function settleOf(params) {
    const progress = spring(params);
    let last = 0;
    for (let t = 0; t <= 4000; t += 10) if (Math.abs(1 - progress(t / 1000)) > .002) last = t;
    return last + 40;
  }

  // Springs have no CSS equivalent that every browser supports, so they are
  // sampled into finely spaced keyframes and played back linearly.
  function keyframes(duration, frame) {
    const count = Math.max(2, Math.round(duration / MOTION.sampleMs));
    return Array.from({ length: count + 1 }, (_, i) => ({ offset: i / count, ...frame(i === count ? duration : (i / count) * duration) }));
  }

  const UNIT = '.pen-bubble, .unfurl-user-turn, .unfurl-block, .unfurl-thread-cue';
  const UNITS = `${UNIT}, .bubble-typing, [data-demo-message]`;
  const isOutgoing = node => node.matches('.unfurl-user-turn, .user-message');
  const isReply = node => node.matches('.pen-bubble, .assistant-message');
  const isTyping = node => node.matches('.bubble-typing');
  const bubbleOf = node => node.matches('.unfurl-user-turn') ? node.querySelector('.unfurl-user-bubble') || node : node;

  function create({ messages, scroll, reducedMotion, composer = null }) {
    // The whole scroll content moves as one piece, so every row stays rigid.
    const content = messages.closest('.conversation') || messages;
    let follow = true;
    let expectedTop = scroll.scrollTop;
    let touching = false;
    const shifts = new Set();    // thread glides: cancelled and re-measured on every change
    const locals = new Set();    // per-bubble motion: left running when a change interrupts
    const cleanups = new Set();  // temporary elements (ghosts) to remove
    const units = () => [...messages.querySelectorAll(UNITS)]
      .filter(node => !node.closest('[hidden]') && !node.parentElement.closest(UNIT));
    const maxScroll = () => Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    const writeScroll = top => {
      scroll.scrollTop = top;
      expectedTop = scroll.scrollTop;
    };
    const motionOff = () => reducedMotion.matches || document.hidden;

    function play(set, node, frames, options) {
      const animation = node.animate(frames, options);
      set.add(animation);
      const release = () => set.delete(animation);
      animation.addEventListener('finish', release, { once: true });
      animation.addEventListener('cancel', release, { once: true });
      return animation;
    }

    function removeWith(element, animation) {
      const remove = () => {
        element.remove();
        cleanups.delete(remove);
      };
      cleanups.add(remove);
      animation.addEventListener('finish', remove, { once: true });
      animation.addEventListener('cancel', remove, { once: true });
    }

    // How far the thread is currently displaced from its resting place.
    function threadOffset() {
      const transform = getComputedStyle(content).transform;
      return transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m42 : 0;
    }

    function cancelShifts() {
      shifts.forEach(animation => animation.cancel());
      shifts.clear();
    }

    function cancel() {
      cancelShifts();
      locals.forEach(animation => animation.cancel());
      locals.clear();
      [...cleanups].forEach(cleanup => cleanup());
    }

    function shiftSpec(kind, distance) {
      const base = kind === 'scroll'
        ? { delay: 0, duration: MOTION.scroll.base + Math.min(MOTION.scroll.extra, distance * MOTION.scroll.perPx), curve: MOTION.scroll.curve }
        : MOTION[kind === 'reply' ? 'arrive' : kind].shift;
      // The recording only has short moves; longer ones take proportionally longer.
      const stretch = kind === 'scroll' ? 1 : 1 + clamp((distance - 80) / 800, 0, .6);
      return { delay: base.delay, duration: Math.round(base.duration * stretch), curve: base.curve };
    }

    function fadeIn(node) {
      const { duration, curve } = MOTION.arrive.fade;
      play(locals, node, [{ opacity: 0 }, { opacity: 1 }], { duration, easing: css(curve), fill: 'backwards' });
    }

    // The typing bubble springs in from its tail corner.
    function popTyping(node) {
      const { delay, zeta, omega, from, fade } = MOTION.typing.pop;
      const pop = spring({ zeta, omega });
      const settle = settleOf({ zeta, omega });
      play(locals, node, keyframes(settle, t => ({
        transform: `scale(${(t >= settle ? 1 : from + (1 - from) * pop(t / 1000)).toFixed(4)})`
      })), { duration: settle, delay, easing: 'linear', fill: 'backwards' });
      play(locals, node, [{ opacity: 0 }, { opacity: 1 }], { duration: fade, delay, easing: 'ease-out', fill: 'backwards' });
    }

    // The reply fades in at its final size while the typing bubble fades out.
    function crossfade(node) {
      const { fade, scale } = MOTION.reply;
      play(locals, node, [{ opacity: 0 }, { opacity: 1 }], { duration: fade.duration, easing: css(fade.curve), fill: 'backwards' });
      play(locals, node, [{ transform: `scale(${scale.from})` }, { transform: 'scale(1)' }], { duration: scale.duration, easing: css(scale.curve), fill: 'backwards' });
    }

    // A copy of the typing bubble, pinned where it was, so it can fade out after the real one is gone.
    function ghostOf(node) {
      const rect = node.getBoundingClientRect();
      const frame = messages.getBoundingClientRect();
      const clone = node.cloneNode(true);
      clone.classList.add('is-ghost');
      clone.removeAttribute('role');
      clone.setAttribute('aria-hidden', 'true');
      Object.assign(clone.style, {
        position: 'absolute', left: `${rect.left - frame.left}px`, top: `${rect.top - frame.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`, margin: '0', pointerEvents: 'none'
      });
      return { node, clone };
    }

    function fadeOutGhost({ clone }) {
      messages.append(clone);
      const animation = play(locals, clone, [{ opacity: 1 }, { opacity: 0 }], { duration: MOTION.reply.ghostFade, easing: 'ease-in-out', fill: 'forwards' });
      removeWith(clone, animation);
    }

    // The bubble leaves the composer: a bar collapses into it while it rises on a spring.
    function launchOutgoing(node, { slot, origin, delta, spec }) {
      const { flight, bar, grow: growth, minFlight } = MOTION.send;
      const bubble = bubbleOf(node);
      const lift = spring(flight);
      const glide = bezier(spec.curve);
      const collapse = bezier(bar.curve);
      const swell = bezier(growth.curve);
      const slotMid = slot.top + slot.height / 2;
      const originMid = origin && origin.height ? origin.top + origin.height / 2 : slot.bottom + 80;
      const distance = Math.max(minFlight, originMid - slotMid);
      const reach = origin ? Math.max(0, slot.left - (origin.left + bar.inset)) : 0;
      const withBar = bar.enabled && reach > 8;
      const handoff = withBar ? bar.duration : 0;
      // On-screen offset from the bubble's resting place, as the recording measured it.
      const path = t => distance * (1 - lift((t - flight.delay) / 1000));
      // The share of that offset already supplied by the thread gliding up beneath it.
      const thread = t => delta * (1 - glide(clamp((t - spec.delay) / spec.duration, 0, 1)));
      const scaleAt = t => t < handoff
        ? 1 + (growth.from - 1) * collapse(t / handoff)
        : growth.from + (1 - growth.from) * swell((t - handoff - growth.delay) / growth.duration);
      // Run until both the spring has settled and the thread has finished gliding beneath the bubble.
      const total = Math.max(flight.delay + settleOf(flight), spec.delay + spec.duration);
      const done = t => t >= total;

      play(locals, bubble, keyframes(total, t => ({
        transform: `translateY(${(done(t) ? 0 : path(t) - thread(t)).toFixed(2)}px) scale(${(done(t) ? 1 : scaleAt(t)).toFixed(4)})`
      })), { duration: total, easing: 'linear', fill: 'backwards' });
      const appear = Math.min(handoff / total, .999);
      play(locals, bubble, withBar
        ? [{ opacity: 0, offset: 0 }, { opacity: 0, offset: Math.max(0, appear - .001) }, { opacity: 1, offset: appear }, { opacity: 1, offset: 1 }]
        : [{ opacity: 0, offset: 0 }, { opacity: 1, offset: Math.min(60 / total, .999) }, { opacity: 1, offset: 1 }],
      { duration: total, easing: 'linear', fill: 'backwards' });
      // Anything else in the turn (read receipt and the like) arrives like an ordinary bubble.
      if (bubble !== node) [...node.children].filter(child => child !== bubble && !child.hidden && !child.hasAttribute('hidden')).forEach(fadeIn);
      if (!withBar) return;

      const ghost = document.createElement('div');
      ghost.className = 'send-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      const stretch = document.createElement('div');
      stretch.className = 'send-ghost-bar';
      const clone = bubble.cloneNode(true);
      clone.querySelectorAll('.unfurl-reaction, .unfurl-thread-connector').forEach(element => element.remove());
      clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      clone.removeAttribute('id');
      clone.removeAttribute('data-demo-message');
      clone.removeAttribute('data-source-id');
      clone.classList.add('send-ghost-bubble');
      ghost.append(stretch, clone);
      Object.assign(ghost.style, { left: `${slot.left}px`, top: `${slot.top}px`, width: `${slot.width}px`, height: `${slot.height}px` });
      document.body.append(ghost);
      const swoop = play(locals, ghost, keyframes(handoff, t => ({
        transform: `translateY(${path(t).toFixed(2)}px) scale(${scaleAt(t).toFixed(4)})`
      })), { duration: handoff, easing: 'linear', fill: 'both' });
      play(locals, stretch, [{ width: `${reach}px`, opacity: bar.alpha }, { width: '0px', opacity: 1 }],
        { duration: handoff, easing: css(bar.curve), fill: 'both' });
      removeWith(ghost, swoop);
    }

    function change(update, { incoming = [], pin = false, target = null, morphFrom = null, launch = null } = {}) {
      const animated = !motionOff();
      const startTop = scroll.scrollTop;
      // Measure the presentation as the reader currently sees it, even mid-motion.
      const carried = animated ? threadOffset() : 0;
      const before = animated ? new Map(units().map(node => [node, node.getBoundingClientRect().top])) : null;
      const typing = animated && morphFrom?.isConnected ? ghostOf(morphFrom) : null;
      cancelShifts();
      if (pin) follow = true;
      update();
      const endTop = target
        ? clamp(target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 100, 0, maxScroll())
        : follow ? maxScroll() : startTop;
      // The scroll position lands at once; the glide below hides the jump.
      writeScroll(endTop);
      if (target) follow = false;
      if (!animated) return Promise.resolve(true);

      const nodes = incoming.filter(node => node.isConnected && !node.closest('[hidden]'));
      const slots = new Map(nodes.filter(isOutgoing).map(node => [node, bubbleOf(node).getBoundingClientRect()]));
      const from = launch?.from || composer;
      const origin = from?.isConnected ? from.getBoundingClientRect() : null;
      const typingGone = Boolean(typing) && !typing.node.isConnected;
      const reply = typingGone ? nodes.find(isReply) : null;
      const delta = carried + (scroll.scrollTop - startTop);
      const kind = nodes.some(isOutgoing) ? 'send' : reply ? 'reply' : nodes.some(isTyping) ? 'typing' : nodes.length ? 'arrive' : 'scroll';
      const spec = shiftSpec(kind, Math.abs(delta));
      const timing = { duration: spec.duration, delay: spec.delay, easing: css(spec.curve), fill: 'backwards' };

      // Rows that moved on their own (the rest ride the thread glide below).
      for (const [node, top] of before) {
        if (!node.isConnected || node.closest('[hidden]')) continue;
        const residual = top - node.getBoundingClientRect().top - delta;
        if (Math.abs(residual) > .5) {
          play(shifts, node, [{ transform: `translateY(${residual}px)` }, { transform: 'translateY(0px)' }], { ...timing, composite: 'add' });
        }
      }
      let finished = Promise.resolve(true);
      if (Math.abs(delta) > .5) {
        const glide = play(shifts, content, [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0px)' }], timing);
        finished = glide.finished.then(() => true, () => false);
      }

      for (const node of nodes) {
        if (isOutgoing(node)) launchOutgoing(node, { slot: slots.get(node), origin, delta, spec });
        else if (isTyping(node)) popTyping(node);
        else if (node === reply) crossfade(node);
        else fadeIn(node);
      }
      if (typingGone) fadeOutGhost(typing);
      return finished;
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
    function enter(node) {
      if (!motionOff()) fadeIn(node);
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
      // Ignore our own writes and scroll-range clamping.
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
    return Object.freeze({ change, enter, cancel, toBottom, stopFollowing, resetFollowing });
  }
  window.OwlChatMotion = Object.freeze({ create, MOTION, DEFAULTS, curves: Object.freeze({ bezier, spring, settleOf }) });
})();
