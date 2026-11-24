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
  const art = window.Owl3DArtwork;
  const DEFAULT_COLOR = art.defaultColor;
  const APPEARANCES = {
    '#A16C39':'brown', '#FB2C3F':'red', '#FE6A10':'orange',
    '#F69312':'amber', '#13C16F':'green', '#15B8A3':'teal',
    '#1E86FC':'blue', '#905AFA':'purple', '#FA70AB':'pink',
    '#959595':'gray'
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
  let owlStudio = art.normalize();

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

  function decodeArtwork() {
    const sources = new Set([...illustration.querySelectorAll('image')].map(image => image.getAttribute('href')));
    return Promise.allSettled([...sources].map(src => {
      const image = new Image();
      image.src = src;
      return image.decode();
    }));
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
    const useMotion = !reducedMotion.matches && Boolean(illustration.animate);
    illustration.style.opacity = '0';
    illustration.dataset.artworkReady = 'false';
    illustration.innerHTML = art.render(owlStudio,owlColor);
    const features = [['heads','head'],['eyes','eyes'],['goggles','goggles'],['horns','horns']].map(([group,key]) => `${art.options[group].find(option => option.id === owlStudio[key]).label} ${key}`);
    illustration.setAttribute('aria-label',`Soft ${APPEARANCES[owlColor]} Owl: ${features.join(', ')}`);
    host.dataset.homeStage = '1';
    if (useMotion) DETAILS.forEach(config => reveal(config, request));
    imagePending = true;
    decodeArtwork().then(results => {
      if (request !== entranceRequest || host.hidden) return;
      imagePending = false;
      illustration.dataset.artworkReady = String(results.every(result => result.status === 'fulfilled'));
      if (useMotion) reveal(OWL, request);
      else {
        illustration.style.removeProperty('opacity');
        markSettled();
      }
    });
  }

  function build() {
    host = document.getElementById('home-view');
    if (!host) return false;
    host.innerHTML = `<div class="owl-home-image" role="img" aria-label="Soft Owl"></div>
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
    owlStudio = art.normalize(studio);
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
