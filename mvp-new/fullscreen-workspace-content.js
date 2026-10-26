(() => {
  'use strict';

  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const icons = {
    connections: svg('M19.25 5.31944c0 1.41907-3.2459 2.56945-7.25 2.56945-4.00406 0-7.25-1.15038-7.25-2.56945m14.5 0c0-1.41906-3.2459-2.56944-7.25-2.56944-4.00406 0-7.25 1.15038-7.25 2.56944m14.5 0v13.36116c0 1.419-3.2459 2.5694-7.25 2.5694-4.00406 0-7.25-1.1504-7.25-2.5694v-13.36116m14.5 4.36025c0 1.41911-3.2459 2.56941-7.25 2.56941-4.00406 0-7.25-1.1503-7.25-2.56941m14.5 4.25001c0 1.4191-3.2459 2.5694-7.25 2.5694-4.00406 0-7.25-1.1503-7.25-2.5694'),
    schedules: svg('M14.5 6.5h-5.68686c-1.80975 0-2.42909 2.41123-0.84336 3.28338l8.06042 4.43322c1.5858 0.8722 0.9664 3.2834-0.8433 3.2834h-5.6869m5.25-11.75v1.5c0 1.10457 0.8954 2 2 2h1.5c1.1046 0 2-0.89543 2-2v-1.5c0-1.10457-0.8954-2-2-2h-1.5c-1.1046 0-2 0.89543-2 2z m-11 11v1.5c0 1.1046 0.89543 2 2 2h1.5c1.10457 0 2-0.8954 2-2v-1.5c0-1.1046-0.89543-2-2-2h-1.5c-1.10457 0-2 0.8954-2 2z'),
    artifacts: svg('M17 10.25c-1.7949 0-3.25-1.45507-3.25-3.25 0-1.79493 1.4551-3.25 3.25-3.25 1.7949 0 3.25 1.45507 3.25 3.25 0 1.79493-1.4551 3.25-3.25 3.25z m-10-6.5v3.25m0 0v3.25m0-3.25h-3.25m3.25 0h3.25m9.0481 7.7021l-2.2981 2.2981m0 0l-2.2981 2.2981m2.2981-2.2981l-2.2981-2.2981m2.2981 2.2981l2.2981 2.2981m-14.0481-5.5483h3.5c0.82843 0 1.5 0.6716 1.5 1.5v3.5c0 0.8284-0.67157 1.5-1.5 1.5h-3.5c-0.82843 0-1.5-0.6716-1.5-1.5v-3.5c0-0.8284 0.67157-1.5 1.5-1.5z'),
    memory: svg('M12 18V5a3 3 0 0 0-5.997-.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Zm0 0V5a3 3 0 0 1 5.997-.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18ZM15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4M17.599 6.5a3 3 0 0 0 .399-1.375M6.003 5.125A3 3 0 0 0 6.401 6.5M3.477 10.646a4 4 0 0 1 .585-.396m15.876 0a4 4 0 0 1 .585.396M6 18a4 4 0 0 1-1.967-.516m15.934 0A4 4 0 0 1 18 18')
  };
  const moreIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
  const tools = [
    { id: 'notion', title: 'Notion', status: 'Connected', enabled: true },
    { id: 'hubspot', title: 'HubSpot', status: 'Connected', enabled: true },
    { id: 'slack', title: 'Slack', status: 'Connected · WisdomAI', enabled: true },
    { id: 'gmail', title: 'Gmail', status: 'Connecting…', enabled: true },
    { id: 'snowflake', title: 'Snowflake', status: 'Service-account key renewal due', enabled: true },
    { id: 'databricks', title: 'Databricks', status: 'Approval pending · Restrict to product_events', enabled: false }
  ];
  const tasks = [
    { id: 'deal-follow-ups', title: 'Deal follow-ups (6)', status: 'Review' },
    { id: 'territory-confirmations', title: 'Territory confirmations', status: 'Running...' },
    { id: 'churn-risk', title: 'Churn risk', status: 'Running...' },
    { id: 'forecast-brief', title: 'Forecast brief', status: 'Done' },
    { id: 'discount-review', title: 'Discount review', status: 'Done' }
  ];
  const routines = [
    { id: 'sales-pipeline', title: 'Weekly Sales Pipeline Update', schedule: 'Fridays at 7:00 AM PT', channel: 'Slack · #sales-pipeline', enabled: true },
    { id: 'workspace-health', title: 'Weekly Workspace Health', schedule: 'Fridays at 4:00 PM PT', channel: 'Slack · #data-platform', enabled: true },
    { id: 'quarterly-review', title: 'Quarterly Wisdom Review', schedule: '5 business days before each quarter ends', enabled: true }
  ];
  const artifactGroups = {
    apps: [
      { id: 'deal-risk-app', title: 'Deal risk app', description: 'Review deal risks and follow-up priorities in one place.', thumbnail: 'deal-risk-app' },
      { id: 'coverage-model', title: 'Coverage model', description: 'Explore pipeline coverage and the assumptions behind the model.', thumbnail: 'coverage-model' },
      { id: 'control-room', title: 'Control Room — Leadership Deck', description: 'View the “Live App Views by Account” tiles in the Control Room leadership deck.', thumbnail: 'control-room' }
    ],
    agents: [
      { id: 'churn-watch', title: 'Churn watch', description: 'Review account risk signals and follow-up opportunities.', thumbnail: 'churn-watch' },
      { id: 'weekly-forecast', title: 'Weekly forecast', description: 'Review the weekly forecast and the updates behind it.', thumbnail: 'weekly-forecast' },
      { id: 'daily-pipeline-brief', title: 'Daily Pipeline Brief', description: 'Review daily pipeline changes and follow-up priorities.', thumbnail: 'daily-pipeline-brief' }
    ],
    chats: [
      { id: 'q4-slip-analysis', title: 'Q4 slip analysis', description: 'Explore Q4 deal timing and questions about slipped close dates.', thumbnail: 'q4-slip-analysis' },
      { id: 'apac-hiring', title: 'APAC hiring Q&A', description: 'Review questions and answers about APAC hiring plans.', thumbnail: 'apac-hiring' },
      { id: 'revenue-drivers', title: 'September Revenue Drivers', description: 'Explore monthly revenue, customer changes and product bundle drivers.', thumbnail: 'revenue-drivers' }
    ]
  };
  const categoryLabels = { apps: 'Apps', agents: 'Agents', chats: 'Chats' };
  const artifacts = Object.entries(artifactGroups).flatMap(([category, items]) => items.map(item => ({ ...item, category })));
  const initializedRoots = new WeakSet();

  function switchButton(item, kind) {
    return `<button type="button" class="fsw-content-switch" role="switch" aria-checked="${item.enabled}" aria-label="${escape(item.title)}" aria-describedby="fsw-${kind}-${item.id}-details" data-fsw-switch="${kind}" data-id="${item.id}"><span></span></button>`;
  }
  function connections() {
    return `<section class="fsw-section-content fsw-connections" aria-labelledby="fsw-tools-heading"><h3 class="fsw-content-label" id="fsw-tools-heading">Tools</h3><ul class="fsw-content-list">${tools.map(item => `<li class="fsw-connection-row"><div class="fsw-connection-copy"><p class="fsw-content-title">${escape(item.title)}</p><p class="fsw-content-muted" id="fsw-tool-${item.id}-details">${escape(item.enabled || !item.changed ? item.status : 'Disabled')}</p></div>${switchButton(item, 'tool')}</li>`).join('')}</ul></section>`;
  }
  function taskRow(task) {
    return `<li class="fsw-task-row"><button type="button" class="fsw-task-title" data-fsw-action="task-detail" data-id="${task.id}">${escape(task.title)}</button><div class="fsw-task-actions">${task.status === 'Review' ? `<button type="button" class="fsw-task-review" data-fsw-action="task-detail" data-id="${task.id}">Review</button>` : `<span class="fsw-task-status">${escape(task.status)}</span>`}<span class="fsw-task-more" aria-hidden="true">${moreIcon}</span></div></li>`;
  }
  function schedules() {
    return `<div class="fsw-section-content fsw-schedules"><section class="fsw-schedule-section" aria-labelledby="fsw-tasks-heading"><h3 class="fsw-content-label" id="fsw-tasks-heading">Tasks</h3><ul class="fsw-content-list">${tasks.map(taskRow).join('')}</ul><button type="button" class="fsw-content-see-all" data-fsw-action="tasks-all">See all</button></section><section class="fsw-schedule-section" aria-labelledby="fsw-routines-heading"><h3 class="fsw-content-label" id="fsw-routines-heading">Routines</h3><ul class="fsw-content-list">${routines.map(item => `<li class="fsw-routine-row"><div class="fsw-routine-copy"><p class="fsw-content-title">${escape(item.title)}</p><div id="fsw-routine-${item.id}-details"><p class="fsw-routine-meta">${escape(item.schedule)}</p>${item.channel ? `<p class="fsw-routine-meta">${escape(item.channel)}</p>` : ''}</div></div>${switchButton(item, 'routine')}</li>`).join('')}</ul></section></div>`;
  }
  function artifactCard(item) {
    return `<button type="button" class="fsw-artifact-card" data-fsw-action="artifact-detail" data-id="${item.id}"><span class="fsw-artifact-copy"><span class="fsw-artifact-title">${escape(item.title)}</span><span class="fsw-artifact-description">${escape(item.description)}</span><span class="fsw-artifact-source"><img src="assets/wisdom-card-logo.svg" width="16" height="17.422" alt=""/><span>ayush.gowisdom.ai</span></span></span><img class="fsw-artifact-thumbnail" src="assets/fsw-${item.thumbnail}.png" alt="" width="80" height="78"/></button>`;
  }
  function artifactContent(category) {
    const selected = artifactGroups[category] ? category : 'apps';
    return `<div class="fsw-section-content fsw-artifacts"><div class="fsw-artifact-tabs" role="tablist" aria-label="Artifact categories">${Object.entries(categoryLabels).map(([key, title]) => `<button type="button" class="fsw-artifact-tab" role="tab" id="fsw-artifact-tab-${key}" aria-selected="${key === selected}" aria-controls="fsw-artifact-panel" tabindex="${key === selected ? 0 : -1}" data-fsw-artifact-tab="${key}">${title}</button>`).join('')}</div><section class="fsw-artifact-panel" id="fsw-artifact-panel" role="tabpanel" aria-labelledby="fsw-artifact-tab-${selected}"><div class="fsw-artifact-list">${artifactGroups[selected].map(artifactCard).join('')}</div><div class="fsw-artifact-footer"><button type="button" class="fsw-content-see-all" data-fsw-action="artifacts-all" data-category="${selected}">See all</button></div></section></div>`;
  }
  function render(section, options = {}) {
    if (section === 'connections') return connections();
    if (section === 'schedules') return schedules();
    if (section === 'artifacts') return artifactContent(options.artifactTab);
    return '';
  }
  function askButton(prompt, label) {
    return `<button type="button" class="fsw-content-primary" data-fsw-action="ask" data-prompt="${escape(prompt)}">${escape(label)}</button>`;
  }
  function handleClick(event, api = {}) {
    const target = event.target.closest('[data-fsw-switch], [data-fsw-artifact-tab], [data-fsw-action]');
    if (!target) return false;
    if (target.dataset.fswSwitch) {
      const kind = target.dataset.fswSwitch;
      const item = (kind === 'tool' ? tools : routines).find(item => item.id === target.dataset.id);
      if (!item) return false;
      item.enabled = !item.enabled;
      item.changed = true;
      target.setAttribute('aria-checked', String(item.enabled));
      if (kind === 'tool') {
        const status = document.getElementById(`fsw-tool-${item.id}-details`);
        if (status) status.textContent = item.enabled ? item.status : 'Disabled';
      }
      api.announce?.(`${item.title} ${item.enabled ? 'enabled' : 'disabled'}.`);
      return true;
    }
    if (target.dataset.fswArtifactTab) {
      api.setArtifactTab?.(target.dataset.fswArtifactTab);
      return true;
    }
    const action = target.dataset.fswAction;
    if (action === 'task-detail') {
      const task = tasks.find(item => item.id === target.dataset.id);
      if (task) api.showDetail?.(task.title, `<div class="fsw-content-detail"><p class="fsw-content-label">Status</p><p>${escape(task.status)}</p>${askButton(`Show me the latest update for ${task.title}.`, 'Ask about this task')}</div>`, target);
      return true;
    }
    if (action === 'tasks-all') {
      api.showDetail?.('All tasks', `<ul class="fsw-content-list fsw-task-directory">${tasks.map(taskRow).join('')}</ul>`, target);
      return true;
    }
    if (action === 'artifact-detail') {
      const artifact = artifacts.find(item => item.id === target.dataset.id);
      if (artifact) api.showDetail?.(artifact.title, `<div class="fsw-content-detail"><p class="fsw-content-label">${categoryLabels[artifact.category]}</p><p>${escape(artifact.description)}</p><p class="fsw-artifact-source"><img src="assets/wisdom-card-logo.svg" width="16" height="17.422" alt=""/>ayush.gowisdom.ai</p>${askButton(`Open ${artifact.title} and show me the latest details.`, `Ask about this ${artifact.category === 'chats' ? 'chat' : artifact.category === 'agents' ? 'agent' : 'app'}`)}</div>`, target);
      return true;
    }
    if (action === 'artifacts-all') {
      const category = artifactGroups[target.dataset.category] ? target.dataset.category : 'apps';
      api.showDetail?.(`All ${categoryLabels[category].toLowerCase()}`, `<div class="fsw-artifact-list">${artifactGroups[category].map(artifactCard).join('')}</div>`, target);
      return true;
    }
    if (action === 'ask') {
      api.ask?.(target.dataset.prompt);
      return true;
    }
    return false;
  }
  function init(root, api = {}) {
    if (initializedRoots.has(root)) return;
    initializedRoots.add(root);
    root.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-fsw-artifact-tab]');
      if (!tab) return;
      const keys = Object.keys(categoryLabels);
      const index = keys.indexOf(tab.dataset.fswArtifactTab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % keys.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + keys.length) % keys.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = keys.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      api.setArtifactTab?.(keys[next]);
      root.querySelector(`[data-fsw-artifact-tab="${keys[next]}"]`)?.focus({ preventScroll: true });
    });
  }

  window.FullscreenWorkspaceContent = { render, icons, handleClick, init, data: { tools, tasks, routines, artifactGroups } };
})();
