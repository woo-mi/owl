(() => {
  'use strict';

  /* ANIMATION STORYBOARD — each time screen 00 opens
   *    0ms   Owl fades in, moves up 18px, scale .96 → 1
   *  120ms   name fades in and moves up 12px
   *  220ms   Start chat fades in and moves up 10px
   *  640ms   the entrance settles at the existing layout
   * A late image starts its entrance when decoded; controls never wait on it.
   */
  const TIMING = {
    owlAppear:0,       // lead with the Owl when its image is ready
    nameAppear:120,    // introduce the name after the Owl
    actionAppear:220,  // finish with the primary action
    owlDuration:640,   // soft settling motion for the large illustration
    nameDuration:480,  // keep the name reveal brief
    actionDuration:400 // make Start chat available quickly
  };
  const MOTION = {easing:'cubic-bezier(.22,1,.36,1)',finalScale:1,finalY:0};
  const OWL = {selector:'.owl-home-image',offsetY:18,initialScale:.96,delay:TIMING.owlAppear,duration:TIMING.owlDuration};
  const DETAILS = [
    {selector:'#home-title',offsetY:12,initialScale:1,delay:TIMING.nameAppear,duration:TIMING.nameDuration},
    {selector:'.owl-home-chat',offsetY:10,initialScale:1,delay:TIMING.actionAppear,duration:TIMING.actionDuration}
  ];
  const PINK = '#FA70AB';
  const DEFAULT_COLOR = window.OwlStudioArtwork.defaultColor;
  const PINK_IMAGE = 'assets/owl-soft-preview.png';
  const HEADS = {
    round:{name:'a round head',none:'assets/owl-soft-blue.png',feathered:'assets/owl-soft-round-feathered-blue.png'},
    rounded:{name:'a rounded square head',none:'assets/owl-soft-rounded-blue.png',feathered:'assets/owl-soft-rounded-feathered-blue.png'},
    arch:{name:'an arched head',none:'assets/owl-soft-arch-blue.png',feathered:'assets/owl-soft-arch-feathered-blue.png'}
  };
  // Hue/saturation/brightness are fitted from the blue palette reference.
  // No color offset is applied, so black eyes and the plush shading remain intact.
  const APPEARANCES = {
    '#000000':{name:'black',filter:'grayscale(1) brightness(.32)'},
    '#A16C39':{name:'brown',filter:'hue-rotate(178.2deg) saturate(.506) brightness(.956)'},
    '#FB2C3F':{name:'red',filter:'hue-rotate(136.6deg) saturate(1.908) brightness(1.042)'},
    '#FE6A10':{name:'orange',filter:'hue-rotate(166.6deg) saturate(.988) brightness(1.102)'},
    '#F69312':{name:'amber',filter:'hue-rotate(-174.3deg) saturate(.886) brightness(1.304)'},
    '#13C16F':{name:'green',filter:'hue-rotate(-66.6deg) saturate(.872) brightness(1.172)'},
    '#15B8A3':{name:'teal',filter:'hue-rotate(-47.1deg) saturate(.858) brightness(1.152)'},
    '#1E86FC':{name:'blue',filter:'none'},
    '#905AFA':{name:'purple',filter:'hue-rotate(41.1deg) saturate(1.378) brightness(.982)'},
    '#FA70AB':{name:'pink',filter:'hue-rotate(114deg) saturate(.594) brightness(1.26)'},
    '#959595':{name:'gray',filter:'grayscale(1) brightness(1.2)'}
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const pausedAnimations = new Set();
  let host;
  let illustration;
  let entranceRequest = 0;
  let imagePending = false;
  let owlName = "Ayush's Owl";
  let owlColor = DEFAULT_COLOR;
  let owlStudio = {head:'round',horns:'none'};

  function normalizeStudio(studio) {
    const input = studio && typeof studio === 'object' ? studio : {};
    const normalized = window.OwlStudioArtwork?.normalize?.(input) || input;
    return {
      head:Object.hasOwn(HEADS,normalized.head) ? normalized.head : 'round',
      horns:normalized.horns === 'feathered' ? 'feathered' : 'none'
    };
  }

  function close() {
    entranceRequest++;
    animations.forEach(animation => animation.cancel());
    animations.clear();
    pausedAnimations.clear();
    imagePending = false;
    illustration?.style.removeProperty('opacity');
    if (host) host.dataset.homeStage = '2';
  }

  function markSettled() {
    if (!animations.size && !imagePending) host.dataset.homeStage = '2';
  }

  function showControls() {
    animations.forEach(animation => {
      if (animation.effect.target !== illustration) animation.finish();
    });
  }

  function currentImageReady() {
    return illustration.complete && illustration.naturalWidth > 0 && illustration.currentSrc === illustration.src;
  }

  function reveal(config, request) {
    const element = host.querySelector(config.selector);
    const animation = element.animate([
      {opacity:0,transform:`translateY(${config.offsetY}px) scale(${config.initialScale})`},
      {opacity:1,transform:`translateY(${MOTION.finalY}px) scale(${MOTION.finalScale})`}
    ],{duration:config.duration,delay:config.delay,easing:MOTION.easing,fill:'both'});
    animations.add(animation);
    if (document.hidden) {
      animation.pause();
      pausedAnimations.add(animation);
    }
    animation.finished.then(() => {
      if (request !== entranceRequest) return;
      if (element === illustration) illustration.style.removeProperty('opacity');
      animations.delete(animation);
      pausedAnimations.delete(animation);
      animation.cancel();
      markSettled();
    }).catch(() => {});
  }

  function enter() {
    close();
    const request = entranceRequest;
    const appearance = APPEARANCES[owlColor];
    const head = HEADS[owlStudio.head];
    const originalPink = owlColor === PINK && owlStudio.head === 'round' && owlStudio.horns === 'none';
    const src = originalPink ? PINK_IMAGE : head[owlStudio.horns];
    const sourceChanged = illustration.getAttribute('src') !== src;
    const useMotion = !reducedMotion.matches && Boolean(illustration.animate);
    // Hide before replacing src: browsers may retain the previous decoded bitmap.
    illustration.style.opacity = '0';
    illustration.style.filter = originalPink ? 'none' : appearance.filter;
    illustration.alt = `Soft ${appearance.name} Owl with ${head.name} and ${owlStudio.horns === 'feathered' ? 'feathered horns' : 'no horns'}`;
    if (sourceChanged) illustration.src = src;
    if (!useMotion && !sourceChanged && currentImageReady()) {
      illustration.style.removeProperty('opacity');
      return;
    }
    host.dataset.homeStage = '1';
    if (useMotion) DETAILS.forEach(config => reveal(config, request));
    imagePending = true;
    illustration.decode().then(() => {
      if (request !== entranceRequest || host.hidden) return;
      imagePending = false;
      if (useMotion) reveal(OWL, request);
      else {
        illustration.style.removeProperty('opacity');
        markSettled();
      }
    }).catch(() => {
      if (request !== entranceRequest) return;
      imagePending = false;
      if (currentImageReady()) illustration.style.removeProperty('opacity');
      markSettled();
    });
  }

  function build() {
    host = document.getElementById('home-view');
    if (!host) return false;
    host.innerHTML = `<img class="owl-home-image" alt="Soft gray Owl" width="600" height="600" draggable="false" decoding="async">
      <h1 id="home-title" tabindex="-1"></h1>
      <a class="owl-home-chat" href="?step=chat&amp;chatVersion=live">Start chat</a>`;
    host.querySelector('.owl-home-chat').addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('owl-home:start-chat'));
    });
    host.querySelector('.owl-home-chat').addEventListener('focus', showControls);
    illustration = host.querySelector('.owl-home-image');
    return true;
  }

  function open({name,color,studio} = {}) {
    if (!host?.isConnected && !build()) return;
    if (typeof name === 'string' && name.trim()) owlName = name.trim();
    const requestedColor = typeof color === 'string' ? color.trim().toUpperCase() : DEFAULT_COLOR;
    owlColor = Object.hasOwn(APPEARANCES,requestedColor) ? requestedColor : DEFAULT_COLOR;
    owlStudio = normalizeStudio(studio);
    host.querySelector('#home-title').textContent = owlName;
    const chatUrl = new URL(location.href);
    chatUrl.searchParams.set('step', 'chat');
    chatUrl.searchParams.set('chatVersion', 'live');
    host.querySelector('.owl-home-chat').href = chatUrl.pathname + chatUrl.search + chatUrl.hash;
    enter();
  }

  window.addEventListener('pagehide', close);
  window.addEventListener('pageshow', event => {
    if (event.persisted && host?.isConnected && !host.hidden) enter();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      animations.forEach(animation => {
        if (animation.playState !== 'running') return;
        animation.pause();
        pausedAnimations.add(animation);
      });
    } else {
      pausedAnimations.forEach(animation => {
        if (animations.has(animation) && animation.playState === 'paused') animation.play();
      });
      pausedAnimations.clear();
    }
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches && host?.isConnected && !host.hidden) enter();
    else if (event.matches) close();
  });
  window.OwlHome = Object.freeze({open,close});
})();
