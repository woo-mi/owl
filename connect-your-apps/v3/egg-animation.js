/* ─────────────────────────────────────────────────────────
 * V3 ANIMATION STORYBOARD — white goose egg, pip, perimeter zip, cap release.
 * Timeline below uses animation-clock milliseconds at 1.25x playback:
 * the initial cracking takes 4.96s and the Hatch reveal takes 3.12s.
 *
 *    0ms   small planted pressure pulses alternate with stillness
 *  900ms   fine cracks radiate from a small external pip
 * 2900ms   an irregular zip extends around the shell's upper half
 * 3600ms   two chipped edges expose a recessed, membrane-lined opening
 * 3950ms   two unequal shell flakes drop and settle beneath the egg
 * 6200ms   hold the broken shell; the Owl remains hidden until Hatch
 *
 * Hatch, measured from the click:
 *    0ms   continue from the current sway and existing cracks
 *  120ms   remaining hairlines extend through a slow rocking motion
 *  400ms   finish opening the missing strip, preserving current damage
 *  550ms   finish both fragments' fall if Hatch was pressed early
 * 2050ms   the two matching broken edges part; small chips fall
 * 2250ms   the supplied Owl emerges behind the textured shell rim
 * 3400ms   the foreground shell gently fades before the page handoff
 * 3900ms   resolve with the Owl's exact final bounds
 *
 * One RAF clock owns every pose, including paused visibility.
 * stop() cancels the clock and resolves an interrupted hatch false.
 * ───────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const PLAYBACK_RATE = 1.25;
  const TIMING = {
    idleWobble:6200,       // sway continues through the broken-strip reveal
    idleCrack:900,         // first shoulder hairline
    idleBranch:2100,       // fine fractures descend toward the seam
    idleSeam:2900,         // horizontal crack connects
    idleGap:3600,          // shaded opening widens
    idleGapReveal:900,     // ease the opening from hairline to full depth
    idleFragment:3950,     // the missing strip drops as two broken pieces
    idleFragmentFall:1200, // both fragments land with a small settle
    idleFinish:6200,       // hold the reference pose
    idleReveal:1000,       // individual hairline growth
    hatchCrack:120,        // extend remaining cracks
    hatchReveal:900,       // crack drawing duration
    hatchSeedSettle:650,   // ease out the previous sway angle
    hatchGap:400,          // complete a partially opened fracture
    hatchGapReveal:850,    // open the dark recess gradually
    hatchFragment:550,     // continue an interrupted fragment fall
    hatchFragmentFall:1300,// finish before the shell halves part
    hatchShiver:2050,      // calm anticipation, no rapid shaking
    hatchOpen:2050,        // separate the broken shell halves
    hatchChip:2050,        // small fragments release with the shell
    hatchChipFall:1050,    // small fragment flight
    hatchChipStagger:75,   // uneven release intervals
    hatchOwl:2250,         // Owl emerges after the opening
    hatchOwlRise:850,      // settle into the reveal pose
    hatchShellFall:1300,   // shell halves lift and settle
    hatchShellFade:3400,   // uncover the Owl before the handoff
    hatchShellFadeOut:500, // shell fade duration
    hatchFinish:3900,      // exact final bounds are ready for handoff
  };
  const IMAGE = {
    url:'assets/egg-goose-white-v3.png',
    width:1254,height:1254,
    alphaBounds:{x:234,y:23,width:763,height:1223},
    placement:{x:100.38,y:112,height:337},
  };
  const imageScale=IMAGE.placement.height/IMAGE.alphaBounds.height;
  const imagePlacement={
    x:IMAGE.placement.x-IMAGE.alphaBounds.x*imageScale,
    y:IMAGE.placement.y-IMAGE.alphaBounds.y*imageScale,
    width:IMAGE.width*imageScale,height:IMAGE.height*imageScale,
  };
  // Normalized shell coordinates keep the photographic texture, zip, and flakes aligned.
  // Real goose-hatch references: small external pip, perimeter zip, then cap release.
  const REFERENCE={left:22,top:85,width:417,height:587};
  const referencePoint=([x,y])=>[
    IMAGE.placement.x+(x-REFERENCE.left)/REFERENCE.width*IMAGE.alphaBounds.width*imageScale,
    IMAGE.placement.y+(y-REFERENCE.top)/REFERENCE.height*IMAGE.placement.height,
  ];
  const referencePath=(points,closed=false)=>points.map((point,index)=>`${index?'L':'M'}${referencePoint(point).map(value=>value.toFixed(2)).join(' ')}`).join('')+(closed?'Z':'');
  const leftSeam=[[-200,331],[58,331],[73,338],[88,337],[95,342],[110,341],[120,345],[137,343],[150,349],[165,347],[178,352],[191,349]];
  const upperEdge=[[200,352],[210,349],[218,352],[225,344],[232,346],[238,341],[247,344],[256,338],[265,340],[274,337],[280,342],[288,338],[299,341],[310,336]];
  const lowerEdge=[[200,352],[208,359],[218,359],[224,365],[234,363],[242,370],[249,366],[257,368],[265,361],[276,362],[282,354],[292,352],[298,344],[306,342],[310,336]];
  const fragmentCut=[[256,338],[252,348],[260,356],[257,368]];
  const rightSeam=[[318,339],[327,332],[336,334],[348,325],[357,328],[365,322],[376,323],[386,317],[400,317],[412,311],[700,311]];
  const SEAM=referencePath([...leftSeam,...upperEdge,...rightSeam]);
  const CUP_SEAM=referencePath([...leftSeam,...lowerEdge,...rightSeam]);
  const PIP=referencePath([[249,340],[253,332],[260,334],[263,341],[258,347],[250,345]],true);
  const FRACTURE={
    shape:referencePath([...upperEdge,...lowerEdge.slice(0,-1).reverse()],true),
    upper:referencePath(upperEdge),lower:referencePath(lowerEdge),
    center:referencePoint([256,352]),
    rim:'#f8f8f5',rimWidth:1.15, // thin chalk-white shell thickness
    shadow:'#484743',interior:'#94928c', // recessed shadow behind the broken rim
    airFraction:.92,bounceHeight:.65, // light shell flakes settle without rubbery bouncing
    groundY:474,shadowHeight:1.8,
    // Complementary jagged edges fit the cavity at release, then drift apart.
    pieces:[
      {
        shape:referencePath([...upperEdge.slice(0,8),...fragmentCut.slice(1),...lowerEdge.slice(0,7).reverse()],true),
        upper:referencePath([...upperEdge.slice(0,8),...fragmentCut.slice(1)]),
        center:referencePoint([228,355]),dx:-31,dy:205,lift:.8,turn:-14,delay:0,
        scaleX:.94,scaleY:.65,groundX:173,shadowWidth:17,
      },
      {
        shape:referencePath([...upperEdge.slice(7),...lowerEdge.slice(7,-1).reverse(),...fragmentCut.slice(1,-1).reverse()],true),
        upper:referencePath(upperEdge.slice(7)),
        center:referencePoint([281,351]),dx:4,dy:207,lift:1.1,turn:19,delay:.1,
        scaleX:.9,scaleY:.72,groundX:235,shadowWidth:15,
      },
    ],
  };
  const EGG = {
    crack:'#77766f',shadow:'#a8a7a1',crackStroke:.6,
    centerX:205.5,groundY:449,shadowCompression:.012,
    cracks:[
      {d:referencePath([...upperEdge.slice(0,8).reverse(),...leftSeam.slice().reverse()]),idle:1800,hatch:350,width:.8},
      {d:referencePath([[254,336],[247,329],[248,322],[240,315],[241,307],[235,301]]),idle:0,hatch:0,width:.65},
      {d:referencePath([[260,341],[270,346],[275,354],[284,359],[282,368],[288,376]]),idle:400,hatch:100,width:.55},
      {d:referencePath([[250,342],[242,347],[234,342],[224,344],[218,338],[210,337]]),idle:650,hatch:160,width:.6},
      {d:referencePath([[259,335],[266,328],[276,328],[281,321],[289,319],[292,310]]),idle:1000,hatch:200,width:.5},
      {d:referencePath([...upperEdge.slice(7),...rightSeam]),idle:2150,hatch:420,width:.7},
      {d:referencePath([[257,368],[253,377],[256,384],[249,394],[251,402]]),idle:2550,hatch:470,width:.5},
      {d:referencePath([[150,349],[153,358],[150,365],[155,372]]),idle:2400,hatch:500,width:.4},
    ],
    idlePulses:[{at:450,duration:800,angle:-.65},{at:1820,duration:720,angle:.9},{at:3300,duration:580,angle:-1.05},{at:4300,duration:520,angle:.45}],
    hatchPulses:[{at:230,duration:750,angle:-.6},{at:1200,duration:600,angle:.85}],
    pushIn:.008,
  };
  const OWL = {x:107.8,y:167.8,size:194.4,rise:43,startScale:.91,overshoot:1.014};
  const SHELL = {
    sections:[
      {id:'cap',origin:[120,264],dx:-25,dy:-31,lift:4,turn:-28,
        clip:SEAM+'L520 -100L-100 -100Z',edge:SEAM,rim:'#e9e9e3'},
      {id:'cup',origin:[205.5,449],dx:1,dy:1,lift:0,turn:1,
        clip:CUP_SEAM+'L520 630L-100 630Z',edge:CUP_SEAM,rim:'#dbdbd3'},
    ],
  };
  const CHIPS = {
    airFraction:.9,bounceHeight:.6,flatten:.62,
    items:[
      {x:142,y:264,dx:-25,lift:3,turn:-34,groundOffset:7,shape:'M-4-2L1-3L4 0L2 3L-3 2Z'},
      {x:163,y:270,dx:-16,lift:2,turn:22,groundOffset:13,shape:'M-2-2L1-3L3 1L0 2Z'},
      {x:266,y:258,dx:18,lift:3,turn:-18,groundOffset:12,shape:'M-3-2L2-3L4 1L1 3L-3 2Z'},
      {x:285,y:252,dx:25,lift:4,turn:32,groundOffset:6,shape:'M-5-2L1-4L5-1L3 4L-4 3Z'},
    ],
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value=>Math.max(0,Math.min(1,value));
  const progress = (time,at,duration)=>clamp((time-at)/duration);
  const smooth = value=>value*value*(3-2*value);
  const easeOut = value=>1-Math.pow(1-value,3);
  const mix = (from,to,amount)=>from+(to-from)*amount;
  let host,scene,svg,body,closedShell,openShell,shadow,reveal,crackNodes,chipNodes,shellNodes,gap,pip,fragmentNodes,fragmentShadows;
  let mode='stopped',stage=0,elapsed=0,lastTick=null,frame=0;
  let hatchPromise=null,resolveHatch=null,seedCracks=[],seedChips=[],seedAngle=0,seedGapProgress=0,seedFragment=0;

  function pressureAngle(pulses,time) {
    return pulses.reduce((angle,pulse)=>{
      const phase=progress(time,pulse.at,pulse.duration);
      return angle+pulse.angle*Math.pow(Math.sin(phase*Math.PI),2);
    },0);
  }
  function setStage(next) {
    if(stage===next)return;
    stage=next;
    host.dataset.stage=String(stage);
  }
  function drawCrack(node,amount) {
    node.style.strokeDashoffset=String(1-amount);
    node.style.opacity=amount>0?'1':'0';
  }
  function idleCrackAmount(index,time) {
    const crack=EGG.cracks[index];
    return crack.idle===undefined?0:progress(time,TIMING.idleCrack+crack.idle,TIMING.idleReveal);
  }
  // Loose fragments appear only once the shell actually starts opening.
  function idleChipAmount() { return 0; }
  function idleGapAmount(time) { return smooth(progress(time,TIMING.idleGap,TIMING.idleGapReveal)); }
  function idleFragmentAmount(time) { return progress(time,TIMING.idleFragment,TIMING.idleFragmentFall); }
  function continueProgress(seed,time,start,duration) {
    // Already-moving pieces continue immediately at their existing speed.
    return clamp(seed+Math.max(0,time-(seed>0?0:start))/duration);
  }
  function readBounds() {
    const {left,top,width,height}=reveal.getBoundingClientRect();
    return {left,top,width,height};
  }
  function mount() {
    if(host?.isConnected)return true;
    host=document.getElementById('egg-stage');
    if(!host)return false;
    host.innerHTML=`<div class="owl-egg-scene">
      <div id="owl-egg-reveal" class="owl-egg-reveal" aria-hidden="true" style="left:${OWL.x/420*100}%;top:${OWL.y/530*100}%;width:${OWL.size/420*100}%"></div>
      <svg class="owl-egg-art" viewBox="0 0 420 530" fill="none" role="img" aria-labelledby="owl-egg-title owl-egg-description" xmlns="http://www.w3.org/2000/svg">
        <title id="owl-egg-title">An egg beginning to hatch</title>
        <desc id="owl-egg-description">A white goose egg rocks gently with pauses. A small pip grows into a fine crack around the shell, and two shell flakes settle below. The Owl stays hidden until Hatch is pressed.</desc>
        <defs>
          <image id="owl-egg-texture" href="${IMAGE.url}" x="${imagePlacement.x}" y="${imagePlacement.y}" width="${imagePlacement.width}" height="${imagePlacement.height}"/>
          <mask id="owl-egg-alpha" maskUnits="userSpaceOnUse" x="-50" y="-100" width="520" height="730" style="mask-type:alpha"><use href="#owl-egg-texture"/></mask>
          <filter id="owl-egg-ground-soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
          <filter id="owl-egg-fragment-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.2" stdDeviation=".8" flood-color="#6e6454" flood-opacity=".15"/></filter>
          <linearGradient id="owl-egg-cavity" x1="0" y1="${FRACTURE.center[1]-12}" x2="0" y2="${FRACTURE.center[1]+13}" gradientUnits="userSpaceOnUse"><stop stop-color="${FRACTURE.shadow}"/><stop offset=".45" stop-color="#66645f"/><stop offset="1" stop-color="${FRACTURE.interior}"/></linearGradient>
          <linearGradient id="owl-egg-flake" x1="0" y1="${FRACTURE.center[1]-10}" x2="0" y2="${FRACTURE.center[1]+15}" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".55" stop-color="#f3f3ef"/><stop offset="1" stop-color="#ddddd6"/></linearGradient>
          ${FRACTURE.pieces.map((piece,index)=>`<clipPath id="owl-egg-strip-clip-${index}" clipPathUnits="userSpaceOnUse"><path d="${piece.shape}"/></clipPath>`).join('')}
          ${SHELL.sections.map(section=>`<clipPath id="owl-egg-${section.id}-clip" clipPathUnits="userSpaceOnUse"><path d="${section.clip}"/></clipPath>`).join('')}
          ${CHIPS.items.map((chip,index)=>`<clipPath id="owl-egg-chip-clip-${index}" clipPathUnits="userSpaceOnUse"><path d="${chip.shape}"/></clipPath>`).join('')}
        </defs>
        <ellipse class="owl-egg-shadow" cx="205.5" cy="451" rx="76" ry="5.5" fill="${EGG.shadow}" opacity=".22" filter="url(#owl-egg-ground-soft)"/>
        <g class="owl-egg-body" stroke-linecap="round" stroke-linejoin="round">
          <g class="owl-egg-closed-shell">
            <use href="#owl-egg-texture"/>
            <g mask="url(#owl-egg-alpha)" fill="none">${EGG.cracks.map(crack=>`<g class="owl-egg-crack"><path pathLength="1" stroke="#fff" stroke-opacity=".8" stroke-width="${(crack.width||EGG.crackStroke)+.5}" transform="translate(.3 .55)" d="${crack.d}"/><path pathLength="1" stroke="${EGG.crack}" stroke-opacity=".85" stroke-width="${crack.width||EGG.crackStroke}" d="${crack.d}"/></g>`).join('')}</g>
            <g class="owl-egg-pip" opacity="0"><path d="${PIP}" fill="#5a5953" stroke="#f8f8f4" stroke-width="1.2"/><path d="${referencePath([[249,340],[253,332],[260,334]])}" stroke="#b6b6ad" stroke-width=".65"/></g>
            <g mask="url(#owl-egg-alpha)"><g class="owl-egg-wide-fracture" opacity="0">
              <path d="${FRACTURE.shape}" fill="url(#owl-egg-cavity)"/>
              <path d="${referencePath([[204,353],[215,356],[224,357],[234,361],[245,358],[257,362],[268,357],[279,357],[292,349],[300,342],[310,336],...lowerEdge.slice().reverse()],true)}" fill="#deded4" opacity=".45"/>
              <path d="${FRACTURE.upper}" fill="none" stroke="#5c5c56" stroke-width=".8"/>
              <path d="${FRACTURE.lower}" fill="none" stroke="${FRACTURE.rim}" stroke-width="${FRACTURE.rimWidth}"/>
              <path d="${referencePath([[228,352],[231,358],[234,361],[236,365]])}" fill="none" stroke="#e8e8df" stroke-width=".5" opacity=".6"/>
            </g></g>
          </g>
          <g class="owl-egg-open-shell">${SHELL.sections.map(section=>`<g class="owl-egg-shell-section" data-shell="${section.id}"><g clip-path="url(#owl-egg-${section.id}-clip)">
            <use href="#owl-egg-texture"/>
            <g mask="url(#owl-egg-alpha)" fill="none" stroke="${EGG.crack}" opacity=".52">${EGG.cracks.slice(1).map(crack=>`<path stroke-width="${crack.width}" d="${crack.d}"/>`).join('')}</g>
            <g mask="url(#owl-egg-alpha)"><path d="${section.edge}" fill="none" stroke="${section.rim}" stroke-width="2"/><path d="${section.edge}" transform="translate(0 .7)" fill="none" stroke="#fff" stroke-width=".65" opacity=".8"/></g>
          </g></g>`).join('')}</g>
        </g>
        ${FRACTURE.pieces.map((piece,index)=>`<ellipse class="owl-egg-strip-shadow" cx="${piece.groundX}" cy="${FRACTURE.groundY}" rx="${piece.shadowWidth}" ry="${FRACTURE.shadowHeight}" fill="${EGG.shadow}" opacity="0" filter="url(#owl-egg-ground-soft)"/>
        <g class="owl-egg-strip-fragment" opacity="0" filter="url(#owl-egg-fragment-soft)" aria-hidden="true">
          <path d="${piece.shape}" transform="translate(0 .9)" fill="#cfcfc6"/>
          <path d="${piece.shape}" fill="url(#owl-egg-flake)"/>
          <g clip-path="url(#owl-egg-strip-clip-${index})" opacity=".38"><use href="#owl-egg-texture"/></g>
          <path d="${piece.upper}" fill="none" stroke="#fff" stroke-width=".8"/>
        </g>`).join('')}
        <g aria-hidden="true">${CHIPS.items.map((chip,index)=>`<g transform="translate(${chip.x} ${chip.y})"><g class="owl-egg-chip" filter="url(#owl-egg-fragment-soft)">
          <path d="${chip.shape}" transform="translate(.3 .8)" fill="#ddd6cb"/>
          <g clip-path="url(#owl-egg-chip-clip-${index})"><use href="#owl-egg-texture" transform="translate(${-chip.x} ${-chip.y})"/></g>
        </g></g>`).join('')}</g>
      </svg>
    </div>`;
    scene=host.querySelector('.owl-egg-scene');
    svg=host.querySelector('.owl-egg-art');
    body=host.querySelector('.owl-egg-body');
    closedShell=host.querySelector('.owl-egg-closed-shell');
    openShell=host.querySelector('.owl-egg-open-shell');
    shadow=host.querySelector('.owl-egg-shadow');
    reveal=host.querySelector('#owl-egg-reveal');
    crackNodes=[...host.querySelectorAll('.owl-egg-crack')];
    chipNodes=[...host.querySelectorAll('.owl-egg-chip')];
    shellNodes=[...host.querySelectorAll('.owl-egg-shell-section')];
    gap=host.querySelector('.owl-egg-wide-fracture');
    pip=host.querySelector('.owl-egg-pip');
    fragmentNodes=[...host.querySelectorAll('.owl-egg-strip-fragment')];
    fragmentShadows=[...host.querySelectorAll('.owl-egg-strip-shadow')];
    resetPose();
    return true;
  }
  function setWobble(angle) {
    body.setAttribute('transform',`rotate(${angle} ${EGG.centerX} ${EGG.groundY})`);
    shadow.setAttribute('transform',`translate(${EGG.centerX} 0) scale(${1-Math.abs(angle)*EGG.shadowCompression} 1) translate(${-EGG.centerX} 0)`);
  }
  function renderChip(node,chip,amount) {
    node.style.opacity=amount>0?'1':'0';
    const air=clamp(amount/CHIPS.airFraction);
    const fall=EGG.groundY+chip.groundOffset-chip.y;
    const velocity=2*(chip.lift+Math.sqrt(chip.lift*(chip.lift+fall)));
    let y=(fall+velocity)*air*air-velocity*air;
    const landing=progress(amount,CHIPS.airFraction,1-CHIPS.airFraction);
    if(landing>0)y=fall-Math.sin(landing*Math.PI)*CHIPS.bounceHeight;
    const flatten=mix(1,CHIPS.flatten,smooth(progress(amount,.7,.3)));
    node.setAttribute('transform',`translate(${chip.dx*easeOut(air)} ${y}) scale(1 ${flatten}) rotate(${chip.turn*air})`);
  }
  function renderSection(node,section,index,amount) {
    // The cap first pivots at its rim; its outward movement follows the push.
    const opening=index===0?smooth(progress(amount,.12,.88)):smooth(amount);
    const rise=Math.sin(amount*Math.PI)*section.lift;
    const [xOrigin,yOrigin]=section.origin;
    const turn=index===0?easeOut(amount):opening;
    node.setAttribute('transform',`translate(${section.dx*opening} ${section.dy*opening-rise}) rotate(${section.turn*turn} ${xOrigin} ${yOrigin})`);
  }
  function renderPip(amount,gapAmount) {
    pip.setAttribute('opacity',String(smooth(amount)*(1-gapAmount)));
  }
  function renderFracture(amount) {
    gap.setAttribute('opacity',String(amount));
    gap.setAttribute('transform',`translate(0 ${FRACTURE.center[1]}) scale(1 ${amount}) translate(0 ${-FRACTURE.center[1]})`);
    host.dataset.fracture=amount>=1?'open':amount>0?'forming':'closed';
  }
  function renderFragment(amount) {
    FRACTURE.pieces.forEach((piece,index)=>{
      const pieceAmount=progress(amount,piece.delay,1-piece.delay);
      const air=clamp(pieceAmount/FRACTURE.airFraction);
      const landing=progress(pieceAmount,FRACTURE.airFraction,1-FRACTURE.airFraction);
      const flatten=smooth(air);
      const velocity=2*(piece.lift+Math.sqrt(piece.lift*(piece.lift+piece.dy)));
      let y=(piece.dy+velocity)*air*air-velocity*air;
      if(landing>0)y=piece.dy-Math.sin(landing*Math.PI)*FRACTURE.bounceHeight;
      const [cx,cy]=piece.center;
      fragmentNodes[index].setAttribute('opacity',String(smooth(clamp(pieceAmount*10))));
      fragmentNodes[index].setAttribute('transform',`translate(${piece.dx*easeOut(air)} ${y}) translate(${cx} ${cy}) rotate(${piece.turn*air}) scale(${mix(1,piece.scaleX,flatten)} ${mix(1,piece.scaleY,flatten)}) translate(${-cx} ${-cy})`);
      fragmentShadows[index].setAttribute('opacity',String(.2*smooth(progress(pieceAmount,.75,.25))));
    });
    host.dataset.fragment=amount>=1?'landed':amount>0?'falling':'attached';
  }
  function renderIdle(time) {
    setStage(time<TIMING.idleCrack?1:time<TIMING.idleBranch?2:time<TIMING.idleSeam?3:4);
    setWobble(pressureAngle(EGG.idlePulses,time));
    crackNodes.forEach((node,index)=>drawCrack(node,idleCrackAmount(index,time)));
    chipNodes.forEach((node,index)=>renderChip(node,CHIPS.items[index],idleChipAmount(index,time)));
    renderFracture(idleGapAmount(time));
    renderPip(idleCrackAmount(1,time),idleGapAmount(time));
    renderFragment(idleFragmentAmount(time));
  }
  function renderHatch(time) {
    setStage(time<TIMING.hatchCrack?6:time<TIMING.hatchOpen?7:time<TIMING.hatchOwl?8:9);
    const anticipation=pressureAngle(EGG.hatchPulses,time);
    setWobble(anticipation+seedAngle*(1-smooth(progress(time,0,TIMING.hatchSeedSettle))));
    const fractureAmount=smooth(continueProgress(seedGapProgress,time,TIMING.hatchGap,seedGapProgress>0?TIMING.idleGapReveal:TIMING.hatchGapReveal));
    renderFracture(fractureAmount);
    renderPip(mix(seedCracks[1],1,progress(time,TIMING.hatchCrack,TIMING.hatchReveal)),fractureAmount);
    renderFragment(continueProgress(seedFragment,time,TIMING.hatchFragment,seedFragment>0?TIMING.idleFragmentFall:TIMING.hatchFragmentFall));
    crackNodes.forEach((node,index)=>{
      const grown=progress(time,TIMING.hatchCrack+EGG.cracks[index].hatch,TIMING.hatchReveal);
      drawCrack(node,mix(seedCracks[index],1,grown));
    });
    const opening=progress(time,TIMING.hatchOpen,TIMING.hatchShellFall);
    svg.style.opacity=String(1-smooth(progress(time,TIMING.hatchShellFade,TIMING.hatchShellFadeOut)));
    closedShell.style.opacity=time<TIMING.hatchOpen?'1':'0';
    openShell.style.opacity=time<TIMING.hatchOpen?'0':'1';
    shellNodes.forEach((node,index)=>renderSection(node,SHELL.sections[index],index,opening));
    chipNodes.forEach((node,index)=>{
      const falling=progress(time,TIMING.hatchChip+index*TIMING.hatchChipStagger,TIMING.hatchChipFall);
      renderChip(node,CHIPS.items[index],mix(seedChips[index],1,falling));
    });
    const emerging=progress(time,TIMING.hatchOwl,TIMING.hatchOwlRise);
    const rise=easeOut(emerging);
    const owlScale=mix(OWL.startScale,1,rise)+Math.sin(emerging*Math.PI)*(OWL.overshoot-1);
    reveal.style.opacity=String(smooth(clamp(emerging*3)));
    reveal.style.transform=`translateY(${OWL.rise*(1-rise)/OWL.size*100}%) scale(${owlScale})`;
    const push=progress(time,TIMING.hatchCrack,TIMING.hatchFinish-TIMING.hatchCrack);
    scene.style.transform=`scale(${1+Math.sin(push*Math.PI)*EGG.pushIn})`;
  }
  function finish() {
    frame=0;
    lastTick=null;
    host.dataset.playing='false';
    if(mode==='hatching') {
      renderHatch(TIMING.hatchFinish);
      setStage(10);
      mode='hatched';
      host.dataset.mode=mode;
      svg.querySelector('title').textContent='Your Owl has hatched';
      svg.querySelector('desc').textContent='Two softly shaded shell halves have opened, revealing your Owl.';
      const result={completed:true,bounds:readBounds()};
      const resolve=resolveHatch;
      resolveHatch=null;
      resolve?.(result);
    } else {
      renderIdle(TIMING.idleFinish);
      setStage(5);
      mode='resting';
      host.dataset.mode=mode;
      window.dispatchEvent(new CustomEvent('owl-egg:complete',{detail:{reducedMotion:reducedMotion.matches}}));
    }
  }
  function tick(now) {
    if(document.hidden||!['idle','hatching'].includes(mode))return;
    if(lastTick!==null)elapsed+=(now-lastTick)*PLAYBACK_RATE;
    lastTick=now;
    const end=mode==='hatching'?TIMING.hatchFinish:TIMING.idleFinish;
    if(elapsed>=end){finish();return;}
    mode==='hatching'?renderHatch(elapsed):renderIdle(elapsed);
    frame=requestAnimationFrame(tick);
  }
  function cancelClock() {
    cancelAnimationFrame(frame);
    frame=0;
    lastTick=null;
  }
  function resetPose() {
    stage=0;
    elapsed=0;
    host.dataset.stage='0';
    host.dataset.playing='false';
    host.dataset.mode='stopped';
    scene.style.transform='';
    svg.style.opacity='1';
    svg.querySelector('title').textContent='An egg beginning to hatch';
    svg.querySelector('desc').textContent='A white goose egg rocks gently with pauses. A small pip grows into a fine crack around the shell, and two shell flakes settle below. The Owl stays hidden until Hatch is pressed.';
    reveal.style.opacity='0';
    reveal.style.transform='';
    reveal.replaceChildren();
    closedShell.style.opacity='1';
    openShell.style.opacity='0';
    crackNodes.forEach(node=>drawCrack(node,0));
    chipNodes.forEach(node=>{node.style.opacity='0';node.removeAttribute('transform');});
    shellNodes.forEach(node=>node.removeAttribute('transform'));
    renderFracture(0);
    renderPip(0,0);
    renderFragment(0);
    setWobble(0);
  }
  function stop() {
    cancelClock();
    mode='stopped';
    const resolve=resolveHatch;
    resolveHatch=null;
    hatchPromise=null;
    if(host?.isConnected)resetPose();
    resolve?.({completed:false,bounds:null});
  }
  function start() {
    if(!mount()||mode==='idle'||mode==='hatching')return;
    stop();
    mode='idle';
    host.dataset.mode=mode;
    host.dataset.playing='true';
    if(reducedMotion.matches)finish();
    else if(!document.hidden)frame=requestAnimationFrame(tick);
  }
  function replay(){stop();start();}
  function hatch({artwork}={}) {
    if(mode==='hatching')return hatchPromise;
    if(mode==='hatched')return Promise.resolve({completed:true,bounds:readBounds()});
    if(!mount()||typeof artwork!=='string'||!artwork.trim())return Promise.resolve({completed:false,bounds:null});
    const idleTime=mode==='resting'?TIMING.idleFinish:elapsed;
    seedCracks=EGG.cracks.map((_,index)=>idleCrackAmount(index,idleTime));
    seedChips=CHIPS.items.map((_,index)=>idleChipAmount(index,idleTime));
    seedAngle=pressureAngle(EGG.idlePulses,idleTime);
    seedGapProgress=progress(idleTime,TIMING.idleGap,TIMING.idleGapReveal);
    seedFragment=idleFragmentAmount(idleTime);
    cancelClock();
    reveal.innerHTML=artwork;
    elapsed=0;
    mode='hatching';
    host.dataset.mode=mode;
    host.dataset.playing='true';
    hatchPromise=new Promise(resolve=>{resolveHatch=resolve;});
    renderHatch(0);
    if(reducedMotion.matches)finish();
    else if(!document.hidden)frame=requestAnimationFrame(tick);
    return hatchPromise;
  }
  document.addEventListener('visibilitychange',()=>{
    if(!['idle','hatching'].includes(mode))return;
    cancelClock();
    if(!document.hidden)frame=requestAnimationFrame(tick);
  });
  reducedMotion.addEventListener('change',()=>{
    if(!host?.isConnected||host.closest('[hidden]'))return;
    if(reducedMotion.matches&&['idle','hatching'].includes(mode)){cancelClock();finish();}
  });
  window.addEventListener('pagehide',stop);
  window.OwlEgg=Object.freeze({start,stop,replay,hatch});
})();
