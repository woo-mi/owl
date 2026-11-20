(() => {
  'use strict';
  const versions = ['connected', 'no'];
  const readVersion = () => new URL(location.href).searchParams.get('version') === 'no' ? 'no' : 'connected';
  let selected = readVersion();
  const control = document.createElement('nav');
  control.id = 'connections-version-picker';
  control.setAttribute('aria-label', 'Connection prototype versions');
  control.innerHTML = `<button class="connections-version-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="connections-version-menu">
    <span class="connections-version-label"></span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>
  </button>
  <ul id="connections-version-menu" class="connections-version-menu" role="menu" aria-label="Connection versions" hidden>
    ${versions.map(version => `<li role="none"><button type="button" role="menuitemradio" aria-checked="false" tabindex="-1" data-connections-version="${version}">${version}</button></li>`).join('')}
  </ul>`;
  document.body.prepend(control);
  const trigger = control.querySelector('.connections-version-trigger');
  const label = control.querySelector('.connections-version-label');
  const menu = control.querySelector('[role="menu"]');
  const options = [...menu.querySelectorAll('button')];

  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) options.find(option => option.dataset.connectionsVersion === selected)?.focus({preventScroll:true});
    else if (restoreFocus) trigger.focus({preventScroll:true});
  }
  function sync() {
    label.textContent = selected;
    trigger.setAttribute('aria-label', `Connection version, ${selected}`);
    document.body.dataset.connectionsVersion = selected;
    options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.connectionsVersion === selected)));
  }
  function notify() {
    window.dispatchEvent(new CustomEvent('connections:version-change', {detail:{version:selected}}));
  }
  function select(version) {
    const url = new URL(location.href);
    const changed = selected !== version || url.searchParams.has('step');
    selected = version;
    if (url.searchParams.get('version') !== selected || url.searchParams.has('step')) {
      url.searchParams.delete('step');
      url.searchParams.set('version', selected);
      history.pushState(history.state, '', url.pathname + url.search + url.hash);
    }
    sync();
    setOpen(false, true);
    if (changed) notify();
  }
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    if (event.key === 'ArrowUp') options.at(-1).focus();
  });
  options.forEach(option => option.addEventListener('click', () => select(option.dataset.connectionsVersion)));
  menu.addEventListener('keydown', event => {
    let index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') index = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') index = (index + options.length - 1) % options.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = options.length - 1;
    else if (event.key.length === 1 && /[a-z]/i.test(event.key)) index = versions.findIndex(version => version.startsWith(event.key.toLowerCase()));
    else {
      if (event.key === 'Tab') setOpen(false, true);
      return;
    }
    if (index < 0) return;
    event.preventDefault();
    options[index].focus({preventScroll:true});
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
  window.addEventListener('popstate', () => {
    const next = readVersion();
    const changed = selected !== next;
    selected = next;
    sync();
    setOpen(false, menu.contains(document.activeElement));
    if (changed) notify();
  });
  sync();
})();
