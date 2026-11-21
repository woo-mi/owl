(() => {
  'use strict';

  /* ANIMATION STORYBOARD — idle, v2 only
   *     0ms   neutral, resting
   *  4000ms   slowly close both eyes → hold → reopen (1400ms)
   *  5400ms   neutral, rest for 4000ms
   *  9400ms   reveal right-side profile → hold → face forward (3000ms)
   * 12400ms   neutral, rest for 4000ms
   * 16400ms   reveal left-side profile → hold → face forward (3000ms)
   * 19400ms   repeat, starting with another 4000ms rest
   */
  const TIMING = {
    rest: 4000,  // Full neutral gap after every completed motion.
    blink: 1400,
    turn: 3000,
  };
  const MOTION = {
    easing: 'cubic-bezier(.45, 0, .55, 1)',
    closedEyeScale: 0.055,
    closeAt: 0.38,
    reopenAt: 0.62,
    sideAngle: 70,
    turnOutUntil: 0.42,
    turnBackAfter: 0.58,
  };
  // Preserve the original front artwork. These isolated turntable views reveal
  // actual side volume; no CSS skew, flattening, or sideways tilt is used.
  const ART = {
    size: 264,
    visibleHeight: 257,
    visibleTop: 1,
    poses: [
      { angle: 0 },
      { angle: 20, source: [49, 11, 677, 697], visible: [55, 15, 667, 683], mirror: true },
      { angle: 45, source: [756, 12, 670, 698], visible: [767, 15, 630, 685] },
      { angle: 70, source: [1453, 12, 670, 700], visible: [1472, 15, 646, 685] },
    ],
  };
  const SEQUENCE = ['blink', 'right', 'left'];
  const dock = document.querySelector('.pet-dock');
  const head = dock?.querySelector('.pet-head');
  const overlay = head?.querySelector('.pet-blink-overlay');
  const front = head?.querySelector('img');
  const canvas = head?.querySelector('.pet-turn-view');
  const context = canvas?.getContext('2d');
  const eyes = [...(head?.querySelectorAll('.pet-blink-eye') || [])];
  if (!dock || !head || !overlay || !front || !context || eyes.length !== 2) return;

  const atlas = new Image();
  atlas.src = canvas.dataset.turnAtlas;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let stage = 0;
  let timer = null;
  let animations = [];
  let generation = 0;
  let enabled = false;
  let pageActive = true;
  let artworkReady = false;

  function canAnimate() {
    return artworkReady && pageActive && !document.hidden && !reducedMotion.matches && !dock.hidden
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
    head.dataset.yaw = '0';
  }
  function drawPose(pose, weight, direction) {
    if (weight <= 0) return;
    context.save();
    context.globalAlpha = weight;
    // The source's near-front pose faces left, so correct it before mirroring
    // the full sequence for a left turn. The original front is never mirrored.
    if (pose.source && Boolean(pose.mirror) !== (direction < 0)) {
      context.translate(ART.size, 0);
      context.scale(-1, 1);
    }
    if (!pose.source) context.drawImage(front, 0, 0, ART.size, ART.size);
    else {
      const [sx, sy, sw, sh] = pose.source;
      const [vx, vy, vw, vh] = pose.visible;
      const scale = ART.visibleHeight / vh;
      const dx = (ART.size - vw * scale) / 2 + (sx - vx) * scale;
      const dy = ART.visibleTop + (sy - vy) * scale;
      context.drawImage(atlas, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale);
    }
    context.restore();
  }
  function drawTurn(angle, direction) {
    context.clearRect(0, 0, ART.size, ART.size);
    context.globalCompositeOperation = 'lighter';
    const upper = ART.poses.findIndex(pose => pose.angle >= angle);
    const to = ART.poses[Math.max(0, upper)];
    const from = ART.poses[Math.max(0, upper - 1)];
    const blend = to.angle === from.angle ? 0 : (angle - from.angle) / (to.angle - from.angle);
    // Add premultiplied frames so the head doesn't become translucent while
    // its face and silhouette change between the front and side views.
    drawPose(from, 1 - blend, direction);
    drawPose(to, blend, direction);
    head.dataset.yaw = String(Math.round(angle * direction));
  }
  function animateTurn(direction) {
    let frame = null;
    let started = null;
    let settled = false;
    let finish;
    let reject;
    const finished = new Promise((resolve, fail) => { finish = resolve; reject = fail; });
    const ease = value => value * value * (3 - 2 * value);
    drawTurn(0, direction);
    function tick(now) {
      if (started === null) started = now;
      const progress = Math.min(1, (now - started) / TIMING.turn);
      const amount = progress < MOTION.turnOutUntil ? ease(progress / MOTION.turnOutUntil)
        : progress > MOTION.turnBackAfter ? 1 - ease((progress - MOTION.turnBackAfter) / (1 - MOTION.turnBackAfter))
          : 1;
      drawTurn(MOTION.sideAngle * amount, direction);
      if (progress === 1) {
        frame = null;
        settled = true;
        finish();
      } else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return {
      finished,
      cancel() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        if (!settled) { settled = true; reject(new Error('Turn canceled')); }
      },
    };
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
      animations = [animateTurn(direction)];
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
  Promise.all([front.decode(), atlas.decode()]).then(() => {
    artworkReady = true;
    sync();
  }).catch(() => {
    // A missing turn asset leaves the original Owl and all controls available.
    neutralize();
  });
  sync();
})();
