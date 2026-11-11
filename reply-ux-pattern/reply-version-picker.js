/* Reply versions are separate from the existing Owl and workspace variants. */
(() => {
  'use strict';
  const versions = ['v1', 'v2', 'v3', 'v4'];
  const versionLabel = version => version === 'v1' ? 'V1 · connecting line · one topic' : version.toUpperCase();
  const readVersion = () => {
    const value = new URL(location.href).searchParams.get('version');
    return versions.includes(value) ? value : 'v1';
  };
  let selected = readVersion();
  const control = document.createElement('nav');
  control.id = 'reply-version-picker';
  control.className = 'prototype-versions reply-version-controls';
  control.setAttribute('aria-label', 'Reply UX Pattern versions');
  control.innerHTML = `<div class="prototype-control">
    <button class="prototype-version-trigger reply-version-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="reply-version-menu">
      <span class="reply-version-label"></span><svg class="prototype-version-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 7 6 6 6-6"/></svg>
    </button>
    <ul id="reply-version-menu" class="prototype-version-menu reply-version-menu" role="menu" aria-label="Reply versions" hidden>
      ${versions.map(version => `<li role="none"><button type="button" class="prototype-version-option reply-version-option" role="menuitemradio" aria-checked="false" tabindex="-1" data-reply-version="${version}">${versionLabel(version)}</button></li>`).join('')}
    </ul>
  </div>`;
  document.body.prepend(control);
  const trigger = control.querySelector('.reply-version-trigger');
  const label = control.querySelector('.reply-version-label');
  const menu = control.querySelector('[role="menu"]');
  const options = [...menu.querySelectorAll('button')];

  function setOpen(open, restoreFocus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) options.find(option => option.dataset.replyVersion === selected)?.focus({preventScroll:true});
    else if (restoreFocus && !control.hidden) trigger.focus({preventScroll:true});
  }
  function sync() {
    label.textContent = versionLabel(selected);
    trigger.setAttribute('aria-label', `Reply version, ${versionLabel(selected)}`);
    options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.replyVersion === selected)));
    document.body.dataset.replyVersion = selected;
  }
  function select(version) {
    if (!versions.includes(version)) return;
    const changed = selected !== version;
    selected = version;
    if (changed) {
      const url = new URL(location.href);
      url.searchParams.set('version', selected);
      history.pushState(history.state, '', url.pathname + url.search + url.hash);
    }
    sync();
    setOpen(false, true);
    if (changed) window.dispatchEvent(new CustomEvent('reply-version-change', {detail:{version:selected}}));
  }
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
  });
  options.forEach(option => option.addEventListener('click', () => select(option.dataset.replyVersion)));
  menu.addEventListener('keydown', event => {
    let index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') index = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') index = (index + options.length - 1) % options.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = options.length - 1;
    else {
      if (event.key === 'Tab') setOpen(false);
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
  });
  window.addEventListener('popstate', () => {
    selected = readVersion();
    sync();
    setOpen(false);
  });

  const dock = document.querySelector('.composer-dock');
  let positionFrame;
  function position() {
    positionFrame = undefined;
    control.hidden = document.body.matches('.workspace-open, .workspace-page-open, .fullscreen-workspace-open, .sidebar-open');
    if (control.hidden) { setOpen(false); return; }
    const bounds = dock?.getBoundingClientRect();
    const overlaps = bounds && bounds.right + 12 > innerWidth - 16 - control.offsetWidth;
    control.style.bottom = `${overlaps ? Math.max(24, innerHeight - bounds.top + 12) : 24}px`;
  }
  function schedulePosition() {
    if (!positionFrame) positionFrame = requestAnimationFrame(position);
  }
  const resize = new ResizeObserver(schedulePosition);
  resize.observe(control);
  if (dock) resize.observe(dock);
  resize.observe(document.getElementById('main'));
  new MutationObserver(schedulePosition).observe(document.body, {attributes:true, attributeFilter:['class']});
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('mvp-workspace-open', () => setOpen(false));
  sync();
  position();
})();
