(() => {
  'use strict';

  const originalTrigger = document.querySelector('[data-pencil-id="PR2aB"]');
  const dock = document.querySelector('.pet-dock');
  if (!originalTrigger || !dock || document.querySelector('#owl-profile-menu')) return;

  // Preserve the exported profile circle while giving it native button behavior.
  const trigger = document.createElement('button');
  for (const attribute of originalTrigger.attributes) trigger.setAttribute(attribute.name, attribute.value);
  trigger.append(...originalTrigger.childNodes);
  trigger.type = 'button';
  trigger.classList.add('owl-profile-trigger');
  trigger.setAttribute('aria-label', 'Profile menu for Woo-Mi Jeong');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'owl-profile-menu');
  trigger.title = 'Profile menu';
  originalTrigger.replaceWith(trigger);

  const icons = {
    profile: '<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    key: '<circle cx="8" cy="9" r="4"/><path d="m11 12 9 9m-3-3 3-3m-6 0 3-3"/>',
    connections: '<path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
    chat: '<path d="M3 12h18M5 12l2-8h10l2 8m-9 6h4"/><circle cx="6.5" cy="18" r="3.5"/><circle cx="17.5" cy="18" r="3.5"/>',
    subscriptions: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M7 3v4m10-4v4"/>',
    jobs: '<rect x="5" y="5" width="14" height="14" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M8 2v3m8-3v3M8 19v3m8-3v3M2 8h3m-3 8h3m14-8h3m-3 8h3"/>',
    portal: '<path d="M4 14v-3a8 8 0 0 1 16 0v3m0 4v2a2 2 0 0 1-2 2h-4"/><rect x="2" y="11" width="4" height="8" rx="2"/><rect x="18" y="11" width="4" height="8" rx="2"/>',
    owl: '<path d="M12 4C7 1 2 5 2 12a10 10 0 0 0 20 0c0-7-5-11-10-8Z"/><path d="M2 9c3-4 7-3 10 1 3-4 7-5 10-1"/><circle cx="7.5" cy="12" r="1.5"/><circle cx="16.5" cy="12" r="1.5"/><path d="m10.5 16 1.5 2 1.5-2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    moon: '<path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A9 9 0 1 0 20.5 14Z"/>',
    theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/>',
    news: '<circle cx="12" cy="12" r="4" fill="#5b5bff" stroke="none"/>',
    signout: '<path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h10"/>',
  };
  const icon = name => `<svg class="owl-profile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const inactiveRow = (label, glyph) => `<button class="owl-profile-row" type="button" disabled aria-disabled="true">${icon(glyph)}<span>${label}</span></button>`;

  const menu = document.createElement('div');
  menu.id = 'owl-profile-menu';
  menu.className = 'owl-profile-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Profile menu');
  menu.setAttribute('aria-modal', 'false');
  menu.hidden = true;
  menu.innerHTML = `
    <div class="owl-profile-identity">
      <div class="owl-profile-name">Woo-Mi Jeong</div>
      <div class="owl-profile-email">woo-mi@wisdom.ai</div>
    </div>
    <div class="owl-profile-divider" role="separator"></div>
    <div class="owl-profile-section">
      ${inactiveRow('Profile preferences', 'profile')}
      ${inactiveRow('API Keys', 'key')}
      ${inactiveRow('Connections', 'connections')}
      ${inactiveRow('Chat Personality', 'chat')}
      ${inactiveRow('Subscriptions', 'subscriptions')}
      ${inactiveRow('Jobs', 'jobs')}
      ${inactiveRow('Customer Portal', 'portal')}
      <button class="owl-profile-row owl-profile-pet-toggle" type="button">${icon('owl')}<span class="owl-profile-pet-label">Hide Owl</span></button>
      <div class="owl-profile-theme-row">
        <span class="owl-profile-theme-label">${icon('theme')}<span>Theme</span></span>
        <div class="owl-profile-theme-options" role="group" aria-label="Theme">
          <button class="is-selected" type="button" aria-label="Light theme" aria-pressed="true" disabled aria-disabled="true">${icon('sun')}</button>
          <button type="button" aria-label="System theme" aria-pressed="false" disabled aria-disabled="true">${icon('system')}</button>
          <button type="button" aria-label="Dark theme" aria-pressed="false" disabled aria-disabled="true">${icon('moon')}</button>
        </div>
      </div>
    </div>
    <div class="owl-profile-divider" role="separator"></div>
    <div class="owl-profile-section owl-profile-news">
      <div class="owl-profile-section-title">WHAT’S NEW</div>
      ${inactiveRow('WisdomAI is now in Claude', 'news')}
      ${inactiveRow('Build agents from chat', 'news')}
      ${inactiveRow('Native answers in Slack', 'news')}
    </div>
    <div class="owl-profile-divider" role="separator"></div>
    <div class="owl-profile-section">${inactiveRow('Sign out', 'signout')}</div>
  `;
  document.body.append(menu);

  const toggle = menu.querySelector('.owl-profile-pet-toggle');
  const toggleLabel = menu.querySelector('.owl-profile-pet-label');
  const VIEWPORT_MARGIN = 12;
  const MENU_WIDTH = 280;
  const TRIGGER_GAP = 8;
  let petVisible = dock.dataset.visible !== 'false';

  function updateVisibility(visible) {
    petVisible = Boolean(visible);
    toggleLabel.textContent = petVisible ? 'Hide Owl' : 'Show Owl';
    toggle.setAttribute('aria-label', toggleLabel.textContent);
  }
  function positionMenu() {
    if (menu.hidden) return;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const triggerRect = trigger.getBoundingClientRect();
    const rail = trigger.closest('[data-pencil-name="Navigation rail"]');
    const railRight = rail ? rail.getBoundingClientRect().right : triggerRect.right;
    const width = Math.min(MENU_WIDTH, Math.max(1, viewportWidth - VIEWPORT_MARGIN * 2));
    menu.style.width = `${width}px`;
    menu.style.maxHeight = `${Math.max(1, viewportHeight - VIEWPORT_MARGIN * 2)}px`;
    const height = menu.offsetHeight;
    const left = Math.min(Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN), railRight + TRIGGER_GAP);
    const top = Math.min(Math.max(VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, triggerRect.top - height - TRIGGER_GAP));
    menu.style.left = `${Math.max(VIEWPORT_MARGIN, left)}px`;
    menu.style.top = `${top}px`;
  }
  function closeMenu(restoreFocus = false) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  function openMenu() {
    updateVisibility(dock.dataset.visible !== 'false');
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    positionMenu();
    toggle.focus({ preventScroll: true });
    toggle.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  trigger.addEventListener('click', () => {
    if (menu.hidden) openMenu();
    else closeMenu(true);
  });
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu();
    } else if (event.key === 'Escape' && !menu.hidden) {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    }
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const actions = [...menu.querySelectorAll('button:not(:disabled)')];
    if (!actions.length) return;
    event.preventDefault();
    const current = actions.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? actions.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + actions.length) % actions.length;
    actions[next].focus();
  });
  menu.addEventListener('focusout', event => {
    if (event.relatedTarget && event.relatedTarget !== trigger && !menu.contains(event.relatedTarget)) closeMenu();
  });
  toggle.addEventListener('click', () => {
    const visible = !petVisible;
    updateVisibility(visible);
    document.dispatchEvent(new CustomEvent('pet:visibility-request', { detail: { visible } }));
    closeMenu(true);
  });
  document.addEventListener('pet:visibilitychange', event => {
    if (event.detail && typeof event.detail.visible === 'boolean') updateVisibility(event.detail.visible);
  });
  document.addEventListener('pointerdown', event => {
    if (!menu.hidden && !menu.contains(event.target) && !trigger.contains(event.target)) closeMenu();
  }, true);
  window.addEventListener('resize', positionMenu);
  updateVisibility(petVisible);
})();
