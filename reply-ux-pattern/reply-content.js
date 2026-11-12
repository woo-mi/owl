/* Reply UX Pattern: conversations copied from the corresponding Pen frames. */
(() => {
  'use strict';
  // Consolidate removed versions into the current color-code design.
  function normalizeVersionURL() {
    const url = new URL(location.href);
    if (!/^v[4-9]$/.test(url.searchParams.get('version') || '')) return;
    url.searchParams.set('version', 'color-code');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
  normalizeVersionURL();
  window.addEventListener('popstate', normalizeVersionURL);
  const view = window.MVPViews?.['latest-oct-28'];
  if (!view) return;
  const groupTools = {context:['Notion', 'Gmail', 'Calendar', 'Slack', 'Gong'], crm:['HubSpot', 'Salesforce']};
  const freshConnections = () => new Map(Object.values(groupTools).flat().map(tool => [tool, 'connected']));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const paragraph = text => `<p>${escape(text)}</p>`;
  const row = (glyph, text) => `<li class="reply-insight"><span class="reply-glyph" aria-hidden="true">${glyph}</span><span>${escape(text)}</span></li>`;
  const list = rows => `<ul class="reply-insights">${rows.map(([glyph, text]) => row(glyph, text)).join('')}</ul>`;
  const bubble = (body, title = '', id = '') => `<article${id ? ` id="${id}"` : ''} class="message assistant-message ftux-bubble reply-bubble">${title ? `<h2>${escape(title)}</h2>` : ''}${body}</article>`;
  const separator = '<div class="reply-group-separator" aria-hidden="true"></div>';
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
  function userTurnHTML(value, files = [], reaction = true, reactionSource = 'assets/y1jENV.png', reactionAlt = 'Thumbs-up reaction') {
    return `<div class="ftux-user-turn"><article class="message user-message ftux-user-bubble">${value ? `<p>${escape(value)}</p>` : ''}${files.length ? `<ul class="message-attachments">${files.map(file => `<li>${escape(file)}</li>`).join('')}</ul>` : ''}${reaction ? `<img class="ftux-reaction" src="${reactionSource}" width="32" height="36.5" alt="${escape(reactionAlt)}">` : ''}</article><span class="ftux-read">Read 5:12 AM</span></div>`;
  }
  function secondTopicHTML() {
    return `<div id="reply-revenue" class="reply-revenue-turn">
      ${userTurnHTML('what are the revenue numbers - what are driving the changes?', [], true, 'assets/reply-v2-reaction.png')}
      <svg class="reply-loop-connector" viewBox="0 0 34 114" width="34" height="114" fill="none" aria-hidden="true"><path d="M3 27l0 21c0 16 4 22 4 32 0 10-4 17-4 29m27-29c0 1.459-0.279 2.862-0.837 4.21-0.559 1.347-1.353 2.537-2.385 3.568-1.031 1.032-2.221 1.826-3.568 2.385-1.348 0.558-2.751 0.837-4.21 0.837-1.459 0-2.862-0.279-4.21-0.837-1.347-0.559-2.537-1.353-3.568-2.385-1.032-1.031-1.826-2.221-2.385-3.568-0.558-1.348-0.837-2.751-0.837-4.21 0-1.459 0.279-2.862 0.837-4.21 0.559-1.347 1.353-2.537 2.385-3.568 1.031-1.032 2.221-1.826 3.568-2.385 1.348-0.558 2.751-0.837 4.21-0.837 1.459 0 2.862 0.279 4.21 0.837 1.347 0.559 2.537 1.353 3.568 2.385 1.032 1.031 1.826 2.221 2.385 3.568 0.558 1.348 0.837 2.751 0.837 4.21z" stroke="#EBEBEB" stroke-width="6" stroke-linecap="round"/></svg>
    </div>`;
  }
  function initialHTML(version = new URL(location.href).searchParams.get('version')) {
    if (!['v1', 'v2', 'v3', 'color-code', 'color-code-ticks', 'color-code-previews', 'one-topic-time-gap', 'two-topics'].includes(version)) version = 'color-code-previews';
    if (version === 'one-topic-time-gap' || version === 'two-topics') return window.ReplyTopicContent(initialHTML(version === 'two-topics' ? 'v2' : 'v1'), version);
    if (['color-code', 'color-code-ticks', 'color-code-previews'].includes(version)) return window.ReplyColorContent(initialHTML('v3'));
    if (version === 'v3') return window.ReplyV3Content(initialHTML('v1'), {paragraph, bubble, userTurnHTML, secondTopicHTML});
    const twoTopics = version === 'v2';
    return `<div class="ftux-flow reply-pattern${twoTopics ? ' reply-two-topics' : ''}" data-pen-frame="${twoTopics ? 'I0AYM4' : 'omuzR'}">
      <div class="reply-date">Today, Mon, Oct 13 7:02 AM</div>
      <div class="reply-prompt-turn">
        <div class="reply-prompt"><p>how are you doing on my goals? why did you not reach out to me with updates over the last few days?</p></div>
        <a class="reply-count" href="#reply-q4">5 Replies</a>
        <svg class="reply-connector" viewBox="0 0 56 51" width="56" height="51" fill="none" aria-hidden="true"><path d="M55 2h-13c-26 0-40 17-40 47" stroke="#E9E9EB" stroke-width="6" stroke-linecap="round"/></svg>
      </div>
      <div class="ftux-turns">${
        bubble(paragraph("Sales Ops documents fiscal Q4 as Nov 1-Jan 31, not Oct-Dec. That window has $11.416M of open deal Amount in the primary pipeline―not verified incremental ARR or a forecast. I'm still reconciling ARR definitions, so I won't assert a gap against $3.5M yet."), 'Back to Q4', 'reply-q4') +
        bubble(paragraph('The immediate deal moves are') + list([
          ['•', 'RMB / Edvin Strandberg: use the Nov 10 meeting to secure the governance-board date and funding, risk and contract owners.'],
          ['•', "Wells Fargo / Paul O'Rourke: substantiate the Nov 13 close with a dated MSA path and infrastructure owners."],
          ['•', 'P&G Malaysia / Daniel Muldowney: agree UAT exit criteria and confirm the purchasing/commercial steps for Nov 30.']
        ])) +
        bubble(paragraph("Owner follow-ups are drafted in Q4-owner-followups.md; none have been sent. For your $3.5M targetm should I use the company's Nov-Jan fiscal Q4?")) +
        separator +
        bubble(list([
          ['↑', 'External users: 1,489 (+1.3%)'],
          ['↓', 'Human questions: 19,328 (−12.9%)'],
          ['↓', '101GenAI: users 6 → 2; questions 348 → 14'],
          ['•', 'My clearest recommendation is for CS to validate 101GenAI’s drop.']
        ]), 'QA confirmed Customer-growth · Nov 2–8', 'reply-growth') +
        bubble(list([
          ['•', 'I published the weekly fix: correct human-activity filters, at most 150 words and two priorities.'],
          ['↑', 'Property Finder: 315.7s → 668.1s (+111.6%)'],
          ['•', 'I corrected the daily wording from “111.6% of prior” to “up 111.6%”; the alert itself was valid.']
        ]), 'Published fixes') +
        bubble(paragraph('Schedules and recipients are unchanged, but revised outputs still need runtime verification.'), 'Runtime verification') +
        `<article class="message assistant-message ftux-bubble reply-bubble reply-question">${paragraph('Run both updated Agents now to test them without email, or skip for now?')}</article>` +
        (twoTopics ? secondTopicHTML() : separator) +
        bubble(list([
          ['•', 'The wider audit found zero qualifying Nov 1–9 CRM closed wins, including other pipelines and renewals. If Nov–Jan is your target window, I propose $0 from qualifying recorded wins as the provisional baseline, not certified company-wide incremental ARR.'],
          ['•', 'The $11.416M open total uses a populated custom ARR field, but its expansion-uplift definition remains unproven.'],
          ['•', 'Also, 71 of 105 deals are still in Discovery or Scoping, so I would not treat that headline as close-ready coverage.'],
          ['→', 'Verification status: the gap to $3.5M remains unresolved.']
        ]), 'Back to Q4', 'reply-q4-audit')
      }</div>
    </div>`;
  }
  view.html = initialHTML();
  view.label = 'Reply UX Pattern';

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
    stage, total:connections.size,
    connectedCount:[...connections.values()].filter(state => state === 'connected').length,
    connectingTools:[...connections].filter(([, state]) => state === 'connecting').map(([tool]) => tool),
    artifactReady:false
  });
  window.FTUX = Object.freeze({send, reset, openConnections, getIndexState, getConversationHTML:initialHTML,
    pauseAutoScroll:() => {}});
  window.addEventListener('indexing-ready', boot);
  function start() {
    document.getElementById('messages')?.addEventListener('click', event => {
      const link = event.target.closest('.reply-count');
      if (!link) return;
      event.preventDefault();
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      const scroller = document.getElementById('chat-scroll');
      const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 80;
      scroller.scrollTo({top:Math.max(0, top), behavior:'instant'});
      target.tabIndex = -1;
      target.focus({preventScroll:true});
    });
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
