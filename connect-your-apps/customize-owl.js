(() => {
  'use strict';
  const main = document.querySelector('#main');
  const connectionsView = document.querySelector('#connections-view');
  const customizeView = document.querySelector('#customize-view');
  const advanceLinks = [...document.querySelectorAll('[data-customize-link]')];
  const nameInput = document.querySelector('#owl-name');
  const status = document.querySelector('#hatch-status');
  const defaultName = nameInput.value;
  let currentStep;

  function renderRoute(focusHeading = false) {
    const url = new URL(location.href);
    const step = url.searchParams.get('step') === 'customize' ? 'customize' : 'connections';
    const isCustomize = step === 'customize';
    const changed = currentStep !== step;
    if (changed && isCustomize) window.dispatchEvent(new CustomEvent('connections:leave'));
    connectionsView.hidden = isCustomize;
    customizeView.hidden = !isCustomize;
    document.body.dataset.flowStep = step;
    main.setAttribute('aria-labelledby', isCustomize ? 'customize-title' : 'page-title');
    document.title = isCustomize ? 'Meet your Owl · Owl' : 'Connect your apps · Owl';
    url.searchParams.set('step', 'customize');
    advanceLinks.forEach(link => { link.href = url.pathname + url.search; });
    if (changed) {
      if (isCustomize) window.OwlEgg?.start();
      else window.OwlEgg?.stop();
    }
    currentStep = step;
    if (focusHeading) {
      document.querySelector(isCustomize ? '#customize-title' : '#page-title').focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});
    }
  }

  function navigate(step) {
    const url = new URL(location.href);
    if (step === 'customize') url.searchParams.set('step', step);
    else url.searchParams.delete('step');
    if (url.href !== location.href) history.pushState(history.state, '', url.pathname + url.search + url.hash);
    renderRoute(true);
  }

  advanceLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate('customize');
  }));
  window.addEventListener('popstate', () => renderRoute(true));
  window.addEventListener('pageshow', event => {
    if (event.persisted && currentStep === 'customize') window.OwlEgg?.start();
  });
  window.addEventListener('connections:version-change', () => renderRoute());
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
  document.querySelector('#hatch-owl').addEventListener('click', () => {
    status.textContent = 'The egg is starting to crack.';
    window.OwlEgg?.replay();
  });
  window.addEventListener('owl-egg:complete', () => { status.textContent = 'The egg has a new crack.'; });
  sizeName();
  renderRoute();
})();
