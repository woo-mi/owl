/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — follows the 2.12s reference clip.
 *
 *    0ms   the intact egg rocks gently, planted at its base
 * 1000ms   irregular cracks spread across the upper shell
 * 1300ms   the fracture branches downward during a quick shiver
 * 1580ms   six shell panels peel away, fall, and bounce once
 * 2120ms   the closed egg settles; fragments stay on the ground
 *
 * No creature, face, or open hatch is included in any stage.
 * ───────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const TIMING = {
    anticipation:    0, // gentle movement begins immediately
    firstCrack:   1000, // first connected fracture lines appear
    fullFracture: 1300, // the crack network spreads down the shell
    shellPieces:  1580, // panels lift away from both edges
    finish:       2120, // pause on the fractured, closed egg
    gentleMotion:  980, // the initial planted wobble
    shiverMotion:  550, // faster motion while cracks spread
    firstReveal:  280, // upper crack drawing duration
    fullReveal:   260, // lower crack drawing duration
    pieceFall:    430, // gravity-driven drop plus one small bounce
    pieceStagger:  14, // slight unevenness between shell pieces
    gapOpen:       75, // short peel-away at the source panel
  };
  const EGG = {
    outline: '#1c1c1c', // reference black contour
    crack: '#606060', // legible, finer shell fracture
    shadow: '#f1f1f1', // subtle shadow directly under the base
    stroke: 5.5, // outer contour in SVG units
    crackStroke: 2.6, // fine shell-wide fissures
    shadowCompression: .012, // small response to the planted wobble
    motionEasing: 'cubic-bezier(.35,0,.65,1)', // smooth pose changes
    gentle: [0, -2.4, 2.2, -1.6, .8, 0], // visible first-second rocking
    shiver: [0, -3.8, 4.2, -3, 2.5, -1.5, .65, 0], // quick damped rocking
    silhouette: 'M204 88C149 88 76 200 76 309C76 396 132 448 204 448C276 448 330 396 330 309C330 203 264 88 204 88Z',
    upperCracks: [
      'M78 287L101 273L120 280L137 262L160 273L178 258L199 272L222 260L244 267L267 249L289 256L315 239L333 250',
      'M137 262L126 238L143 217L137 194L160 175L181 181L195 160L210 163',
      'M143 217L166 223L181 204L181 181',
      'M166 223L175 246L178 258',
      'M181 204L205 213L221 199L247 205L267 188L273 165',
      'M247 205L252 232L267 249',
      'M160 175L156 153L166 134',
    ],
    lowerCracks: [
      'M120 280L114 311L94 325L74 313',
      'M114 311L141 323L149 349L175 355L183 383L171 410L180 447',
      'M141 323L169 307L199 312L210 291L199 272',
      'M199 312L215 339L244 336L266 354L291 346L309 365L326 352',
      'M244 336L247 307L272 295L296 284L289 256',
      'M296 284L315 293L333 279',
      'M149 349L128 371L103 366L85 387',
      'M175 355L201 349L223 373L219 400L245 417L258 447',
      'M219 400L192 409L171 410',
      'M223 373L251 369L267 393L291 391L302 411',
      'M221 199L219 174L234 153',
    ],
  };
  const PIECES = {
    stroke: 2.5, // visible angular fragments, finer than the egg outline
    groundY: 449, // the shell foot and shadow share this ground plane
    airFraction: .82, // remaining time is the impact and small bounce
    samples: 12, // sampled parabolas give the drop a gravity-like acceleration
    landingScale: .42, // pieces lie flat at rest
    bounceAt: .91, // one restrained bounce after impact
    bounceHeight: 7, // maximum bounce in SVG units
    bounceScale: .7, // fragment briefly tilts on impact
    items: [
      {x:97, y:246, dx:-47, lift:18, turn:-145, groundOffset:0, shape:'M-9-8L-1-17L13-6L6 11L-10 5Z'},
      {x:311, y:224, dx:51, lift:20, turn:155, groundOffset:2, shape:'M-9-15L7-5L10 12L-3 9L-12-3Z'},
      {x:86, y:326, dx:-12, lift:15, turn:100, groundOffset:5, shape:'M-9-12L9-6L15 9L2 16L-9 3Z'},
      {x:320, y:331, dx:15, lift:17, turn:-120, groundOffset:6, shape:'M-10-13L10-6L6 13L-8 8L-16-4Z'},
      {x:112, y:388, dx:1, lift:12, turn:-65, groundOffset:11, shape:'M-10-13L9-6L12 9L-5 12L-14-2Z'},
      {x:301, y:393, dx:-8, lift:13, turn:75, groundOffset:12, shape:'M-8-12L12-7L9 9L-5 13L-13 1Z'},
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
  let gaps;
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
      <desc id="owl-egg-description">Cracks spread over a black outlined egg. Angular shell pieces fall and remain beside it. The egg stays closed and no animal appears.</desc>
      <defs>
        <clipPath id="owl-egg-clip"><path d="${EGG.silhouette}"/></clipPath>
        <mask id="owl-egg-panel-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="420" height="530">
          <rect width="420" height="530" fill="white"/>
          ${PIECES.items.map(piece => `<path class="owl-egg-panel-gap" transform="translate(${piece.x} ${piece.y})" d="${piece.shape}" fill="black" stroke="black" stroke-width="1"/>`).join('')}
        </mask>
      </defs>
      <ellipse class="owl-egg-shadow" cx="204" cy="449" rx="90" ry="8" fill="${EGG.shadow}"/>
      <g class="owl-egg-body" stroke-linecap="round" stroke-linejoin="round">
        <g mask="url(#owl-egg-panel-mask)">
          <path class="owl-egg-shell" d="${EGG.silhouette}" fill="white" stroke="${EGG.outline}" stroke-width="${EGG.stroke}"/>
          <g clip-path="url(#owl-egg-clip)" stroke="${EGG.crack}" stroke-width="${EGG.crackStroke}">
            <g class="owl-egg-upper-cracks">${crackPaths(EGG.upperCracks)}</g>
            <g class="owl-egg-lower-cracks">${crackPaths(EGG.lowerCracks)}</g>
          </g>
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
    gaps = [...host.querySelectorAll('.owl-egg-panel-gap')];
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
    animate(gaps[index], [{opacity:0}, {opacity:1}], TIMING.gapOpen, {delay});
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
