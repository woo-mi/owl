/* Conversation index from Pen frames S2Qem and qOfAL. */
(() => {
  'use strict';

  function start() {
    const main = document.querySelector('.main');
    const chat = document.getElementById('chat-scroll');
    if (!main || !chat || document.getElementById('indexing-menu-toggle')) return;

    const topics = [
      ['revenue', 'September revenue drivers'],
      ['pipeline', 'Pipeline health and app adoption'],
      ['arr', 'Sales vs. Finance ARR'],
      ['metrics', 'Monthly business metrics'],
      ['review', 'Weekly sales pipeline review'],
      ['connections', 'Connecting your tools'],
    ];
    const linkIcon = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6.25 9.75 3.5-3.5m-4.5 1-1 1a2.475 2.475 0 0 0 3.5 3.5l1-1m-1.5-5.5 1-1a2.475 2.475 0 0 1 3.5 3.5l-1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const toggle = document.createElement('button');
    toggle.id = 'indexing-menu-toggle';
    toggle.className = 'indexing-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'indexing-menu');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g transform="translate(5 6)"><path d="M8 11.5h8.5m-8.5-9.5h8.5m-12.5 0c0 1.10457-.89543 2-2 2s-2-.89543-2-2 .89543-2 2-2 2 .89543 2 2m0 9.5c0 1.10457-.89543 2-2 2s-2-.89543-2-2 .89543-2 2-2 2 .89543 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';

    const panel = document.createElement('nav');
    panel.id = 'indexing-menu';
    panel.className = 'indexing-menu';
    panel.setAttribute('aria-label', 'Conversation index');
    panel.innerHTML = `
      <section class="indexing-menu-section" aria-labelledby="indexing-connections-heading">
        <h2 id="indexing-connections-heading">Connections</h2>
        <div class="indexing-menu-connection-row">
          <span class="indexing-menu-connection-status"><span class="indexing-menu-status-dot" aria-hidden="true"></span><span><span class="indexing-menu-connection-count" aria-live="polite">2 tools connected</span><span class="indexing-menu-connection-pending">Gmail connecting…</span></span></span>
          <button type="button" class="indexing-menu-manage" data-indexing-topic="connections">Manage</button>
        </div>
      </section>
      <section class="indexing-menu-section" aria-labelledby="indexing-topics-heading">
        <h2 id="indexing-topics-heading">Recent</h2>
        <ul class="indexing-menu-topic-list">${topics.map(([id, label]) => `<li><button type="button" class="indexing-menu-topic" data-indexing-topic="${id}">${label}</button></li>`).join('')}</ul>
      </section>
      <section class="indexing-menu-section" aria-labelledby="indexing-artifacts-heading">
        <h2 id="indexing-artifacts-heading">Artifacts</h2>
        <ul class="indexing-menu-artifact-list">
          <li><a class="indexing-menu-artifact" href="https://ayush.gowisdom.ai/apps/app_af105ef5a93d4b77a5e9922cd6ffa91f/view" target="_blank" rel="noopener noreferrer">${linkIcon}<span class="indexing-menu-artifact-label">September Revenue Drivers</span><span class="indexing-menu-artifact-type">App</span></a></li>
          <li><a class="indexing-menu-artifact" href="https://ayush.gowisdom.ai/chat/33ac3dce-6d77-47cd-8e6b-1c049379ee6b" target="_blank" rel="noopener noreferrer">${linkIcon}<span class="indexing-menu-artifact-label">September 2024 Revenue Analysis</span><span class="indexing-menu-artifact-type">Chat</span></a></li>
        </ul>
      </section>`;
    main.append(toggle, panel);

    const connectedTools = new Set(['Notion', 'HubSpot']);
    const connectionCount = panel.querySelector('.indexing-menu-connection-count');
    window.addEventListener('indexing-connection-change', event => {
      const { tool, connected } = event.detail || {};
      if (typeof tool !== 'string' || connected !== true) return;
      connectedTools.add(tool);
      connectionCount.textContent = `${connectedTools.size} tools connected`;
    });

    let open = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isAvailable = () => !document.body.classList.contains('workspace-page-open') &&
      !document.body.classList.contains('replies-open') &&
      !document.body.dataset.prototypeView?.endsWith('replies');
    const controls = () => [...panel.querySelectorAll('button, a[href]')];

    function setOpen(next, { restoreFocus = false, focusFirst = false } = {}) {
      const wasOpen = open;
      open = next && isAvailable();
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', `${open ? 'Close' : 'Open'} conversation index`);
      if (restoreFocus && !toggle.hidden) toggle.focus({ preventScroll: true });
      if (open && focusFirst) controls()[0]?.focus({ preventScroll: true });
      if (open && !wasOpen) window.dispatchEvent(new Event('indexing-menu-open'));
    }

    window.addEventListener('indexing-navigator-open', () => setOpen(false));

    function syncAvailability() {
      const available = isAvailable();
      toggle.hidden = !available;
      setOpen(available && open);
    }

    function goToTopic(id) {
      const target = document.getElementById(`indexing-topic-${id}`);
      if (!target || !chat.contains(target)) return;
      setOpen(false);
      // Keep focus with the content selected by keyboard without moving the page.
      const addedTabIndex = !target.hasAttribute('tabindex');
      if (addedTabIndex) {
        target.tabIndex = -1;
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
      const chatRect = chat.getBoundingClientRect();
      const headerRect = main.querySelector('.agent-header')?.getBoundingClientRect();
      const clearance = Math.max(16, (headerRect?.bottom ?? chatRect.top + 124) - chatRect.top + 16);
      const top = chat.scrollTop + target.getBoundingClientRect().top - chatRect.top - clearance;
      chat.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }

    toggle.addEventListener('click', event => setOpen(!open, { focusFirst: event.detail === 0 }));
    toggle.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      setOpen(true);
      const items = controls();
      (event.key === 'ArrowUp' ? items.at(-1) : items[0])?.focus({ preventScroll: true });
    });
    panel.addEventListener('click', event => {
      const topic = event.target.closest('[data-indexing-topic]');
      if (topic) goToTopic(topic.dataset.indexingTopic);
      else if (event.target.closest('a')) setOpen(false, { restoreFocus: true });
    });
    document.addEventListener('pointerdown', event => {
      if (open && !panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (!open || event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false, { restoreFocus: true });
    });
    document.addEventListener('focusin', event => {
      if (open && !panel.contains(event.target) && event.target !== toggle) setOpen(false);
    });
    new MutationObserver(syncAvailability).observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-prototype-view'],
    });
    syncAvailability();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
