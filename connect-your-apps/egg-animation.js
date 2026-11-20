/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — based on hatching.mov.
 *
 * Idle: 0–950ms a rounded egg rocks on its base; 950–1500ms
 * short asymmetric fractures branch; 1580–2120ms chips fall.
 * The closed shell conceals the Owl until Hatch is pressed.
 *
 * Hatch, measured from the click:
 *    0ms   a small anticipation → a brief, planted shiver
 *  180ms   existing fractures extend around the softly shaded shell
 *  620ms   two textured halves part: the cap lifts and the cup settles
 *  660ms   the supplied Owl emerges; the scene pushes in slightly
 * 1250ms   the foreground shell fades to uncover the Owl before handoff
 * 1550ms   pieces settle → resolve with the Owl's exact bounds
 *
 * One RAF clock owns every pose, including paused visibility.
 * stop() cancels the clock and resolves an interrupted hatch false.
 * ───────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const TIMING = {
    idleWobble:950,       // first gentle, planted movement
    idleCrack:950,        // upper fracture begins
    idleBranch:1170,      // fractures spread diagonally
    idleChip:1580,        // four small, unequal fragments fall
    idleFinish:2120,      // hold a lightly cracked, closed shell
    idleReveal:340,       // hairline drawing duration
    idleChipFall:400,     // chip flight and landing bounce
    idleChipStagger:32,   // uneven chip release
    hatchCrack:180,       // extend the cracks after anticipation
    hatchReveal:340,      // finish drawing a fracture
    hatchShiver:590,      // settle the shell before splitting
    hatchOpen:620,        // replace closed shell with matching textured halves
    hatchChip:560,        // tiny fragments leave before the sections
    hatchChipFall:670,    // slower chips accompany the opening
    hatchChipStagger:45,  // uneven chip release
    hatchOwl:660,         // Owl emerges behind the shell rim
    hatchOwlRise:470,     // rise into the final pose
    hatchShellFall:770,   // shell halves open and settle
    hatchShellFade:1250,  // clear the foreground shell before the page handoff
    hatchShellFadeOut:300,
    hatchFinish:1550,     // hold the reveal for the page handoff
  };
  const IMAGE = {
    url:'assets/egg-white-render.png',
    width:1254,height:1254,
    alphaBounds:{x:254,y:126,width:728,height:1061},
    placement:{x:90,y:112,height:337},
  };
  const imageScale=IMAGE.placement.height/IMAGE.alphaBounds.height;
  const imagePlacement={
    x:IMAGE.placement.x-IMAGE.alphaBounds.x*imageScale,
    y:IMAGE.placement.y-IMAGE.alphaBounds.y*imageScale,
    width:IMAGE.width*imageScale,height:IMAGE.height*imageScale,
  };
  // The same gently irregular seam clips both halves; image alpha supplies
  // their outside contours. No geometric outline is painted over the egg.
  const SEAM='M-50 296C8 294 67 295 96 300L111 295Q115 291 119 292L134 286Q138 285 142 291L147 298L161 294Q168 292 173 298L182 302Q196 299 209 296L222 289Q228 285 234 290L241 296Q251 297 260 299L278 300Q288 303 297 309L310 316Q323 313 340 308L470 307';
  const EGG = {
    crack:'#827d75',shadow:'#bbb6ae',crackStroke:1.15,
    centerX:205.5,groundY:449,shadowCompression:.012,
    cracks:[
      {d:SEAM,idle:0,hatch:0,width:1.35},
      {d:'M278 179Q272 190 263 196L255 208Q249 219 233 222L224 225',idle:180,hatch:40,width:1.05},
      {d:'M255 208Q256 223 250 233L251 245Q248 254 238 260L232 269Q228 278 222 289',idle:280,hatch:70},
      {d:'M222 289Q223 307 216 321L217 336Q214 346 204 352L198 365',idle:340,hatch:110,width:.95},
      {d:'M255 208L239 204Q233 206 228 200L218 196Q207 194 200 199',hatch:130,width:.9},
      {d:'M310 316Q302 330 297 347L290 358Q278 367 265 367L257 373',hatch:170,width:1},
      {d:'M184 301Q171 307 159 304L149 310Q141 319 130 319',hatch:200,width:.85},
    ],
    idleAngles:[0,-1.35,1.15,-.6,.2,0],
    hatchAngles:[0,-1.3,.8,-2,1.8,-.9,.3,0],
    pushIn:.045,
  };
  const OWL = {x:97,y:157,size:216,rise:43,startScale:.91,overshoot:1.014};
  const SHELL = {
    sections:[
      {id:'cap',origin:[116,300],dx:-55,dy:-55,lift:13,turn:-29,
        clip:SEAM+'L470 -100L-50 -100Z',rim:'#e5dfd5'},
      {id:'cup',origin:[205.5,449],dx:5,dy:13,lift:2.5,turn:2.5,
        clip:SEAM+'L470 630L-50 630Z',rim:'#cfc7bb'},
    ],
  };
  const CHIPS = {
    airFraction:.82,bounceHeight:2,flatten:.62,
    items:[
      {x:133,y:295,dx:-58,lift:12,turn:-34,groundOffset:7,shape:'M-10-4L1-8L10 0L4 7L-7 4Z'},
      {x:151,y:298,dx:-16,lift:7,turn:22,groundOffset:13,shape:'M-4-3L2-4L5 1L0 4Z'},
      {x:278,y:300,dx:25,lift:9,turn:-18,groundOffset:12,shape:'M-7-5L3-7L8 1L1 6L-6 3Z'},
      {x:301,y:310,dx:48,lift:13,turn:32,groundOffset:6,shape:'M-12-6L1-10L13-2L7 9L-9 7Z'},
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
  function idleChipAmount(index,time) {
    return progress(time,TIMING.idleChip+index*TIMING.idleChipStagger,TIMING.idleChipFall);
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
        <desc id="owl-egg-description">Fine organic cracks form in a softly shaded white egg. The Owl stays hidden until Hatch is pressed.</desc>
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
    setStage(time<TIMING.idleCrack?1:time<TIMING.idleBranch?2:time<TIMING.idleChip?3:4);
    setWobble(poseAngle(EGG.idleAngles,time/TIMING.idleWobble));
    crackNodes.forEach((node,index)=>drawCrack(node,idleCrackAmount(index,time)));
    chipNodes.forEach((node,index)=>renderChip(node,CHIPS.items[index],idleChipAmount(index,time)));
  }
  function renderHatch(time) {
    setStage(time<TIMING.hatchCrack?6:time<TIMING.hatchOpen?7:time<TIMING.hatchOwl?8:9);
    const anticipation=poseAngle(EGG.hatchAngles,time/TIMING.hatchShiver);
    setWobble(anticipation+seedAngle*(1-progress(time,0,TIMING.hatchCrack)));
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
    svg.querySelector('desc').textContent='Fine organic cracks form in a softly shaded white egg. The Owl stays hidden until Hatch is pressed.';
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
