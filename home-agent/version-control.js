/* Version picker shared in appearance with Reply UX Pattern. */
(() => {
  'use strict';
  const labels = {
    v1: 'V1 · One column img right',
    v2: 'V2 · One column img left'
  };
  const readVersion = () => {
    const value = new URL(location.href).searchParams.get('version');
    return Object.hasOwn(labels, value) ? value : 'v1';
  };
  let selected = readVersion();
  const control = document.createElement('nav');
  control.className = 'prototype-versions';
  control.setAttribute('aria-label', 'Home - Agent versions');
  control.innerHTML = `<div class="prototype-control">
    <button class="prototype-version-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="home-version-menu">
      <span class="prototype-version-label"></span><svg class="prototype-version-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>
    </button>
    <ul id="home-version-menu" class="prototype-version-menu" role="menu" aria-label="Home versions" hidden>
      ${Object.entries(labels).map(([version, label]) => `<li role="none"><button type="button" class="prototype-version-option" role="menuitemradio" aria-checked="false" tabindex="-1" data-version="${version}">${label}</button></li>`).join('')}
    </ul>
  </div>`;
  document.body.append(control);
  const trigger = control.querySelector('.prototype-version-trigger');
  const label = control.querySelector('.prototype-version-label');
  const menu = control.querySelector('[role="menu"]');
  const options = [...menu.querySelectorAll('button')];

  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      closeMenus();
      options.find(option => option.dataset.version === selected)?.focus({preventScroll: true});
    } else if (restoreFocus) trigger.focus({preventScroll: true});
  }
  function sync() {
    document.documentElement.dataset.homeVersion = selected;
    label.textContent = labels[selected];
    trigger.setAttribute('aria-label', `Home version, ${labels[selected]}`);
    options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.version === selected)));
  }
  function select(version) {
    if (version !== selected) {
      selected = version;
      const url = new URL(location.href);
      url.searchParams.set('version', version);
      history.pushState(history.state, '', url.pathname + url.search + url.hash);
    }
    sync();
    setOpen(false, true);
  }
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
  });
  options.forEach(option => option.addEventListener('click', () => select(option.dataset.version)));
  menu.addEventListener('keydown', event => {
    let index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') index = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') index = (index + options.length - 1) % options.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = options.length - 1;
    else { if (event.key === 'Tab') setOpen(false); return; }
    event.preventDefault();
    options[index].focus({preventScroll: true});
  });
  document.addEventListener('pointerdown', event => {
    if (!control.contains(event.target)) setOpen(false);
  });
  document.addEventListener('focusin', event => {
    if (!control.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  window.addEventListener('popstate', () => { selected = readVersion(); sync(); setOpen(false); });
  sync();
})();
