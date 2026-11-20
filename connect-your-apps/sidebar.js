(() => {
  'use strict';

  function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || sidebar.dataset.initialized === 'true') return;
    sidebar.dataset.initialized = 'true';

    const toggle = document.getElementById('sidebar-close');
    const backdrop = document.getElementById('sidebar-backdrop');
    const main = document.getElementById('main');
    const searchButton = document.getElementById('recent-search-button');
    const mobile = window.matchMedia('(max-width: 900px)');
    let desktopCollapsed = true;
    let mobileOpen = false;
    let returnFocus = null;

    function render() {
      const expanded = mobile.matches ? mobileOpen : !desktopCollapsed;
      document.body.classList.toggle('sidebar-collapsed', !expanded || mobile.matches);
      document.body.classList.toggle('sidebar-expanded', expanded && !mobile.matches);
      document.body.classList.toggle('sidebar-open', mobile.matches && mobileOpen);
      sidebar.classList.toggle('is-compact', !expanded);
      sidebar.classList.toggle('is-collapsed', !expanded);
      sidebar.classList.toggle('is-open', mobile.matches && mobileOpen);
      toggle?.setAttribute('aria-expanded', String(expanded));
      toggle?.setAttribute('aria-controls', 'sidebar');
      toggle?.setAttribute('aria-label', expanded ? 'Collapse sidebar' : 'Expand sidebar');
      if (toggle) toggle.title = expanded ? 'Collapse sidebar' : 'Expand sidebar';
      if (backdrop) backdrop.hidden = !(mobile.matches && mobileOpen);
      if (main) main.inert = mobile.matches && mobileOpen;
      if (mobile.matches && mobileOpen) {
        sidebar.setAttribute('role', 'dialog');
        sidebar.setAttribute('aria-modal', 'true');
      } else {
        sidebar.removeAttribute('role');
        sidebar.removeAttribute('aria-modal');
      }
    }

    function setExpanded(expanded, restoreFocus = false) {
      if (mobile.matches) {
        if (expanded && !mobileOpen) returnFocus = document.activeElement;
        mobileOpen = expanded;
      } else {
        desktopCollapsed = !expanded;
      }
      render();
      if (mobile.matches && expanded && !sidebar.contains(document.activeElement)) toggle?.focus();
      if (restoreFocus) {
        const target = returnFocus?.isConnected ? returnFocus : toggle;
        target?.focus();
      }
    }

    function isExpanded() {
      return mobile.matches ? mobileOpen : !desktopCollapsed;
    }

    function closeOverlay() {
      if (mobile.matches) setExpanded(false);
    }

    function focusMainHeading() {
      const heading = main?.querySelector('h1, [data-main-heading], h2') || main;
      if (!heading) return;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll:true });
    }

    function notifyNavigation(name, extra = {}) {
      document.dispatchEvent(new CustomEvent('prototype:nav', {
        bubbles:true,
        detail:{ name, ...extra }
      }));
    }

    toggle?.addEventListener('click', () => setExpanded(!isExpanded()));
    backdrop?.addEventListener('click', () => setExpanded(false, true));
    sidebar.querySelectorAll('[data-nav]').forEach(button => {
      button.addEventListener('click', () => {
        const name = button.dataset.nav;
        closeOverlay();
        if (name === 'Connections') {
          focusMainHeading();
          notifyNavigation(name);
        }
        else {
          if (mobile.matches) toggle?.focus();
          notifyNavigation(name);
        }
      });
    });
    sidebar.querySelectorAll('[data-recent]').forEach(button => {
      button.addEventListener('click', () => {
        closeOverlay();
        if (mobile.matches) toggle?.focus();
        notifyNavigation('Chat', { recent:button.dataset.recent });
      });
    });

    if (searchButton) {
      const filter = document.createElement('input');
      filter.type = 'search';
      filter.className = 'recent-filter';
      filter.id = 'recent-filter';
      filter.placeholder = 'Search recent chats';
      filter.setAttribute('aria-label', 'Search recent chats');
      filter.hidden = true;
      searchButton.closest('h2')?.after(filter);
      searchButton.setAttribute('aria-controls', 'recent-filter');
      searchButton.setAttribute('aria-expanded', 'false');
      const filterRecents = () => {
        const query = filter.value.trim().toLowerCase();
        sidebar.querySelectorAll('[data-recent]').forEach(item => {
          item.hidden = !item.textContent.toLowerCase().includes(query);
        });
      };
      searchButton.addEventListener('click', () => {
        const compact = !isExpanded();
        if (compact) setExpanded(true);
        filter.hidden = compact ? false : !filter.hidden;
        searchButton.setAttribute('aria-expanded', String(!filter.hidden));
        if (!filter.hidden) filter.focus();
        else {
          filter.value = '';
          filterRecents();
        }
      });
      filter.addEventListener('input', filterRecents);
      filter.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        searchButton.click();
        searchButton.focus();
      });
    }

    document.addEventListener('keydown', event => {
      if (!mobile.matches || !mobileOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false, true);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...sidebar.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]')]
        .filter(node => !node.hidden && node.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    });

    mobile.addEventListener('change', () => {
      const wasOpen = mobileOpen;
      const hadSidebarFocus = sidebar.contains(document.activeElement);
      mobileOpen = false;
      render();
      if (wasOpen || (mobile.matches && hadSidebarFocus)) toggle?.focus();
    });
    window.OwlSidebar = {
      expand:() => setExpanded(true),
      collapse:() => setExpanded(false, mobile.matches),
      toggle:() => setExpanded(!isExpanded())
    };
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSidebar, { once:true });
  else initializeSidebar();
})();
