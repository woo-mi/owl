(() => {
  'use strict';

  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const chevron = icon('m6 9 6 6 6-6');
  const closeIcon = icon('m6 6 12 12M6 18 18 6');
  const check = icon('m5 12 4 4L19 6');
  const more = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>';
  const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const groups = [
    {id:'upcoming', label:'Upcoming', status:'Need approval'},
    {id:'in-progress', label:'In progress', status:'Running'},
    {id:'done', label:'Done', status:'Done'}
  ];
  const sourceTasks = [
    {id:'deal-follow-ups', title:'Deal follow-ups (6)', status:'Need approval', time:'07:00', channel:'#sales-pipeline', instructions:'Review the six pipeline deals needing follow-up. Summarize recent changes, stalled next steps, and close-date risks. List each deal’s owner and recommended next action, with CRM links where available. Prepare follow-up drafts for review and flag decisions that need approval.'},
    {id:'territory-confirmations', title:'Territory confirmations', status:'Running...', time:'16:00', channel:'#data-platform', instructions:'Review pending territory assignments and account ownership. Highlight conflicts or missing confirmations, identify the owner for each decision, and prepare a concise list of changes that need approval. Include links to the source records where available.'},
    {id:'churn-risk', title:'Churn risk', status:'Running...', time:'16:00', channel:'#data-platform', instructions:'Review account health and recent usage changes for signs of churn risk. Summarize the strongest signals, identify affected accounts and owners, and recommend the next follow-up. Include supporting source links and flag any actions that need approval.'},
    {id:'forecast-brief', title:'Forecast brief', status:'Done', time:'16:00', channel:'#data-platform', instructions:'Prepare a concise sales forecast brief covering pipeline coverage, expected closes, and changes since the previous update. Highlight slipped close dates, significant deal movements, and the owners and next actions behind the largest risks. Include links to supporting records.'},
    {id:'discount-review', title:'Discount review', status:'Done', time:'16:00', channel:'#data-platform', instructions:'Review pending deal discounts and their impact on expected revenue. Summarize each request, its business rationale, deal owner, and any approval needed. Flag unusual discounts or missing information and include links to the relevant deal records.'}
  ].map(task => ({...task, repeatEnabled:true, repeat:'Weekly', day:'Friday', monthDay:1, interval:1, customDays:['Friday'], end:'Never', endDate:'', destination:'Slack', timezone:'Pacific Time', model:'Select model', paused:false}));
  const isUpdated = () => document.body.dataset.prototypeView === 'latest-oct-28';
  const groupsForView = () => isUpdated() ? [groups[1], groups[0], groups[2]] : groups;
  const tasksByView = new Map();
  function tasksForView() {
    const key = document.body.dataset.prototypeView;
    if (!tasksByView.has(key)) {
      tasksByView.set(key, groups.flatMap(group => sourceTasks.slice(0,3).map((task, index) => ({
        ...task, id:`${group.id}-${task.id}`, group:group.id, status:group.status, customDays:[...task.customDays],
        ...(isUpdated() ? {
          summary: group.id === 'upcoming' ? ['In 2 hrs', 'In 5 hr', 'Tomorrow'][index] : `${task.day}s at ${timeLabel(task.time)} PT`,
          ...(index === 0 ? {repeat:'Daily', time:'08:00'} : {})
        } : {})
      }))));
    }
    return tasksByView.get(key);
  }
  const timezoneSuffix = {'Pacific Time':'PT','Eastern Time':'ET','UTC':'UTC'};
  let editor;
  let activeTask;
  let draft;
  let api = {};
  let opener;
  let menuField;
  let menuTrigger;
  let advanced = false;

  function timeLabel(value) {
    const [hours, minutes] = value.split(':').map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
  }
  function scheduleLabel(task) {
    const at = `${timeLabel(task.time)} ${timezoneSuffix[task.timezone] || 'PT'}`;
    if (!task.repeatEnabled) return `Does not repeat · ${at}`;
    if (task.repeat === 'Weekly') return `${task.day}s at ${at}`;
    if (task.repeat === 'Monthly') return `Day ${task.monthDay} of each month at ${at}`;
    if (task.repeat === 'Interval') return `Every ${task.interval} ${task.interval === 1 ? 'hour' : 'hours'}`;
    if (task.repeat === 'Custom') return `${task.customDays.map(day => day.slice(0,3)).join(', ')} at ${at}`;
    return `${task.repeat} at ${at}`;
  }
  function row(task) {
    const updated = isUpdated();
    const running = updated && !task.paused && task.group === 'in-progress';
    const meta = updated ? task.summary || scheduleLabel(task) : scheduleLabel(task);
    return `<li><button type="button" class="latest-task-row" data-latest-task="edit" data-task-id="${task.id}" aria-label="Edit ${esc(task.title)} (${esc(groups.find(group => group.id === task.group).label)})"><span class="latest-task-copy"><span class="latest-task-title">${esc(task.title)}</span><span class="latest-task-meta"><span>${esc(meta)}</span>${updated ? '' : `<span>${esc(task.destination === 'Slack' ? `Slack · ${task.channel}` : 'Owl · Current chat')}</span>`}</span></span><span class="latest-task-actions${running ? ' is-running' : ''}"><span class="latest-task-status">${running ? '<span class="latest-task-running-dot" aria-hidden="true"></span>' : ''}${esc(task.paused ? 'Paused' : task.status)}</span><span class="latest-task-more">${more}</span></span></button></li>`;
  }
  function render() {
    const footerLabels = isUpdated() ? {'in-progress':'3 more', upcoming:'2 more', done:'See all'} : {};
    return `<div class="latest-tasks" aria-label="Tasks">${groupsForView().map(group => `<section class="latest-task-group" aria-labelledby="latest-tasks-${group.id}"><h3 id="latest-tasks-${group.id}" class="latest-task-group-label">${group.label}</h3><ul class="latest-task-list">${tasksForView().filter(task => task.group === group.id).map(row).join('')}</ul><span class="latest-task-see-all">${footerLabels[group.id] || 'See all'}</span></section>`).join('')}</div>`;
  }
  function control(field, label, extra = '') {
    return `<button type="button" class="fsw-edit-select" data-edit-select="${field}" aria-haspopup="listbox" aria-expanded="false" aria-controls="latest-task-menu" aria-label="${esc(label)}" ${extra}><span data-edit-value="${field}"></span>${chevron}</button>`;
  }
  function setting(field, label, extra = '') {
    return `<div class="fsw-edit-setting" data-setting="${field}"><span>${label}</span>${control(field, label, extra)}</div>`;
  }
  function makeEditor() {
    if (editor) return;
    editor = document.createElement('dialog');
    editor.id = 'latest-edit-task';
    editor.className = 'fsw-edit-dialog latest-task-editor';
    editor.setAttribute('aria-labelledby', 'latest-edit-title');
    document.body.append(editor);
    editor.addEventListener('click', event => {
      if (event.target === editor) {
        const bounds = editor.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeEditor();
        return;
      }
      const choice = event.target.closest('[data-edit-choice]');
      if (choice) return choose(choice.dataset.editChoice);
      const select = event.target.closest('[data-edit-select]');
      if (select) return openMenu(select);
      const action = event.target.closest('[data-edit-action]')?.dataset.editAction;
      if (action === 'close') closeEditor();
      if (action === 'repeat') {
        draft.repeatEnabled = !draft.repeatEnabled;
        closeMenu();
        refreshEditor();
      }
      if (action === 'advanced') {
        advanced = !advanced;
        closeMenu();
        refreshEditor();
      }
      if (action === 'pause') {
        activeTask.paused = !activeTask.paused;
        api.refreshSchedules?.();
        api.announce?.(`${activeTask.title} ${activeTask.paused ? 'paused' : 'resumed'}.`);
        closeEditor();
      }
    });
    editor.addEventListener('input', readInputs);
    editor.addEventListener('change', readInputs);
    editor.addEventListener('submit', event => {
      event.preventDefault();
      readInputs();
      if (!isValid()) return;
      const scheduleFields = ['repeatEnabled','repeat','day','monthDay','interval','customDays','time','timezone'];
      const scheduleChanged = scheduleFields.some(field => JSON.stringify(activeTask[field]) !== JSON.stringify(draft[field]));
      Object.assign(activeTask, draft, {title:draft.title.trim(), instructions:draft.instructions.trim(), customDays:[...draft.customDays]});
      if (isUpdated() && scheduleChanged) delete activeTask.summary;
      api.refreshSchedules?.();
      api.announce?.(`${activeTask.title} updated.`);
      closeEditor();
    });
    editor.addEventListener('cancel', event => {
      event.preventDefault();
      if (menuField) closeMenu(true);
      else closeEditor();
    });
    editor.addEventListener('keydown', event => {
      if (!menuField) return;
      const menu = editor.querySelector('#latest-task-menu');
      const choices = [...menu.querySelectorAll('[data-edit-choice]')];
      let index = choices.indexOf(document.activeElement);
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(true); return; }
      if (event.key === 'Tab') { closeMenu(true); return; }
      if (event.key === 'ArrowDown') index = Math.min(index + 1, choices.length - 1);
      else if (event.key === 'ArrowUp') index = Math.max(index - 1, 0);
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = choices.length - 1;
      else return;
      event.preventDefault();
      choices[index]?.focus({preventScroll:true});
      choices[index]?.scrollIntoView({block:'nearest'});
    });
    document.addEventListener('pointerdown', event => {
      if (!menuField || event.target.closest('#latest-task-menu') || event.target.closest('[data-edit-select]')) return;
      closeMenu();
    });
    editor.addEventListener('scroll', () => closeMenu());
    window.addEventListener('resize', () => { if (menuField) positionMenu(); });
  }
  function openEditor(task, trigger, nextApi) {
    makeEditor();
    if (editor.open) closeEditor({restoreFocus:false});
    activeTask = task;
    draft = {...task, customDays:[...task.customDays]};
    api = nextApi;
    opener = trigger;
    advanced = false;
    editor.innerHTML = `<form class="fsw-edit-form"><header class="fsw-edit-header"><h3 id="latest-edit-title">Edit task</h3><button type="button" class="fsw-edit-close" data-edit-action="close" aria-label="Close edit task">${closeIcon}</button></header><input class="fsw-edit-name" name="taskName" aria-label="Task name" value="${esc(draft.title)}" required maxlength="120"><textarea class="fsw-edit-instructions" name="instructions" aria-label="Task instructions" required>${esc(draft.instructions)}</textarea><div class="fsw-edit-settings"><div class="fsw-edit-setting"><span>Repeat task</span><button type="button" class="fsw-edit-switch" data-edit-action="repeat" role="switch" aria-label="Repeat task" aria-checked="true"><span></span></button></div>${setting('repeat','Repeat')}${setting('day','Day')}<div class="fsw-edit-setting fsw-edit-custom-days" data-setting="customDays"><span>On</span><div>${weekdays.map(day => `<label><input type="checkbox" name="customDay" value="${day}"><span>${day.slice(0,2)}</span></label>`).join('')}</div></div><label class="fsw-edit-setting" data-setting="monthDay"><span>Day of month</span><input type="number" name="monthDay" min="1" max="31" value="${draft.monthDay}" aria-label="Day of month"></label><label class="fsw-edit-setting" data-setting="interval"><span>Every</span><span class="fsw-edit-interval"><input type="number" name="interval" min="1" max="24" value="${draft.interval}" aria-label="Interval in hours"><span>hours</span></span></label>${setting('time','Time')}${setting('end','End repeat')}<label class="fsw-edit-setting" data-setting="endDate"><span>End date</span><input type="date" name="endDate" aria-label="End date" value="${draft.endDate}"></label>${setting('destination','Deliver to')}${setting('channel','Channel · connected workspace')}</div><button type="button" class="fsw-edit-advanced" data-edit-action="advanced" aria-expanded="false" aria-controls="latest-task-advanced">Advanced${chevron}</button><div id="latest-task-advanced" class="fsw-edit-advanced-fields" hidden>${setting('timezone','Time zone')}<div class="fsw-edit-setting fsw-edit-runs"><span>Runs in</span><span>Same chat for every run</span></div>${setting('model','Model')}</div><footer class="fsw-edit-footer"><button type="button" class="fsw-edit-pause" data-edit-action="pause">${task.paused ? 'Resume' : 'Pause'}</button><button type="submit" class="fsw-edit-save" disabled>Save</button></footer></form><div id="latest-task-menu" class="fsw-edit-menu latest-task-editor-menu" role="listbox" popover="manual" hidden></div>`;
    refreshEditor();
    editor.showModal();
    editor.querySelector('.fsw-edit-close').focus({preventScroll:true});
  }
  function isValid() {
    return draft.title.trim() && draft.instructions.trim() && (!draft.repeatEnabled || (draft.repeat !== 'Custom' || draft.customDays.length) && (draft.repeat !== 'Monthly' || draft.monthDay >= 1 && draft.monthDay <= 31) && (draft.repeat !== 'Interval' || draft.interval >= 1 && draft.interval <= 24) && (draft.end !== 'On date' || draft.endDate));
  }
  function updateSave() {
    if (!editor?.open && !draft) return;
    const changed = JSON.stringify(draft) !== JSON.stringify(activeTask);
    editor.querySelector('.fsw-edit-save').disabled = !changed || !isValid();
  }
  function readInputs() {
    if (!draft || !editor.open) return;
    draft.title = editor.querySelector('[name="taskName"]').value;
    draft.instructions = editor.querySelector('[name="instructions"]').value;
    draft.endDate = editor.querySelector('[name="endDate"]').value;
    draft.monthDay = Number(editor.querySelector('[name="monthDay"]').value);
    draft.interval = Number(editor.querySelector('[name="interval"]').value);
    draft.customDays = [...editor.querySelectorAll('[name="customDay"]:checked')].map(input => input.value);
    updateSave();
  }
  function refreshEditor() {
    const labels = {...draft, time:`${timeLabel(draft.time)} ${timezoneSuffix[draft.timezone] || 'PT'}`, channel:draft.destination === 'Slack' ? draft.channel : 'Current chat'};
    editor.querySelectorAll('[data-edit-value]').forEach(node => { node.textContent = labels[node.dataset.editValue]; });
    editor.querySelector('[data-edit-action="repeat"]').setAttribute('aria-checked', String(draft.repeatEnabled));
    for (const field of ['repeat','day','time','end']) editor.querySelector(`[data-edit-select="${field}"]`).disabled = !draft.repeatEnabled;
    for (const [field, visible] of [['day', draft.repeatEnabled && draft.repeat === 'Weekly'],['monthDay',draft.repeatEnabled && draft.repeat === 'Monthly'],['interval',draft.repeatEnabled && draft.repeat === 'Interval'],['customDays',draft.repeatEnabled && draft.repeat === 'Custom'],['endDate',draft.repeatEnabled && draft.end === 'On date']]) {
      const row = editor.querySelector(`[data-setting="${field}"]`);
      row.hidden = !visible;
      row.querySelectorAll('input').forEach(input => { input.disabled = !visible; });
    }
    editor.querySelectorAll('[name="customDay"]').forEach(input => { input.checked = draft.customDays.includes(input.value); });
    editor.querySelector('[name="endDate"]').required = draft.repeatEnabled && draft.end === 'On date';
    editor.querySelector('[data-edit-select="channel"]').disabled = draft.destination !== 'Slack';
    editor.querySelector('[data-edit-action="advanced"]').setAttribute('aria-expanded', String(advanced));
    editor.querySelector('#latest-task-advanced').hidden = !advanced;
    updateSave();
  }
  function optionsFor(field) {
    if (field === 'repeat') return ['Interval','Daily','Weekdays','Weekly','Monthly','Custom'].map(value => ({value,label:value}));
    if (field === 'time') return Array.from({length:96}, (_, i) => {
      const value = `${String(Math.floor(i / 4)).padStart(2,'0')}:${String(i % 4 * 15).padStart(2,'0')}`;
      return {value, label:timeLabel(value)};
    });
    const options = {day:weekdays, end:['Never','On date'], destination:['Slack','Owl'], channel:['#sales-pipeline','#data-platform','#leadership'], timezone:['Pacific Time','Eastern Time','UTC'], model:['Select model','Auto','Thinking']};
    return (options[field] || []).map(value => ({value,label:value}));
  }
  function openMenu(trigger) {
    const field = trigger.dataset.editSelect;
    if (menuField === field) return closeMenu(true);
    closeMenu();
    menuField = field;
    menuTrigger = trigger;
    const menu = editor.querySelector('#latest-task-menu');
    menu.setAttribute('aria-label', trigger.getAttribute('aria-label'));
    menu.innerHTML = optionsFor(field).map(option => `<button type="button" role="option" aria-selected="${option.value === draft[field]}" data-edit-choice="${esc(option.value)}"><span>${esc(option.label)}</span>${option.value === draft[field] ? check : ''}</button>`).join('');
    menu.hidden = false;
    trigger.setAttribute('aria-expanded','true');
    menu.showPopover?.();
    positionMenu();
    const selected = menu.querySelector('[aria-selected="true"]') || menu.querySelector('button');
    selected?.focus({preventScroll:true});
    if (field === 'time' && selected) menu.scrollTop = selected.offsetTop - menu.clientHeight / 2 + selected.offsetHeight / 2;
  }
  function positionMenu() {
    if (!menuField || !menuTrigger) return;
    const menu = editor.querySelector('#latest-task-menu');
    const rect = menuTrigger.getBoundingClientRect();
    const width = Math.min(190, window.innerWidth - 24);
    menu.style.width = `${width}px`;
    menu.style.maxHeight = `${Math.min(menuField === 'time' ? 248 : 240, window.innerHeight - 32)}px`;
    const height = menu.offsetHeight;
    const below = rect.bottom + 4;
    const top = below + height <= window.innerHeight - 12 ? below : Math.max(12, rect.top - height - 4);
    menu.style.left = `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`;
    menu.style.top = `${top}px`;
  }
  function closeMenu(restoreFocus = false) {
    if (!menuField) return;
    const menu = editor.querySelector('#latest-task-menu');
    const trigger = menuTrigger;
    if (menu.matches(':popover-open')) menu.hidePopover();
    menu.hidden = true;
    trigger?.setAttribute('aria-expanded','false');
    menuField = null;
    menuTrigger = null;
    if (restoreFocus) trigger?.focus({preventScroll:true});
  }
  function choose(value) {
    const field = menuField;
    if (!optionsFor(field).some(option => option.value === value)) return;
    draft[field] = value;
    closeMenu(true);
    refreshEditor();
    if (field === 'end' && value === 'On date') editor.querySelector('[name="endDate"]').focus({preventScroll:true});
  }
  function closeEditor({restoreFocus = true} = {}) {
    if (!editor?.open) return;
    const taskId = activeTask?.id;
    closeMenu();
    editor.close();
    draft = null;
    activeTask = null;
    if (restoreFocus) {
      const target = opener?.isConnected && opener.getClientRects().length ? opener : [...document.querySelectorAll(`#fullscreen-workspace [data-task-id="${taskId}"]`)].find(node => !node.closest('[hidden]') && node.getClientRects().length);
      target?.focus({preventScroll:true});
    }
  }
  function handleClick(event, nextApi = {}) {
    const target = event.target.closest('[data-latest-task]');
    if (!target) return false;
    const task = tasksForView().find(item => item.id === target.dataset.taskId);
    if (task) openEditor(task, target, nextApi);
    return !!task;
  }
  window.LatestTasks = Object.freeze({render, handleClick, closeEditor});
})();
