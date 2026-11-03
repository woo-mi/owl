/* Topic pagination adapted from the older Owl tick navigator. */
(() => {
  'use strict';
  function start() {
    const main = document.querySelector('.main');
    const scroller = document.getElementById('chat-scroll');
    const messages = document.getElementById('messages');
    if (!main || !scroller || !messages || document.getElementById('indexing-nav-rail')) return;
    const definitions = [
      {id:'review', title:'Weekly sales pipeline review', excerpt:'Review three updates ahead of Monday’s Sales Pipeline Review: a closed-won deal, a slipped deal, and a blocked security review.'},
      {id:'metrics', title:'Monthly business metrics', excerpt:'Net revenue is $4.82M, orders are 38,410, average order value is $125.50, and the return rate is 2.1%.'},
      {id:'arr', title:'Sales vs. Finance ARR', excerpt:'Sales shows $3.1M and Finance $2.4M. Create one governed Net New ARR metric using Finance’s definition.'},
      {id:'pipeline', title:'Pipeline health and app adoption', excerpt:'Pipeline health: $23.36M open across 205 deals. Review sales stages and app adoption.'},
      {id:'revenue', title:'September revenue drivers', excerpt:'September closed-won revenue was $10.11M, down $9.24M (47.8%) from August. Review the regional, account, and product drivers.'},
      {id:'artifact-chat', title:'September 2024 Revenue Analysis', kind:'Chat', href:'https://ayush.gowisdom.ai/chat/33ac3dce-6d77-47cd-8e6b-1c049379ee6b', excerpt:'Open the conversation behind the September revenue analysis.'},
      {id:'artifact-app', title:'September Revenue Drivers', kind:'App', href:'https://ayush.gowisdom.ai/apps/app_af105ef5a93d4b77a5e9922cd6ffa91f/view', excerpt:'Explore the revenue trend, customer changes, and product bundle drivers.'},
    ];
    const storageKey = 'owl-ftux-bookmarks-v1';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const rail = document.createElement('nav');
    rail.id = 'indexing-nav-rail';
    rail.className = 'indexing-nav-rail';
    rail.setAttribute('aria-label', 'Conversation pagination');
    const preview = document.createElement('aside');
    preview.id = 'indexing-nav-preview';
    preview.className = 'indexing-nav-preview';
    preview.setAttribute('aria-label', 'Conversation topic preview');
    preview.setAttribute('aria-hidden', 'true');
    preview.dataset.open = 'false';
    preview.inert = true;
    preview.innerHTML = '<button type="button" class="indexing-nav-jump"><span class="indexing-nav-title"></span><span class="indexing-nav-excerpt"></span></button><button type="button" class="indexing-nav-bookmark" aria-label="Bookmark topic" aria-pressed="false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button><div class="indexing-nav-artifact-footer" hidden><a class="indexing-nav-external" target="_blank" rel="noopener noreferrer"></a></div>';
    const status = document.createElement('div');
    status.className = 'indexing-nav-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    main.append(rail, preview, status);
    const title = preview.querySelector('.indexing-nav-title');
    const excerpt = preview.querySelector('.indexing-nav-excerpt');
    const jumpButton = preview.querySelector('.indexing-nav-jump');
    const bookmark = preview.querySelector('.indexing-nav-bookmark');
    const artifactFooter = preview.querySelector('.indexing-nav-artifact-footer');
    const externalLink = preview.querySelector('.indexing-nav-external');
    let bookmarks = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) bookmarks = new Set(saved.filter(id => definitions.some(item => item.id === id)));
    } catch (_) {}
    let entries = [], buttons = [], selected = 0, hovered = -1, previewIndex = -1;
    let openTimer, closeTimer, scrollFrame, refreshFrame, jumpTimer, jumpingUntil = 0;
    let suppressFocus = false, escapeDismissedId = null;
    const isAvailable = () => !document.body.classList.contains('workspace-page-open') && !document.body.classList.contains('replies-open');
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
      bookmark.setAttribute('aria-pressed', String(bookmarks.has(item.id)));
      bookmark.setAttribute('aria-label', `${bookmarks.has(item.id) ? 'Remove bookmark for' : 'Bookmark'} ${item.title}`);
      artifactFooter.hidden = !item.kind;
      if (item.kind) {
        externalLink.textContent = `Open ${item.kind.toLowerCase()} ↗`;
        externalLink.href = item.href;
        externalLink.setAttribute('aria-label', `Open ${item.title} ${item.kind.toLowerCase()} in a new tab`);
      } else externalLink.removeAttribute('href');
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
      const targetOffset = scroller.scrollTop + item.node.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      // Account for the header state at the destination, after scrolling has collapsed or expanded it.
      const top = targetOffset <= 130 ? 0 : targetOffset - 80;
      scroller.scrollTo({top:Math.max(0, top), behavior:reducedMotion.matches ? 'instant' : 'smooth'});
      status.textContent = `${item.kind || 'Topic'} ${index + 1} of ${entries.length}: ${item.title}`;
    }
    function syncPosition() {
      if (!entries.length || !isAvailable() || performance.now() < jumpingUntil) return;
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 3) { setSelected(entries.length - 1); return; }
      let next = 0;
      entries.forEach((item, index) => { if (item.node.getBoundingClientRect().top <= clearance() + 2) next = index; });
      setSelected(next);
    }
    function queueSync() { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(syncPosition); }
    function refresh() {
      hidePreview();
      rail.hidden = !isAvailable();
      document.body.classList.toggle('indexing-nav-ready', isAvailable());
      if (!isAvailable()) return;
      const blocks = [...messages.querySelectorAll('.unfurl-block')];
      entries = definitions.map(item => {
        const node = item.kind ? blocks.find(block => block.querySelector('.unfurl-card-title')?.textContent.trim() === item.title) : document.getElementById(`indexing-topic-${item.id}`);
        if (!node || !messages.contains(node)) return null;
        const copy = item.kind ? node.querySelector('.unfurl-card-description')?.textContent.replace(/\s+/g, ' ').trim() : '';
        return {...item, node, excerpt:copy || item.excerpt};
      }).filter(Boolean).sort((a, b) => a.node === b.node ? 0 : a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      selected = Math.min(selected, Math.max(0, entries.length - 1));
      previewIndex = -1;
      escapeDismissedId = null;
      rail.replaceChildren();
      buttons = entries.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'indexing-nav-stop';
        button.dataset.indexingStop = item.id;
        button.setAttribute('aria-label', `${item.kind || 'Topic'} ${index + 1} of ${entries.length}: ${item.title}`);
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
    bookmark.addEventListener('click', () => {
      const item = entries[previewIndex]; if (!item) return;
      bookmarks.has(item.id) ? bookmarks.delete(item.id) : bookmarks.add(item.id);
      try { localStorage.setItem(storageKey, JSON.stringify([...bookmarks])); } catch (_) {}
      bookmark.setAttribute('aria-pressed', String(bookmarks.has(item.id)));
      bookmark.setAttribute('aria-label', `${bookmarks.has(item.id) ? 'Remove bookmark for' : 'Bookmark'} ${item.title}`);
      status.textContent = bookmarks.has(item.id) ? `${item.title} bookmarked.` : `Bookmark removed for ${item.title}.`;
    });
    scroller.addEventListener('scroll', queueSync, {passive:true});
    for (const eventName of ['wheel', 'touchstart', 'pointerdown', 'keydown']) scroller.addEventListener(eventName, () => { jumpingUntil = 0; clearTimeout(jumpTimer); queueSync(); }, {passive:true});
    document.addEventListener('pointerdown', event => { if (!inNavigator(event.target)) hidePreview(); });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || (preview.dataset.open !== 'true' && openTimer === undefined)) return;
      event.preventDefault(); escapeDismissedId = entries[previewIndex >= 0 ? previewIndex : selected]?.id;
      hidePreview({restoreFocus:inNavigator(document.activeElement)});
    });
    window.addEventListener('indexing-menu-open', () => hidePreview());
    window.addEventListener('indexing-ready', queueRefresh);
    window.addEventListener('resize', () => { position(); queueSync(); });
    main.addEventListener('transitionend', position);
    new ResizeObserver(() => { position(); queueSync(); }).observe(main);
    new ResizeObserver(position).observe(preview);
    new MutationObserver(() => {
      const available = isAvailable();
      if (!available) {
        hidePreview(); rail.hidden = true;
        if (document.body.classList.contains('indexing-nav-ready')) document.body.classList.remove('indexing-nav-ready');
      }
      else if (rail.hidden) queueRefresh();
    }).observe(document.body, {attributes:true, attributeFilter:['class', 'data-prototype-view']});
    queueRefresh(); document.fonts.ready.then(queueSync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
