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
  const tools = [
    { id: 'notion', title: 'Notion', status: 'Connected', enabled: true },
    { id: 'hubspot', title: 'HubSpot', status: 'Connected', enabled: true },
    { id: 'slack', title: 'Slack', status: 'Connected · WisdomAI', enabled: true },
    { id: 'gmail', title: 'Gmail', status: 'Connecting…', enabled: true },
    { id: 'snowflake', title: 'Snowflake', status: 'Service-account key renewal due', enabled: true },
    { id: 'databricks', title: 'Databricks', status: 'Approval pending · Restrict to product_events', enabled: false }
  ];
  const artifactGroups = {
    apps: [
      { id: 'deal-risk-app', title: 'Deal risk app', description: 'Review deal risks and follow-up priorities in one place.' },
      { id: 'coverage-model', title: 'Coverage model', description: 'Explore pipeline coverage and the assumptions behind the model.' },
      { id: 'revenue-explorer', title: 'Revenue explorer', description: 'Explore monthly revenue by region.' },
      { id: 'segment-performance', title: 'Segment performance', description: 'Compare metrics across customer segments.' },
      { id: 'pipeline-health', title: 'Pipeline health', description: 'Review deal stages, aging, and coverage.' }
    ],
    agents: [
      { id: 'churn-watch', title: 'Churn watch', description: 'Review account risk signals and follow-up opportunities.' },
      { id: 'weekly-forecast', title: 'Weekly forecast', description: 'Review the weekly forecast and the updates behind it.' },
      { id: 'renewal-watch', title: 'Renewal watch', description: 'Track upcoming renewals and account risks.' },
      { id: 'spend-monitor', title: 'Spend monitor', description: 'Track spend trends and flag unusual changes.' },
      { id: 'sales-pulse', title: 'Sales pulse', description: 'Summarize sales activity and weekly changes.' }
    ],
    chats: [
      { id: 'q4-slip-analysis', title: 'Q4 slip analysis', description: 'Explore Q4 deal timing and questions about slipped close dates.' },
      { id: 'apac-hiring', title: 'APAC hiring Q&A', description: 'Review questions and answers about APAC hiring plans.' },
      { id: 'win-rate-analysis', title: 'Win-rate analysis', description: 'Explore wins by segment and deal owner.' },
      { id: 'margin-drivers', title: 'Margin drivers', description: 'Ask which products and accounts affect margins.' },
      { id: 'capacity-planning', title: 'Capacity planning', description: 'Plan staffing against upcoming workloads.' }
    ]
  };
  const categoryLabels = { apps: 'Apps', agents: 'Agents', chats: 'Chats' };
  const artifacts = Object.entries(artifactGroups).flatMap(([category, items]) => items.map(item => ({ ...item, category })));
  const artifactColumns = [
    ['deal-risk-app', 'apac-hiring', 'spend-monitor'],
    ['coverage-model', 'revenue-explorer', 'sales-pulse'],
    ['churn-watch', 'segment-performance', 'win-rate-analysis'],
    ['weekly-forecast', 'pipeline-health', 'margin-drivers'],
    ['q4-slip-analysis', 'renewal-watch', 'capacity-planning']
  ];
  const artifactLinkIcon = svg('M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71');

  function switchButton(item, kind) {
    return `<button type="button" class="fsw-content-switch" role="switch" aria-checked="${item.enabled}" aria-label="${escape(item.title)}" aria-describedby="fsw-${kind}-${item.id}-details" data-fsw-switch="${kind}" data-id="${item.id}"><span></span></button>`;
  }
  function connections() {
    return `<section class="fsw-section-content fsw-connections" aria-labelledby="fsw-tools-heading"><h3 class="fsw-content-label" id="fsw-tools-heading">Tools</h3><ul class="fsw-content-list">${tools.map(item => `<li class="fsw-connection-row"><div class="fsw-connection-copy"><p class="fsw-content-title">${escape(item.title)}</p><p class="fsw-content-muted" id="fsw-tool-${item.id}-details">${escape(item.enabled || !item.changed ? item.status : 'Disabled')}</p></div>${switchButton(item, 'tool')}</li>`).join('')}</ul></section>`;
  }
  function artifactCard(item) {
    return `<button type="button" class="fsw-artifact-card" data-fsw-action="artifact-detail" data-id="${item.id}" aria-label="Open ${escape(item.title)}"><span class="fsw-artifact-copy"><span class="fsw-artifact-title">${escape(item.title)}</span><span class="fsw-artifact-description">${escape(item.description)}</span></span><img class="fsw-artifact-thumbnail" src="assets/fsw-grid-${item.id}.png" alt="" width="80" height="78"/><span class="fsw-artifact-source">${artifactLinkIcon}<span>${escape(item.title)}</span></span></button>`;
  }
  function artifactContent() {
    return `<div class="fsw-section-content fsw-artifacts"><div class="fsw-artifact-grid" aria-label="Artifact library">${artifactColumns.map(column => `<div class="fsw-artifact-column">${column.map(id => artifactCard(artifacts.find(item => item.id === id))).join('')}</div>`).join('')}</div></div>`;
  }
  function render(section) {
    if (section === 'connections') return connections();
    if (section === 'artifacts') return artifactContent();
    return '';
  }
  function askButton(prompt, label) {
    return `<button type="button" class="fsw-content-primary" data-fsw-action="ask" data-prompt="${escape(prompt)}">${escape(label)}</button>`;
  }
  function handleClick(event, api = {}) {
    const target = event.target.closest('[data-fsw-switch], [data-fsw-action]');
    if (!target) return false;
    if (target.dataset.fswSwitch) {
      const kind = target.dataset.fswSwitch;
      const item = kind === 'tool' && tools.find(item => item.id === target.dataset.id);
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
    const action = target.dataset.fswAction;
    if (action === 'artifact-detail') {
      const artifact = artifacts.find(item => item.id === target.dataset.id);
      if (artifact) api.showDetail?.(artifact.title, `<div class="fsw-content-detail"><p class="fsw-content-label">${categoryLabels[artifact.category]}</p><p>${escape(artifact.description)}</p><img class="fsw-artifact-detail-preview" src="assets/fsw-grid-${artifact.id}.png" alt="${escape(artifact.title)} preview" width="160" height="156"/>${askButton(`Open ${artifact.title} and show me the latest details.`, `Ask about this ${artifact.category === 'chats' ? 'chat' : artifact.category === 'agents' ? 'agent' : 'app'}`)}</div>`, target);
      return true;
    }
    if (action === 'ask') {
      api.ask?.(target.dataset.prompt);
      return true;
    }
    return false;
  }

  window.FullscreenWorkspaceContent = { render, icons, handleClick, data: { tools, artifactGroups } };
})();
