/* FTUX pagination for topics revealed by the live onboarding conversation. */
(() => {
  'use strict';
  function start() {
    const main = document.querySelector('.main');
    const scroller = document.getElementById('chat-scroll');
    const messages = document.getElementById('messages');
    if (!main || !scroller || !messages || document.getElementById('indexing-nav-rail')) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const rail = document.createElement('nav');
    rail.id = 'indexing-nav-rail';
    rail.className = 'indexing-nav-rail';
    rail.hidden = true;
    rail.setAttribute('aria-label', 'Conversation pagination');
    const preview = document.createElement('aside');
    preview.id = 'indexing-nav-preview';
    preview.className = 'indexing-nav-preview';
    preview.setAttribute('aria-label', 'Conversation topic preview');
    preview.setAttribute('aria-hidden', 'true');
    preview.dataset.open = 'false';
    preview.inert = true;
    preview.innerHTML = '<button type="button" class="indexing-nav-jump"><span class="indexing-nav-title"></span><span class="indexing-nav-excerpt"></span></button>';
    const status = document.createElement('div');
    status.className = 'indexing-nav-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    main.append(rail, preview, status);
    const title = preview.querySelector('.indexing-nav-title');
    const excerpt = preview.querySelector('.indexing-nav-excerpt');
    const jumpButton = preview.querySelector('.indexing-nav-jump');
    let entries = [], buttons = [], selected = 0, hovered = -1, previewIndex = -1;
    let openTimer, closeTimer, scrollFrame, refreshFrame, jumpTimer, jumpingUntil = 0;
    let suppressFocus = false, escapeDismissedId = null;
    const isAvailable = () => window.FTUXIndex?.isAvailable() === true && !document.body.classList.contains('workspace-page-open') && !document.body.classList.contains('replies-open');
    const inNavigator = node => node && (rail.contains(node) || preview.contains(node));
    const cancelOpen = () => { clearTimeout(openTimer); openTimer = undefined; };
    const clearance = () => Math.max(scroller.getBoundingClientRect().top + 16, (main.querySelector('.agent-header')?.getBoundingClientRect().bottom || 114) + 16);

    function paint() {
      buttons.forEach((button, index) => {
        const distance = Math.abs(index - hovered);
        const active = hovered >= 0 ? hovered === index : selected === index;
        const width = hovered >= 0 ? ([30, 23, 16, 11, 8][distance] || 6) : active ? 18 : 6;
        button.style.setProperty('--indexing-nav-tick-width', `${width}px`);
        button.style.setProperty('--indexing-nav-tick-color', active ? '#202123' : '#d1d3d4');
        if (index === selected) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
      });
    }
    function ensureTickVisible(index) {
      const tick = buttons[index]?.getBoundingClientRect();
      if (!tick) return;
      const bounds = rail.getBoundingClientRect();
      if (tick.top < bounds.top + 8) rail.scrollTop += tick.top - bounds.top - 8;
      else if (tick.bottom > bounds.bottom - 8) rail.scrollTop += tick.bottom - bounds.bottom + 8;
    }
    function setSelected(index) {
      selected = index;
      buttons.forEach((button, i) => { button.tabIndex = i === index ? 0 : -1; });
      paint();
      if (!inNavigator(document.activeElement) && !rail.matches(':hover') && !preview.matches(':hover')) ensureTickVisible(index);
    }
    function position() {
      if (!isAvailable()) return;
      const bounds = main.getBoundingClientRect();
      const right = Math.max(0, innerWidth - bounds.right);
      const previewInset = innerWidth <= 760 ? 48 : 64;
      main.style.setProperty('--indexing-nav-rail-right', `${right + (innerWidth <= 760 ? 12 : 20)}px`);
      main.style.setProperty('--indexing-nav-preview-right', `${right + previewInset}px`);
      main.style.setProperty('--indexing-nav-preview-width', `${Math.max(0, bounds.width - previewInset - 12)}px`);
      if (previewIndex < 0 || preview.dataset.open !== 'true') return;
      const tick = buttons[previewIndex]?.getBoundingClientRect();
      const railBounds = rail.getBoundingClientRect();
      if (!tick || tick.bottom <= railBounds.top || tick.top >= railBounds.bottom) { hidePreview(); return; }
      const bottom = Math.min(innerHeight - 12, main.querySelector('.composer-dock')?.getBoundingClientRect().top - 12 || innerHeight - 64);
      const top = Math.max(12, Math.min(Math.max(12, bottom - preview.offsetHeight), tick.top + tick.height / 2 - preview.offsetHeight / 2));
      preview.style.top = `${top}px`;
    }
    function hidePreview({restoreFocus = false} = {}) {
      cancelOpen(); clearTimeout(closeTimer);
      if (restoreFocus && buttons[previewIndex >= 0 ? previewIndex : selected]) {
        suppressFocus = true;
        buttons[previewIndex >= 0 ? previewIndex : selected].focus({preventScroll:true});
        suppressFocus = false;
      }
      hovered = -1;
      preview.dataset.open = 'false';
      preview.setAttribute('aria-hidden', 'true');
      preview.inert = true;
      buttons.forEach(button => button.setAttribute('aria-expanded', 'false'));
      paint();
    }
    function showPreview(index) {
      const item = entries[index];
      if (!isAvailable() || !item || escapeDismissedId === item.id) return;
      cancelOpen(); clearTimeout(closeTimer);
      hovered = previewIndex = index;
      title.textContent = item.title;
      excerpt.textContent = item.excerpt;
      jumpButton.setAttribute('aria-label', `Jump to ${item.title} in conversation`);
      buttons.forEach((button, i) => button.setAttribute('aria-expanded', String(i === index)));
      preview.inert = false;
      preview.setAttribute('aria-hidden', 'false');
      preview.dataset.open = 'true';
      window.dispatchEvent(new Event('indexing-navigator-open'));
      position(); paint();
    }
    function jumpTo(index) {
      const item = entries[index];
      if (!item?.node.isConnected || !isAvailable()) return;
      setSelected(index);
      jumpingUntil = performance.now() + (reducedMotion.matches ? 0 : 800);
      clearTimeout(jumpTimer);
      jumpTimer = setTimeout(syncPosition, reducedMotion.matches ? 0 : 820);
      window.FTUXIndex.jumpTo(item.id);
      status.textContent = `Topic ${index + 1} of ${entries.length}: ${item.title}`;
    }
    function syncPosition() {
      if (!entries.length || !isAvailable() || performance.now() < jumpingUntil) return;
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 3) { setSelected(entries.length - 1); return; }
      let next = 0;
      entries.forEach((item, index) => { if (item.node.getBoundingClientRect().top <= clearance() + 2) next = index; });
      setSelected(next);
    }
    function queueSync() { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(syncPosition); }
    function setReady(ready) {
      rail.hidden = !ready;
      if (document.body.classList.contains('indexing-nav-ready') !== ready) {
        document.body.classList.toggle('indexing-nav-ready', ready);
      }
    }
    function updateLabels() {
      buttons.forEach((button, index) => {
        button.setAttribute('aria-label', `Topic ${index + 1} of ${entries.length}: ${entries[index].title}`);
      });
      const item = entries[previewIndex];
      if (!item || preview.dataset.open !== 'true') return;
      title.textContent = item.title;
      excerpt.textContent = item.excerpt;
      jumpButton.setAttribute('aria-label', `Jump to ${item.title} in conversation`);
    }
    function refresh() {
      const nextEntries = (window.FTUXIndex?.getTopics() || []).filter(item =>
        typeof item.id === 'string' && item.node?.isConnected && messages.contains(item.node));
      const ready = isAvailable() && nextEntries.length > 0;
      setReady(ready);
      if (!ready) { hidePreview(); return; }
      const changed = nextEntries.length !== entries.length || nextEntries.some((item, index) =>
        item.id !== entries[index]?.id || item.node !== entries[index]?.node);
      if (!changed) {
        entries = nextEntries;
        updateLabels();
        position(); syncPosition();
        return;
      }
      const selectedId = entries[selected]?.id;
      const focusedId = buttons.find(button => button === document.activeElement)?.dataset.indexingStop;
      hidePreview();
      entries = nextEntries;
      const retainedSelection = entries.findIndex(item => item.id === selectedId);
      selected = retainedSelection >= 0 ? retainedSelection : Math.min(selected, entries.length - 1);
      previewIndex = -1;
      escapeDismissedId = null;
      rail.replaceChildren();
      buttons = entries.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'indexing-nav-stop';
        button.dataset.indexingStop = item.id;
        button.setAttribute('aria-label', `Topic ${index + 1} of ${entries.length}: ${item.title}`);
        button.setAttribute('aria-controls', preview.id);
        button.setAttribute('aria-expanded', 'false');
        button.tabIndex = index === selected ? 0 : -1;
        button.innerHTML = '<span class="indexing-nav-tick" aria-hidden="true"></span>';
        button.addEventListener('pointerenter', event => {
          if (event.pointerType === 'touch' || escapeDismissedId === item.id) return;
          escapeDismissedId = null; cancelOpen(); clearTimeout(closeTimer);
          hovered = index; paint();
          openTimer = setTimeout(() => showPreview(index), 80);
        });
        button.addEventListener('focus', () => { if (!suppressFocus) { ensureTickVisible(index); showPreview(index); } });
        button.addEventListener('click', () => { escapeDismissedId = null; showPreview(index); jumpTo(index); });
        rail.append(button);
        return button;
      });
      const retainedFocus = buttons.find(button => button.dataset.indexingStop === focusedId);
      if (retainedFocus) {
        suppressFocus = true;
        retainedFocus.focus({preventScroll:true});
        suppressFocus = false;
      }
      position(); syncPosition();
    }
    function queueRefresh() { cancelAnimationFrame(refreshFrame); refreshFrame = requestAnimationFrame(refresh); }
    function scheduleClose(event) {
      if (inNavigator(event.relatedTarget)) return;
      cancelOpen(); clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        const keyboardFocus = inNavigator(document.activeElement) && document.activeElement.matches(':focus-visible');
        if (!rail.matches(':hover') && !preview.matches(':hover') && !keyboardFocus) hidePreview();
      }, 120);
    }
    function keyboard(event) {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        escapeDismissedId = entries[previewIndex >= 0 ? previewIndex : selected]?.id;
        hidePreview({restoreFocus:true}); return;
      }
      const directions = {ArrowDown:1, ArrowRight:1, ArrowUp:-1, ArrowLeft:-1};
      if (!(event.key in directions) && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault(); escapeDismissedId = null;
      const current = buttons.indexOf(document.activeElement);
      let next = current >= 0 ? current : previewIndex >= 0 ? previewIndex : selected;
      next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : Math.max(0, Math.min(entries.length - 1, next + directions[event.key]));
      buttons.forEach((button, index) => { button.tabIndex = index === next ? 0 : -1; });
      ensureTickVisible(next); buttons[next]?.focus({preventScroll:true}); showPreview(next);
    }
    rail.addEventListener('keydown', keyboard); preview.addEventListener('keydown', keyboard);
    rail.addEventListener('pointerleave', event => { escapeDismissedId = null; scheduleClose(event); });
    preview.addEventListener('pointerleave', scheduleClose);
    preview.addEventListener('pointerenter', () => { cancelOpen(); clearTimeout(closeTimer); });
    preview.addEventListener('focusin', () => clearTimeout(closeTimer));
    rail.addEventListener('focusout', scheduleClose); preview.addEventListener('focusout', scheduleClose);
    rail.addEventListener('scroll', position, {passive:true});
    rail.addEventListener('wheel', event => event.stopPropagation(), {passive:true});
    jumpButton.addEventListener('click', () => jumpTo(previewIndex));
    scroller.addEventListener('scroll', queueSync, {passive:true});
    for (const eventName of ['wheel', 'touchstart', 'pointerdown', 'keydown']) scroller.addEventListener(eventName, () => { jumpingUntil = 0; clearTimeout(jumpTimer); queueSync(); }, {passive:true});
    document.addEventListener('pointerdown', event => { if (!inNavigator(event.target)) hidePreview(); });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || (preview.dataset.open !== 'true' && openTimer === undefined)) return;
      event.preventDefault(); escapeDismissedId = entries[previewIndex >= 0 ? previewIndex : selected]?.id;
      hidePreview({restoreFocus:inNavigator(document.activeElement)});
    });
    window.addEventListener('indexing-menu-open', () => hidePreview());
    window.addEventListener('ftux-index-change', queueRefresh);
    window.addEventListener('resize', () => { position(); queueSync(); });
    main.addEventListener('transitionend', position);
    new ResizeObserver(() => { position(); queueSync(); }).observe(main);
    new ResizeObserver(position).observe(preview);
    new MutationObserver(() => {
      const available = isAvailable();
      if (!available) {
        hidePreview(); setReady(false);
      }
      else if (rail.hidden) queueRefresh();
    }).observe(document.body, {attributes:true, attributeFilter:['class', 'data-prototype-view']});
    queueRefresh(); document.fonts.ready.then(queueSync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
