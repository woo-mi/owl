(() => {
  'use strict';
  const main = document.querySelector('#main');
  const connectionsView = document.querySelector('#connections-view');
  const customizeView = document.querySelector('#customize-view');
  const appearanceView = document.querySelector('#appearance-view');
  const personalityView = document.querySelector('#personality-view');
  const readyView = document.querySelector('#ready-view');
  const homeView = document.querySelector('#home-view');
  const advanceLinks = [...document.querySelectorAll('[data-customize-link]')];
  const nameInput = document.querySelector('#owl-name');
  const status = document.querySelector('#hatch-status');
  const defaultName = nameInput.value;
  const hatchButton = document.querySelector('#hatch-owl');
  const eggStage = document.querySelector('#egg-stage');
  const hatchedStage = document.querySelector('#hatched-owl-stage');
  let currentStep;
  let savedOwl;
  let savedSetup;
  let savedPreferences = window.OwlPersonality.snapshot();
  const routeAnimations = new Set();
  /* TRANSITION STORYBOARD
   *   0ms   the selected Owl moves from its 175px preview toward the 90px slot
   * 140ms   personality controls fade up beneath it
   * 560ms   the smaller Owl settles; all controls are ready
   */
  const TRANSITION = {shrink:560,controlsDelay:140,controlsReveal:300,easing:'cubic-bezier(.22,1,.36,1)',offset:10};
  function clearTransition() {
    routeAnimations.forEach(animation => animation.cancel());
    routeAnimations.clear();
    main.dataset.transitionStage = '0';
  }
  function animatePersonality(sourceBounds) {
    if (!sourceBounds?.width || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = document.querySelector('#personality-owl-preview');
    if (!target) return;
    const bounds = target.getBoundingClientRect();
    main.dataset.transitionStage = '1';
    const animation = target.animate([
      {transformOrigin:'top left',transform:`translate(${sourceBounds.left-bounds.left}px,${sourceBounds.top-bounds.top}px) scale(${sourceBounds.width/bounds.width})`},
      {transformOrigin:'top left',transform:'translate(0,0) scale(1)'}
    ],{duration:TRANSITION.shrink,easing:TRANSITION.easing});
    routeAnimations.add(animation);
    const settings = personalityView.querySelector('.owl-personality-settings');
    if (settings) routeAnimations.add(settings.animate([
      {opacity:0,transform:`translateY(${TRANSITION.offset}px)`},
      {opacity:1,transform:'translateY(0)'}
    ],{duration:TRANSITION.controlsReveal,delay:TRANSITION.controlsDelay,easing:TRANSITION.easing,fill:'backwards'}));
    animation.finished.then(() => {
      if (routeAnimations.has(animation)) {
        main.dataset.transitionStage = '2';
        routeAnimations.clear();
      }
    }).catch(() => {});
  }

  function renderRoute(focusHeading = false) {
    const url = new URL(location.href);
    const requestedStep = url.searchParams.get('step');
    const step = ['customize','appearance','personality','ready','00'].includes(requestedStep) ? requestedStep : 'connections';
    const isCustomize = step === 'customize';
    const changed = currentStep !== step;
    if (changed) { clearTransition();window.OwlReady.close(); }
    if (changed && step !== 'connections') window.dispatchEvent(new CustomEvent('connections:leave'));
    connectionsView.hidden = step !== 'connections';
    customizeView.hidden = !isCustomize;
    appearanceView.hidden = step !== 'appearance';
    personalityView.hidden = step !== 'personality';
    readyView.hidden = step !== 'ready';
    homeView.hidden = step !== '00';
    document.body.dataset.flowStep = step;
    const titleId = {connections:'page-title',customize:'customize-title',appearance:'appearance-title',personality:'personality-title',ready:'ready-title','00':'home-title'}[step];
    main.setAttribute('aria-labelledby',titleId);
    document.title = (isCustomize ? 'Meet your Owl' : step === 'connections' ? 'Connect your apps' : step === 'ready' ? 'Your Owl is ready' : step === '00' ? savedSetup?.name || nameInput.value : 'Make your Owl') + ' · Owl';
    url.searchParams.set('step', 'customize');
    advanceLinks.forEach(link => { link.href = url.pathname + url.search; });
    if (changed) {
      if (isCustomize && !savedOwl) window.OwlEgg?.start();
      else window.OwlEgg?.stop();
      if (step === 'appearance') window.OwlAppearance.open({...savedOwl,name:nameInput.value});
      if (step === 'personality') {
        savedOwl ||= {name:nameInput.value,color:'#FA70AB',studio:{...window.OwlStudioArtwork.defaults}};
        window.OwlPersonality.open({...savedOwl,name:nameInput.value});
      }
      if (step === 'ready') {
        savedOwl ||= {name:nameInput.value,color:'#FA70AB',studio:{...window.OwlStudioArtwork.defaults}};
        window.OwlReady.open({...savedOwl,name:nameInput.value,preferences:savedPreferences});
      }
      if (step === '00') window.OwlHome.open({name:savedSetup?.name || nameInput.value});
    }
    if (step === 'ready') window.OwlReady.setVersion(new URL(location.href).searchParams.get('readyVersion'));
    eggStage.hidden = !!savedOwl;
    hatchedStage.hidden = !savedOwl;
    if (savedOwl) hatchedStage.innerHTML = window.OwlStudioArtwork.render(savedOwl.studio,savedOwl.color);
    hatchButton.innerHTML = `${savedOwl ? 'Customize your Owl' : 'Hatch your Owl'}<span aria-hidden="true">→</span>`;
    currentStep = step;
    window.dispatchEvent(new CustomEvent('owl-flow:change', {detail:{step}}));
    if (focusHeading) {
      document.getElementById(titleId).focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});
    }
  }

  function navigate(step, {shrinkOwl = false} = {}) {
    const sourceBounds = shrinkOwl ? appearanceView.querySelector('.owl-appearance-preview').getBoundingClientRect() : null;
    const url = new URL(location.href);
    if (step !== 'connections') url.searchParams.set('step', step);
    else url.searchParams.delete('step');
    if (url.href !== location.href) history.pushState(history.state, '', url.pathname + url.search + url.hash);
    renderRoute(true);
    if (shrinkOwl) animatePersonality(sourceBounds);
  }

  advanceLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate('customize');
  }));
  window.addEventListener('popstate', () => renderRoute(true));
  window.addEventListener('pageshow', event => {
    if (event.persisted && currentStep === 'customize' && !savedOwl) window.OwlEgg?.start();
  });
  window.addEventListener('connections:version-change', () => renderRoute());
  window.addEventListener('owl-ready:version-change', () => renderRoute());
  window.OwlFlow = {connections:() => navigate('connections')};

  function sizeName() { nameInput.size = Math.min(24, Math.max(8, nameInput.value.length)); }
  nameInput.addEventListener('input', sizeName);
  nameInput.addEventListener('blur', () => {
    nameInput.value = nameInput.value.trim() || defaultName;
    sizeName();
  });
  nameInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault();nameInput.blur();document.querySelector('#hatch-owl').focus(); }
  });
  document.querySelector('#edit-owl-name').addEventListener('click', () => { nameInput.focus();nameInput.select(); });
  hatchButton.addEventListener('click', () => navigate('appearance'));
  window.addEventListener('owl-appearance:save',event => {
    savedOwl = event.detail;
    nameInput.value = savedOwl.name;
    sizeName();
    navigate('personality',{shrinkOwl:true});
  });
  window.addEventListener('owl-personality:save',event => {
    savedPreferences = {...event.detail};
    navigate('ready');
  });
  window.addEventListener('owl-personality:skip',() => navigate('customize'));
  window.addEventListener('owl-ready:save',event => {
    savedSetup = event.detail;
    navigate('00');
  });
  window.addEventListener('owl-ready:skip',() => { window.location.href = '../reply-ux-pattern/'; });
  window.addEventListener('pagehide',clearTransition);
  window.addEventListener('owl-egg:complete', () => { status.textContent = 'The egg has a new crack.'; });
  sizeName();
  renderRoute();
})();
