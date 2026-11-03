/* First-use conversation from Pen frames AQxSV (FTUX) and KJKJh (FTUX 2). */
(() => {
  'use strict';
  const view = window.MVPViews?.['latest-oct-28'];
  if (!view) return;
  const prompts = [
    'Which enterprise deals should I follow up on this week?',
    'Why did our September revenue drop from August?',
    'Build a deal-risk dashboard for my leadership review.',
    'Send me a pipeline brief every Monday morning.'
  ];
  const introduction = [
    'Hi Woo-Mi! I’m your Owl, a teammate that works in your tools.',
    'I do the work and bring the results back here, so you don’t have to copy and paste my responses.',
    'Where would you like to start? Pick a question below, or tell me what’s on your mind.'
  ];
  const groupTools = {context:['Notion', 'Gmail', 'Calendar', 'Slack', 'Gong'], crm:['HubSpot', 'Salesforce']};
  const freshConnections = () => new Map(Object.values(groupTools).flat().map(tool => [tool, 'available']));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const bubble = (text, extra = '') => `<article class="message assistant-message ftux-bubble ${extra}"><p>${escape(text)}</p></article>`;
  const initialHTML = `<div class="ftux-flow" data-pen-frame="AQxSV"><section class="ftux-introduction" aria-label="Meet your Owl">${introduction.map((copy, i) => bubble(copy, i === 1 ? 'ftux-bubble-wide' : '')).join('')}</section><div class="ftux-turns"></div><div class="ftux-prompts" aria-label="Suggested prompts">${prompts.map((copy, i) => `<button class="ftux-prompt" type="button" data-ftux-prompt="${i}">${escape(copy)}</button>`).join('')}</div><div class="ftux-local-status" role="status" aria-live="polite"></div></div>`;
  view.html = initialHTML;
  view.label = 'FTUX';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connectionTimers = new Map();
  let connections = freshConnections();
  let skipped = new Set();
  let selectedPrompt = '';
  let selectedFiles = [];
  let boundFlow;
  let completionShown = false;
  let stage = 'welcome';
  let setupSnapshot;
  let connectionsDialog;
  let connectionsOpener;
  let playback;
  const host = () => document.querySelector('#messages .ftux-flow');
  const turns = () => host()?.querySelector('.ftux-turns');
  const active = () => Boolean(host()) && !document.body.classList.contains('replies-open');
  const announce = text => { const node = host()?.querySelector('.ftux-local-status'); if (node) node.textContent = text; };
  const setStage = next => { stage = next; document.body.dataset.ftuxStage = next; };
  const stopTimers = () => { connectionTimers.forEach(clearTimeout); connectionTimers.clear(); };
  const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  function statusHTML(tool) {
    const state = connections.get(tool);
    if (state === 'connected') return `<span class="ftux-tool-status is-connected" tabindex="-1" aria-label="${escape(tool)} connected">${checkIcon}Connected</span>`;
    if (state === 'connecting') return `<span class="ftux-tool-status is-connecting" tabindex="-1" aria-label="Connecting ${escape(tool)}"><span class="ftux-spinner" aria-hidden="true"></span>Connecting...</span>`;
    return `<button type="button" class="ftux-connect" data-ftux-connect="${escape(tool)}" aria-label="Connect ${escape(tool)}">Connect</button>`;
  }
  function cardHTML(group, manage = false) {
    const footer = manage ? '' : `<footer class="ftux-skip-row"><button type="button" class="ftux-skip" data-ftux-skip="${group}"${skipped.has(group) ? ' disabled' : ''}>${skipped.has(group) ? 'Skipped for now' : 'Skip for now'}</button></footer>`;
    return `<section class="ftux-tools" id="ftux-${manage ? 'manage-' : ''}${group}" data-ftux-group="${group}" aria-label="${group === 'context' ? 'Connect your context' : 'Connect your CRM'}" tabindex="-1">${groupTools[group].map(tool => `<div class="ftux-tool-row" data-ftux-tool="${escape(tool)}"><span class="ftux-tool-name"><img src="assets/ftux-tools/${tool.toLowerCase()}.png" alt="" width="18" height="18">${escape(tool)}</span><span data-ftux-tool-control>${statusHTML(tool)}</span></div>`).join('')}${footer}</section>`;
  }
  function userTurnHTML(value, files = [], reaction = true) {
    return `<div class="ftux-user-turn"><article class="message user-message ftux-user-bubble">${value ? `<p>${escape(value)}</p>` : ''}${files.length ? `<ul class="message-attachments">${files.map(file => `<li>${escape(file)}</li>`).join('')}</ul>` : ''}${reaction ? '<img class="ftux-reaction" src="assets/y1jENV.png" width="32" height="36.5" alt="Thumbs-up reaction">' : ''}</article><span class="ftux-read">Read 5:12 AM</span></div>`;
  }
  function scrollToNode(node, {alignTop = false, shouldFollow = () => true} = {}) {
    if (!node || !active()) return;
    requestAnimationFrame(() => {
      if (!node.isConnected || !shouldFollow() || document.body.classList.contains('workspace-page-open')) return;
      const scroller = document.getElementById('chat-scroll');
      const rect = node.getBoundingClientRect();
      const composerTop = document.querySelector('.composer-dock')?.getBoundingClientRect().top || innerHeight - 90;
      if (!alignTop && rect.bottom <= composerTop - 16 && rect.top >= 80) return;
      const top = alignTop || rect.height > composerTop - 96
        ? scroller.scrollTop + rect.top - 80
        : scroller.scrollTop + rect.bottom - composerTop + 20;
      scroller.scrollTo({top:Math.max(0, top), behavior:motion.matches ? 'instant' : 'smooth'});
    });
  }
  function play(nodes, options) {
    playback ||= window.FTUXPlayback.create({
      messages:document.getElementById('messages'), scroll:document.getElementById('chat-scroll'),
      motion, scrollToNode, onReveal(node) {
        if (!node.matches('.ftux-tools')) return;
        node.querySelectorAll('[data-ftux-tool]').forEach(row => {
          const tool = row.dataset.ftuxTool;
          if (connections.get(tool) === 'connecting') startConnection(tool);
        });
      }
    });
    playback.play(nodes, options);
  }
  function playWelcome() {
    play([...host().querySelectorAll('.ftux-introduction > .ftux-bubble'), host().querySelector('.ftux-prompts')]);
  }
  function updateTool(tool) {
    document.querySelectorAll(`.ftux-flow [data-ftux-tool="${tool}"] [data-ftux-tool-control], .ftux-connections-dialog [data-ftux-tool="${tool}"] [data-ftux-tool-control]`).forEach(row => {
      const hadFocus = row.contains(document.activeElement);
      row.innerHTML = statusHTML(tool);
      if (hadFocus) row.firstElementChild?.focus({preventScroll:true});
    });
  }
  function startConnection(tool) {
    if (!connections.has(tool) || connections.get(tool) === 'connected' || connectionTimers.has(tool)) return;
    connections.set(tool, 'connecting');
    updateTool(tool);
    announce(`Connecting ${tool}.`);
    connectionTimers.set(tool, setTimeout(() => {
      connectionTimers.delete(tool);
      connections.set(tool, 'connected');
      updateTool(tool);
      announce(`${tool} connected.`);
      checkCompletion();
    }, motion.matches ? 250 : 1600));
  }
  function groupDone(group) { return skipped.has(group) || groupTools[group].every(tool => connections.get(tool) === 'connected'); }
  function checkCompletion() {
    if (!active() || stage === 'welcome' || completionShown || !groupDone('context') || !groupDone('crm')) return;
    completionShown = true;
    setStage('ready');
    const copy = [...connections.values()].includes('connected')
      ? 'You’re all set. Your connected tools are ready, and you can add more context whenever you need it.'
      : 'You can connect your tools whenever you’re ready. For now, tell me what you’d like help with.';
    turns().insertAdjacentHTML('beforeend', bubble(copy, 'ftux-bubble-wide ftux-confirmation'));
    announce('Setup complete.');
    play([turns().lastElementChild], {firstDelay:2000, resetFollow:false, scrollOnReducedMotion:true, enqueue:true});
  }
  function renderSetup(value, files = [], {pushHistory = false} = {}) {
    const flow = host();
    if (!flow) return false;
    playback?.finish();
    selectedPrompt = value;
    selectedFiles = [...files];
    flow.dataset.penFrame = 'KJKJh';
    flow.querySelector('.ftux-prompts').hidden = true;
    setStage('setup');
    completionShown = false;
    turns().innerHTML = userTurnHTML(value, files) +
      bubble(introduction[1], 'ftux-bubble-wide') +
      bubble('Let’s make your daily brief useful. Connecting your tools helps me understand what you’re working on, what’s coming up, and what needs your attention.', 'ftux-bubble-wide') +
      bubble('The more context I have, the better I get. Would you like to connect your context so I can start?', 'ftux-bubble-wide') +
      cardHTML('context') +
      bubble('Connect your CRM so I can bring in your opportunities, sales stages, and regional performance.', 'ftux-bubble-crm') +
      cardHTML('crm');
    if (pushHistory) {
      setupSnapshot = undefined;
      const url = new URL(location.href);
      url.searchParams.set('step', '2');
      history.pushState({...history.state, ftuxStep:2}, '', url.pathname + url.search + url.hash);
    }
    play(turns().children, {immediateFirst:true});
    checkCompletion();
    return true;
  }
  function renderWelcome({preserveSetup = false} = {}) {
    const messages = document.getElementById('messages');
    if (!messages) return;
    if (preserveSetup && stage !== 'welcome') {
      playback?.finish();
      setupSnapshot = {node:host(), stage, completionShown, scrollTop:document.getElementById('chat-scroll').scrollTop};
    }
    playback?.cancel();
    stopTimers();
    messages.innerHTML = initialHTML;
    boundFlow = host();
    setStage('welcome');
    document.getElementById('chat-scroll').scrollTo({top:0, behavior:'instant'});
    if (!preserveSetup) playWelcome();
  }
  function restoreSetup() {
    playback?.cancel();
    if (!setupSnapshot?.node) { renderSetup(selectedPrompt || prompts[0], selectedFiles); return; }
    document.getElementById('messages').replaceChildren(setupSnapshot.node);
    boundFlow = host();
    setStage(setupSnapshot.stage);
    completionShown = setupSnapshot.completionShown;
    for (const [tool, state] of connections) {
      updateTool(tool);
      if (state === 'connecting') startConnection(tool);
    }
    document.getElementById('chat-scroll').scrollTo({top:setupSnapshot.scrollTop, behavior:'instant'});
    checkCompletion();
  }
  function send(value, files = []) {
    if (!active()) return false;
    if (stage === 'welcome') {
      renderSetup(value, files, {pushHistory:true});
      scrollToNode(turns().firstElementChild);
    } else {
      playback?.finish();
      turns().insertAdjacentHTML('beforeend', userTurnHTML(value, files, false));
      const userTurn = turns().lastElementChild;
      const copy = stage === 'setup'
        ? 'Connect the tools you’d like me to use, or choose “Skip for now” to continue with the context you already have.'
        : 'I’m ready to help with your deals, revenue, dashboards, and pipeline updates. Your request is now part of this conversation.';
      turns().insertAdjacentHTML('beforeend', bubble(copy, 'ftux-bubble-wide'));
      play([userTurn, turns().lastElementChild], {immediateFirst:true, reply:true, scrollOnReducedMotion:true});
    }
    return true;
  }
  function reset() {
    if (!active()) return false;
    connections = freshConnections();
    skipped = new Set();
    selectedPrompt = '';
    selectedFiles = [];
    completionShown = false;
    setupSnapshot = undefined;
    const url = new URL(location.href);
    url.searchParams.delete('step');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    renderWelcome();
    return true;
  }
  function openConnections() {
    playback?.finish();
    if (!connectionsDialog) {
      connectionsDialog = document.createElement('dialog');
      connectionsDialog.className = 'indexing-preview ftux-connections-dialog';
      connectionsDialog.setAttribute('aria-labelledby', 'ftux-connections-title');
      connectionsDialog.innerHTML = '<header><h2 id="ftux-connections-title">Connections</h2><button type="button" aria-label="Close connections">×</button></header><div class="indexing-preview-content"></div>';
      document.body.append(connectionsDialog);
      connectionsDialog.addEventListener('click', onClick);
      connectionsDialog.querySelector('header button').addEventListener('click', () => connectionsDialog.close());
      connectionsDialog.addEventListener('close', () => connectionsOpener?.focus({preventScroll:true}));
    }
    connectionsOpener = document.activeElement;
    connectionsDialog.querySelector('.indexing-preview-content').innerHTML = cardHTML('context', true) + cardHTML('crm', true);
    connectionsDialog.showModal();
    for (const [tool, state] of connections) if (state === 'connecting') startConnection(tool);
  }
  function onClick(event) {
    const prompt = event.target.closest('[data-ftux-prompt]');
    if (prompt && stage === 'welcome') {
      const input = document.getElementById('message-input');
      input.value = prompts[Number(prompt.dataset.ftuxPrompt)];
      input.dispatchEvent(new Event('input', {bubbles:true}));
      document.getElementById('message-form').requestSubmit();
      return;
    }
    const connect = event.target.closest('[data-ftux-connect]');
    if (connect) { startConnection(connect.dataset.ftuxConnect); return; }
    const skip = event.target.closest('[data-ftux-skip]');
    if (!skip) return;
    playback?.finish();
    const group = skip.dataset.ftuxSkip;
    skipped.add(group);
    skip.textContent = 'Skipped for now';
    skip.disabled = true;
    announce(`${group === 'context' ? 'Additional context tools' : 'Additional CRM connections'} skipped for now.`);
    if (group === 'context') {
      const next = host().querySelector('#ftux-crm');
      next.focus({preventScroll:true});
      scrollToNode(next, {alignTop:true});
    } else document.getElementById('message-input')?.focus({preventScroll:true});
    checkCompletion();
  }
  function boot() {
    const flow = host();
    if (!flow || flow === boundFlow) return;
    boundFlow = flow;
    if (new URL(location.href).searchParams.get('step') === '2') renderSetup(selectedPrompt || prompts[0], selectedFiles);
    else { setStage('welcome'); playWelcome(); }
  }
  window.FTUX = Object.freeze({send, reset, openConnections});
  window.addEventListener('indexing-ready', boot);
  window.addEventListener('popstate', () => {
    if (!active()) return;
    if (new URL(location.href).searchParams.get('step') === '2') restoreSetup();
    else renderWelcome({preserveSetup:true});
  });
  function start() {
    document.getElementById('messages')?.addEventListener('click', onClick);
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
