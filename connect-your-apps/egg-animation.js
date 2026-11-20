/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — a gentle crack, with a few fallen pieces.
 *
 *  350ms   the intact egg rocks gently, planted at its base
 * 1250ms   a small central zigzag appears
 * 2100ms   three short branches extend during a soft wobble
 * 2900ms   four differently sized shell chips drop beside the egg
 * 4100ms   the egg settles; the chips stay on the ground
 *
 * No creature, face, or open hatch is included in any stage.
 * ───────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const TIMING = {
    anticipation:  350, // a brief rest before the gentle wobble
    firstCrack:   1250, // a single central fracture appears
    fullFracture: 2100, // three short branches extend the crack
    shellPieces:  2900, // a few small fragments fall to either side
    finish:       4100, // rest on the lightly cracked egg
    gentleMotion:  900, // the initial planted wobble
    shiverMotion:  900, // a soft, slower second wobble
    firstReveal:  700, // central crack drawing duration
    fullReveal:   650, // short branch drawing duration
    pieceFall:    800, // gentle drop plus a small bounce
    pieceStagger:  60, // slight unevenness between shell pieces
  };
  const EGG = {
    outline: '#1c1c1c', // reference black contour
    crack: '#929292', // light hairline fracture from the first version
    shadow: '#f1f1f1', // subtle shadow directly under the base
    stroke: 5.5, // outer contour in SVG units
    crackStroke: 2.6, // restrained central fissure
    shadowCompression: .012, // small response to the planted wobble
    motionEasing: 'cubic-bezier(.35,0,.65,1)', // smooth pose changes
    gentle: [0, -1.8, 1.6, -1, .5, 0], // a gentle anticipation
    shiver: [0, -2.8, 2.4, -1.7, .9, -.4, 0], // soft damped rocking
    silhouette: 'M204 88C149 88 76 200 76 309C76 396 132 448 204 448C276 448 330 396 330 309C330 203 264 88 204 88Z',
    upperCracks: [
      'M157 326L176 308L193 331L214 310L237 334',
    ],
    lowerCracks: [
      'M157 326L143 316L132 330L116 321',
      'M237 334L250 321L263 333L279 322',
      'M193 331L189 350L199 360',
    ],
  };
  const PIECES = {
    stroke: 2.3, // fine outlines on the few fallen fragments
    groundY: 449, // the shell foot and shadow share this ground plane
    airFraction: .82, // remaining time is the impact and small bounce
    samples: 12, // sampled parabolas give the drop a gravity-like acceleration
    landingScale: .42, // pieces lie flat at rest
    bounceAt: .91, // one restrained bounce after impact
    bounceHeight: 3, // a small settling bounce in SVG units
    bounceScale: .7, // fragment briefly tilts on impact
    items: [
      {x:132, y:326, dx:-48, lift:9, turn:-35, groundOffset:4, shape:'M-11-5L2-9L12-1L5 8L-8 5Z'},
      {x:143, y:323, dx:-17, lift:6, turn:22, groundOffset:11, shape:'M-4-3L2-4L5 1L0 4Z'},
      {x:263, y:329, dx:29, lift:8, turn:-18, groundOffset:9, shape:'M-7-5L3-7L8 1L1 6L-6 3Z'},
      {x:276, y:323, dx:62, lift:10, turn:32, groundOffset:2, shape:'M-14-7L1-12L15-2L8 10L-10 8Z'},
    ],
  };
  const STAGES = [
    {at:TIMING.anticipation, stage:1},
    {at:TIMING.firstCrack, stage:2},
    {at:TIMING.fullFracture, stage:3},
    {at:TIMING.shellPieces, stage:4},
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let host;
  let body;
  let upperCracks;
  let lowerCracks;
  let shadow;
  let pieces;
  let stage = 0;
  let active = false;
  let frame = 0;
  let elapsed = 0;
  let lastTick = 0;
  const animations = new Set();
  const fallDistance = piece => PIECES.groundY + piece.groundOffset - piece.y;
  const restingTransform = piece => `translate(${piece.dx}px, ${fallDistance(piece)}px) scaleY(${PIECES.landingScale}) rotate(${piece.turn}deg)`;

  function mount() {
    if (host?.isConnected) return true;
    host = document.getElementById('egg-stage');
    if (!host) return false;
    const crackPaths = paths => paths.map(d => `<path class="owl-egg-crack" pathLength="1" d="${d}"/>`).join('');
    host.innerHTML = `<svg class="owl-egg-art" viewBox="0 0 420 530" fill="none" role="img" aria-labelledby="owl-egg-title owl-egg-description" xmlns="http://www.w3.org/2000/svg">
      <title id="owl-egg-title">An egg cracking</title>
      <desc id="owl-egg-description">A small crack forms in a black outlined egg. Four shell pieces of different sizes settle beside it. The egg stays closed.</desc>
      <defs>
        <clipPath id="owl-egg-clip"><path d="${EGG.silhouette}"/></clipPath>
      </defs>
      <ellipse class="owl-egg-shadow" cx="204" cy="449" rx="90" ry="8" fill="${EGG.shadow}"/>
      <g class="owl-egg-body" stroke-linecap="round" stroke-linejoin="round">
          <path class="owl-egg-shell" d="${EGG.silhouette}" fill="white" stroke="${EGG.outline}" stroke-width="${EGG.stroke}"/>
          <g clip-path="url(#owl-egg-clip)" stroke="${EGG.crack}" stroke-width="${EGG.crackStroke}">
            <g class="owl-egg-upper-cracks">${crackPaths(EGG.upperCracks)}</g>
            <g class="owl-egg-lower-cracks">${crackPaths(EGG.lowerCracks)}</g>
          </g>
      </g>
      <g aria-hidden="true" stroke="${EGG.outline}" stroke-width="${PIECES.stroke}" stroke-linecap="round" stroke-linejoin="round" fill="white">
        ${PIECES.items.map(piece => `<g transform="translate(${piece.x} ${piece.y})"><path class="owl-egg-piece" d="${piece.shape}" style="--piece-rest:${restingTransform(piece)}"/></g>`).join('')}
      </g>
    </svg>`;
    host.dataset.stage = '0';
    host.dataset.playing = 'false';
    body = host.querySelector('.owl-egg-body');
    upperCracks = [...host.querySelectorAll('.owl-egg-upper-cracks path')];
    lowerCracks = [...host.querySelectorAll('.owl-egg-lower-cracks path')];
    shadow = host.querySelector('.owl-egg-shadow');
    pieces = [...host.querySelectorAll('.owl-egg-piece')];
    return true;
  }

  function animate(element, keyframes, duration, {delay = 0, easing = 'linear'} = {}) {
    const animation = element.animate(keyframes, {duration, delay, easing, fill:'forwards'});
    animations.add(animation);
    if (document.hidden) animation.pause();
    return animation;
  }
  function wobble(angles, duration) {
    const options = {easing:EGG.motionEasing};
    animate(body, angles.map(angle => ({transform:`rotate(${angle}deg)`})), duration, options);
    animate(shadow, angles.map(angle => ({transform:`scaleX(${1 - Math.abs(angle) * EGG.shadowCompression})`})), duration, options);
  }
  function drawCracks(paths, duration) {
    paths.forEach(path => animate(path, [{strokeDashoffset:1, opacity:0}, {strokeDashoffset:0, opacity:1}], duration));
  }
  function dropPiece(element, piece, index) {
    const fall = fallDistance(piece);
    const velocity = 2 * (piece.lift + Math.sqrt(piece.lift * (piece.lift + fall)));
    const frames = Array.from({length:PIECES.samples + 1}, (_, sample) => {
      const t = sample / PIECES.samples;
      const x = piece.dx * t * (2 - t);
      const y = (fall + velocity) * t * t - velocity * t;
      const scale = sample === PIECES.samples ? PIECES.landingScale : 1;
      return {offset:t * PIECES.airFraction, opacity:1, transform:`translate(${x}px, ${y}px) scaleY(${scale}) rotate(${piece.turn * t}deg)`};
    });
    frames.push(
      {offset:PIECES.bounceAt, opacity:1, transform:`translate(${piece.dx}px, ${fall - PIECES.bounceHeight}px) scaleY(${PIECES.bounceScale}) rotate(${piece.turn}deg)`},
      {offset:1, opacity:1, transform:restingTransform(piece)},
    );
    const delay = index * TIMING.pieceStagger;
    animate(element, frames, TIMING.pieceFall, {delay});
  }
  function setStage(next) {
    if (stage === next) return;
    stage = next;
    host.dataset.stage = String(stage);
    if (stage === 1) wobble(EGG.gentle, TIMING.gentleMotion);
    if (stage === 2) drawCracks(upperCracks, TIMING.firstReveal);
    if (stage === 3) {
      wobble(EGG.shiver, TIMING.shiverMotion);
      drawCracks(lowerCracks, TIMING.fullReveal);
    }
    if (stage === 4) pieces.forEach((piece, index) => dropPiece(piece, PIECES.items[index], index));
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
      stage = 4;
      host.dataset.stage = '4';
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
