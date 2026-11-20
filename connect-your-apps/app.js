(() => {
  'use strict';
  const apps = [
    {id:'google-calendar',name:'Google Calendar',icon:'google-calendar.png',connected:true},
    {id:'notion',name:'Notion',icon:'notion.svg',connected:true},
    {id:'slack',name:'Slack',icon:'slack.png',connected:true},
    {id:'gong',name:'Gong',icon:'gong.png',connected:true},
    {id:'linear',name:'Linear',icon:'linear.png'},
    {id:'github',name:'GitHub',icon:'github.png'},
    {id:'brex',name:'Brex',icon:'brex.png'},
    {id:'gitlab',name:'GitLab',icon:'gitlab.png'},
    {id:'jira',name:'Jira',icon:'jira.png'},
    {id:'asana',name:'Asana',icon:'asana.png'}
  ];
  const initialConnections = new Set(['google-calendar','notion','slack','gong']);
  const readVersion = () => new URL(location.href).searchParams.get('version') === 'no' ? 'no' : 'connected';
  const current = document.querySelector('#current-apps');
  const currentSection = document.querySelector('#current-section');
  const account = document.querySelector('.account');
  const suggestions = document.querySelector('#suggested-apps');
  const connectDialog = document.querySelector('#connect-dialog');
  const catalogDialog = document.querySelector('#catalog-dialog');
  const catalogList = document.querySelector('#catalog-list');
  const search = document.querySelector('#catalog-search');
  let pendingApp = null;
  let noticeTimer;
  let returnToCatalog = false;
  function card(app, compact = false) {
    const article = document.createElement('article');
    article.className = `integration-card${app.connected ? ' is-current' : ''}`;
    article.dataset.app = app.id;
    const icon = document.createElement('img');
    icon.className = `app-icon${initialConnections.has(app.id) ? ' app-icon-small' : ''}`; icon.src = `assets/${app.icon}`; icon.alt = ''; icon.width = 34; icon.height = 34;
    const title = document.createElement('span'); title.className = 'app-name'; title.textContent = app.name;
    const action = document.createElement(app.connected ? 'span' : 'button');
    action.className = `card-action${app.connected ? ' is-connected' : ''}`;
    if (app.connected) {
      action.innerHTML = '<img class="connected-check" src="assets/connected.svg" alt="" width="14" height="14"><span>Connected</span>';
      action.setAttribute('aria-label', `${app.name} connected`);
    } else {
      action.type = 'button'; action.textContent = 'Connect'; action.setAttribute('aria-label', `Connect ${app.name}`);
      action.addEventListener('click', () => openConnection(app, compact));
    }
    article.append(icon,title,action); return article;
  }
  function render() {
    const connectedApps = apps.filter(app => app.connected);
    current.replaceChildren(...connectedApps.map(app => card(app)));
    currentSection.hidden = connectedApps.length === 0;
    suggestions.replaceChildren(...apps.filter(app => !app.connected).map(app => card(app)));
    document.querySelector('#suggested-section').hidden = apps.every(app => app.connected);
    renderCatalog();
  }
  function renderCatalog() {
    const query = search.value.trim().toLowerCase();
    const matches = apps.filter(app => app.name.toLowerCase().includes(query));
    catalogList.replaceChildren(...matches.map(app => card(app,true)));
    document.querySelector('#catalog-empty').hidden = matches.length > 0;
  }
  function openConnection(app, fromCatalog) {
    pendingApp = app; returnToCatalog = fromCatalog;
    if (catalogDialog.open) catalogDialog.close();
    document.querySelector('#connect-title').textContent = `Connect ${app.name}`;
    document.querySelector('#connect-description').textContent = `Give your Owl access to ${app.name} so it can help with your work.`;
    document.querySelector('#connect-icon').src = `assets/${app.icon}`;
    document.querySelector('#confirm-connect').textContent = `Connect ${app.name}`;
    connectDialog.showModal();
  }
  function notice(message) {
    const element = document.querySelector('#notice');
    clearTimeout(noticeTimer); element.textContent = message; element.hidden = false;
    noticeTimer = setTimeout(() => { element.hidden = true; }, 3200);
  }
  document.querySelector('#confirm-connect').addEventListener('click', () => {
    if (!pendingApp) return;
    pendingApp.connected = true;
    const name = pendingApp.name;
    returnToCatalog = false;
    connectDialog.close(); render(); notice(`${name} connected`);
    document.querySelector('#browse-all').focus();
  });
  document.querySelector('#browse-all').addEventListener('click', () => { search.value = ''; renderCatalog(); catalogDialog.showModal(); search.focus(); });
  search.addEventListener('input', renderCatalog);
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  connectDialog.addEventListener('close', () => { pendingApp = null; if (returnToCatalog) {returnToCatalog = false; catalogDialog.showModal();} });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  }));
  window.addEventListener('prototype:nav', event => {
    const name = event.detail?.name;
    if (name === 'Connections') { window.OwlFlow?.connections(); }
    else if (name === 'Owls' || name === 'New Chat' || name === 'Chat') window.location.href = '../reply-ux-pattern/';
    else notice(`${name} is available in the Owl workspace`);
  });
  function dismissConnectionDialogs() {
    returnToCatalog = false;
    pendingApp = null;
    connectDialog.close();
    catalogDialog.close();
    clearTimeout(noticeTimer);
    document.querySelector('#notice').hidden = true;
  }
  window.addEventListener('connections:leave', dismissConnectionDialogs);
  function applyVersion(version) {
    const selected = version === 'no' ? 'no' : 'connected';
    dismissConnectionDialogs();
    search.value = '';
    account.hidden = selected === 'no';
    document.body.dataset.connectionsVersion = selected;
    apps.forEach(app => { app.connected = selected === 'connected' && initialConnections.has(app.id); });
    render();
  }
  window.addEventListener('connections:version-change', event => {
    applyVersion(event.detail?.version);
    window.scrollTo({top:0,behavior:'instant'});
  });
  applyVersion(readVersion());
})();
