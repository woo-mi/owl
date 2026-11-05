/* A conversation index derived from FTUX's revealed messages and connection state. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isAvailable = () => Boolean(document.querySelector('#messages .ftux-flow')) &&
    !document.body.classList.contains('workspace-page-open') &&
    !document.body.classList.contains('replies-open');
  const revealed = node => node?.isConnected && !node.closest('[hidden]');
  function getTopics() {
    const flow = document.querySelector('#messages .ftux-flow');
    if (!flow) return [];
    return [
      {id:'welcome', title:'Getting started with your Owl',
        excerpt:'Meet your Owl, a teammate that works in your tools and brings the results back here.',
        node:flow.querySelector('.ftux-introduction > .ftux-bubble')},
      {id:'context', title:'Connecting your tools',
        excerpt:'Connect Notion, Gmail, Calendar, Slack, and Gong to give your Owl context. You can also skip for now.',
        node:flow.querySelector('#ftux-context')},
      {id:'pipeline-review', title:'Weekly sales pipeline review',
        excerpt:'Prepare a Monday sales pipeline review with deal updates, risks, and next steps.',
        node:flow.querySelector('.ftux-pipeline-suggestion')},
      {id:'crm', title:'Connecting your CRM',
        excerpt:'Connect HubSpot or Salesforce to bring in your opportunities, sales stages, and regional performance.',
        node:flow.querySelector('#ftux-crm')}
    ].filter(item => revealed(item.node));
  }
  function jumpTo(id) {
    if (!isAvailable()) return;
    const target = getTopics().find(item => item.id === id)?.node;
    const scroller = document.getElementById('chat-scroll');
    if (!target || !scroller) return;
    window.FTUX.pauseAutoScroll();
    if (!target.hasAttribute('tabindex')) {
      target.tabIndex = -1;
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once:true});
    }
    target.focus({preventScroll:true});
    const offset = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTo({top:id === 'welcome' ? 0 : Math.max(0, offset - 80), behavior:motion.matches ? 'instant' : 'smooth'});
  }
  window.FTUXIndex = Object.freeze({getTopics, jumpTo, isAvailable});

  function start() {
    const main = document.querySelector('.main');
    const messages = document.getElementById('messages');
    if (!main || !messages) return;
    const linkIcon = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6.25 9.75 3.5-3.5m-4.5 1-1 1a2.475 2.475 0 0 0 3.5 3.5l1-1m-1.5-5.5 1-1a2.475 2.475 0 0 1 3.5 3.5l-1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const toggle = document.createElement('button');
    toggle.id = 'indexing-menu-toggle';
    toggle.className = 'indexing-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'indexing-menu');
    toggle.innerHTML = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="4.5" cy="5.5" r="2"/><circle cx="4.5" cy="12.5" r="2"/><path d="M9.5 5.5h6M9.5 12.5h6"/></svg>';
    const panel = document.createElement('nav');
    panel.id = 'indexing-menu';
    panel.className = 'indexing-menu';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Conversation index');
    panel.innerHTML = `
      <section class="indexing-menu-section" aria-labelledby="indexing-connections-heading">
        <h2 id="indexing-connections-heading">Connections</h2>
        <div class="indexing-menu-connection-row">
          <span class="indexing-menu-connection-status"><span class="indexing-menu-status-dot" aria-hidden="true"></span><span><span class="indexing-menu-connection-count" aria-live="polite"></span><span class="indexing-menu-connection-pending"></span></span></span>
          <button type="button" class="indexing-menu-manage" data-indexing-manage>Manage</button>
        </div>
      </section>
      <section class="indexing-menu-section" aria-labelledby="indexing-topics-heading">
        <h2 id="indexing-topics-heading">Recent</h2>
        <ul class="indexing-menu-topic-list"></ul>
        <p class="ftux-index-empty" data-empty-topics>Your conversation will appear here.</p>
      </section>
      <section class="indexing-menu-section" aria-labelledby="indexing-artifacts-heading">
        <h2 id="indexing-artifacts-heading">Artifacts</h2>
        <div data-indexing-artifacts><p class="ftux-index-empty">No artifacts yet.</p></div>
      </section>`;
    main.append(toggle, panel);
    const list = panel.querySelector('.indexing-menu-topic-list');
    let open = false;
    let frame;
    let topicKey = '';
    let artifactReady = false;
    const controls = () => [...panel.querySelectorAll('button, a[href]')];
    function setOpen(next, {restoreFocus = false, focusFirst = false} = {}) {
      const wasOpen = open;
      open = next && isAvailable();
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', `${open ? 'Close' : 'Open'} conversation index`);
      if (restoreFocus && !toggle.hidden) toggle.focus({preventScroll:true});
      if (open && focusFirst) controls()[0]?.focus({preventScroll:true});
      if (open && !wasOpen) window.dispatchEvent(new Event('indexing-menu-open'));
    }
    function sync() {
      frame = undefined;
      const state = window.FTUX.getIndexState();
      const count = state.connectedCount;
      const pending = state.connectingTools;
      panel.querySelector('.indexing-menu-connection-count').textContent = `${count} ${count === 1 ? 'tool' : 'tools'} connected`;
      panel.querySelector('.indexing-menu-status-dot').dataset.state = pending.length ? 'connecting' : count ? 'connected' : 'empty';
      panel.querySelector('.indexing-menu-connection-pending').textContent = pending.length
        ? pending.length === 1 ? `Connecting ${pending[0]}…` : `Connecting ${pending.length} tools…`
        : count === state.total ? 'All your tools are connected.'
        : count ? `${state.total - count} more ${state.total - count === 1 ? 'tool' : 'tools'} available to connect.`
        : 'Connect your tools to get started.';
      const topics = getTopics().reverse();
      const key = JSON.stringify(topics.map(({id, title}) => [id, title]));
      if (key !== topicKey) {
        const focused = document.activeElement?.dataset.indexingTopic;
        list.replaceChildren(...topics.map(({id, title}) => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'indexing-menu-topic';
          button.dataset.indexingTopic = id;
          button.textContent = title;
          li.append(button);
          return li;
        }));
        if (focused && open) controls().find(button => button.dataset.indexingTopic === focused)?.focus({preventScroll:true});
        topicKey = key;
      }
      panel.querySelector('[data-empty-topics]').hidden = topics.length > 0;
      if (Boolean(state.artifactReady) !== artifactReady) {
        artifactReady = Boolean(state.artifactReady);
        panel.querySelector('[data-indexing-artifacts]').innerHTML = artifactReady
          ? `<ul class="indexing-menu-artifact-list"><li><a class="indexing-menu-artifact" href="https://ayush.gowisdom.ai/apps/app_af105ef5a93d4b77a5e9922cd6ffa91f/view" target="_blank" rel="noopener noreferrer">${linkIcon}<span class="indexing-menu-artifact-label">Weekly Sales Pipeline Review</span><span class="indexing-menu-artifact-type">App</span></a></li></ul>`
          : '<p class="ftux-index-empty">No artifacts yet.</p>';
      }
      toggle.hidden = !isAvailable();
      setOpen(open);
      window.dispatchEvent(new Event('ftux-index-change'));
    }
    function scheduleSync() { if (!frame) frame = requestAnimationFrame(sync); }
    toggle.addEventListener('click', event => setOpen(!open, {focusFirst:event.detail === 0}));
    toggle.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      setOpen(true);
      (event.key === 'ArrowUp' ? controls().at(-1) : controls()[0])?.focus({preventScroll:true});
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-indexing-manage]')) {
        setOpen(false);
        window.FTUX.openConnections(toggle);
        return;
      }
      const topic = event.target.closest('[data-indexing-topic]');
      if (!topic) return;
      setOpen(false);
      jumpTo(topic.dataset.indexingTopic);
    });
    document.addEventListener('pointerdown', event => {
      if (open && !panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (!open || event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false, {restoreFocus:true});
    });
    document.addEventListener('focusin', event => {
      if (open && !panel.contains(event.target) && event.target !== toggle) setOpen(false);
    });
    window.addEventListener('indexing-navigator-open', () => setOpen(false));
    window.addEventListener('ftux-state-change', scheduleSync);
    window.addEventListener('indexing-ready', scheduleSync);
    new MutationObserver(scheduleSync).observe(messages, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden']});
    new MutationObserver(scheduleSync).observe(document.body, {attributes:true, attributeFilter:['class', 'data-prototype-view']});
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
