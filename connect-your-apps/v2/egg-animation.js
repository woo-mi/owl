/* ─────────────────────────────────────────────────────────
 * V2 ANIMATION STORYBOARD — the supplied six-stage cracking reference.
 *
 * Idle: over 5.5 seconds the realistic shell gently sways on its base.
 * Hairlines begin at 900ms, branch downward, then join the jagged seam.
 * The closed shell conceals the Owl until Hatch is pressed.
 *
 * Hatch, measured from the click:
 *    0ms   continue from the current sway and existing cracks
 *  120ms   fractures extend through one slow, shallow rocking motion
 * 1650ms   the jagged cap lifts; a few chips fall and the cup settles
 * 1850ms   the supplied Owl emerges behind the shell's textured rim
 * 3000ms   the foreground shell gently fades before the page handoff
 * 3500ms   resolve with the Owl's exact final bounds
 *
 * One RAF clock owns every pose, including paused visibility.
 * stop() cancels the clock and resolves an interrupted hatch false.
 * ───────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const TIMING = {
    idleWobble:5500,
    idleCrack:900,
    idleBranch:2100,
    idleSeam:2900,
    idleFinish:5500,
    idleReveal:1000,
    hatchCrack:120,
    hatchReveal:900,
    hatchShiver:1650,
    hatchOpen:1650,
    hatchChip:1650,
    hatchChipFall:1050,
    hatchChipStagger:75,
    hatchOwl:1850,
    hatchOwlRise:850,
    hatchShellFall:1300,
    hatchShellFade:3000,
    hatchShellFadeOut:500,
    hatchFinish:3500,
  };
  const IMAGE = {
    url:'assets/egg-realistic-v2.png',
    width:1254,height:1254,
    alphaBounds:{x:217,y:61,width:804,height:1143},
    placement:{x:86.97,y:112,height:337},
  };
  const imageScale=IMAGE.placement.height/IMAGE.alphaBounds.height;
  const imagePlacement={
    x:IMAGE.placement.x-IMAGE.alphaBounds.x*imageScale,
    y:IMAGE.placement.y-IMAGE.alphaBounds.y*imageScale,
    width:IMAGE.width*imageScale,height:IMAGE.height*imageScale,
  };
  // The same gently irregular seam clips both halves; image alpha supplies
  // their outside contours. No geometric outline is painted over the egg.
  // Trace the reference's asymmetric horizontal fracture and branching hairlines.
  // The same seam both draws the crack and cuts the two textured shell pieces.
  const SEAM='M-50 297L88 297L99 302L110 298L121 300L131 308L142 302L155 306L165 303L177 304L189 297L200 301L211 297L221 285Q226 281 232 282L243 289L252 289L267 298L282 300L297 312L308 315L323 307L470 307';
  const EGG = {
    crack:'#827b72',shadow:'#b4aca0',crackStroke:.9,
    centerX:205.5,groundY:449,shadowCompression:.012,
    cracks:[
      {d:SEAM,idle:2000,hatch:400,width:1.25},
      {d:'M283 165L273 177L268 187L259 193L254 202L243 207L234 214L222 215L215 220',idle:0,hatch:0,width:.85},
      {d:'M259 193L256 208L250 221L248 234L239 244L229 252L226 263L221 270L221 285',idle:900,hatch:100,width:.95},
      {d:'M221 285L218 299L215 313L216 327L207 338L204 350L195 362L191 373',idle:2400,hatch:450,width:.85},
      {d:'M254 202L243 201L235 207L227 203L223 196L214 195L207 191L199 194',idle:1200,hatch:150,width:.7},
      {d:'M259 193L264 207L261 221L269 234L270 248L280 260L282 276L278 282L282 300',idle:1650,hatch:250,width:.9},
      {d:'M297 312L291 326L289 342L281 350L278 360L267 364L258 368',idle:2550,hatch:500,width:.8},
      {d:'M177 304L166 309L153 307L142 313L135 321L123 323',idle:2600,hatch:550,width:.7},
    ],
    idleAngles:[0,-1.6,1.5,-.65,0],
    hatchAngles:[0,-1.8,1.35,0],
    pushIn:.025,
  };
  const OWL = {x:107.8,y:167.8,size:194.4,rise:43,startScale:.91,overshoot:1.014};
  const SHELL = {
    sections:[
      {id:'cap',origin:[116,300],dx:-30,dy:-48,lift:9,turn:-18,
        clip:SEAM+'L470 -100L-50 -100Z',rim:'#e5dfd5'},
      {id:'cup',origin:[205.5,449],dx:2,dy:8,lift:1.5,turn:2,
        clip:SEAM+'L470 630L-50 630Z',rim:'#cfc7bb'},
    ],
  };
  const CHIPS = {
    airFraction:.82,bounceHeight:2,flatten:.62,
    items:[
      {x:133,y:307,dx:-58,lift:12,turn:-34,groundOffset:7,shape:'M-10-4L1-8L10 0L4 7L-7 4Z'},
      {x:151,y:305,dx:-16,lift:7,turn:22,groundOffset:13,shape:'M-4-3L2-4L5 1L0 4Z'},
      {x:278,y:300,dx:25,lift:9,turn:-18,groundOffset:12,shape:'M-7-5L3-7L8 1L1 6L-6 3Z'},
      {x:301,y:313,dx:48,lift:13,turn:32,groundOffset:6,shape:'M-12-6L1-10L13-2L7 9L-9 7Z'},
    ],
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value=>Math.max(0,Math.min(1,value));
  const progress = (time,at,duration)=>clamp((time-at)/duration);
  const smooth = value=>value*value*(3-2*value);
  const easeOut = value=>1-Math.pow(1-value,3);
  const mix = (from,to,amount)=>from+(to-from)*amount;
  let host,scene,svg,body,closedShell,openShell,shadow,reveal,crackNodes,chipNodes,shellNodes;
  let mode='stopped',stage=0,elapsed=0,lastTick=null,frame=0;
  let hatchPromise=null,resolveHatch=null,seedCracks=[],seedChips=[],seedAngle=0;

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
        <desc id="owl-egg-description">A realistic ivory egg gently sways as hairline cracks branch into an uneven seam. The Owl stays hidden until Hatch is pressed.</desc>
        <defs>
          <image id="owl-egg-texture" href="${IMAGE.url}" x="${imagePlacement.x}" y="${imagePlacement.y}" width="${imagePlacement.width}" height="${imagePlacement.height}"/>
          <mask id="owl-egg-alpha" maskUnits="userSpaceOnUse" x="-50" y="-100" width="520" height="730" style="mask-type:alpha"><use href="#owl-egg-texture"/></mask>
          <filter id="owl-egg-ground-soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
          <filter id="owl-egg-fragment-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.2" stdDeviation=".8" flood-color="#6e6454" flood-opacity=".15"/></filter>
          ${SHELL.sections.map(section=>`<clipPath id="owl-egg-${section.id}-clip" clipPathUnits="userSpaceOnUse"><path d="${section.clip}"/></clipPath>`).join('')}
          ${CHIPS.items.map((chip,index)=>`<clipPath id="owl-egg-chip-clip-${index}" clipPathUnits="userSpaceOnUse"><path d="${chip.shape}"/></clipPath>`).join('')}
        </defs>
        <ellipse class="owl-egg-shadow" cx="205.5" cy="451" rx="76" ry="5.5" fill="${EGG.shadow}" opacity=".22" filter="url(#owl-egg-ground-soft)"/>
        <g class="owl-egg-body" stroke-linecap="round" stroke-linejoin="round">
          <g class="owl-egg-closed-shell">
            <use href="#owl-egg-texture"/>
            <g mask="url(#owl-egg-alpha)" fill="none" stroke="${EGG.crack}">${EGG.cracks.map(crack=>`<path class="owl-egg-crack" pathLength="1" stroke-width="${crack.width||EGG.crackStroke}" d="${crack.d}"/>`).join('')}</g>
          </g>
          <g class="owl-egg-open-shell">${SHELL.sections.map(section=>`<g class="owl-egg-shell-section" data-shell="${section.id}"><g clip-path="url(#owl-egg-${section.id}-clip)">
            <use href="#owl-egg-texture"/>
            <g mask="url(#owl-egg-alpha)" fill="none" stroke="#999188" stroke-width=".85" opacity=".52">${EGG.cracks.slice(1).map(crack=>`<path d="${crack.d}"/>`).join('')}</g>
            <g mask="url(#owl-egg-alpha)"><path d="${SEAM}" fill="none" stroke="${section.rim}" stroke-width="2.4"/><path d="${SEAM}" transform="translate(0 1)" fill="none" stroke="#fffdf8" stroke-width=".8" opacity=".8"/></g>
          </g></g>`).join('')}</g>
        </g>
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
  function renderIdle(time) {
    setStage(time<TIMING.idleCrack?1:time<TIMING.idleBranch?2:time<TIMING.idleSeam?3:4);
    setWobble(poseAngle(EGG.idleAngles,time/TIMING.idleWobble));
    crackNodes.forEach((node,index)=>drawCrack(node,idleCrackAmount(index,time)));
    chipNodes.forEach((node,index)=>renderChip(node,CHIPS.items[index],idleChipAmount(index,time)));
  }
  function renderHatch(time) {
    setStage(time<TIMING.hatchCrack?6:time<TIMING.hatchOpen?7:time<TIMING.hatchOwl?8:9);
    const anticipation=poseAngle(EGG.hatchAngles,time/TIMING.hatchShiver);
    setWobble(anticipation+seedAngle*(1-smooth(progress(time,0,650))));
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
    if(lastTick!==null)elapsed+=now-lastTick;
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
    svg.querySelector('desc').textContent='A realistic ivory egg gently sways as hairline cracks branch into an uneven seam. The Owl stays hidden until Hatch is pressed.';
    reveal.style.opacity='0';
    reveal.style.transform='';
    reveal.replaceChildren();
    closedShell.style.opacity='1';
    openShell.style.opacity='0';
    crackNodes.forEach(node=>drawCrack(node,0));
    chipNodes.forEach(node=>{node.style.opacity='0';node.removeAttribute('transform');});
    shellNodes.forEach(node=>node.removeAttribute('transform'));
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
