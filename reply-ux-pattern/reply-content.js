/* Reply UX Pattern: the complete FTUX conversation, rendered immediately. */
(() => {
  'use strict';
  const view = window.MVPViews?.['latest-oct-28'];
  if (!view) return;
  const introduction = [
    "Hey Woomi, I'm Owl and here to help you.",
    'Let’s make your daily brief useful. Connecting your tools helps me understand what you’re working on, what’s coming up, and what needs your attention.',
    'The more context I have, the better I get. Would you like to connect your context so I can start?'
  ];
  const appURL = 'https://ayush.gowisdom.ai/apps/app_af105ef5a93d4b77a5e9922cd6ffa91f/view';
  const groupTools = {context:['Notion', 'Gmail', 'Calendar', 'Slack', 'Gong'], crm:['HubSpot', 'Salesforce']};
  const freshConnections = () => new Map(Object.values(groupTools).flat().map(tool => [tool, 'connected']));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const bubble = (text, extra = '') => `<article class="message assistant-message ftux-bubble ${extra}"><p>${escape(text)}</p></article>`;
  let connections = freshConnections();
  let boundFlow;
  let connectionsDialog;
  let connectionsOpener;
  const stage = 'complete';
  const host = () => document.querySelector('#messages .ftux-flow');
  const turns = () => host()?.querySelector('.ftux-turns');
  const active = () => Boolean(host()) && !document.body.classList.contains('replies-open');
  const notifyIndex = () => window.dispatchEvent(new Event('ftux-state-change'));
  const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  function statusHTML(tool) {
    return `<span class="ftux-tool-status is-connected" tabindex="-1" aria-label="${escape(tool)} connected">${checkIcon}Connected</span>`;
  }
  function toolRowHTML(tool) {
    return `<div class="ftux-tool-row" data-ftux-tool="${escape(tool)}"><span class="ftux-tool-name"><img src="assets/ftux-tools/${tool.toLowerCase()}.png" alt="" width="18" height="18">${escape(tool)}</span><span data-ftux-tool-control>${statusHTML(tool)}</span></div>`;
  }
  function cardHTML(group) {
    return `<section class="ftux-tools" id="ftux-${group}" data-ftux-group="${group}" aria-label="${group === 'context' ? 'Connect your context' : 'Connect your CRM'}" tabindex="-1">${groupTools[group].map(toolRowHTML).join('')}</section>`;
  }
  function userTurnHTML(value, files = [], reaction = true) {
    return `<div class="ftux-user-turn"><article class="message user-message ftux-user-bubble">${value ? `<p>${escape(value)}</p>` : ''}${files.length ? `<ul class="message-attachments">${files.map(file => `<li>${escape(file)}</li>`).join('')}</ul>` : ''}${reaction ? '<img class="ftux-reaction" src="assets/y1jENV.png" width="32" height="36.5" alt="Thumbs-up reaction">' : ''}</article><span class="ftux-read">Read 5:12 AM</span></div>`;
  }
  function initialHTML() {
    return `<div class="ftux-flow" data-pen-frame="KJKJh"><section class="ftux-introduction" aria-label="Meet your Owl">${introduction.map((copy, i) => bubble(copy, i ? 'ftux-bubble-wide' : '')).join('')}${cardHTML('context')}</section><div class="ftux-turns">${
      bubble('Thank you. I’ll do a deep dive. Back in a few minutes with some ideas for you.') +
      bubble("Now that you're set up, here are a few things I can take care of for you.") +
      bubble('I noticed you have a Sales Pipeline Review every Monday. Would you like me to build an app to help you track pipeline health and prepare for that meeting?', 'ftux-bubble-wide ftux-pipeline-suggestion') +
      userTurnHTML('Yes') +
      bubble('Connect your CRM so I can bring in your opportunities, sales stages, and regional performance.', 'ftux-bubble-wide') +
      cardHTML('crm') +
      bubble('Succeed. The agent reads the CRM data and builds the app.') + pipelineResultHTML()
    }</div><div class="ftux-local-status" role="status" aria-live="polite"></div></div>`;
  }
  view.html = initialHTML();
  view.label = 'Reply UX Pattern';

  function pipelineThumbnail() {
    return `<svg viewBox="0 0 125 123" role="img" aria-label="Pipeline dashboard preview" xmlns="http://www.w3.org/2000/svg">
      <rect width="125" height="123" fill="#fafbfe"/><g font-family="Inter,system-ui,sans-serif" fill="#333b55">
      <text x="10" y="17" font-size="8" font-weight="600">Pipeline health</text><text x="10" y="28" font-size="6" fill="#7e8698">Monday review</text>
      ${['Deals','Stages','Regions'].map((label,i)=>`<rect x="${10+i*36}" y="36" width="32" height="25" rx="3" fill="#fff" stroke="#e6e9ef"/><text x="${14+i*36}" y="45" font-size="5">${label}</text><rect x="${14+i*36}" y="50" width="18" height="4" rx="1" fill="#d9e1ef"/>`).join('')}
      <text x="10" y="75" font-size="5">Opportunity</text><text x="66" y="75" font-size="5">Stage</text><text x="95" y="75" font-size="5">Region</text>
      ${[83,95,107].map(y=>`<rect x="10" y="${y}" width="40" height="3" rx="1" fill="#c5ccd9"/><rect x="66" y="${y-1}" width="20" height="6" rx="2" fill="#e3eaf7"/><rect x="95" y="${y}" width="15" height="3" rx="1" fill="#c5ccd9"/>`).join('')}</g></svg>`;
  }
  function pipelineResultHTML() {
    const title = 'Weekly Sales Pipeline Review';
    return `<section class="ftux-pipeline-result" aria-label="${title}">
      <a class="unfurl-link" href="${appURL}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m10 13 4-4m-5 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1"/></svg>${title}</a>
      <a class="ftux-app-card" href="${appURL}" target="_blank" rel="noopener noreferrer" aria-label="Open ${title}"><div class="ftux-app-copy"><h3>${title}</h3><p>Track pipeline health, sales stages, and regional performance in one app. Get ready for your Monday Sales Pipeline Review.</p><span class="ftux-app-domain"><img src="assets/wisdom-card-logo.svg" width="16" height="16" alt="">ayush.gowisdom.ai</span></div><div class="ftux-pipeline-thumbnail">${pipelineThumbnail()}</div></a>
      </section>`;
  }
  function send(value, files = []) {
    if (!active()) return false;
    turns().insertAdjacentHTML('beforeend', userTurnHTML(value, files, false));
    document.getElementById('chat-scroll').scrollTo({top:document.getElementById('chat-scroll').scrollHeight, behavior:'instant'});
    notifyIndex();
    return true;
  }
  function reset() {
    if (!active()) return false;
    connectionsDialog?.close();
    document.getElementById('messages').innerHTML = initialHTML();
    boundFlow = undefined;
    const url = new URL(location.href);
    url.searchParams.delete('step');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    document.getElementById('chat-scroll').scrollTo({top:0, behavior:'instant'});
    boot();
    return true;
  }
  function updateConnectionsDescription() {
    const description = connectionsDialog?.querySelector('#ftux-connections-description');
    if (!description) return;
    const connected = [...connections.values()].filter(state => state === 'connected').length;
    const pending = [...connections].filter(([, state]) => state === 'connecting').map(([tool]) => tool);
    description.textContent = `${connected === connections.size ? `All ${connected} tools are connected.` : connected ? `${connected} of ${connections.size} tools are connected.` : 'No tools are connected yet.'}${pending.length ? ` Connecting ${pending.join(' and ')}…` : ''}`;
  }
  function openConnections(opener = document.activeElement) {
    if (!connectionsDialog) {
      connectionsDialog = document.createElement('dialog');
      connectionsDialog.className = 'indexing-preview ftux-connections-dialog';
      connectionsDialog.setAttribute('aria-labelledby', 'ftux-connections-title');
      connectionsDialog.setAttribute('aria-describedby', 'ftux-connections-description');
      connectionsDialog.innerHTML = '<header><h2 id="ftux-connections-title">Connections</h2><button type="button" aria-label="Close connections">×</button></header><div class="indexing-preview-content"></div>';
      document.body.append(connectionsDialog);
      connectionsDialog.querySelector('header button').addEventListener('click', () => connectionsDialog.close());
      connectionsDialog.addEventListener('click', event => {
        if (event.target !== connectionsDialog) return;
        const bounds = connectionsDialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) connectionsDialog.close();
      });
      connectionsDialog.addEventListener('close', () => connectionsOpener?.focus({preventScroll:true}));
    }
    connectionsOpener = opener;
    connectionsDialog.querySelector('.indexing-preview-content').innerHTML = `<p id="ftux-connections-description" class="ftux-connections-description" aria-live="polite"></p><section class="ftux-tools" aria-label="Your connections">${Object.values(groupTools).flat().map(toolRowHTML).join('')}</section><footer class="ftux-connections-footer"><a href="https://canary.gowisdom.ai/settings/my-connections" target="_blank" rel="noopener noreferrer" aria-label="Manage data connections (opens in a new tab)">Manage data connections<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.5 3.5h5v5m0-5-8 8M8.5 4.5h-4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4"/></svg></a></footer>`;
    updateConnectionsDescription();
    connectionsDialog.showModal();
  }

  function boot() {
    const flow = host();
    if (!flow || flow === boundFlow) return;
    boundFlow = flow;
    document.body.dataset.ftuxStage = stage;
    notifyIndex();
  }
  const getIndexState = () => ({
    stage, selectedPrompt:'Yes', total:connections.size,
    connectedCount:[...connections.values()].filter(state => state === 'connected').length,
    connectingTools:[...connections].filter(([, state]) => state === 'connecting').map(([tool]) => tool),
    artifactReady:Boolean(host()?.querySelector('.ftux-pipeline-result:not([hidden])'))
  });
  window.FTUX = Object.freeze({send, reset, openConnections, getIndexState,
    pauseAutoScroll:() => {}});
  window.addEventListener('indexing-ready', boot);
  function start() { boot(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
