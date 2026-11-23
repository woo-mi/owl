(() => {
  'use strict';
  // The prototype files are independent; only the version selector is shared.
  const base = new URL('.', document.currentScript.src);
  const versions = [
    { id: 'v1', path: './' },
    { id: 'v2', path: 'v2/' },
    { id: 'v3', path: 'v3/' },
  ];
  const selected = versions.find(version => version.id === document.body.dataset.customizeVersion)?.id || 'v1';
  const control = document.createElement('nav');
  control.id = 'customize-version-picker';
  control.setAttribute('aria-label', 'Customize Owl prototype versions');
  control.innerHTML = `<button class="connections-version-trigger" type="button" aria-label="Customize Owl version, ${selected}" aria-haspopup="menu" aria-expanded="false" aria-controls="customize-version-menu">
    <span>${selected}</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>
  </button>
  <ul id="customize-version-menu" class="connections-version-menu" role="menu" aria-label="Customize Owl versions" hidden></ul>`;
  document.body.prepend(control);
  const trigger = control.querySelector('button');
  const menu = control.querySelector('[role="menu"]');
  const options = versions.map(version => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const link = document.createElement('a');
    link.textContent = version.id;
    link.dataset.version = version.id;
    link.setAttribute('role', 'menuitemradio');
    link.setAttribute('aria-checked', String(version.id === selected));
    link.tabIndex = -1;
    item.append(link);
    menu.append(item);
    return link;
  });
  function updateLinks() {
    versions.forEach((version, index) => {
      const destination = new URL(version.path, base);
      destination.search = window.location.search;
      if (!destination.searchParams.has('version')) destination.searchParams.set('version', 'connected');
      destination.searchParams.set('step', 'customize');
      options[index].href = destination.href;
    });
  }
  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      updateLinks();
      options.find(option => option.dataset.version === selected).focus({ preventScroll: true });
    } else if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  updateLinks();
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    if (event.key === 'ArrowUp') options.at(-1).focus({ preventScroll: true });
  });
  options.forEach(option => option.addEventListener('click', event => {
    if (option.dataset.version !== selected) return;
    event.preventDefault();
    setOpen(false, true);
  }));
  menu.addEventListener('keydown', event => {
    let index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') index = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') index = (index + options.length - 1) % options.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = options.length - 1;
    else if (event.key === ' ') {
      event.preventDefault();
      options[index]?.click();
      return;
    } else {
      if (event.key === 'Tab') setOpen(false, true);
      return;
    }
    event.preventDefault();
    options[index].focus({ preventScroll: true });
  });
  document.addEventListener('pointerdown', event => {
    if (!control.contains(event.target)) setOpen(false);
  });
  document.addEventListener('focusin', event => {
    if (!control.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || menu.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(false, true);
  }, true);
  window.addEventListener('owl-flow:change', () => {
    setOpen(false);
    updateLinks();
  });
})();
