(() => {
  'use strict';
  const versions = ['live', 'no-work'];
  const labels = {'live':'v1', 'no-work':'v2'};
  const names = {'live':'Chat becomes live', 'no-work':'Chat. No work selected'};
  const readVersion = () => new URL(location.href).searchParams.get('chatVersion') === 'no-work' ? 'no-work' : 'live';
  let selected = readVersion();
  const control = document.createElement('nav');
  control.id = 'chat-version-picker';
  control.setAttribute('aria-label', 'Chat prototype versions');
  control.innerHTML = `<button class="connections-version-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="chat-version-menu">
    <span class="connections-version-label"></span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>
  </button>
  <ul id="chat-version-menu" class="connections-version-menu" role="menu" aria-label="Chat versions" hidden>
    ${versions.map(version => `<li role="none"><button type="button" role="menuitemradio" aria-checked="false" tabindex="-1" data-chat-version="${version}">${labels[version]} · ${names[version]}</button></li>`).join('')}
  </ul>`;
  document.body.prepend(control);
  const trigger = control.querySelector('.connections-version-trigger');
  const label = control.querySelector('.connections-version-label');
  const menu = control.querySelector('[role="menu"]');
  const options = [...menu.querySelectorAll('button')];

  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) options.find(option => option.dataset.chatVersion === selected)?.focus({preventScroll:true});
    else if (restoreFocus) trigger.focus({preventScroll:true});
  }
  function sync() {
    selected = readVersion();
    label.textContent = labels[selected];
    trigger.setAttribute('aria-label', `Chat version, ${labels[selected]}`);
    options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.chatVersion === selected)));
  }
  function select(version) {
    const url = new URL(location.href);
    const changed = selected !== version;
    if (changed) {
      url.searchParams.set('chatVersion', version);
      history.pushState(history.state, '', url.pathname + url.search + url.hash);
    }
    sync();
    setOpen(false, true);
    if (changed) window.dispatchEvent(new CustomEvent('owl-chat:version-change', {detail:{version}}));
  }
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    if (event.key === 'ArrowUp') options.at(-1).focus();
  });
  options.forEach(option => option.addEventListener('click', () => select(option.dataset.chatVersion)));
  menu.addEventListener('keydown', event => {
    let index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') index = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') index = (index + options.length - 1) % options.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = options.length - 1;
    else if (['1', '2'].includes(event.key)) index = Number(event.key) - 1;
    else {
      if (event.key === 'Tab') setOpen(false, true);
      return;
    }
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
  window.addEventListener('popstate', () => { sync();setOpen(false); });
  window.addEventListener('owl-flow:change', () => { sync();setOpen(false); });
  sync();
})();
