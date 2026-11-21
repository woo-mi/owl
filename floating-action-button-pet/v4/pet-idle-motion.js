(() => {
  'use strict';

  /* ANIMATION STORYBOARD — idle, v2 only
   *     0ms   neutral, resting
   *  4000ms   slowly close both eyes → hold → reopen (1400ms)
   *  5400ms   neutral, rest for 4000ms
   *  9400ms   gently turn right → hold → face forward (2400ms)
   * 11800ms   neutral, rest for 4000ms
   * 15800ms   gently turn left → hold → face forward (2400ms)
   * 18200ms   repeat, starting with another 4000ms rest
   */
  const TIMING = {
    rest: 4000,  // Full neutral gap after every completed motion.
    blink: 1400,
    turn: 2400,
  };
  const MOTION = {
    easing: 'cubic-bezier(.45, 0, .55, 1)',
    closedEyeScale: 0.055,
    closeAt: 0.38,
    reopenAt: 0.62,
    yaw: 12,
    tilt: 7,
    shift: 1.5,
    perspective: 180,
  };
  const SEQUENCE = ['blink', 'right', 'left'];
  const dock = document.querySelector('.pet-dock');
  const head = dock?.querySelector('.pet-head');
  const overlay = head?.querySelector('.pet-blink-overlay');
  const eyes = [...(head?.querySelectorAll('.pet-blink-eye') || [])];
  if (!dock || !head || !overlay || eyes.length !== 2) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let stage = 0;
  let timer = null;
  let animations = [];
  let generation = 0;
  let enabled = false;
  let pageActive = true;

  function canAnimate() {
    return pageActive && !document.hidden && !reducedMotion.matches && !dock.hidden
      && dock.dataset.visible !== 'false' && !dock.classList.contains('is-hiding')
      && !dock.classList.contains('is-dragging')
      && ['default', 'done'].includes(dock.dataset.stage);
  }
  function neutralize() {
    clearTimeout(timer);
    timer = null;
    animations.forEach(animation => animation.cancel());
    animations = [];
    overlay.style.opacity = '0';
    head.dataset.motion = 'rest';
  }
  function queueNext() {
    timer = setTimeout(play, TIMING.rest);
  }
  async function play() {
    timer = null;
    if (!canAnimate()) { sync(); return; }
    const token = generation;
    const motion = SEQUENCE[stage];
    head.dataset.motion = motion;
    if (motion === 'blink') {
      overlay.style.opacity = '1';
      const frames = [
        { transform: 'scaleY(1)', offset: 0 },
        { transform: `scaleY(${MOTION.closedEyeScale})`, offset: MOTION.closeAt },
        { transform: `scaleY(${MOTION.closedEyeScale})`, offset: MOTION.reopenAt },
        { transform: 'scaleY(1)', offset: 1 },
      ];
      animations = eyes.map(eye => eye.animate(frames, { duration: TIMING.blink, easing: MOTION.easing }));
    } else {
      const direction = motion === 'right' ? 1 : -1;
      const neutral = `perspective(${MOTION.perspective}px) translateX(0px) rotateY(0deg) rotateZ(0deg)`;
      const turned = `perspective(${MOTION.perspective}px) translateX(${direction * MOTION.shift}px) rotateY(${direction * MOTION.yaw}deg) rotateZ(${direction * MOTION.tilt}deg)`;
      animations = [head.animate([
        { transform: neutral, offset: 0 },
        { transform: turned, offset: MOTION.closeAt },
        { transform: turned, offset: MOTION.reopenAt },
        { transform: neutral, offset: 1 },
      ], { duration: TIMING.turn, easing: MOTION.easing })];
    }
    try {
      await Promise.all(animations.map(animation => animation.finished));
    } catch {
      return; // Interaction, hiding, or reduced motion canceled this sequence.
    }
    if (token !== generation) return;
    neutralize();
    stage = (stage + 1) % SEQUENCE.length;
    if (canAnimate()) queueNext();
    else sync();
  }
  function sync() {
    const next = canAnimate();
    if (next === enabled) return;
    enabled = next;
    generation += 1;
    neutralize();
    if (enabled) queueNext();
  }
  new MutationObserver(sync).observe(dock, {
    attributes: true,
    attributeFilter: ['data-stage', 'data-visible', 'class', 'hidden'],
  });
  dock.addEventListener('pet:dragstart', sync);
  dock.addEventListener('pet:dragend', sync);
  document.addEventListener('pet:visibilitychange', sync);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { pageActive = false; sync(); });
  window.addEventListener('pageshow', () => { pageActive = true; sync(); });
  sync();
})();
