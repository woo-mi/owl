(() => {
  'use strict';
  // Each version has its own prototype files; only this selector is shared.
  const base = new URL('.', document.currentScript.src);
  const versions = [
    { id: 'v1', label: 'v1 - before feedback', href: new URL('./?version=v1', base).href },
    { id: 'v2', label: 'v2 - no side nav', href: new URL('v2/', base).href },
    { id: 'v3', label: 'v3 - side nav only', href: new URL('v3/', base).href },
    { id: 'v4', label: 'v4 - v2+no animation', href: new URL('v4/', base).href },
  ];
  const selectedVersion = versions.find(version => version.id === document.body.dataset.petVersion) || versions[0];
  const selected = selectedVersion.id;
  const control = document.createElement('nav');
  control.id = 'pet-version-picker';
  control.setAttribute('aria-label', 'FAB pet prototype versions');
  control.innerHTML = `<button class="pet-version-trigger" type="button" aria-label="Prototype version, ${selectedVersion.label}" aria-haspopup="menu" aria-expanded="false" aria-controls="pet-version-menu">
    <span>${selectedVersion.label}</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>
  </button>
  <ul id="pet-version-menu" class="pet-version-menu" role="menu" aria-label="Prototype versions" hidden></ul>`;
  document.body.prepend(control);
  const trigger = control.querySelector('button');
  const menu = control.querySelector('[role="menu"]');
  menu.style.width = '240px';
  const options = versions.map(version => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');
    const link = document.createElement('a');
    link.href = version.href;
    link.textContent = version.label;
    link.dataset.version = version.id;
    link.setAttribute('role', 'menuitemradio');
    link.setAttribute('aria-checked', String(version.id === selected));
    link.tabIndex = -1;
    item.append(link);
    menu.append(item);
    return link;
  });
  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) options.find(option => option.dataset.version === selected).focus({ preventScroll: true });
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
})();
