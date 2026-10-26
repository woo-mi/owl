(() => {
  'use strict';

  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const pencil = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5M4 15 15.5 3.5a3.54 3.54 0 0 1 5 5L9 20l-6 1 1-6Z"/></svg>';
  const trash = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7M14 10v7"/></svg>';
  const profile = {
    id: 'profile', title: 'Profile', updated: 'Oct 23, 2026', shortDate: 'Oct 23',
    summary: 'Who Woomi is - employer, product, and role; read for any work-related request.',
    details: [
      'Works at WisdomAI; refers to "our WisdomAI product" (serves business users.)',
      "Working on UI card for the product's daily brief feature. FINAL WRITE"
    ]
  };
  const settings = [
    { id: 'search', title: 'Search and reference chats', description: 'Allow Owl to search for relevant details in past chats.', enabled: false, help: 'When enabled, Owl can use relevant details from past chats to answer your questions.' },
    { id: 'generate', title: 'Generate memory from chats', description: 'Allow Owl to generate memory from your chats.', enabled: true, help: 'When enabled, Owl can save useful context from your chats. Review or delete saved memories below.' }
  ];
  const importPrompt = 'Summarize the memories you have saved about me, including my work, preferences, and ongoing projects. Use plain text so I can review the details and bring them into another AI assistant.';
  let host = null;
  let api = {};
  let view = 'overview';
  let entries = [profile];
  let activeId = 'profile';
  let deleted = null;
  let help = null;
  let importedCount = 0;

  function announce(message) {
    if (api.announce) api.announce(message);
    else {
      const status = host && host.querySelector('.fsm-status');
      if (status) status.textContent = message;
    }
  }

  function activeEntry() { return entries.find(entry => entry.id === activeId); }

  function setView(next, focusSelector) {
    view = next;
    render();
    if (focusSelector) host.querySelector(focusSelector)?.focus();
  }

  function settingRow(setting) {
    return `<div class="fsm-setting">
      <div class="fsm-setting-copy"><p class="fsm-setting-title" id="fsm-${setting.id}-title">${setting.title}</p>
        <p class="fsm-setting-description" id="fsm-${setting.id}-description">${setting.description} <button class="fsm-learn" type="button" data-fsm-action="learn" data-id="${setting.id}" aria-expanded="${help === setting.id}" aria-controls="fsm-${setting.id}-help">Learn more</button></p>
        <p class="fsm-help" id="fsm-${setting.id}-help"${help === setting.id ? '' : ' hidden'}>${setting.help}</p>
      </div>
      <button class="fsm-switch" type="button" role="switch" aria-checked="${setting.enabled}" aria-labelledby="fsm-${setting.id}-title" aria-describedby="fsm-${setting.id}-description" data-fsm-action="setting" data-id="${setting.id}"></button>
    </div>`;
  }

  function memoryRow(entry) {
    const summary = entry.id === 'profile' ? entry.summary.replace(' is - ', ' is — ') : entry.summary;
    return `<div class="fsm-row" data-memory-id="${entry.id}">
      <button class="fsm-row-open" type="button" data-fsm-action="open" data-id="${entry.id}" aria-label="Open ${escape(entry.title)} memory">
        <span class="fsm-row-name">${escape(entry.title)}</span><span class="fsm-row-summary">${escape(summary)}</span><span class="fsm-row-date">Updated ${escape(entry.shortDate)}</span>
      </button>
      <div class="fsm-row-actions"><button class="fsm-icon-button" type="button" data-fsm-action="edit" data-id="${entry.id}" aria-label="Edit ${escape(entry.title)} memory">${pencil}</button><button class="fsm-icon-button" type="button" data-fsm-action="delete" data-id="${entry.id}" aria-label="Delete ${escape(entry.title)} memory">${trash}</button></div>
    </div>`;
  }

  function overview() {
    return `<div class="fsm-overview"><section class="fsm-settings" aria-label="Memory settings">${settings.map(settingRow).join('')}
      <div class="fsm-setting fsm-import-setting"><div class="fsm-setting-copy"><p class="fsm-setting-title">Import memory from other AI providers</p><p class="fsm-setting-description">Bring relevant context and data from another AI provider to Owl. We’ll provide a prompt you can use to fetch the memory from your other account.</p><button type="button" class="fsm-learn" data-fsm-action="learn" data-id="import" aria-expanded="${help === 'import'}" aria-controls="fsm-import-help">Learn more</button><p class="fsm-help" id="fsm-import-help"${help === 'import' ? '' : ' hidden'}>Use the provided prompt in your other AI account, then review and paste its response here to add it to this prototype’s memory.</p></div><button type="button" class="fsm-button" data-fsm-action="start-import">Start import</button></div>
      </section><section class="fsm-you" aria-labelledby="fsm-you-heading"><h3 id="fsm-you-heading">You</h3>${entries.length ? entries.map(memoryRow).join('') : '<p class="fsm-empty">No saved memories.</p>'}</section>${undoMessage()}</div>`;
  }

  function undoMessage() {
    return deleted ? `<div class="fsm-undo" role="status"><span>${escape(deleted.entry.title)} memory deleted.</span><button type="button" class="fsm-text-button" data-fsm-action="undo">Undo</button></div>` : '';
  }

  function detail() {
    const entry = activeEntry();
    if (!entry) return overview();
    return `<section class="fsm-detail" aria-labelledby="fsm-profile-heading"><div class="fsm-detail-heading"><h3 id="fsm-profile-heading" tabindex="-1">${escape(entry.title)}</h3><button type="button" class="fsm-button" data-fsm-action="delete" data-id="${entry.id}">Delete</button></div><div class="fsm-detail-fields"><section><h4>Last updated</h4><p>${escape(entry.updated)}</p></section><section><h4>Summary</h4><p>${escape(entry.summary)}</p></section><section class="fsm-detail-list"><h4>Details</h4><ul>${entry.details.map(item => `<li>${escape(item)}</li>`).join('')}</ul></section></div></section>`;
  }

  function editor() {
    const entry = activeEntry();
    if (!entry) return overview();
    return `<form class="fsm-editor" data-fsm-form="edit"><h3>Edit ${escape(entry.title)}</h3><label for="fsm-edit-summary">Summary</label><textarea id="fsm-edit-summary" name="summary" rows="2" required>${escape(entry.summary)}</textarea><label for="fsm-edit-details">Details</label><textarea id="fsm-edit-details" name="details" rows="6" required aria-describedby="fsm-edit-hint">${escape(entry.details.join('\n'))}</textarea><p class="fsm-field-hint" id="fsm-edit-hint">Use a new line for each detail.</p><div class="fsm-form-actions"><button type="button" class="fsm-button" data-fsm-action="cancel-edit">Cancel</button><button type="submit" class="fsm-button fsm-button-primary">Save</button></div></form>`;
  }

  function importView() {
    return `<section class="fsm-import" aria-labelledby="fsm-import-heading"><h3 id="fsm-import-heading" tabindex="-1">Import memory</h3><p>Copy this prompt into your other AI account.</p><div class="fsm-import-prompt"><p>${escape(importPrompt)}</p><button class="fsm-button" type="button" data-fsm-action="copy-prompt">Copy prompt</button></div><form class="fsm-editor" data-fsm-form="import"><label for="fsm-import-text">Review and paste the memory you want to import</label><textarea id="fsm-import-text" name="memory" rows="7" required placeholder="Paste memory here"></textarea><div class="fsm-form-actions"><button type="button" class="fsm-button" data-fsm-action="back">Cancel</button><button type="submit" class="fsm-button fsm-button-primary">Import</button></div></form></section>`;
  }

  function render() {
    if (!host) return;
    host.classList.add('fsm');
    host.dataset.fsmView = view;
    host.innerHTML = (view === 'profile' ? detail() : view === 'edit' ? editor() : view === 'import' ? importView() : overview()) + '<span class="fsm-status" role="status" aria-live="polite"></span>';
    if (api.onDetailChange) api.onDetailChange({ isDetail: view !== 'overview', title: 'Memory' });
  }

  function deleteEntry(id) {
    const index = entries.findIndex(entry => entry.id === id);
    if (index === -1) return;
    deleted = { entry: entries[index], index };
    entries.splice(index, 1);
    setView('overview', '[data-fsm-action="undo"]');
    announce(`${deleted.entry.title} memory deleted. Undo is available.`);
  }

  function back() {
    if (view === 'overview') return false;
    const target = activeId;
    setView('overview', `[data-fsm-action="open"][data-id="${target}"]`);
    return true;
  }

  async function handleClick(event) {
    const button = event.target.closest('[data-fsm-action]');
    if (!button || !host.contains(button)) return;
    const action = button.dataset.fsmAction;
    const id = button.dataset.id;
    if (action === 'setting') {
      const setting = settings.find(item => item.id === id);
      setting.enabled = !setting.enabled;
      button.setAttribute('aria-checked', String(setting.enabled));
      announce(`${setting.title} ${setting.enabled ? 'on' : 'off'}.`);
    } else if (action === 'learn') {
      help = help === id ? null : id;
      render();
      host.querySelector(`[data-fsm-action="learn"][data-id="${id}"]`)?.focus();
    } else if (action === 'open' || action === 'edit') {
      activeId = id;
      setView(action === 'edit' ? 'edit' : 'profile', action === 'edit' ? '#fsm-edit-summary' : '#fsm-profile-heading');
    } else if (action === 'delete') deleteEntry(id);
    else if (action === 'undo' && deleted) {
      const restoredId = deleted.entry.id;
      entries.splice(deleted.index, 0, deleted.entry);
      deleted = null;
      render();
      host.querySelector(`[data-fsm-action="open"][data-id="${restoredId}"]`)?.focus();
      announce('Memory restored.');
    } else if (action === 'cancel-edit') setView('profile', '#fsm-profile-heading');
    else if (action === 'start-import') setView('import', '#fsm-import-heading');
    else if (action === 'back') back();
    else if (action === 'copy-prompt') {
      try {
        await navigator.clipboard.writeText(importPrompt);
        button.textContent = 'Copied';
        announce('Import prompt copied.');
      } catch (_) {
        const range = document.createRange();
        range.selectNodeContents(host.querySelector('.fsm-import-prompt p'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        announce('Prompt selected. Use your copy shortcut to copy it.');
      }
    }
  }

  function handleSubmit(event) {
    const form = event.target.closest('[data-fsm-form]');
    if (!form || !host.contains(form)) return;
    event.preventDefault();
    const data = new FormData(form);
    if (form.dataset.fsmForm === 'edit') {
      const entry = activeEntry();
      const summary = String(data.get('summary') || '').trim();
      const details = String(data.get('details') || '').split('\n').map(line => line.trim()).filter(Boolean);
      if (!entry || !summary || !details.length) return;
      entry.summary = summary;
      entry.details = details;
      entry.updated = 'Today';
      entry.shortDate = 'today';
      setView('profile', '#fsm-profile-heading');
      announce('Memory updated.');
    } else {
      const memory = String(data.get('memory') || '').trim();
      if (!memory) return;
      const id = `imported-${++importedCount}`;
      const lines = memory.split('\n').map(line => line.trim()).filter(Boolean);
      entries.push({ id, title: importedCount === 1 ? 'Imported memory' : `Imported memory ${importedCount}`, updated: 'Today', shortDate: 'today', summary: lines[0], details: lines });
      activeId = id;
      setView('overview', `[data-fsm-action="open"][data-id="${id}"]`);
      announce('Memory imported.');
    }
  }

  window.FullscreenMemory = {
    mount(container, callbacks = {}) {
      if (host) {
        host.removeEventListener('click', handleClick);
        host.removeEventListener('submit', handleSubmit);
      }
      host = container;
      api = callbacks;
      host.addEventListener('click', handleClick);
      host.addEventListener('submit', handleSubmit);
      render();
    },
    resetView() { view = 'overview'; help = null; render(); },
    isDetail() { return view !== 'overview'; },
    back,
    focusTarget() { return host?.querySelector('#fsm-profile-heading, #fsm-edit-summary, #fsm-import-heading, [data-fsm-action="open"], [data-fsm-action="setting"]'); }
  };
})();
