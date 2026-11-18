(() => {
  const picker = document.querySelector('#ui-version-picker');
  const trigger = picker.querySelector('.prototype-version-trigger');
  const menu = picker.querySelector('[role="menu"]');
  const option = menu.querySelector('[role="menuitemradio"]');
  const composer = document.querySelector('.composer');
  let positionFrame;

  function position() {
    positionFrame = undefined;
    const bounds = composer.getBoundingClientRect();
    const availableRight = innerWidth - 16 - trigger.offsetWidth;
    picker.classList.toggle('is-docked', bounds.right + 12 > availableRight);
    picker.style.setProperty('--dock-offset', `${Math.max(0, innerWidth - 16 - bounds.right)}px`);
    menu.style.maxHeight = `${Math.max(0, picker.getBoundingClientRect().top - 16)}px`;
  }

  function schedulePosition() {
    if (!positionFrame) positionFrame = requestAnimationFrame(position);
  }

  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      position();
      option.focus({ preventScroll: true });
    } else if (restoreFocus) {
      trigger.focus({ preventScroll: true });
    }
  }

  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
  });
  option.addEventListener('click', () => setOpen(false, true));
  menu.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      option.focus({ preventScroll: true });
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
  resize.observe(composer);
  resize.observe(document.querySelector('.conversation'));
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('scroll', schedulePosition, { passive: true });
  document.fonts.ready.then(schedulePosition);
  position();
})();
