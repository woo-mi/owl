(() => {
  'use strict';

  const cards = [
    {id:'morning-brief', title:'Morning brief', description:'Today’s commitments, priorities and follow-ups.', metadata:'Routine · Weekdays · 9 AM IST · Only you', kind:'routine'},
    {id:'missed-follow-ups', title:'Catch missed follow-ups', description:'Commitments and action items worth revisiting.', metadata:'Routine · Weekdays · 4 PM IST · Last 7 days', kind:'routine'},
    {id:'customer-feedback', title:'Close the loop on customer feedback', description:'Turn review feedback into a clear pilot plan.', metadata:'First step · Gather decisions and next owners', metadataV2:'Goal · First step · Gather decisions and next owners', kind:'goal'},
    {id:'launch-review', title:'Get the launch review ready', description:'Bring positioning, demo readiness and owners together.', metadata:'Goal · First step · Prepare a short review note', kind:'goal'}
  ];
  const state = {
    name:"Ayush's Owl", studio:null, color:'#FA70AB',
    preferences:{slack:false, email:false, length:'short', personality:'direct'},
    identity:{
      role:'Product at WisdomAI',
      workSummary:'Working on launch readiness and customer follow-ups.',
      currentPriority:'Get Wednesday’s launch review ready. Bring positioning,\ndemo readiness and next owners together.'
    }
  };
  const selected = new Set();
  let host;
  let dialog;
  let restoreDialogFocus = true;
  let readyVersion = 'v1';

  const snapshot = () => ({
    name:state.name, studio:state.studio ? {...state.studio} : {...window.OwlStudioArtwork.defaults}, color:state.color,
    preferences:{...state.preferences}, identity:{...state.identity}, selection:[...selected]
  });
  const icon = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kind === 'routine' ? '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/>' : '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'}</svg>`;
  const leadingIcon = kind => kind === 'routine' ? icon(kind) : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.75a9.25 9.25 0 1 0 9.25 9.25M12 6.75a5.25 5.25 0 1 0 5.25 5.25M12 12l7.5-7.5M14.25 5.25V2.75l4.5 2.5 2.5 4.5h-2.5"/></svg>';

  function renderVersion() {
    host.dataset.readyVersion = readyVersion;
    cards.forEach(card => {
      host.querySelector(`[data-ready-metadata="${card.id}"]`).textContent = readyVersion === 'v2' ? card.metadataV2 || card.metadata : card.metadata;
    });
  }

  function setVersion(version) {
    readyVersion = version === 'v2' ? 'v2' : 'v1';
    if (host?.isConnected) renderVersion();
    return readyVersion;
  }

  function renderIdentity() {
    host.querySelector('#ready-role').textContent = state.identity.role;
    host.querySelector('#ready-work-summary').textContent = state.identity.workSummary;
    host.querySelector('#ready-current-priority').textContent = state.identity.currentPriority;
  }

  function dismissEditor(restoreFocus = true) {
    restoreDialogFocus = restoreFocus;
    if (dialog?.open) dialog.close();
  }

  function editIdentity() {
    const form = dialog.querySelector('form');
    Object.entries(state.identity).forEach(([key,value]) => {
      form.elements.namedItem(key).value = value;
      form.elements.namedItem(key).setCustomValidity('');
    });
    restoreDialogFocus = true;
    dialog.showModal();
    form.elements.namedItem('role').focus();
  }

  function build() {
    host = document.getElementById('ready-view');
    if (!host) return false;
    host.setAttribute('aria-labelledby','ready-title');
    host.innerHTML = `<header class="heading"><h1 id="ready-title" tabindex="-1">Your Owl is ready</h1><p>Here’s a first look at your work, and a few useful ways to start.</p></header>
      <section class="owl-ready-identity" aria-labelledby="ready-identity-label">
        <h2 id="ready-identity-label" class="ready-section-label">Personal Identity</h2>
        <div class="ready-identity-row"><div class="ready-identity-copy"><p id="ready-role"></p><p id="ready-work-summary" class="ready-secondary"></p></div><button id="ready-edit" class="ready-edit" type="button" aria-haspopup="dialog">Review and edit ↗</button></div>
      </section>
      <section class="owl-ready-priority" aria-labelledby="ready-priority-label"><h2 id="ready-priority-label" class="ready-section-label">What matters now</h2><p id="ready-current-priority"></p></section>
      <section class="owl-ready-suggestions" aria-labelledby="ready-suggestions-title"><h2 id="ready-suggestions-title">Useful start</h2><p class="ready-suggestions-subtitle">Set up the personalized goals and routines</p><div class="ready-card-grid">
        ${cards.map(card => `<article class="ready-card" aria-labelledby="ready-card-title-${card.id}"><div class="ready-card-leading-icon" aria-hidden="true">${leadingIcon(card.kind)}</div><div class="ready-card-summary"><h3 id="ready-card-title-${card.id}">${card.title}</h3><p class="ready-card-description">${card.description}</p></div><p class="ready-card-metadata">${leadingIcon(card.kind)}<span data-ready-metadata="${card.id}">${card.metadata}</span></p><button class="ready-use" type="button" data-ready-card="${card.id}" aria-pressed="false" aria-label="Use ${card.title}">Use</button></article>`).join('')}
      </div></section>
      <div class="footer-spacer"></div>
      <footer class="flow-footer ready-footer"><button id="ready-skip" class="footer-action secondary" type="button">Skip for now</button><ol class="progress" aria-label="Setup complete"><li aria-label="Step 1 completed"></li><li aria-label="Step 2 completed"></li><li class="is-current" aria-label="Step 3 completed"></li></ol><button id="ready-save" class="footer-action primary" type="button">Save</button></footer>
      <dialog id="ready-identity-dialog" class="owl-ready-dialog" aria-labelledby="ready-dialog-title"><form>
        <button class="dialog-close" data-ready-dismiss type="button" aria-label="Close identity editor"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        <h2 id="ready-dialog-title">Review and edit</h2>
        <label class="ready-edit-field">Role<input name="role" type="text" required maxlength="120" autocomplete="organization-title"></label>
        <label class="ready-edit-field">Work summary<textarea name="workSummary" required maxlength="280" rows="3"></textarea></label>
        <label class="ready-edit-field">Current priority<textarea name="currentPriority" required maxlength="400" rows="3"></textarea></label>
        <div class="dialog-actions"><button class="dialog-button" data-ready-dismiss type="button">Cancel</button><button class="dialog-button primary" type="submit">Save changes</button></div>
      </form></dialog>`;
    dialog = host.querySelector('#ready-identity-dialog');
    host.addEventListener('click', event => {
      const use = event.target.closest('[data-ready-card]');
      if (use) {
        const id = use.dataset.readyCard;
        selected.has(id) ? selected.delete(id) : selected.add(id);
        renderSelections();
      }
      if (event.target.closest('#ready-edit')) editIdentity();
      if (event.target.closest('[data-ready-dismiss]')) dismissEditor();
      const action = event.target.closest('#ready-save, #ready-skip');
      if (action) window.dispatchEvent(new CustomEvent(action.id === 'ready-save' ? 'owl-ready:save' : 'owl-ready:skip', {detail:snapshot()}));
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismissEditor();
    });
    dialog.addEventListener('close', () => {
      if (restoreDialogFocus && !host.hidden) host.querySelector('#ready-edit').focus({preventScroll:true});
    });
    dialog.querySelector('form').addEventListener('input', event => event.target.setCustomValidity?.(''));
    dialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const edits = {};
      for (const key of Object.keys(state.identity)) {
        const field = event.currentTarget.elements.namedItem(key);
        edits[key] = field.value.trim();
        if (!edits[key]) { field.setCustomValidity('Please enter a value.'); field.reportValidity(); return; }
      }
      state.identity = edits;
      renderIdentity();
      dismissEditor();
    });
    return true;
  }

  function renderSelections() {
    host.querySelectorAll('[data-ready-card]').forEach(button => {
      const card = cards.find(item => item.id === button.dataset.readyCard);
      const active = selected.has(card.id);
      button.textContent = active ? 'Added' : 'Use';
      button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',`${active ? 'Added' : 'Use'} ${card.title}`);
    });
  }

  function open({name, studio, color, preferences} = {}) {
    if (!host?.isConnected && !build()) return;
    if (typeof name === 'string' && name.trim()) state.name = name.trim();
    if (studio) state.studio = window.OwlStudioArtwork.normalize(studio);
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) state.color = color;
    if (preferences && typeof preferences === 'object') state.preferences = {...state.preferences,...preferences};
    renderIdentity();
    renderSelections();
    renderVersion();
  }

  function close() { dismissEditor(false); }
  window.OwlReady = Object.freeze({open, close, snapshot, setVersion});
})();
