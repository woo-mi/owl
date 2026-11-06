(() => {
  'use strict';

  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const icons = {
    settings: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" fill="none"><path d="M5.128 2.46415l-0.70326-0.16229c-0.59471-0.13724-1.21816 0.04157-1.64974 0.47314-0.43157 0.43157-0.61038 1.05503-0.47314 1.64974l0.16229 0.70326c0.18706 0.81061-0.14719 1.65236-0.83938 2.11382l-0.85512 0.57008c-0.48083 0.32056-0.76965 0.86021-0.76965 1.4381 0 0.57789 0.28881 1.11754 0.76965 1.4381l0.85512 0.57008c0.69219 0.46146 1.02644 1.30322 0.83938 2.11382l-0.16229 0.70327c-0.13724 0.59471 0.04157 1.21816 0.47314 1.64973 0.43157 0.43157 1.05503 0.61038 1.64974 0.47314l0.70326-0.1623c0.8106-0.18706 1.65236 0.14719 2.11382 0.83939l0.57008 0.85512c0.32056 0.48083 0.86021 0.76965 1.4381 0.76965 0.57789 0 1.11754-0.28881 1.4381-0.76965l0.57008-0.85512c0.46146-0.69219 1.30322-1.02644 2.11382-0.83939l0.70327 0.1623c0.59471 0.13724 1.21816-0.04156 1.64973-0.47314 0.43157-0.43157 0.61038-1.05503 0.47314-1.64973l-0.1623-0.70327c-0.18706-0.8106 0.14719-1.65236 0.83939-2.11382l0.85512-0.57008c0.48083-0.32056 0.76965-0.86021 0.76965-1.4381 0-0.57789-0.28881-1.11754-0.76965-1.4381l-0.85512-0.57008c-0.69219-0.46146-1.02644-1.30321-0.83939-2.11382l0.1623-0.70327c0.13724-0.59471-0.04156-1.21816-0.47314-1.64973-0.43157-0.43157-1.05503-0.61038-1.64974-0.47314l-0.70326 0.16229c-0.8106 0.18706-1.65236-0.14719-2.11382-0.83938l-0.57008-0.85512c-0.32056-0.48083-0.86021-0.76965-1.4381-0.76965-0.57789 0-1.11754 0.28881-1.4381 0.76965l-0.57008 0.85512c-0.46146 0.69219-1.30322 1.02644-2.11382 0.83938z" fill="none" stroke="#626268" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" transform="matrix(0.8333514 0 0 0.8333514 2.2920001 2.2919998)"></path><path d="M5.5 2.75c0 1.51878-1.23122 2.75-2.75 2.75-1.51878 0-2.75-1.23122-2.75-2.75 0-1.51878 1.23122-2.75 2.75-2.75 1.51878 0 2.75 1.23122 2.75 2.75z" fill="none" stroke="#626268" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" transform="matrix(0.8332728 0 0 0.8332728 7.7080002 7.7080002)"></path></svg>',
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
  const approvalStorageKey = 'owl:full-page-workspace:action-approval-mode';
  const approvalModes = [
    { id: 'auto', title: 'Auto', description: 'The Owl acts when the review is confident you asked for it, and declines otherwise.' },
    { id: 'always-ask', title: 'Always ask', description: 'The Owl asks you before every action that changes something.' }
  ];
  let approvalMode = 'auto';
  try {
    const saved = localStorage.getItem(approvalStorageKey);
    if (approvalModes.some(mode => mode.id === saved)) approvalMode = saved;
  } catch (_) { /* Keep the in-memory preference when browser storage is unavailable. */ }

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
  function settings() {
    return `<section class="fsw-section-content fsw-settings" aria-labelledby="fsw-approvals-heading"><h3 class="fsw-content-label" id="fsw-approvals-heading">Action approvals</h3><div class="fsw-approval-options" role="radiogroup" aria-labelledby="fsw-approvals-heading">${approvalModes.map(mode => `<label class="fsw-approval-row"><input class="fsw-approval-radio" type="radio" name="fsw-action-approval" value="${mode.id}" aria-labelledby="fsw-approval-${mode.id}-label" aria-describedby="fsw-approval-${mode.id}-description" ${approvalMode === mode.id ? 'checked' : ''}><span class="fsw-approval-copy"><span class="fsw-content-title" id="fsw-approval-${mode.id}-label">${mode.title}</span><span class="fsw-approval-description" id="fsw-approval-${mode.id}-description">${mode.description}</span></span></label>`).join('')}</div></section>`;
  }
  function render(section) {
    if (section === 'connections') return connections();
    if (section === 'artifacts') return artifactContent();
    if (section === 'settings') return settings();
    return '';
  }
  function handleChange(event, api = {}) {
    const input = event.target.closest('input[name="fsw-action-approval"]');
    const mode = input?.checked && approvalModes.find(mode => mode.id === input.value);
    if (!mode) return false;
    approvalMode = mode.id;
    try { localStorage.setItem(approvalStorageKey, approvalMode); }
    catch (_) { /* The selection still works for this session. */ }
    api.announce?.(`${mode.title} selected for action approvals.`);
    return true;
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

  window.FullscreenWorkspaceContent = { render, icons, handleClick, handleChange, data: { tools, artifactGroups } };
})();
