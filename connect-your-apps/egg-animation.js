/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — based on hatching.mov.
 *
 * Idle: 0–950ms a rounded egg rocks on its base; 950–1500ms
 * short asymmetric fractures branch; 1580–2120ms chips fall.
 * The closed shell conceals the Owl until Hatch is pressed.
 *
 * Hatch, measured from the click:
 *    0ms   a small anticipation → a brief, planted shiver
 *  180ms   existing fractures extend into three shell sections
 *  620ms   the sections lift apart and fall to either side
 *  660ms   the supplied Owl emerges; the scene pushes in slightly
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
    hatchOpen:620,        // replace closed shell with matching sections
    hatchChip:560,        // tiny fragments leave before the sections
    hatchChipFall:670,    // slower chips accompany the opening
    hatchChipStagger:45,  // uneven chip release
    hatchOwl:660,         // Owl becomes visible behind the shell
    hatchOwlRise:470,     // rise into the final pose
    hatchShellFall:770,   // larger sections fall and settle
    hatchFinish:1550,     // hold the reveal for the page handoff
  };
  const EGG = {
    outline:'#1c1c1c', crack:'#747474', shadow:'#f1f1f1',
    stroke:5, crackStroke:2.35, splitStroke:3,
    centerX:205, groundY:449, shadowCompression:.012,
    silhouette:'M205 112C153 112 82 211 82 309C82 393 133 449 205 449C278 449 331 393 331 309C331 214 264 112 205 112Z',
    // Unequal lengths and branching joints replace repeated sawteeth.
    cracks:[
      {d:'M129 236L147 227L150 214L166 210L177 191',idle:0,hatch:0},
      {d:'M150 214L170 225L190 220L201 230',idle:110,hatch:40},
      {d:'M155 264L171 267L184 290L209 281L237 283L249 264',idle:220,hatch:80},
      {d:'M209 281L214 313L205 330',idle:330,hatch:120},
      {d:'M155 264L137 282L115 277L83 287',hatch:60},
      {d:'M249 264L281 270L298 259L330 291',hatch:100},
      {d:'M177 191L184 180M190 220L196 201',hatch:20},
      {d:'M205 330L218 354L208 379L217 402L205 449',hatch:180},
      {d:'M218 354L241 345L255 350',hatch:220},
    ],
    idleAngles:[0,-1.65,1.4,-.8,.25,0],
    hatchAngles:[0,-1.5,.9,-2.3,2.1,-1.15,.35,0],
    pushIn:.055,
  };
  const OWL = {x:80,y:199,size:250,rise:27,startScale:.91,overshoot:1.014};
  const SHELL = {
    airFraction:.82,bounceHeight:3,samples:96,
    sections:[
      {origin:[205,218],dx:-164,lift:42,turn:-72,flatten:.29,groundOffset:2,
        d:'M83 287C89 202 153 112 205 112C264 112 324 214 330 291L298 259L281 270L249 264L237 283L209 281L184 290L171 267L155 264L137 282L115 277Z'},
      {origin:[145,365],dx:-54,lift:10,turn:-31,flatten:.38,groundOffset:7,
        d:'M83 287L115 277L137 282L155 264L171 267L184 290L209 281L214 313L205 330L218 354L208 379L217 402L205 449C133 449 82 393 82 309Z'},
      {origin:[267,365],dx:86,lift:15,turn:37,flatten:.34,groundOffset:5,
        d:'M209 281L237 283L249 264L281 270L298 259L330 291L331 309C331 393 278 449 205 449L217 402L208 379L218 354L205 330L214 313Z'},
    ],
  };
  const CHIPS = {
    stroke:2.2,airFraction:.82,bounceHeight:2.5,flatten:.42,
    items:[
      {x:133,y:278,dx:-66,lift:14,turn:-34,groundOffset:7,shape:'M-10-4L1-8L10 0L4 7L-7 4Z'},
      {x:145,y:283,dx:-19,lift:8,turn:22,groundOffset:16,shape:'M-4-3L2-4L5 1L0 4Z'},
      {x:280,y:271,dx:34,lift:10,turn:-18,groundOffset:15,shape:'M-7-5L3-7L8 1L1 6L-6 3Z'},
      {x:298,y:275,dx:55,lift:15,turn:32,groundOffset:9,shape:'M-12-6L1-10L13-2L7 9L-9 7Z'},
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
  let shellLandings=[];

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
  function landingOffset(node,section) {
    const length=node.getTotalLength();
    const angle=section.turn*Math.PI/180;
    let bottom=-Infinity;
    for(let index=0;index<=SHELL.samples;index++) {
      const point=node.getPointAtLength(length*index/SHELL.samples);
      const y=(point.x-section.origin[0])*Math.sin(angle)+(point.y-section.origin[1])*Math.cos(angle);
      bottom=Math.max(bottom,section.origin[1]+y*section.flatten);
    }
    return EGG.groundY+section.groundOffset-bottom;
  }
  function mount() {
    if(host?.isConnected)return true;
    host=document.getElementById('egg-stage');
    if(!host)return false;
    host.innerHTML=`<div class="owl-egg-scene">
      <div id="owl-egg-reveal" class="owl-egg-reveal" aria-hidden="true" style="left:${OWL.x/420*100}%;top:${OWL.y/530*100}%;width:${OWL.size/420*100}%"></div>
      <svg class="owl-egg-art" viewBox="0 0 420 530" fill="none" role="img" aria-labelledby="owl-egg-title owl-egg-description" xmlns="http://www.w3.org/2000/svg">
        <title id="owl-egg-title">An egg beginning to hatch</title>
        <desc id="owl-egg-description">Small irregular cracks branch across a black outlined egg. The Owl stays hidden until Hatch is pressed.</desc>
        <ellipse class="owl-egg-shadow" cx="205" cy="449" rx="88" ry="8" fill="${EGG.shadow}"/>
        <g class="owl-egg-body" stroke-linecap="round" stroke-linejoin="round">
          <g class="owl-egg-closed-shell">
            <path d="${EGG.silhouette}" fill="white" stroke="${EGG.outline}" stroke-width="${EGG.stroke}"/>
            <g fill="none" stroke="${EGG.crack}" stroke-width="${EGG.crackStroke}">${EGG.cracks.map(crack=>`<path class="owl-egg-crack" pathLength="1" d="${crack.d}"/>`).join('')}</g>
          </g>
          <g class="owl-egg-open-shell" fill="white" stroke="${EGG.outline}" stroke-width="${EGG.splitStroke}">${SHELL.sections.map(section=>`<path class="owl-egg-shell-section" d="${section.d}"/>`).join('')}</g>
        </g>
        <g aria-hidden="true" fill="white" stroke="${EGG.outline}" stroke-width="${CHIPS.stroke}" stroke-linecap="round" stroke-linejoin="round">${CHIPS.items.map(chip=>`<g transform="translate(${chip.x} ${chip.y})"><path class="owl-egg-chip" d="${chip.shape}"/></g>`).join('')}</g>
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
    shellLandings=shellNodes.map((node,index)=>landingOffset(node,SHELL.sections[index]));
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
    const air=clamp(amount/SHELL.airFraction);
    const landing=progress(amount,SHELL.airFraction,1-SHELL.airFraction);
    let y=shellLandings[index]*air*air-section.lift*4*air*(1-air);
    if(landing>0)y=shellLandings[index]-Math.sin(landing*Math.PI)*SHELL.bounceHeight;
    const flatten=mix(1,section.flatten,smooth(progress(amount,.55,.45)));
    const angle=section.turn*smooth(air);
    const [xOrigin,yOrigin]=section.origin;
    node.setAttribute('transform',`translate(${section.dx*easeOut(air)} ${y}) translate(${xOrigin} ${yOrigin}) scale(1 ${flatten}) rotate(${angle}) translate(${-xOrigin} ${-yOrigin})`);
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
      svg.querySelector('desc').textContent='The shell has opened, revealing your Owl between the fallen pieces.';
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
    svg.querySelector('title').textContent='An egg beginning to hatch';
    svg.querySelector('desc').textContent='Small irregular cracks branch across a black outlined egg. The Owl stays hidden until Hatch is pressed.';
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
