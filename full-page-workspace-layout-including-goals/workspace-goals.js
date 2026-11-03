/* Workspace Page and its grouped-row, category-card, and searchable-table reference variants. */
(() => {
  'use strict';

  const STORAGE_KEY = 'owl-full-page-workspace-layout-including-goals-v1';
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
  const emptyGoal = () => ({title:'', instruction:'', metric:'', baseline:'', current:'', target:'', unit:'', startDate:'', targetDate:'', update:'', updated:'', lifecycle:'active', status:'Not started', tone:'not-started', references:[]});
  function savedFields(item) {
    const patch = {};
    for (const field of editableFields) if (typeof item[field] === 'string') patch[field] = item[field].trim().slice(0, field === 'instruction' ? 5000 : 250);
    if (['active', 'paused'].includes(item.lifecycle)) patch.lifecycle = item.lifecycle;
    if (Array.isArray(item.references)) patch.references = [...new Set(item.references.filter(ref => typeof ref === 'string' && ref.trim()).map(ref => ref.trim().slice(0, 200)))].slice(0, 40);
    return patch;
  }
  let goals = sourceGoals.map(goal => ({...goal, references:[...goal.references]}));
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved)) {
      goals = goals.map(goal => {
        const existing = saved.find(item => item && item.id === goal.id);
        return existing ? {...goal, ...savedFields(existing)} : goal;
      });
      const knownIds = new Set(goals.map(goal => goal.id));
      for (const item of saved.slice(0, 204)) {
        if (!item || typeof item.id !== 'string' || !/^custom-[a-zA-Z0-9-]{1,80}$/.test(item.id) || knownIds.has(item.id)) continue;
        const patch = savedFields(item);
        if (!patch.title || !patch.instruction) continue;
        goals.push({...emptyGoal(), ...patch, id:item.id});
        knownIds.add(item.id);
      }
    }
  } catch (_) { /* A private browsing session can keep its changes in memory. */ }

  let filter = 'all';
  let query = '';
  let referenceQuery = '';
  let referenceCategory = 'all';
  let selectedId = goals[0].id;
  let editor;
  let editingId;
  let editorMode = 'edit';
  let draftReferences = [];
  let referencePickerOpen = false;
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
    const hasMeasure = !!(goal.metric || goal.baseline || goal.target);
    const summary = goal.update || (goal.metric ? goal.metric : 'No measure added.');
    return `<section class="wg-measure" aria-label="${esc(goal.metric || 'Goal measure')}"><div class="wg-copy-group"><h4>Measure</h4><p>${esc(summary)}</p></div>${hasMeasure ? `<div class="wg-measure-scale"><div class="wg-track${measurable ? '' : ' is-unmeasured'}" ${measurable ? `role="progressbar" aria-label="${esc(goal.metric)} progress toward target" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio)}" aria-valuetext="${esc(goal.current)} ${esc(goal.unit)} now; target ${esc(goal.target)} ${esc(goal.unit)}"` : 'aria-hidden="true"'}>${measurable ? `<span class="wg-progress" style="width:${ratio}%"></span><span class="wg-marker" style="left:${ratio}%"></span>` : ''}</div><div class="wg-measure-labels"><span>${baselineLabel}</span><span>${currentLabel}</span><span>${targetLabel}</span></div></div>` : ''}<p class="wg-updated">${goal.updated ? `Progress updated ${esc(goal.updated)}` : 'No progress yet'}</p></section>`;
  }
  const referenceGroups = [
    {name:'Pipeline insights', references:['Deal velocity dashboard', 'Enterprise pipeline report', 'Closed-won cohort analysis', 'Root-cause chat', 'Weekly forecast', 'Churn watch']},
    {name:'Reviews & approvals', references:['Legal review queue', 'Contract redline tracker', 'Security review checklist', 'Approval requirements', 'Pricing exception log']},
    {name:'Deal coordination', references:['Procurement status', 'Deal stakeholder map', 'Customer decision timelines']},
    {name:'Planning & follow-up', references:['Mutual action plans', 'Stalled deal review', 'Quarter-end close plan', 'APAC hiring Q&A']}
  ];
  const referenceButton = ref => `<button type="button" class="wg-reference" data-wg-action="reference" data-wg-reference="${esc(ref)}">${esc(ref)}</button>`;
  const inlineReferences = references => references.map((ref, index) => `${index ? '<span class="wg-reference-separator" aria-hidden="true">·</span>' : ''}${referenceButton(ref)}`).join('');
  function categorizedReferences(goal) {
    const groups = referenceGroups.map(group => ({name:group.name, references:group.references.filter(ref => goal.references.includes(ref))})).filter(group => group.references.length);
    const known = new Set(groups.flatMap(group => group.references));
    const other = goal.references.filter(ref => !known.has(ref));
    if (other.length) groups.push({name:'Other references', references:other});
    return groups;
  }
  function references(goal, version) {
    if (!goal.references.length) return '<section class="wg-references"><h4>References</h4><p class="wg-muted">No references added.</p></section>';
    if (version === 'v1') return `<section class="wg-references"><h4>References</h4><div class="wg-reference-links">${inlineReferences(goal.references)}</div></section>`;
    const groups = categorizedReferences(goal);
    let content;
    if (version === 'v2') {
      content = `<div class="wg-reference-groups">${groups.map(group => {
        const lines = [];
        for (let i = 0; i < group.references.length; i += 3) lines.push(`<div class="wg-reference-links">${inlineReferences(group.references.slice(i, i + 3))}</div>`);
        return `<section class="wg-reference-group"><h5>${esc(group.name)}</h5><div class="wg-reference-group-lines">${lines.join('')}</div></section>`;
      }).join('')}</div>`;
    } else if (version === 'v3') {
      content = `<div class="wg-reference-cards">${groups.map(group => `<section class="wg-reference-category-card"><header><h5>${esc(group.name)}</h5><span aria-label="${group.references.length} references">${group.references.length}</span></header><div class="wg-reference-card-links">${group.references.map(referenceButton).join('')}</div></section>`).join('')}</div>`;
    } else {
      if (!groups.some(group => group.name === referenceCategory)) referenceCategory = 'all';
      const search = referenceQuery.trim().toLocaleLowerCase();
      const rows = groups.filter(group => referenceCategory === 'all' || group.name === referenceCategory).flatMap(group => group.references.map(ref => ({ref, category:group.name}))).filter(row => !search || `${row.ref} ${row.category}`.toLocaleLowerCase().includes(search));
      content = `<div class="wg-reference-table-layout"><div class="wg-reference-tools"><input type="search" class="wg-reference-search" placeholder="Search references" aria-label="Search references" value="${esc(referenceQuery)}" autocomplete="off"><select class="wg-reference-category" aria-label="Reference category"><option value="all"${referenceCategory === 'all' ? ' selected' : ''}>All categories</option>${groups.map(group => `<option value="${esc(group.name)}"${referenceCategory === group.name ? ' selected' : ''}>${esc(group.name)}</option>`).join('')}</select></div><div class="wg-reference-table-wrap"><table class="wg-reference-table" aria-label="Goal references"><thead><tr><th scope="col">Reference</th><th scope="col">Category</th></tr></thead><tbody>${rows.length ? rows.map(row => `<tr><td>${referenceButton(row.ref)}</td><td>${esc(row.category)}</td></tr>`).join('') : '<tr><td colspan="2" class="wg-reference-empty">No matching references.</td></tr>'}</tbody></table></div></div>`;
    }
    return `<section class="wg-references wg-references-organized"><h4>References</h4>${content}</section>`;
  }
  function detail(goal) {
    if (!goal) return `<div class="wg-empty-detail"><h3>${filter === 'closed' && !query ? 'No closed goals' : 'No matching goals'}</h3><p>${filter === 'closed' && !query ? 'Closed goals will appear here.' : 'Try another search or choose a different filter.'}</p></div>`;
    const version = ['v2','v3','v4'].includes(document.body.dataset.workspaceLayoutVersion) ? document.body.dataset.workspaceLayoutVersion : 'v1';
    const lifecycleLabel = `<span>${goal.lifecycle === 'active' ? 'Active' : 'Paused'}</span>`;
    const toggle = `<button type="button" class="wg-switch" role="switch" aria-checked="${goal.lifecycle === 'active'}" aria-label="${goal.lifecycle === 'active' ? 'Pause' : 'Activate'} ${esc(goal.title)}" data-wg-action="toggle"><span></span></button>`;
    const actions = `<div class="wg-detail-actions"><div class="wg-lifecycle">${lifecycleLabel}${toggle}</div><button type="button" class="wg-edit" data-wg-action="edit">Edit</button></div>`;
    const heading = `<h3 id="wg-goal-title">${esc(goal.title)}</h3>`;
    return `<div class="wg-detail-column wg-layout-${version}"><article class="wg-card" aria-labelledby="wg-goal-title"><div class="wg-card-heading">${heading}${actions}</div><section class="wg-copy-group"><h4>Instruction</h4><p>${esc(goal.instruction)}</p></section>${measure(goal)}${references(goal, version)}</article></div>`;
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
    const selector = ['.wg-search', '.wg-reference-search', '.wg-reference-category'].find(value => event.target.matches(value));
    if (!selector) return;
    const position = event.target.selectionStart ?? null;
    if (selector === '.wg-search') query = event.target.value;
    else if (selector === '.wg-reference-search') referenceQuery = event.target.value;
    else referenceCategory = event.target.value;
    refresh(api, selector);
    const input = document.querySelector(`#fsw-section-goals ${selector}`);
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
      referenceQuery = '';
      referenceCategory = 'all';
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
      if (event.target.closest('[data-wg-add-references]')) {
        referencePickerOpen = !referencePickerOpen;
        renderReferencePicker();
        editor.querySelector(referencePickerOpen ? '[data-wg-reference-choice]' : '[data-wg-add-references]')?.focus({preventScroll:true});
        return;
      }
      const removeReference = event.target.closest('[data-wg-remove-reference]');
      if (removeReference) {
        draftReferences = draftReferences.filter(ref => ref !== removeReference.dataset.wgRemoveReference);
        renderReferencePicker();
        editor.querySelector('[data-wg-add-references]')?.focus({preventScroll:true});
        return;
      }
      if (event.target.closest('[data-wg-add-custom-reference]')) return addCustomReference();
      if (event.target === editor) {
        const bounds = editor.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeEditor();
      }
    });
    editor.addEventListener('input', () => {
      editor.querySelector('[type="submit"]').disabled = !editor.querySelector('[name="title"]').value.trim() || !editor.querySelector('[name="instruction"]').value.trim();
    });
    editor.addEventListener('change', event => {
      if (!event.target.matches('[data-wg-reference-choice]')) return;
      const reference = event.target.dataset.wgReferenceChoice;
      if (event.target.checked && draftReferences.length < 40) draftReferences = [...new Set([...draftReferences, reference])];
      else draftReferences = draftReferences.filter(ref => ref !== reference);
      renderReferencePicker();
      [...editor.querySelectorAll('[data-wg-reference-choice]')].find(input => input.dataset.wgReferenceChoice === reference)?.focus({preventScroll:true});
    });
    editor.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.target.matches('[data-wg-custom-reference]')) { event.preventDefault(); addCustomReference(); }
    });
    editor.addEventListener('submit', event => {
      event.preventDefault();
      const form = editor.querySelector('form');
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      if (!String(data.get('title') || '').trim() || !String(data.get('instruction') || '').trim()) return;
      const creating = editorMode === 'new';
      const goal = creating ? {...emptyGoal(), id:`custom-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`} : goals.find(item => item.id === editingId);
      if (!goal) return;
      for (const field of editableFields) goal[field] = String(data.get(field) || '').trim();
      goal.references = [...draftReferences];
      if (creating) {
        goals.push(goal);
        selectedId = goal.id;
        filter = 'all';
        query = '';
      }
      persist();
      closeEditor({restoreFocus:false});
      refresh(activeApi, '[data-wg-action="edit"]');
      activeApi.announce(creating ? 'Goal created.' : 'Goal updated.');
    });
  }
  function referenceCatalog() {
    return [...new Set([...sourceGoals.flatMap(goal => goal.references), ...goals.flatMap(goal => goal.references), ...draftReferences])];
  }
  function renderReferencePicker() {
    const host = editor.querySelector('.wg-editor-reference-section');
    if (!host) return;
    host.innerHTML = `<div class="wg-editor-reference-heading"><span>References${draftReferences.length ? ` (${draftReferences.length})` : ''}</span><button type="button" data-wg-add-references aria-expanded="${referencePickerOpen}" aria-controls="wg-reference-picker">${icon('M12 5v14M5 12h14')}Add references</button></div><div class="wg-editor-reference-chips">${draftReferences.length ? draftReferences.map(ref => `<span class="wg-editor-reference-chip"><span>${esc(ref)}</span><button type="button" data-wg-remove-reference="${esc(ref)}" aria-label="Remove ${esc(ref)}">${closeIcon}</button></span>`).join('') : '<p>Add apps, reports, or chats for context.</p>'}</div>${referencePickerOpen ? `<div class="wg-reference-picker" id="wg-reference-picker"><div class="wg-reference-options">${referenceCatalog().map(ref => `<label><input type="checkbox" data-wg-reference-choice="${esc(ref)}" ${draftReferences.includes(ref) ? 'checked' : ''}${draftReferences.length >= 40 && !draftReferences.includes(ref) ? ' disabled' : ''}><span>${esc(ref)}</span></label>`).join('')}</div><div class="wg-reference-custom"><input type="text" data-wg-custom-reference aria-label="Reference name" placeholder="Add another reference" maxlength="200"><button type="button" data-wg-add-custom-reference>Add</button></div></div>` : ''}`;
  }
  function addCustomReference() {
    const input = editor.querySelector('[data-wg-custom-reference]');
    const reference = input?.value.trim();
    if (!reference || draftReferences.length >= 40) return;
    draftReferences = [...new Set([...draftReferences, reference])];
    renderReferencePicker();
    editor.querySelector('[data-wg-custom-reference]')?.focus({preventScroll:true});
  }
  function openEditor(control, api) {
    const goal = goals.find(item => item.id === selectedId);
    if (!goal) return;
    showEditor(goal, control, api, 'edit');
  }
  function openNew(control, api) {
    showEditor(emptyGoal(), control, api, 'new');
  }
  function showEditor(goal, control, api, mode) {
    makeEditor();
    activeApi = api;
    opener = control;
    editingId = goal.id || null;
    editorMode = mode;
    draftReferences = [...goal.references];
    referencePickerOpen = false;
    const creating = mode === 'new';
    const heading = creating ? 'New goal' : 'Edit goal';
    const setting = (field, label, placeholder) => `<label class="wg-editor-setting"><span>${label}</span><input name="${field}" value="${esc(goal[field])}" placeholder="${placeholder}" maxlength="250"></label>`;
    editor.dataset.mode = mode;
    editor.innerHTML = `<form class="wg-editor-form"><header><h3 id="wg-editor-title">${heading}</h3><button type="button" class="wg-editor-close" data-wg-editor-close aria-label="Close ${heading}">${closeIcon}</button></header><label class="wg-editor-field"><span>Goal name</span><input name="title" value="${esc(goal.title)}" maxlength="250" placeholder="Enter goal name" required></label><label class="wg-editor-field"><span>Instruction</span><textarea name="instruction" placeholder="Describe the outcome and how your Owl should help." maxlength="5000" required>${esc(goal.instruction)}</textarea></label><fieldset class="wg-editor-measure"><legend>Measure</legend>${setting('metric','Metric','Enter a metric')}${setting('baseline','Starting value','Enter value')}${setting('startDate','Starting date','Select date')}${setting('target','Target value','Enter value')}${setting('targetDate','Target date','Select date')}</fieldset><section class="wg-editor-reference-section" aria-label="References"></section><footer><button type="button" data-wg-editor-close>Cancel</button><button type="submit" ${creating ? 'disabled' : ''}>${creating ? 'Create goal' : 'Save'}</button></footer></form>`;
    renderReferencePicker();
    if (!editor.open) editor.showModal();
    editor.querySelector('[name="title"]').focus({preventScroll:true});
  }
  function closeEditor({restoreFocus = true} = {}) {
    if (!editor?.open) return;
    editor.close();
    if (restoreFocus) (opener?.isConnected ? opener : document.querySelector('#fsw-section-goals [data-wg-action="edit"]'))?.focus({preventScroll:true});
    editingId = null;
    draftReferences = [];
    referencePickerOpen = false;
  }

  window.WorkspaceGoals = Object.freeze({render, handleClick, handleInput, closeEditor, openNew});
})();
