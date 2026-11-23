(() => {
  const picker = document.querySelector('#ui-version-picker');
  if (!picker) return;
  const trigger = picker.querySelector('.prototype-version-trigger');
  const label = trigger.querySelector('.prototype-version-label');
  const menu = picker.querySelector('[role="menu"]');
  const options = [...menu.querySelectorAll('[role="menuitemradio"][data-version]')];
  const screens = [...document.querySelectorAll('[data-prototype-screen]')];
  const composer = document.querySelector('.composer');
  const labels = { 'third-party': 'third-party', clarification: 'clarification', 'multi-select-q': 'multi-select Q', 'data-connect-modal': 'Data connect modal' };
  const defaultVersion = 'data-connect-modal';
  let currentVersion;
  let positionFrame;

  function position() {
    positionFrame = undefined;
    if (!composer) return;
    if (picker.closest('dialog[open]')) {
      picker.classList.remove('is-docked');
      menu.style.maxHeight = `${Math.max(0, picker.getBoundingClientRect().top - 16)}px`;
      return;
    }
    const bounds = composer.getBoundingClientRect();
    const availableRight = innerWidth - 16 - trigger.offsetWidth;
    picker.classList.toggle('is-docked', bounds.right + 12 > availableRight);
    picker.style.setProperty('--dock-offset', `${Math.max(0, innerWidth - 16 - bounds.right)}px`);
    menu.style.maxHeight = `${Math.max(0, picker.getBoundingClientRect().top - 16)}px`;
  }

  function schedulePosition() {
    if (!positionFrame) positionFrame = requestAnimationFrame(position);
  }

  function focusOption(option) {
    options.forEach(item => { item.tabIndex = item === option ? 0 : -1; });
    option?.focus({ preventScroll: true });
  }

  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      position();
      focusOption(options.find(option => option.dataset.version === currentVersion) || options[0]);
    } else {
      options.forEach(option => { option.tabIndex = -1; });
      if (restoreFocus) trigger.focus({ preventScroll: true });
    }
  }

  function versionFromLocation() {
    const requested = new URL(location.href).searchParams.get('version');
    return Object.hasOwn(labels, requested) ? requested : defaultVersion;
  }

  function showVersion(version, { updateHistory = false, restoreFocus = false } = {}) {
    if (version === currentVersion) {
      setOpen(false, restoreFocus);
      return;
    }

    const isSwitch = currentVersion !== undefined;
    window.dispatchEvent(new CustomEvent('ui-version-will-change', { detail: { version } }));
    currentVersion = version;
    document.body.dataset.prototypeVersion = version;
    screens.forEach(screen => { screen.hidden = screen.dataset.prototypeScreen !== version; });
    options.forEach(option => {
      option.setAttribute('aria-checked', String(option.dataset.version === version));
    });
    label.textContent = labels[version];
    trigger.setAttribute('aria-label', `Prototype version, ${labels[version]}`);

    if (updateHistory) {
      const url = new URL(location.href);
      url.searchParams.delete('v');
      if (version === defaultVersion) url.searchParams.delete('version');
      else url.searchParams.set('version', version);
      history.pushState(history.state, '', url);
    }

    setOpen(false);
    if (isSwitch) {
      window.scrollTo(0, 0);
      screens.find(screen => screen.dataset.prototypeScreen === version)
        ?.querySelector('h2')?.focus({ preventScroll: true });
    }
    schedulePosition();
    window.dispatchEvent(new CustomEvent('ui-version-change', { detail: { version } }));
  }

  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
  });
  options.forEach(option => {
    option.addEventListener('click', () => {
      showVersion(option.dataset.version, { updateHistory: true, restoreFocus: true });
    });
  });
  menu.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const index = options.indexOf(document.activeElement);
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = options.length - 1;
      else if (event.key === 'ArrowDown') next = (index + 1) % options.length;
      else next = index < 0 ? options.length - 1 : (index - 1 + options.length) % options.length;
      focusOption(options[next]);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || menu.hidden) return;
    event.preventDefault();
    setOpen(false, true);
  });
  document.addEventListener('pointerdown', event => {
    if (!picker.contains(event.target)) setOpen(false);
  });
  document.addEventListener('focusin', event => {
    if (!picker.contains(event.target)) setOpen(false);
  });
  const resize = new ResizeObserver(schedulePosition);
  if (composer) resize.observe(composer);
  const conversation = document.querySelector('.conversation');
  if (conversation) resize.observe(conversation);
  resize.observe(trigger);
  window.addEventListener('popstate', () => showVersion(versionFromLocation()));
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('scroll', schedulePosition, { passive: true });
  document.fonts.ready.then(schedulePosition);
  showVersion(versionFromLocation());
  position();
})();
