/* A conversation index derived from FTUX's revealed messages and connection state. */
(() => {
  'use strict';
  const usesConversationIndex = () => new URL(location.href).searchParams.get('version') === 'timeline-line-user';
  const readThreads = new Set();
  const linkIcon = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6.25 9.75 3.5-3.5m-4.5 1-1 1a2.475 2.475 0 0 0 3.5 3.5l1-1m-1.5-5.5 1-1a2.475 2.475 0 0 1 3.5 3.5l-1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isAvailable = () => Boolean(document.querySelector('#messages .ftux-flow')) &&
    !document.body.classList.contains('workspace-page-open') &&
    !document.body.classList.contains('replies-open');
  const revealed = node => node?.isConnected && !node.closest('[hidden]');
  function getTopics() {
    const flow = document.querySelector('#messages .ftux-flow');
    if (!flow) return [];
    if (flow.classList.contains('reply-timeline')) {
      return [...flow.querySelectorAll('[data-timeline-topic]')].map(node => ({
        id:node.id,
        title:node.dataset.timelineTitle,
        excerpt:node.dataset.timelineExcerpt,
        node
      })).filter(item => revealed(item.node));
    }
    return [
      {id:'goal-updates', title:'Goal updates',
        excerpt:'Q4 deal moves, Customer-growth trends and fixes, and the latest Q4 audit.',
        node:flow.querySelector('[data-reply-topic="goal-updates"], .reply-prompt-turn')},
      {id:'revenue-changes', title:'Revenue changes',
        excerpt:'What are the revenue numbers, and what is driving the changes?',
        node:flow.querySelector('#reply-revenue')},
      {id:'leadership-app', title:'App, HTML, and PPT for leadership',
        excerpt:'Turn the revenue analysis into a live app, offline HTML, and a presentation.',
        node:flow.querySelector('#reply-app-request')},
      {id:'q4-insights', title:'Key insights from Back to Q4',
        excerpt:'Key insights requested while the earlier revenue conversation is still ongoing.',
        node:flow.querySelector('#reply-insight-request')}
    ].filter(item => revealed(item.node));
  }
  function getRecentTopics() {
    if (!usesConversationIndex()) return getTopics().reverse();
    const flow = document.querySelector('#messages .ftux-flow');
    return [
      {id:'timeline-message-lxiD8', title:'Rubrik usage monitoring'},
      {id:'timeline-message-bUhpm', title:'Chat adoption and Slack access'},
      {id:'timeline-message-D6IAGc', title:'Live App growth report'}
    ].map(item => ({...item, node:flow?.querySelector(`#${item.id}`)}))
      .filter(item => revealed(item.node));
  }
  function getArtifacts() {
    if (!usesConversationIndex()) return [];
    const seen = new Set();
    return [...document.querySelectorAll('#messages .ftux-flow .timeline-card[href]')]
      .reverse().filter(revealed).filter(node => {
        if (seen.has(node.href)) return false;
        seen.add(node.href);
        return true;
      }).map(node => ({
        href:node.href,
        title:node.querySelector('.timeline-card-copy strong').textContent,
        type:node.querySelector('.timeline-card-meta').textContent.split('·')[0].trim()
      }));
  }
  function getUnreadThreads() {
    if (!usesConversationIndex()) return [];
    return [...document.querySelectorAll('#messages .ftux-flow .timeline-outgoing .timeline-footer [data-timeline-mode="unread"]')]
      .filter(trigger => revealed(trigger) && !readThreads.has(trigger.dataset.timelineThread)).map(trigger => ({
        key:trigger.dataset.timelineThread,
        title:trigger.closest('[data-timeline-message]').querySelector('.timeline-text').textContent,
        count:Number(trigger.textContent.match(/(\d+)\s*Unread/)?.[1] || 1)
      }));
  }
  function jumpTo(id) {
    if (!isAvailable()) return;
    const target = [...getTopics(), ...getRecentTopics()].find(item => item.id === id)?.node;
    const scroller = document.getElementById('chat-scroll');
    if (!target || !scroller) return;
    window.FTUX.pauseAutoScroll();
    if (!target.hasAttribute('tabindex')) {
      target.tabIndex = -1;
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once:true});
    }
    target.focus({preventScroll:true});
    const offset = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTo({top:id === 'goal-updates' ? 0 : Math.max(0, offset - 80), behavior:motion.matches ? 'instant' : 'instant'});
  }
  window.FTUXIndex = Object.freeze({getTopics, jumpTo, isAvailable});

  function start() {
    const main = document.querySelector('.main');
    const messages = document.getElementById('messages');
    if (!main || !messages) return;
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
      </section>
      <section class="indexing-menu-section indexing-menu-unread" aria-labelledby="indexing-unread-heading" hidden>
        <h2 id="indexing-unread-heading">Unread<span class="indexing-menu-unread-dot" aria-hidden="true">•</span></h2>
        <ul class="indexing-menu-unread-list"></ul>
      </section>`;
    main.append(toggle, panel);
    const list = panel.querySelector('.indexing-menu-topic-list');
    let open = false;
    let frame;
    let topicKey = '';
    let artifactKey;
    let unreadKey;
    const controls = () => [...panel.querySelectorAll('button, a[href]')];
    function setOpen(next, {restoreFocus = false, focusFirst = false} = {}) {
      const wasOpen = open;
      open = next && isAvailable();
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', `${open ? 'Close' : 'Open'} conversation index${toggle.classList.contains('has-unread') ? ', unread replies' : ''}`);
      if (restoreFocus && !toggle.hidden) toggle.focus({preventScroll:true});
      if (open && focusFirst) controls()[0]?.focus({preventScroll:true});
      if (open && !wasOpen) window.dispatchEvent(new Event('indexing-menu-open'));
    }
    function sync() {
      frame = undefined;
      const state = window.FTUX.getIndexState();
      const count = state.connectedCount;
      const pending = state.connectingTools;
      const failed = state.failedTools || [];
      panel.querySelector('.indexing-menu-connection-count').textContent = failed.length ? `${count} connected · ${failed.length} failed` : `${count} ${count === 1 ? 'tool' : 'tools'} connected`;
      panel.querySelector('.indexing-menu-status-dot').dataset.state = failed.length ? 'failed' : pending.length ? 'connecting' : count ? 'connected' : 'empty';
      panel.querySelector('.indexing-menu-connection-pending').textContent = failed.length ? `${failed.join(', ')} couldn’t connect` : pending.length
        ? pending.length === 1 ? `Connecting ${pending[0]}…` : `Connecting ${pending.length} tools…`
        : count === state.total ? 'All your tools are connected.'
        : count ? `${state.total - count} more ${state.total - count === 1 ? 'tool' : 'tools'} available to connect.`
        : 'Connect your tools to get started.';
      const topics = getRecentTopics();
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
      const artifacts = getArtifacts();
      const nextArtifactKey = JSON.stringify(artifacts);
      if (artifactKey !== nextArtifactKey) {
        const container = panel.querySelector('[data-indexing-artifacts]');
        if (artifacts.length) {
          const artifactList = document.createElement('ul');
          artifactList.className = 'indexing-menu-artifact-list';
          artifactList.replaceChildren(...artifacts.map(({href, title, type}) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'indexing-menu-artifact';
            link.href = href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.innerHTML = `${linkIcon}<span class="indexing-menu-artifact-label"></span><span class="indexing-menu-artifact-type"></span>`;
            link.querySelector('.indexing-menu-artifact-label').textContent = title;
            link.querySelector('.indexing-menu-artifact-type').textContent = type;
            li.append(link);
            return li;
          }));
          container.replaceChildren(artifactList);
        } else container.innerHTML = '<p class="ftux-index-empty">No artifacts yet.</p>';
        artifactKey = nextArtifactKey;
      }
      const unreadThreads = getUnreadThreads();
      toggle.classList.toggle('has-unread', unreadThreads.some(thread => thread.count > 0));
      const nextUnreadKey = JSON.stringify(unreadThreads);
      if (unreadKey !== nextUnreadKey) {
        const section = panel.querySelector('.indexing-menu-unread');
        section.hidden = !unreadThreads.length;
        section.querySelector('ul').replaceChildren(...unreadThreads.map(({key, title, count}) => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'indexing-menu-topic indexing-menu-unread-thread';
          button.dataset.timelineThread = key;
          button.dataset.timelineMode = 'unread';
          button.title = title;
          button.setAttribute('aria-haspopup', 'dialog');
          button.setAttribute('aria-controls', `timeline-line-user-${key}-thread`);
          button.setAttribute('aria-label', `${title} — ${count} unread ${count === 1 ? 'reply' : 'replies'}`);
          button.innerHTML = '<span class="indexing-menu-unread-title"></span><span class="indexing-menu-unread-count" aria-hidden="true"></span>';
          button.querySelector('.indexing-menu-unread-title').textContent = title;
          button.querySelector('.indexing-menu-unread-count').textContent = count;
          li.append(button);
          return li;
        }));
        unreadKey = nextUnreadKey;
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
      if (event.target.closest('a[href]')) {
        setOpen(false, {restoreFocus:true});
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
    window.addEventListener('timeline-thread-open', event => {
      setOpen(false);
      const {key, version, mode} = event.detail || {};
      if (version === 'timeline-line-user' && mode === 'unread' && key) {
        readThreads.add(key);
        scheduleSync();
      }
    });
    window.addEventListener('ftux-state-change', scheduleSync);
    window.addEventListener('indexing-ready', scheduleSync);
    new MutationObserver(scheduleSync).observe(messages, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden']});
    new MutationObserver(scheduleSync).observe(document.body, {attributes:true, attributeFilter:['class', 'data-prototype-view', 'data-reply-version']});
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
