(() => {
  'use strict';
  // Versions share only this selector; each version owns its prototype files.
  const base = new URL('.', document.currentScript.src);
  const versions = [
    { id: 'before', label: 'v1', href: new URL('./?animation=v1', base).href },
    { id: 'after-1', label: 'v2', href: new URL('after-1/', base).href },
    { id: 'after-3', label: 'v3', href: new URL('after-3/', base).href },
    { id: 'after-4', label: 'v4', href: new URL('after-4/', base).href },
  ];
  const selected = versions.find(version => version.id === document.body.dataset.animationVersion) || versions[0];
  const control = document.createElement('nav');
  control.id = 'animation-version-picker';
  control.setAttribute('aria-label', 'Animation optimization versions');
  control.innerHTML = `<button class="animation-version-trigger" type="button" aria-label="Animation version, ${selected.label}" aria-haspopup="menu" aria-expanded="false" aria-controls="animation-version-menu">
    <span>${selected.label}</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>
  </button>
  <ul id="animation-version-menu" class="animation-version-menu" role="menu" aria-label="Animation versions" hidden></ul>`;
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) skipLink.after(control);
  else document.body.prepend(control);
  const trigger = control.querySelector('button');
  const menu = control.querySelector('[role="menu"]');
  const options = versions.map(version => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const link = document.createElement('a');
    link.href = version.href;
    link.textContent = version.label;
    link.dataset.version = version.id;
    link.setAttribute('role', 'menuitemradio');
    link.setAttribute('aria-checked', String(version.id === selected.id));
    if (version.id === selected.id) link.setAttribute('aria-current', 'page');
    link.tabIndex = -1;
    item.append(link);
    menu.append(item);
    return link;
  });

  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) options.find(option => option.dataset.version === selected.id).focus({ preventScroll: true });
    else if (restoreFocus) trigger.focus({ preventScroll: true });
  }

  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    if (event.key === 'ArrowUp') options.at(-1).focus({ preventScroll: true });
  });
  options.forEach(option => option.addEventListener('click', event => {
    if (option.dataset.version !== selected.id) return;
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
  // Register before the prototype scripts so Escape closes this menu first.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || menu.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setOpen(false, true);
  }, true);
})();
