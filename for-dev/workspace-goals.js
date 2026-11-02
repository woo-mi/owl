/* Goals — Architecture 1 · Split view (Pen frame rhx0l). */
(() => {
  'use strict';

  const STORAGE_KEY = 'owl-for-dev-workspace-goals-v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const closeIcon = icon('m6 6 12 12M6 18 18 6');
  const chevron = icon('m9 6 6 6-6 6');
  const sourceGoals = [
    {
      id: 'enterprise-deals', title: 'Close enterprise deals faster', lifecycle: 'active', status: 'On track', tone: 'on-track',
      instruction: 'Close enterprise deals within 30 days by Dec 31. Keep deal owners aligned on next steps and resolve blockers before they delay closing. Use timely follow-ups and clear approval paths to maintain momentum from the first meeting to the signed agreement.',
      metric: 'Median days to close', baseline: '45', current: '38', target: '30', unit: 'days', startDate: 'Oct 1', targetDate: 'Dec 31',
      update: 'Down to 38 days. Legal review is the slowest stage.', updated: '2 days ago',
      references: ['Deal velocity dashboard', 'Root-cause chat', 'Enterprise pipeline report', 'Legal review queue', 'Contract redline tracker', 'Security review checklist', 'Procurement status', 'Deal stakeholder map', 'Approval requirements', 'Pricing exception log', 'Mutual action plans', 'Stalled deal review', 'Closed-won cohort analysis', 'Quarter-end close plan', 'Customer decision timelines']
    },
    {
      id: 'forecast-accuracy', title: 'Improve forecast accuracy', lifecycle: 'active', status: 'At risk', tone: 'at-risk',
      instruction: 'Keep weekly forecast error below 10%. Review late-stage changes and compare the forecast with actual results. Flag the largest gaps and the next steps needed to improve accuracy.',
      metric: 'Weekly forecast error', baseline: '', current: '14', target: '<10', unit: '%', startDate: '', targetDate: '',
      update: 'Forecast error is 14%; late-stage changes remain the gap.', updated: '1 day ago', references: ['Weekly forecast']
    },
    {
      id: 'upcoming-renewals', title: 'Protect upcoming renewals', lifecycle: 'active', status: 'Blocked', tone: 'blocked',
      instruction: 'Keep priority accounts on track for renewal. Review account health and current usage, identify risks, and coordinate timely follow-ups with account owners.',
      metric: 'Priority renewals on track', baseline: '', current: '', target: 'All priority renewals', unit: '', startDate: '', targetDate: '',
      update: 'Waiting for current account usage data.', updated: '3 days ago', references: ['Churn watch']
    },
    {
      id: 'apac-coverage', title: 'Build APAC sales coverage', lifecycle: 'paused', status: 'Not started', tone: 'not-started',
      instruction: 'Fill 6 approved sales roles by Dec 31. Coordinate hiring priorities and track recruitment progress so the team can build coverage across APAC.',
      metric: 'Approved sales roles filled', baseline: '0', current: '0', target: '6', unit: 'roles', startDate: '', targetDate: 'Dec 31',
      update: 'Hiring is approved; recruitment has not started.', updated: 'today', references: ['APAC hiring Q&A']
    }
  ];
  const editableFields = ['title', 'instruction', 'metric', 'baseline', 'target', 'startDate', 'targetDate'];
  let goals = sourceGoals.map(goal => ({...goal, references:[...goal.references]}));
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved)) goals = goals.map(goal => {
      const existing = saved.find(item => item && item.id === goal.id);
      if (!existing) return goal;
      const patch = {};
      for (const field of editableFields) if (typeof existing[field] === 'string') patch[field] = existing[field].slice(0, field === 'instruction' ? 5000 : 250);
      if (['active', 'paused'].includes(existing.lifecycle)) patch.lifecycle = existing.lifecycle;
      if (Array.isArray(existing.references)) patch.references = existing.references.filter(item => typeof item === 'string' && item.trim()).slice(0, 40).map(item => item.slice(0, 200));
      return {...goal, ...patch};
    });
  } catch (_) { /* A private browsing session can keep its changes in memory. */ }

  let filter = 'all';
  let query = '';
  let selectedId = goals[0].id;
  let editor;
  let editingId;
  let opener;
  let activeApi = {};

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); } catch (_) { /* The current session still retains the update. */ }
  }
  function visibleGoals() {
    const search = query.trim().toLocaleLowerCase();
    return goals.filter(goal => (filter === 'all' ? goal.lifecycle !== 'closed' : goal.lifecycle === filter) &&
      (!search || `${goal.title} ${goal.instruction} ${goal.metric}`.toLocaleLowerCase().includes(search)));
  }
  function statusPill(goal) {
    return `<span class="wg-status wg-status-${goal.tone}"><span aria-hidden="true">•</span>${esc(goal.status)}</span>`;
  }
  function number(value) {
    const result = Number.parseFloat(String(value).replace(/^[<>≤≥]\s*/, ''));
    return Number.isFinite(result) ? result : null;
  }
  function displayValue(goal, value) {
    return goal.unit === '%' && value ? `${esc(value)}%` : esc(value);
  }
  function measure(goal) {
    const start = number(goal.baseline), current = number(goal.current), target = number(goal.target);
    const measurable = start !== null && current !== null && target !== null && target !== start;
    const ratio = measurable ? Math.max(0, Math.min(100, (current - start) / (target - start) * 100)) : null;
    const baselineLabel = goal.baseline ? `${displayValue(goal, goal.baseline)}${goal.startDate ? ` on ${esc(goal.startDate)}` : ' at start'}` : 'Baseline pending';
    const currentLabel = goal.current !== '' ? `${displayValue(goal, goal.current)} now` : 'Awaiting data';
    const targetLabel = goal.target ? `${displayValue(goal, goal.target)}${goal.targetDate ? ` by ${esc(goal.targetDate)}` : ' target'}` : 'Target not set';
    return `<section class="wg-measure" aria-label="${esc(goal.metric)}"><div class="wg-copy-group"><h4>Measure</h4><p>${esc(goal.update)}</p></div><div class="wg-measure-scale"><div class="wg-track${measurable ? '' : ' is-unmeasured'}" ${measurable ? `role="progressbar" aria-label="${esc(goal.metric)} progress toward target" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio)}" aria-valuetext="${esc(goal.current)} ${esc(goal.unit)} now; target ${esc(goal.target)} ${esc(goal.unit)}"` : 'aria-hidden="true"'}>${measurable ? `<span class="wg-progress" style="width:${ratio}%"></span><span class="wg-marker" style="left:${ratio}%"></span>` : ''}</div><div class="wg-measure-labels"><span>${baselineLabel}</span><span>${currentLabel}</span><span>${targetLabel}</span></div></div><p class="wg-updated">Progress updated ${esc(goal.updated)}</p></section>`;
  }
  function detail(goal) {
    if (!goal) return `<div class="wg-empty-detail"><h3>${filter === 'closed' && !query ? 'No closed goals' : 'No matching goals'}</h3><p>${filter === 'closed' && !query ? 'Closed goals will appear here.' : 'Try another search or choose a different filter.'}</p></div>`;
    return `<div class="wg-detail-column"><article class="wg-card" aria-labelledby="wg-goal-title"><h3 id="wg-goal-title">${esc(goal.title)}</h3><section class="wg-copy-group"><h4>Instruction</h4><p>${esc(goal.instruction)}</p></section>${measure(goal)}<section class="wg-references"><h4>References</h4>${goal.references.length ? `<div class="wg-reference-links">${goal.references.map((ref, index) => `${index ? '<span class="wg-reference-separator" aria-hidden="true">·</span>' : ''}<button type="button" class="wg-reference" data-wg-action="reference" data-wg-reference="${esc(ref)}">${esc(ref)}</button>`).join('')}</div>` : '<p class="wg-muted">No references added.</p>'}</section></article><div class="wg-detail-actions"><div class="wg-lifecycle"><button type="button" class="wg-switch" role="switch" aria-checked="${goal.lifecycle === 'active'}" aria-label="${goal.lifecycle === 'active' ? 'Pause' : 'Activate'} ${esc(goal.title)}" data-wg-action="toggle"><span></span></button><span>${goal.lifecycle === 'active' ? 'Active' : 'Paused'}</span></div><button type="button" class="wg-edit" data-wg-action="edit">Edit</button></div></div>`;
  }
  function render() {
    const visible = visibleGoals();
    if (!visible.some(goal => goal.id === selectedId)) selectedId = visible[0]?.id || '';
    const selected = visible.find(goal => goal.id === selectedId);
    return `<div class="workspace-goals"><aside class="wg-navigator" aria-label="Goal navigator"><input class="wg-search" type="search" placeholder="Search goals" aria-label="Search goals" value="${esc(query)}" autocomplete="off"><div class="wg-filters" aria-label="Filter goals">${['all','active','paused','closed'].map(value => `<button type="button" data-wg-action="filter" data-wg-filter="${value}" aria-pressed="${filter === value}">${value[0].toUpperCase() + value.slice(1)}</button>`).join('')}</div><ul class="wg-goal-list">${visible.map(goal => `<li><button type="button" class="wg-goal-item" data-wg-action="select" data-wg-id="${goal.id}" aria-current="${goal.id === selectedId ? 'true' : 'false'}"><span class="wg-goal-title">${esc(goal.title)}</span><span class="wg-goal-assessment">${statusPill(goal)}${goal.lifecycle === 'paused' ? '<span class="wg-paused">Paused</span>' : ''}</span></button></li>`).join('')}</ul>${!visible.length ? `<p class="wg-list-empty">${filter === 'closed' ? 'No closed goals' : 'No goals found'}</p>` : ''}<button type="button" class="wg-closed-link" data-wg-action="filter" data-wg-filter="closed">Closed goals ${chevron}</button></aside>${detail(selected)}</div>`;
  }
  function refresh(api, focusSelector) {
    api.rerender('goals');
    if (focusSelector) {
      const target = document.querySelector(`#fsw-section-goals ${focusSelector}`) ||
        document.querySelector('#fsw-section-goals .wg-filters [aria-pressed="true"]');
      target?.focus({preventScroll:true});
    }
  }
  function handleInput(event, api) {
    if (!event.target.matches('.wg-search')) return;
    const position = event.target.selectionStart;
    query = event.target.value;
    refresh(api, '.wg-search');
    const input = document.querySelector('#fsw-section-goals .wg-search');
    if (input && position !== null) {
      try { input.setSelectionRange(position, position); } catch (_) { /* Search inputs differ across browsers. */ }
    }
  }
  function handleClick(event, api) {
    const control = event.target.closest('[data-wg-action]');
    if (!control) return;
    activeApi = api;
    const action = control.dataset.wgAction;
    if (action === 'filter') {
      filter = control.dataset.wgFilter;
      refresh(api, `.wg-filters [data-wg-filter="${filter}"]`);
    } else if (action === 'select') {
      selectedId = control.dataset.wgId;
      refresh(api, `[data-wg-id="${selectedId}"]`);
    } else if (action === 'toggle') {
      const goal = goals.find(item => item.id === selectedId);
      if (!goal) return;
      goal.lifecycle = goal.lifecycle === 'active' ? 'paused' : 'active';
      persist();
      refresh(api, '[data-wg-action="toggle"]');
      api.announce(`${goal.title} ${goal.lifecycle === 'active' ? 'activated' : 'paused'}.`);
    } else if (action === 'edit') openEditor(control, api);
    else if (action === 'reference') api.ask(`Open ${control.dataset.wgReference} for my goal “${goals.find(goal => goal.id === selectedId)?.title || ''}”.`);
  }
  function makeEditor() {
    if (editor) return;
    editor = document.createElement('dialog');
    editor.className = 'wg-editor';
    editor.id = 'workspace-goal-editor';
    editor.setAttribute('aria-labelledby', 'wg-editor-title');
    document.body.append(editor);
    editor.addEventListener('cancel', event => {event.preventDefault(); closeEditor();});
    editor.addEventListener('click', event => {
      if (event.target.closest('[data-wg-editor-close]')) return closeEditor();
      if (event.target === editor) {
        const bounds = editor.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeEditor();
      }
    });
    editor.addEventListener('input', () => {
      editor.querySelector('[type="submit"]').disabled = !editor.querySelector('[name="title"]').value.trim() || !editor.querySelector('[name="instruction"]').value.trim();
    });
    editor.addEventListener('submit', event => {
      event.preventDefault();
      const form = editor.querySelector('form');
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const goal = goals.find(item => item.id === editingId);
      if (!goal) return;
      for (const field of editableFields) goal[field] = String(data.get(field) || '').trim();
      goal.references = [...new Set(String(data.get('references') || '').split('\n').map(ref => ref.trim()).filter(Boolean))];
      persist();
      closeEditor({restoreFocus:false});
      refresh(activeApi, '[data-wg-action="edit"]');
      activeApi.announce('Goal updated.');
    });
  }
  function openEditor(control, api) {
    const goal = goals.find(item => item.id === selectedId);
    if (!goal) return;
    makeEditor();
    activeApi = api;
    opener = control;
    editingId = goal.id;
    const setting = (field, label, placeholder) => `<label class="wg-editor-setting"><span>${label}</span><input name="${field}" value="${esc(goal[field])}" placeholder="${placeholder}" maxlength="250"></label>`;
    editor.innerHTML = `<form class="wg-editor-form"><header><h3 id="wg-editor-title">Edit goal</h3><button type="button" class="wg-editor-close" data-wg-editor-close aria-label="Close Edit goal">${closeIcon}</button></header><label class="wg-editor-field"><span>Goal name</span><input name="title" value="${esc(goal.title)}" maxlength="250" placeholder="Enter goal name" required></label><label class="wg-editor-field"><span>Instruction</span><textarea name="instruction" placeholder="Describe the outcome and how your Owl should help." maxlength="5000" required>${esc(goal.instruction)}</textarea></label><fieldset class="wg-editor-measure"><legend>Measure</legend>${setting('metric','Metric','Enter a metric')}${setting('baseline','Starting value','Enter value')}${setting('startDate','Starting date','Select date')}${setting('target','Target value','Enter value')}${setting('targetDate','Target date','Select date')}</fieldset><label class="wg-editor-field wg-editor-references"><span>References <small>One reference per line</small></span><textarea name="references" placeholder="Add apps, reports, or chats for context.">${esc(goal.references.join('\n'))}</textarea></label><footer><button type="button" data-wg-editor-close>Cancel</button><button type="submit">Save</button></footer></form>`;
    editor.showModal();
    editor.querySelector('[name="title"]').focus({preventScroll:true});
  }
  function closeEditor({restoreFocus = true} = {}) {
    if (!editor?.open) return;
    editor.close();
    if (restoreFocus) (opener?.isConnected ? opener : document.querySelector('#fsw-section-goals [data-wg-action="edit"]'))?.focus({preventScroll:true});
    editingId = null;
  }

  window.WorkspaceGoals = Object.freeze({render, handleClick, handleInput, closeEditor});
})();
