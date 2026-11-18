/* Reply versions are separate from the existing Owl and workspace variants. */
(() => {
  'use strict';
  const versionLabels = {
    'color-code':'color code',
    'color-code-ticks':'color code · colored ticks',
    'color-code-previews':'more than three topics',
    'one-topic-time-gap':'one topic - time gap',
    'two-topics':'two topics',
    'timeline':'Slack style',
    'timeline-unread':'Unread',
    'timeline-unread-dark':'Unread dark',
    'links':'use case 1',
    'links-2':'use case 2',
    'links-3':'use case 3',
    'links-4':'use case 4',
    'links-5':'use case 5',
    'timeline-bubble-user':'bubble, read/reply - user',
    'timeline-line-user':'Hybrid style',
    'timeline-line-both':'bubble, connecting line, read/reply both'
  };
  const versions = Object.keys(versionLabels);
  const linksVersions = ['links', 'links-2', 'links-3', 'links-4', 'links-5'];
  const legacyVisibleVersions = ['one-topic-time-gap', 'timeline', 'timeline-unread'];
  const visibleVersions = [...legacyVisibleVersions, ...linksVersions];
  const versionLabel = version => versionLabels[version] || version.toUpperCase();
  const readVersion = () => {
    const value = new URL(location.href).searchParams.get('version');
    return versions.includes(value) ? value : 'timeline';
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
      ${visibleVersions.map(version => `<li role="none"><button type="button" class="prototype-version-option reply-version-option" role="menuitemradio" aria-checked="false" tabindex="-1" data-reply-version="${version}">${versionLabel(version)}</button></li>`).join('')}
    </ul>
  </div><div class="reply-theme-control" role="group" aria-label="Color mode" hidden>
    <span class="reply-theme-icon" data-theme-label="light" title="Light mode" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg></span>
    <button id="reply-theme-toggle" class="reply-theme-toggle" type="button" role="switch" aria-label="Dark mode" aria-checked="true"><span class="reply-theme-thumb" aria-hidden="true"></span></button>
    <span class="reply-theme-icon" data-theme-label="dark" title="Dark mode" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg></span>
  </div>`;
  document.body.prepend(control);
  const trigger = control.querySelector('.reply-version-trigger');
  const label = control.querySelector('.reply-version-label');
  const menu = control.querySelector('[role="menu"]');
  const options = [...menu.querySelectorAll('button')];
  const versionControl = control.querySelector('.prototype-control');
  const themeControl = control.querySelector('.reply-theme-control');
  const themeToggle = control.querySelector('.reply-theme-toggle');

  function focusOption(option) {
    if (!option) return;
    option.focus({preventScroll:true});
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
  }
  function setOpen(open, restoreFocus = false) {
    if (versionControl.hidden) open = false;
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      position();
      const availableOptions = options.filter(option => !option.parentElement.hidden);
      focusOption(availableOptions.find(option => option.dataset.replyVersion === selected) || availableOptions[0]);
    }
    else if (restoreFocus && !control.hidden) (versionControl.hidden ? themeToggle : trigger).focus({preventScroll:true});
  }
  function sync() {
    const links = linksVersions.includes(selected);
    const themeOnly = selected === 'timeline-unread-dark';
    const hasThemeToggle = themeOnly || links;
    versionControl.hidden = themeOnly;
    themeControl.hidden = !hasThemeToggle;
    control.classList.toggle('has-theme-picker', links);
    control.setAttribute('aria-label', links ? 'Prototype use case and color mode' : themeOnly ? 'Prototype color mode' : 'Reply UX Pattern versions');
    if (themeOnly) setOpen(false);
    label.textContent = versionLabel(selected);
    trigger.setAttribute('aria-label', `Reply version, ${versionLabel(selected)}`);
    const displayedVersions = links ? linksVersions : legacyVisibleVersions;
    options.forEach(option => {
      option.setAttribute('aria-checked', String(option.dataset.replyVersion === selected));
      option.parentElement.hidden = !displayedVersions.includes(option.dataset.replyVersion);
    });
    const unread = links || ['timeline', 'timeline-unread', 'timeline-unread-dark'].includes(selected);
    if (links) {
      const url = new URL(location.href);
      if (url.searchParams.has('timeline-thread') || url.searchParams.has('timeline-mode')) {
        url.searchParams.delete('timeline-thread');
        url.searchParams.delete('timeline-mode');
        history.replaceState(history.state, '', url.pathname + url.search + url.hash);
      }
    }
    const requestedTheme = new URL(location.href).searchParams.get('theme');
    const theme = (themeOnly && requestedTheme !== 'light') || (links && requestedTheme === 'dark') ? 'dark' : 'light';
    document.documentElement.dataset.replyTheme = theme;
    document.body.dataset.replyTheme = theme;
    themeToggle.setAttribute('aria-checked', String(theme === 'dark'));
    document.body.dataset.replyExperience = unread ? 'unread' : selected;
    document.body.dataset.replyVersion = selected;
    const themeColor = getComputedStyle(document.body).getPropertyValue('--reply-theme-color').trim() || (theme === 'dark' ? '#17191d' : '#ffffff');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    document.body.dataset.replyLayout = links || selected === 'timeline' || selected.startsWith('timeline-') ? 'timeline' : '';
  }
  function select(version) {
    if (!versions.includes(version)) return;
    const changed = selected !== version;
    const keepLinksTheme = linksVersions.includes(selected) && linksVersions.includes(version);
    selected = version;
    if (changed) {
      const url = new URL(location.href);
      url.searchParams.set('version', selected);
      if (!keepLinksTheme) url.searchParams.delete('theme');
      history.pushState(history.state, '', url.pathname + url.search + url.hash);
    }
    sync();
    setOpen(false, true);
    if (changed) window.dispatchEvent(new CustomEvent('reply-version-change', {detail:{version:selected}}));
  }
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  themeToggle.addEventListener('click', () => {
    const url = new URL(location.href);
    const nextTheme = document.body.dataset.replyTheme === 'dark' ? 'light' : 'dark';
    const defaultTheme = selected === 'timeline-unread-dark' ? 'dark' : 'light';
    if (nextTheme === defaultTheme) url.searchParams.delete('theme');
    else url.searchParams.set('theme', nextTheme);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    setOpen(false);
    sync();
    window.dispatchEvent(new CustomEvent('reply-theme-change', {detail:{theme:nextTheme}}));
    schedulePosition();
  });
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
  });
  options.forEach(option => option.addEventListener('click', () => select(option.dataset.replyVersion)));
  menu.addEventListener('keydown', event => {
    const availableOptions = options.filter(option => !option.parentElement.hidden);
    let index = availableOptions.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') index = (index + 1) % availableOptions.length;
    else if (event.key === 'ArrowUp') index = (index + availableOptions.length - 1) % availableOptions.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = availableOptions.length - 1;
    else {
      if (event.key === 'Tab') setOpen(false);
      return;
    }
    event.preventDefault();
    focusOption(availableOptions[index]);
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
    menu.style.maxHeight = `${Math.max(0, control.getBoundingClientRect().top - 22)}px`;
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
