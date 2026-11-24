(() => {
  'use strict';
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-close');
  const backdrop = document.getElementById('sidebar-backdrop');
  const main = document.querySelector('[data-pencil-name="Search home content"]');
  if (!sidebar || !toggle || !backdrop || !main) return;

  const mobile = matchMedia('(max-width: 900px)');
  const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘B' : 'Ctrl+B';
  let desktopExpanded = true;
  let mobileExpanded = false;
  main.setAttribute('role', 'main');
  document.querySelectorAll('svg').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
  toggle.setAttribute('aria-controls', 'sidebar');
  toggle.setAttribute('aria-keyshortcuts', 'Meta+B Control+B');

  const search = document.getElementById('recent-search-button');
  const recentItems = [...sidebar.querySelectorAll('[data-recent]')];
  const filter = document.createElement('input');
  filter.type = 'search';
  filter.id = 'recent-filter';
  filter.className = 'recent-filter';
  filter.placeholder = 'Search recent chats';
  filter.setAttribute('aria-label', 'Search recent chats');
  filter.hidden = true;
  search.closest('h2').after(filter);
  search.setAttribute('aria-controls', filter.id);
  search.setAttribute('aria-expanded', 'false');

  const expanded = () => mobile.matches ? mobileExpanded : desktopExpanded;
  function closeSearch() {
    filter.hidden = true;
    filter.value = '';
    search.setAttribute('aria-expanded', 'false');
    recentItems.forEach(item => { item.hidden = false; });
  }

  function render() {
    const open = expanded();
    const overlay = mobile.matches && open;
    document.body.classList.toggle('pet-sidebar-collapsed', !open);
    sidebar.classList.toggle('is-compact', !open);
    sidebar.classList.toggle('is-open', overlay);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', `${open ? 'Collapse' : 'Expand'} sidebar`);
    toggle.title = `${open ? 'Collapse' : 'Expand'} sidebar (${shortcut})`;
    backdrop.hidden = !overlay;
    main.inert = overlay;
    const versions = document.getElementById('pet-version-picker');
    if (versions) versions.inert = overlay;
    if (overlay) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
    }
    if (!open) closeSearch();
    // The profile popup follows this sidebar, including its compact state.
    window.dispatchEvent(new Event('pet-sidebar-change'));
  }

  function setExpanded(open, restoreFocus = false) {
    if (mobile.matches) mobileExpanded = open;
    else desktopExpanded = open;
    render();
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => setExpanded(!expanded()));
  backdrop.addEventListener('click', () => setExpanded(false, true));
  mobile.addEventListener('change', () => {
    mobileExpanded = false;
    render();
    if (sidebar.contains(document.activeElement) && !expanded()) toggle.focus({ preventScroll: true });
  });

  search.addEventListener('click', () => {
    const wasCompact = !expanded();
    if (wasCompact) setExpanded(true);
    if (!wasCompact && !filter.hidden) {
      closeSearch();
      return;
    }
    filter.hidden = false;
    search.setAttribute('aria-expanded', 'true');
    filter.focus({ preventScroll: true });
  });
  filter.addEventListener('input', () => {
    const query = filter.value.trim().toLowerCase();
    recentItems.forEach(item => { item.hidden = !item.textContent.toLowerCase().includes(query); });
  });
  filter.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    closeSearch();
    search.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'b' &&
        !event.target.closest('input, textarea, [contenteditable="true"]')) {
      event.preventDefault();
      setExpanded(!expanded(), true);
      return;
    }
    if (!mobile.matches || !mobileExpanded) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setExpanded(false, true);
    } else if (event.key === 'Tab') {
      const popup = document.getElementById('owl-profile-menu');
      const containers = [sidebar, ...(popup && !popup.hidden ? [popup] : [])];
      const focusable = containers.flatMap(container => [...container.querySelectorAll('button:not(:disabled), a[href], input')])
        .filter(node => node.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!focusable.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });

  sidebar.querySelector('[data-nav="New"]')?.addEventListener('click', () => {
    if (mobile.matches) setExpanded(false, true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  render();
})();
