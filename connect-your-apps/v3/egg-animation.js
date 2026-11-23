/* ─────────────────────────────────────────────────────────
 * V3 ANIMATION STORYBOARD — the supplied wide fracture and fallen shell.
 * Timeline below uses animation-clock milliseconds at 1.25x playback:
 * the initial cracking takes 4.96s and the Hatch reveal takes 3.12s.
 *
 *    0ms   the realistic shell begins one gentle, planted sway
 *  900ms   hairline cracks branch down from the upper-right shoulder
 * 2900ms   the uneven horizontal seam connects across the shell
 * 3600ms   the seam opens into the reference's wide, shaded fracture
 * 3950ms   two curved shell fragments fall and settle under the egg
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
  // Points follow the supplied reference in its original 464 x 760 coordinates.
  // Reuse the exact edges for the opening, missing fragments, and shell clips.
  const REFERENCE={left:22,top:85,width:417,height:587};
  const referencePoint=([x,y])=>[
    IMAGE.placement.x+(x-REFERENCE.left)/REFERENCE.width*IMAGE.alphaBounds.width*imageScale,
    IMAGE.placement.y+(y-REFERENCE.top)/REFERENCE.height*IMAGE.placement.height,
  ];
  const referencePath=(points,closed=false)=>points.map((point,index)=>`${index?'L':'M'}${referencePoint(point).map(value=>value.toFixed(2)).join(' ')}`).join('')+(closed?'Z':'');
  const upperEdge=[[22,408],[45,411],[63,408],[80,397],[98,392],[126,379],[147,403],[175,395],[192,395],[214,389],[239,388],[257,379],[278,380],[299,389]];
  const lowerEdge=[[22,408],[36,418],[50,427],[65,429],[87,421],[111,425],[123,433],[144,449],[163,440],[185,446],[214,442],[232,439],[255,429],[268,409],[286,397],[299,389]];
  const fragmentCut=[[175,395],[165,410],[177,424],[163,440]];
  const rightSeam=[[330,397],[345,409],[369,415],[389,415],[417,439],[438,443],[455,433],[700,433]];
  const SEAM=referencePath([[-200,408],...upperEdge,...rightSeam]);
  const CUP_SEAM=referencePath([[-200,408],...lowerEdge,...rightSeam]);
  const FRACTURE={
    shape:referencePath([...upperEdge,...lowerEdge.slice(0,-1).reverse()],true),
    upper:referencePath(upperEdge),lower:referencePath(lowerEdge),
    center:[166,301], // pivot inside the missing strip
    rim:'#f4f0e8',rimWidth:1.3, // lit edge shows shell thickness
    shadow:'#756c61',interior:'#a0988c', // softly shaded cavity
    airFraction:.88,bounceHeight:2.2, // one restrained landing bounce
    groundY:475,shadowHeight:3,
    // Complementary jagged edges fit the cavity at release, then drift apart.
    pieces:[
      {
        shape:referencePath([...upperEdge.slice(0,8),...fragmentCut.slice(1),...lowerEdge.slice(0,8).reverse()],true),
        upper:referencePath([...upperEdge.slice(0,8),...fragmentCut.slice(1)]),
        center:referencePoint([100,420]),dx:18,dy:168,lift:3,turn:-9,
        scaleX:.82,scaleY:.8,groundX:157.7,shadowWidth:31,
      },
      {
        shape:referencePath([...upperEdge.slice(7),...lowerEdge.slice(8,-1).reverse(),...fragmentCut.slice(1,-1).reverse()],true),
        upper:referencePath(upperEdge.slice(7)),
        center:referencePoint([231,413]),dx:22,dy:170,lift:4,turn:8,
        scaleX:.82,scaleY:.85,groundX:227.8,shadowWidth:28.4,
      },
    ],
  };
  const EGG = {
    crack:'#827b72',shadow:'#b4aca0',crackStroke:.9,
    centerX:205.5,groundY:449,shadowCompression:.012,
    cracks:[
      {d:SEAM,idle:2000,hatch:400,width:1.25},
      {d:referencePath([[362,176],[345,197],[325,220],[306,238],[282,242],[257,260],[245,259],[230,244],[214,242],[195,236],[175,248]]),idle:0,hatch:0,width:1.1},
      {d:referencePath([[306,238],[304,264],[309,294],[297,313],[274,325],[250,329],[225,340],[201,354],[190,372],[185,393]]),idle:900,hatch:100,width:1.1},
      {d:referencePath([[255,429],[249,459],[244,481],[245,512],[232,525],[223,546],[202,566]]),idle:2400,hatch:450,width:1},
      {d:referencePath([[250,329],[260,309],[277,295],[284,278]]),idle:1200,hatch:150,width:.65},
      {d:referencePath([[320,307],[322,338],[335,358],[330,379],[330,397]]),idle:1650,hatch:250,width:.85},
      {d:referencePath([[438,443],[422,471],[414,504],[395,530],[377,555],[350,563],[319,564]]),idle:2550,hatch:500,width:1},
      {d:referencePath([[144,449],[128,458],[110,472],[97,477]]),idle:2600,hatch:550,width:.75},
    ],
    idleAngles:[0,-1.6,1.5,-.65,0],
    hatchAngles:[0,-1.8,1.35,0],
    pushIn:.025,
  };
  const OWL = {x:122.38,y:182.38,size:165.24,rise:43,startScale:.91,overshoot:1.014};
  const SHELL = {
    sections:[
      {id:'cap',origin:[126.1,300],dx:-30,dy:-48,lift:9,turn:-18,
        clip:SEAM+'L520 -100L-100 -100Z',edge:SEAM,rim:'#e5dfd5'},
      {id:'cup',origin:[205.5,449],dx:2,dy:8,lift:1.5,turn:2,
        clip:CUP_SEAM+'L520 630L-100 630Z',edge:CUP_SEAM,rim:'#cfc7bb'},
    ],
  };
  const CHIPS = {
    airFraction:.82,bounceHeight:2,flatten:.62,
    items:[
      {x:141.2,y:307,dx:-58,lift:12,turn:-34,groundOffset:7,shape:'M-10-4L1-8L10 0L4 7L-7 4Z'},
      {x:157.2,y:305,dx:-16,lift:7,turn:22,groundOffset:13,shape:'M-4-3L2-4L5 1L0 4Z'},
      {x:269.8,y:300,dx:25,lift:9,turn:-18,groundOffset:12,shape:'M-7-5L3-7L8 1L1 6L-6 3Z'},
      {x:290.2,y:313,dx:48,lift:13,turn:32,groundOffset:6,shape:'M-12-6L1-10L13-2L7 9L-9 7Z'},
    ],
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value=>Math.max(0,Math.min(1,value));
  const progress = (time,at,duration)=>clamp((time-at)/duration);
  const smooth = value=>value*value*(3-2*value);
  const easeOut = value=>1-Math.pow(1-value,3);
  const mix = (from,to,amount)=>from+(to-from)*amount;
  let host,scene,svg,body,closedShell,openShell,shadow,reveal,crackNodes,chipNodes,shellNodes,gap,fragmentNodes,fragmentShadows;
  let mode='stopped',stage=0,elapsed=0,lastTick=null,frame=0;
  let hatchPromise=null,resolveHatch=null,seedCracks=[],seedChips=[],seedAngle=0,seedGapProgress=0,seedFragment=0;

  function poseAngle(values,amount) {
    const position=clamp(amount)*(values.length-1);
    const index=Math.min(values.length-2,Math.floor(position));
    return mix(values[index],values[index+1],smooth(position-index));
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
        <desc id="owl-egg-description">A white goose egg gently sways. Branching cracks widen into a broken opening, and two curved shell fragments settle below. The Owl stays hidden until Hatch is pressed.</desc>
        <defs>
          <image id="owl-egg-texture" href="${IMAGE.url}" x="${imagePlacement.x}" y="${imagePlacement.y}" width="${imagePlacement.width}" height="${imagePlacement.height}"/>
          <mask id="owl-egg-alpha" maskUnits="userSpaceOnUse" x="-50" y="-100" width="520" height="730" style="mask-type:alpha"><use href="#owl-egg-texture"/></mask>
          <filter id="owl-egg-ground-soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
          <filter id="owl-egg-fragment-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.2" stdDeviation=".8" flood-color="#6e6454" flood-opacity=".15"/></filter>
          <linearGradient id="owl-egg-cavity" x1="0" y1="280" x2="0" y2="325" gradientUnits="userSpaceOnUse"><stop stop-color="${FRACTURE.shadow}"/><stop offset="1" stop-color="${FRACTURE.interior}"/></linearGradient>
          ${FRACTURE.pieces.map((piece,index)=>`<clipPath id="owl-egg-strip-clip-${index}" clipPathUnits="userSpaceOnUse"><path d="${piece.shape}"/></clipPath>`).join('')}
          ${SHELL.sections.map(section=>`<clipPath id="owl-egg-${section.id}-clip" clipPathUnits="userSpaceOnUse"><path d="${section.clip}"/></clipPath>`).join('')}
          ${CHIPS.items.map((chip,index)=>`<clipPath id="owl-egg-chip-clip-${index}" clipPathUnits="userSpaceOnUse"><path d="${chip.shape}"/></clipPath>`).join('')}
        </defs>
        <ellipse class="owl-egg-shadow" cx="205.5" cy="451" rx="76" ry="5.5" fill="${EGG.shadow}" opacity=".22" filter="url(#owl-egg-ground-soft)"/>
        <g class="owl-egg-body" stroke-linecap="round" stroke-linejoin="round">
          <g class="owl-egg-closed-shell">
            <use href="#owl-egg-texture"/>
            <g mask="url(#owl-egg-alpha)" fill="none" stroke="${EGG.crack}">${EGG.cracks.map(crack=>`<path class="owl-egg-crack" pathLength="1" stroke-width="${crack.width||EGG.crackStroke}" d="${crack.d}"/>`).join('')}</g>
            <g mask="url(#owl-egg-alpha)"><g class="owl-egg-wide-fracture" opacity="0">
              <path d="${FRACTURE.shape}" fill="url(#owl-egg-cavity)"/>
              <path d="${FRACTURE.upper}" fill="none" stroke="#6e675e" stroke-width="1.1"/>
              <path d="${FRACTURE.lower}" fill="none" stroke="${FRACTURE.rim}" stroke-width="${FRACTURE.rimWidth}"/>
            </g></g>
          </g>
          <g class="owl-egg-open-shell">${SHELL.sections.map(section=>`<g class="owl-egg-shell-section" data-shell="${section.id}"><g clip-path="url(#owl-egg-${section.id}-clip)">
            <use href="#owl-egg-texture"/>
            <g mask="url(#owl-egg-alpha)" fill="none" stroke="#999188" stroke-width=".85" opacity=".52">${EGG.cracks.slice(1).map(crack=>`<path d="${crack.d}"/>`).join('')}</g>
            <g mask="url(#owl-egg-alpha)"><path d="${section.edge}" fill="none" stroke="${section.rim}" stroke-width="2.4"/><path d="${section.edge}" transform="translate(0 1)" fill="none" stroke="#fffdf8" stroke-width=".8" opacity=".8"/></g>
          </g></g>`).join('')}</g>
        </g>
        ${FRACTURE.pieces.map((piece,index)=>`<ellipse class="owl-egg-strip-shadow" cx="${piece.groundX}" cy="${FRACTURE.groundY}" rx="${piece.shadowWidth}" ry="${FRACTURE.shadowHeight}" fill="${EGG.shadow}" opacity="0" filter="url(#owl-egg-ground-soft)"/>
        <g class="owl-egg-strip-fragment" opacity="0" filter="url(#owl-egg-fragment-soft)" aria-hidden="true">
          <path d="${piece.shape}" transform="translate(0 1.5)" fill="#d5cfc4"/>
          <path d="${piece.shape}" fill="#fffdf8"/>
          <g clip-path="url(#owl-egg-strip-clip-${index})" opacity=".28"><use href="#owl-egg-texture"/></g>
          <path d="${piece.upper}" fill="none" stroke="#fdfcf9" stroke-width="1.5"/>
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
    const opening=easeOut(amount);
    const rise=Math.sin(amount*Math.PI)*section.lift;
    const [xOrigin,yOrigin]=section.origin;
    node.setAttribute('transform',`translate(${section.dx*opening} ${section.dy*opening-rise}) rotate(${section.turn*opening} ${xOrigin} ${yOrigin})`);
  }
  function renderFracture(amount) {
    gap.setAttribute('opacity',String(amount));
    gap.setAttribute('transform',`translate(0 ${FRACTURE.center[1]}) scale(1 ${amount}) translate(0 ${-FRACTURE.center[1]})`);
    host.dataset.fracture=amount>=1?'open':amount>0?'forming':'closed';
  }
  function renderFragment(amount) {
    const air=clamp(amount/FRACTURE.airFraction);
    const landing=progress(amount,FRACTURE.airFraction,1-FRACTURE.airFraction);
    const flatten=smooth(air);
    FRACTURE.pieces.forEach((piece,index)=>{
      const velocity=2*(piece.lift+Math.sqrt(piece.lift*(piece.lift+piece.dy)));
      let y=(piece.dy+velocity)*air*air-velocity*air;
      if(landing>0)y=piece.dy-Math.sin(landing*Math.PI)*FRACTURE.bounceHeight;
      const [cx,cy]=piece.center;
      fragmentNodes[index].setAttribute('opacity',String(smooth(clamp(amount*8))));
      fragmentNodes[index].setAttribute('transform',`translate(${piece.dx*easeOut(air)} ${y}) translate(${cx} ${cy}) rotate(${piece.turn*air}) scale(${mix(1,piece.scaleX,flatten)} ${mix(1,piece.scaleY,flatten)}) translate(${-cx} ${-cy})`);
      fragmentShadows[index].setAttribute('opacity',String(.18*smooth(progress(amount,.65,.35))));
    });
    host.dataset.fragment=amount>=1?'landed':amount>0?'falling':'attached';
  }
  function renderIdle(time) {
    setStage(time<TIMING.idleCrack?1:time<TIMING.idleBranch?2:time<TIMING.idleSeam?3:4);
    setWobble(poseAngle(EGG.idleAngles,time/TIMING.idleWobble));
    crackNodes.forEach((node,index)=>drawCrack(node,idleCrackAmount(index,time)));
    chipNodes.forEach((node,index)=>renderChip(node,CHIPS.items[index],idleChipAmount(index,time)));
    renderFracture(idleGapAmount(time));
    renderFragment(idleFragmentAmount(time));
  }
  function renderHatch(time) {
    setStage(time<TIMING.hatchCrack?6:time<TIMING.hatchOpen?7:time<TIMING.hatchOwl?8:9);
    const anticipation=poseAngle(EGG.hatchAngles,time/TIMING.hatchShiver);
    setWobble(anticipation+seedAngle*(1-smooth(progress(time,0,TIMING.hatchSeedSettle))));
    renderFracture(smooth(continueProgress(seedGapProgress,time,TIMING.hatchGap,seedGapProgress>0?TIMING.idleGapReveal:TIMING.hatchGapReveal)));
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
    svg.querySelector('desc').textContent='A white goose egg gently sways. Branching cracks widen into a broken opening, and two curved shell fragments settle below. The Owl stays hidden until Hatch is pressed.';
    reveal.style.opacity='0';
    reveal.style.transform='';
    reveal.replaceChildren();
    closedShell.style.opacity='1';
    openShell.style.opacity='0';
    crackNodes.forEach(node=>drawCrack(node,0));
    chipNodes.forEach(node=>{node.style.opacity='0';node.removeAttribute('transform');});
    shellNodes.forEach(node=>node.removeAttribute('transform'));
    renderFracture(0);
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
    seedAngle=poseAngle(EGG.idleAngles,idleTime/TIMING.idleWobble);
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
