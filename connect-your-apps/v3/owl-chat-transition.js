(() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────
   * ANIMATION STORYBOARD — screen 00 → live chat
   *
   *    0ms   the visible soft Owl travels and shrinks → the 24px avatar
   *  160ms   the old name and Start chat finish fading out
   *  200ms   the old main background clears; the navigation stays still
   *  320ms   avatar circle, profile label, and version selector appear
   *  360ms   the conversation fades up
   *  440ms   the composer fades up, keeping its existing horizontal transform
   *  580ms   the arriving plush Owl crossfades → the selected flat Owl
   *  720ms   the chat settles; all temporary effects are removed
   * A pending/invisible source image uses the same fades without a flight.
   * ───────────────────────────────────────────────────────── */
  const TIMING = {
    departureDuration:160, // finish the old text and action together
    backgroundDuration:200, // clear only the old main area
    flightDuration:700, // carry the soft Owl into the avatar
    headerAppear:320, // introduce the avatar circle and profile
    headerDuration:180, // settle the chat identity
    conversationAppear:360, // reveal the initial conversation
    conversationDuration:320, // let the messages arrive calmly
    composerAppear:440, // finish with the interactive composer
    composerDuration:280, // end the sequence at 720ms
    avatarAppear:580, // change artwork only near the final size
    avatarDuration:120 // crossfade the two Owl styles
  };
  const MOTION = {
    travelEasing:'cubic-bezier(.22,1,.36,1)', // smooth, non-bouncing arrival
    fadeEasing:'cubic-bezier(.22,1,.36,1)', // calm content reveal
    opacityEasing:'linear', // predictable artwork crossfade
    conversationOffset:10, // incoming message movement in pixels
    composerOffset:8, // incoming composer movement in pixels
    minimumOpacity:.001 // never force a pending source image into view
  };
  const GHOST = {
    zIndex:40, // above chat content, with no pointer or keyboard interaction
    fallbackBackground:'#fafafa', // the existing screen 00 canvas
    detailSelectors:['#home-title','.owl-home-chat'], // old content to fade
    styleProperties:[
      'display','boxSizing','color','backgroundColor','border','borderRadius',
      'padding','fontFamily','fontSize','fontWeight','fontStyle','fontStretch',
      'lineHeight','letterSpacing','textAlign','textDecoration','whiteSpace',
      'overflowWrap','wordBreak','boxShadow','objectFit','objectPosition',
      'alignItems','justifyContent','gap','filter'
    ] // freeze the source appearance before its entrance is canceled
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let snapshotSequence = 0;

  function rectOf(element) {
    const {left,top,width,height} = element.getBoundingClientRect();
    return {left,top,width,height};
  }

  function remapCloneIds(clone) {
    const elements = [clone,...clone.querySelectorAll('*')];
    const ids = new Map();
    const prefix = `owl-chat-ghost-${++snapshotSequence}-`;
    elements.forEach(element => {
      const id = element.getAttribute('id');
      if (!id) return;
      if (element.namespaceURI === 'http://www.w3.org/2000/svg') {
        const replacement = prefix + ids.size;
        ids.set(id,replacement);
        element.setAttribute('id',replacement);
      } else element.removeAttribute('id');
    });
    elements.forEach(element => {
      [...element.attributes].forEach(attribute => {
        if (attribute.name === 'id') return;
        let value = attribute.value.replace(/url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g,(match,quote,id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
        if (['href','xlink:href'].includes(attribute.name) && value.startsWith('#') && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
        if (['aria-labelledby','aria-describedby'].includes(attribute.name)) value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
        if (value !== attribute.value) element.setAttribute(attribute.name,value);
      });
    });
  }

  function sourceSnapshot(element) {
    if (!element) return null;
    const style = getComputedStyle(element);
    const rect = rectOf(element);
    const opacity = Math.max(0,Math.min(1,Number.parseFloat(style.opacity) || 0));
    const inViewport = rect.left < window.innerWidth && rect.left + rect.width > 0 && rect.top < window.innerHeight && rect.top + rect.height > 0;
    if (!rect.width || !rect.height || !inViewport || style.visibility !== 'visible' || style.display === 'none' || opacity <= MOTION.minimumOpacity) return null;
    const clone = element.cloneNode(true);
    clone.removeAttribute('href');
    clone.removeAttribute('srcset');
    clone.removeAttribute('sizes');
    clone.setAttribute('tabindex','-1');
    clone.setAttribute('aria-hidden','true');
    GHOST.styleProperties.forEach(property => { clone.style[property] = style[property]; });
    Object.assign(clone.style,{
      position:'absolute',inset:'0',width:'100%',height:'100%',minWidth:'0',
      maxWidth:'none',minHeight:'0',maxHeight:'none',margin:'0',transform:'none',
      opacity:'1',animation:'none',transition:'none',pointerEvents:'none'
    });
    if (element.tagName === 'IMG') clone.src = element.currentSrc || element.src;
    remapCloneIds(clone);
    return {clone,rect,opacity};
  }

  function capture(homeView) {
    if (!homeView?.isConnected || homeView.hidden || reducedMotion.matches) return null;
    const main = homeView.closest('main') || homeView;
    const mainRect = rectOf(main);
    const left = Math.max(0,mainRect.left);
    const right = Math.min(window.innerWidth,mainRect.left + mainRect.width);
    if (right <= left) return null;
    const image = homeView.querySelector('.owl-home-image');
    const artworkReady = image?.tagName === 'IMG' ? image.complete && image.naturalWidth > 0 : image?.dataset.artworkReady === 'true';
    const background = getComputedStyle(main).backgroundColor;
    return {
      main:{left,width:right-left,height:window.innerHeight,background:background === 'rgba(0, 0, 0, 0)' || background === 'transparent' ? GHOST.fallbackBackground : background},
      image:artworkReady ? sourceSnapshot(image) : null,
      details:GHOST.detailSelectors.map(selector => sourceSnapshot(homeView.querySelector(selector))).filter(Boolean)
    };
  }

  function cancel() {
    const run = active;
    active = null;
    if (!run) return;
    run.animations.forEach(animation => animation.cancel());
    run.animations.clear();
    run.paused.clear();
    run.layer.remove();
    if (run.chatView.isConnected) run.chatView.dataset.chatTransitionStage = '2';
  }

  function animate(run,element,keyframes,options) {
    const animation = element.animate(keyframes,{fill:'both',...options});
    run.animations.add(animation);
    if (document.hidden) {
      animation.pause();
      run.paused.add(animation);
    }
    return animation;
  }

  function fadeIn(run,element,delay,duration,offset=0) {
    if (!element) return;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const opacity = Number.parseFloat(style.opacity);
    const frames = [{opacity:0},{opacity:Number.isFinite(opacity) ? opacity : 1}];
    if (offset) {
      const base = style.transform === 'none' ? '' : style.transform;
      frames[0].transform = `${base} translateY(${offset}px)`.trim();
      frames[1].transform = base || 'none';
    }
    animate(run,element,frames,{delay,duration,easing:MOTION.fadeEasing});
  }

  function addGhost(run,source,mainLeft) {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style,{
      position:'absolute',left:`${source.rect.left-mainLeft}px`,top:`${source.rect.top}px`,
      width:`${source.rect.width}px`,height:`${source.rect.height}px`,
      opacity:String(source.opacity),transformOrigin:'top left',pointerEvents:'none'
    });
    wrapper.append(source.clone);
    run.layer.append(wrapper);
    return wrapper;
  }

  function start(snapshot,chatView) {
    cancel();
    if (!snapshot || !chatView?.isConnected || chatView.hidden || reducedMotion.matches || typeof chatView.animate !== 'function') return false;
    const avatar = chatView.querySelector('.owl-chat-avatar');
    const flatOwl = avatar?.querySelector('svg');
    const target = flatOwl ? rectOf(flatOwl) : null;
    const hasFlight = Boolean(snapshot.image && target?.width && target.height);
    const layer = document.createElement('div');
    layer.dataset.owlChatTransition = '';
    layer.setAttribute('aria-hidden','true');
    layer.inert = true;
    Object.assign(layer.style,{
      position:'fixed',left:`${snapshot.main.left}px`,top:'0',width:`${snapshot.main.width}px`,
      height:`${snapshot.main.height}px`,overflow:'hidden',pointerEvents:'none',zIndex:String(GHOST.zIndex)
    });
    const run = {layer,chatView,animations:new Set(),paused:new Set()};
    active = run;
    chatView.dataset.chatTransitionStage = '1';
    document.body.append(layer);
    try {
      const background = document.createElement('div');
      Object.assign(background.style,{position:'absolute',inset:'0',background:snapshot.main.background,pointerEvents:'none'});
      layer.append(background);
      animate(run,background,[{opacity:1},{opacity:0}],{duration:TIMING.backgroundDuration,easing:MOTION.opacityEasing});
      if (hasFlight) {
        const ghost = addGhost(run,snapshot.image,snapshot.main.left);
        const source = snapshot.image.rect;
        animate(run,ghost,[
          {transform:'translate(0,0) scale(1,1)'},
          {transform:`translate(${target.left-source.left}px,${target.top-source.top}px) scale(${target.width/source.width},${target.height/source.height})`}
        ],{duration:TIMING.flightDuration,easing:MOTION.travelEasing});
        animate(run,ghost,[{opacity:snapshot.image.opacity},{opacity:0}],{delay:TIMING.avatarAppear,duration:TIMING.avatarDuration,easing:MOTION.opacityEasing});
      }
      snapshot.details.forEach(detail => {
        const ghost = addGhost(run,detail,snapshot.main.left);
        animate(run,ghost,[{opacity:detail.opacity},{opacity:0}],{duration:TIMING.departureDuration,easing:MOTION.opacityEasing});
      });
      fadeIn(run,avatar,TIMING.headerAppear,TIMING.headerDuration);
      fadeIn(run,chatView.querySelector('.owl-chat-profile'),TIMING.headerAppear,TIMING.headerDuration);
      fadeIn(run,flatOwl,hasFlight ? TIMING.avatarAppear : TIMING.headerAppear,hasFlight ? TIMING.avatarDuration : TIMING.headerDuration);
      fadeIn(run,chatView.querySelector('.owl-chat-conversation'),TIMING.conversationAppear,TIMING.conversationDuration,MOTION.conversationOffset);
      fadeIn(run,chatView.querySelector('.owl-chat-composer-wrap'),TIMING.composerAppear,TIMING.composerDuration,MOTION.composerOffset);
      fadeIn(run,document.getElementById('chat-version-picker'),TIMING.headerAppear,TIMING.headerDuration);
      Promise.all([...run.animations].map(animation => animation.finished)).then(() => {
        if (active === run) cancel();
      }).catch(() => {});
      return true;
    } catch {
      cancel();
      return false;
    }
  }

  document.addEventListener('pointerdown',() => { if (active) cancel(); },true);
  document.addEventListener('focusin',event => {
    if (active && event.target.closest?.('input,textarea,select,button,a,dialog,[contenteditable="true"]')) cancel();
  },true);
  document.addEventListener('visibilitychange',() => {
    if (!active) return;
    if (document.hidden) {
      active.animations.forEach(animation => {
        if (animation.playState !== 'running') return;
        animation.pause();
        active.paused.add(animation);
      });
    } else {
      active.paused.forEach(animation => {
        if (active.animations.has(animation) && animation.playState === 'paused') animation.play();
      });
      active.paused.clear();
    }
  });
  ['pagehide','resize','popstate','owl-flow:change'].forEach(event => window.addEventListener(event,cancel));
  reducedMotion.addEventListener('change',event => { if (event.matches) cancel(); });
  window.OwlChatTransition = Object.freeze({capture,start,cancel});
})();
