/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — the shell stays closed throughout.
 *
 *    0ms   outlined egg rests over a soft shadow
 *  350ms   two small, spring-like wobbles
 * 1250ms   the central hairline crack darkens and grows
 * 2100ms   a stronger shiver extends two fine branches
 * 3300ms   four tiny shell chips flick outward and fall
 * 4400ms   wobble settles → a quietly cracked egg
 * 4800ms   sequence ends; Hatch your Owl can replay it
 * ───────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const TIMING = {
    anticipation:  350, // begin the first gentle wobble
    firstCrack:   1250, // reveal the central crack
    shiver:       2100, // add branches and a stronger wobble
    shellChips:   3300, // small fragments pop out to either side
    settle:       4400, // settle into the final closed-shell pose
    finish:       4800, // stop on the cracked egg
    gentleMotion:  900, // first wobble duration
    strongMotion: 1400, // second wobble duration
    crackReveal:   850, // central crack drawing duration
    branchReveal: 1000, // branching crack drawing duration
    chipFall:     1050, // tiny fragments arc down to the ground
  };
  const EGG = {
    outline: '#1c1c1c', // quiet near-black outer contour
    highlight: '#e5e5e5', // upper-left shell reflection
    crack: '#929292', // fine visible shell fracture
    hint: '#e5e5e5', // initial central fracture hint
    shadow: '#f2f2f2', // transparent-stage ground shadow
    stroke: 5.5, // reference outline thickness in SVG units
    crackStroke: 2.8, // cracks remain lighter than the contour
    shadowCompression: .018, // shadow narrowing per wobble degree
    easing: 'cubic-bezier(.22,.7,.2,1)', // damped motion between poses
    gentle: [0, -2.4, 2, -1.3, .7, 0], // degrees, tapering to rest
    strong: [0, -4.5, 4, -3.4, 2.5, -1.5, .7, 0], // a short shiver
  };
  const CHIPS = {
    stroke: 2.3, // fragments use the same restrained outline
    appearAt: .08, // initial fragment reveal
    arcPeak: .33, // fraction of its falling arc
    landAt: .86, // ground contact before fading
    peakProgress: .6, // horizontal progress at the arc apex
    peakTurn: .4, // rotation reached at the arc apex
    landOpacity: .7, // subtle chips fade away on landing
    items: [
      {x:117, y:321, outward:-65, lift:-32, fall:143, turn:-105, shape:'M-4 2L0-4L5 3Z'},
      {x:125, y:329, outward:-47, lift:-19, fall:137, turn:80, shape:'M-3 2L2-3L4 3Z'},
      {x:277, y:324, outward:65, lift:-35, fall:140, turn:115, shape:'M-5 2L1-4L4 3Z'},
      {x:268, y:333, outward:48, lift:-22, fall:135, turn:-70, shape:'M-3 1L1-3L4 3Z'},
    ],
  };
  const STAGES = [
    {at:TIMING.anticipation, stage:1},
    {at:TIMING.firstCrack, stage:2},
    {at:TIMING.shiver, stage:3},
    {at:TIMING.shellChips, stage:4},
    {at:TIMING.settle, stage:5},
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let host;
  let body;
  let centralCrack;
  let branchCracks;
  let shadow;
  let chips;
  let stage = 0;
  let active = false;
  let frame = 0;
  let elapsed = 0;
  let lastTick = 0;
  const animations = new Set();

  function mount() {
    if (host?.isConnected) return true;
    host = document.getElementById('egg-stage');
    if (!host) return false;
    host.innerHTML = `<svg class="owl-egg-art" viewBox="0 0 420 530" fill="none" role="img" aria-labelledby="owl-egg-title owl-egg-description" xmlns="http://www.w3.org/2000/svg">
      <title id="owl-egg-title">An egg beginning to crack</title>
      <desc id="owl-egg-description">A black outlined egg with a pale highlight and delicate cracks. The shell stays closed.</desc>
      <ellipse class="owl-egg-shadow" cx="204" cy="475" rx="81" ry="9" fill="${EGG.shadow}"/>
      <g class="owl-egg-body" stroke-linecap="round" stroke-linejoin="round">
        <path class="owl-egg-shell" d="M204 88C149 88 76 200 76 309C76 396 132 448 204 448C276 448 330 396 330 309C330 203 264 88 204 88Z" fill="white" stroke="${EGG.outline}" stroke-width="${EGG.stroke}"/>
        <path d="M126 275C127 224 148 175 178 144" stroke="${EGG.highlight}" stroke-width="8"/>
        <path d="M157 326L176 308L193 331L214 310L237 334" stroke="${EGG.hint}" stroke-width="3.5"/>
        <path class="owl-egg-central-crack" pathLength="1" d="M157 326L176 308L193 331L214 310L237 334" stroke="${EGG.crack}" stroke-width="${EGG.crackStroke}"/>
        <g class="owl-egg-branch-cracks" stroke="${EGG.crack}" stroke-width="${EGG.crackStroke}">
          <path pathLength="1" d="M157 326L143 316L132 330L116 321"/>
          <path pathLength="1" d="M237 334L250 321L263 333L279 322"/>
          <path pathLength="1" d="M193 331L189 350L199 360"/>
        </g>
      </g>
      <g aria-hidden="true" stroke="${EGG.outline}" stroke-width="${CHIPS.stroke}" stroke-linecap="round" stroke-linejoin="round" fill="white">
        ${CHIPS.items.map(chip => `<g transform="translate(${chip.x} ${chip.y})"><path class="owl-egg-chip" d="${chip.shape}"/></g>`).join('')}
      </g>
    </svg>`;
    host.dataset.stage = '0';
    host.dataset.playing = 'false';
    body = host.querySelector('.owl-egg-body');
    centralCrack = host.querySelector('.owl-egg-central-crack');
    branchCracks = [...host.querySelectorAll('.owl-egg-branch-cracks path')];
    shadow = host.querySelector('.owl-egg-shadow');
    chips = [...host.querySelectorAll('.owl-egg-chip')];
    return true;
  }

  function animate(element, keyframes, duration) {
    const animation = element.animate(keyframes, {duration, easing:EGG.easing, fill:'forwards'});
    animations.add(animation);
    if (document.hidden) animation.pause();
    return animation;
  }
  function wobble(angles, duration) {
    animate(body, angles.map(angle => ({transform:`rotate(${angle}deg)`})), duration);
    animate(shadow, angles.map(angle => ({transform:`scaleX(${1 - Math.abs(angle) * EGG.shadowCompression})`})), duration);
  }
  function drawCrack(element, duration) {
    animate(element, [{strokeDashoffset:1, opacity:0}, {strokeDashoffset:0, opacity:1}], duration);
  }
  function setStage(next) {
    if (stage === next) return;
    stage = next;
    host.dataset.stage = String(stage);
    if (stage === 1) wobble(EGG.gentle, TIMING.gentleMotion);
    if (stage === 2) drawCrack(centralCrack, TIMING.crackReveal);
    if (stage === 3) {
      wobble(EGG.strong, TIMING.strongMotion);
      branchCracks.forEach(crack => drawCrack(crack, TIMING.branchReveal));
    }
    if (stage === 4) chips.forEach((chip, index) => {
      const pose = CHIPS.items[index];
      animate(chip, [
        {offset:0, opacity:0, transform:'translate(0px, 0px) rotate(0deg)'},
        {offset:CHIPS.appearAt, opacity:1, transform:'translate(0px, 0px) rotate(0deg)'},
        {offset:CHIPS.arcPeak, opacity:1, transform:`translate(${pose.outward * CHIPS.peakProgress}px, ${pose.lift}px) rotate(${pose.turn * CHIPS.peakTurn}deg)`},
        {offset:CHIPS.landAt, opacity:CHIPS.landOpacity, transform:`translate(${pose.outward}px, ${pose.fall}px) rotate(${pose.turn}deg)`},
        {offset:1, opacity:0, transform:`translate(${pose.outward}px, ${pose.fall}px) rotate(${pose.turn}deg)`},
      ], TIMING.chipFall);
    });
  }
  function tick(now) {
    if (!active || document.hidden) return;
    if (lastTick) elapsed += now - lastTick;
    lastTick = now;
    STAGES.forEach(cue => { if (elapsed >= cue.at && stage < cue.stage) setStage(cue.stage); });
    if (elapsed < TIMING.finish) frame = requestAnimationFrame(tick);
    else {
      active = false;
      frame = 0;
      host.dataset.playing = 'false';
      window.dispatchEvent(new CustomEvent('owl-egg:complete', {detail:{reducedMotion:false}}));
    }
  }
  function cancelSequence() {
    cancelAnimationFrame(frame);
    frame = 0;
    active = false;
    if (host) host.dataset.playing = 'false';
    lastTick = 0;
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function resetPose() {
    stage = 0;
    elapsed = 0;
    host.dataset.stage = '0';
    host.classList.remove('owl-egg-static');
  }
  function start() {
    if (!mount() || active) return;
    cancelSequence();
    resetPose();
    if (reducedMotion.matches) {
      stage = 5;
      host.dataset.stage = '5';
      host.classList.add('owl-egg-static');
      window.dispatchEvent(new CustomEvent('owl-egg:complete', {detail:{reducedMotion:true}}));
      return;
    }
    active = true;
    host.dataset.playing = 'true';
    if (!document.hidden) frame = requestAnimationFrame(tick);
  }
  function stop() {
    cancelSequence();
    if (host?.isConnected) resetPose();
  }
  function replay() {
    stop();
    start();
  }
  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTick = 0;
      animations.forEach(animation => { if (animation.playState === 'running') animation.pause(); });
    } else {
      animations.forEach(animation => { if (animation.playState === 'paused') animation.play(); });
      frame = requestAnimationFrame(tick);
    }
  });
  reducedMotion.addEventListener('change', () => {
    if (!host?.isConnected || host.closest('[hidden]')) return;
    replay();
  });
  window.addEventListener('pagehide', stop);
  window.OwlEgg = {start, stop, replay};
})();
