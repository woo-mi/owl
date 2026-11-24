(() => {
  'use strict';

  const routines = [
    {id:'morning-brief',name:'Morning brief',description:'Your day and open follow-ups',schedule:'Weekdays · 9 AM IST'},
    {id:'missed-follow-ups',name:'Catch missed follow-ups',description:'Work worth revisiting',schedule:'Weekdays · 4 PM IST'},
    {id:'weekly-recap',name:'Weekly action-item recap',description:'Decisions and open to-dos',schedule:'Friday · 4 PM IST'}
  ];
  const art = window.Owl3DArtwork;
  const context = {name:"Ayush's Owl",studio:null,color:art.defaultColor,preferences:{},identity:{},selection:[]};
  const freshConversation = () => ({draft:'',attachments:[],messages:[],routineDrafts:{}});
  const conversations = {live:freshConversation(),'no-work':freshConversation()};
  let version = 'live';
  let host,composer,input,sendButton,attachmentInput,infoDialog,draftDialog,status;
  let draftRoutineId = null;
  let dialogOpener = null;
  let restoreDialogFocus = true;
  let scrollFrame = 0;
  let attachmentId = 0;
  let composerObserver;

  const current = () => conversations[version];
  const svg = (paths,extra='') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;
  const icons = {
    chevron:svg('<path d="m9 6 6 6-6 6"/>'),
    clip:svg('<path d="m21.4 11.6-9.2 9.2a6 6 0 0 1-8.5-8.5l10-10a4 4 0 0 1 5.7 5.7l-10 10a2 2 0 0 1-2.8-2.8L16 6"/>'),
    mic:svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>'),
    arrow:svg('<path d="M12 19V5m-6 6 6-6 6 6"/>'),
    link:svg('<path d="M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    close:svg('<path d="m6 6 12 12M18 6 6 18"/>')
  };
  const bullet = text => `<div class="owl-chat-bullet"><span aria-hidden="true">•</span><p>${text}</p></div>`;
  const contextBubble = () => `<section class="owl-chat-bubble owl-chat-context" aria-label="Saved context"><h2>Saved context</h2><p>Product owner at WisdomAI</p>${bullet('Launch readiness and customer follow-ups.')}${bullet('Short review notes. Working with Kapil on the launch review.')}<button class="owl-chat-link" data-chat-action="context" type="button">View what Owl kept</button></section>`;
  const opening = () => version === 'live'
    ? `<p class="owl-chat-bubble">Your context and setup are saved with your Owl.</p>
       <p class="owl-chat-bubble">What would you like to work on first?</p>
       ${contextBubble()}
       <section class="owl-chat-bubble" aria-label="Saved goal"><h2>Saved goal</h2>${bullet('Launch readiness and customer follow-ups.')}<button class="owl-chat-link" data-chat-action="goal" type="button">View goal</button></section>
       <section class="owl-chat-bubble" aria-label="Your routines"><h2>Your routines</h2>${bullet('Morning brief, Weekdays · 9 AM IST')}${bullet('Weekly action-item recap, Friday · 4 PM IST')}</section>
       <p class="owl-chat-bubble owl-chat-note">Let's draft your <button class="owl-chat-link" data-chat-action="note" type="button">${icons.link}<span>launch review note</span></button></p>`
    : `<p class="owl-chat-bubble">Your reviewed context is saved with your Owl.</p>
       <p class="owl-chat-bubble">Start with a simple routine, or tell me what you need.</p>
       ${contextBubble()}
       <section class="owl-chat-bubble owl-chat-routines" aria-label="Start with a useful routine"><h2>Start with a useful routine</h2><div class="owl-chat-routine-list">${routines.map(routine => `<div class="owl-chat-routine"><p>${routine.name}</p><div class="owl-chat-bullet"><span aria-hidden="true">•</span><div class="owl-chat-routine-detail"><span>${routine.description} · ${routine.schedule}</span><button class="owl-chat-link" data-chat-draft="${routine.id}" type="button">Add draft</button></div></div></div>`).join('')}</div></section>`;

  function setStatus(message) { status.textContent = message; }

  function closeDialogs(restoreFocus = false) {
    restoreDialogFocus = restoreFocus;
    if (infoDialog?.open) infoDialog.close();
    if (draftDialog?.open) draftDialog.close();
    draftRoutineId = null;
  }

  function prepareDialog(dialog) {
    closeDialogs(false);
    dialogOpener = document.activeElement;
    restoreDialogFocus = true;
    dialog.showModal();
  }

  function showInfo(kind) {
    const title = infoDialog.querySelector('#chat-info-title');
    const body = infoDialog.querySelector('.owl-chat-info-body');
    body.replaceChildren();
    let lines;
    if (kind === 'goal') {
      title.textContent = 'Saved goal';
      lines = ['Launch readiness and customer follow-ups.','Bring positioning, demo readiness and next owners together.'];
    } else {
      title.textContent = kind === 'profile' ? context.name : 'Saved context';
      lines = [context.identity.role || 'Product owner at WisdomAI',context.identity.workSummary || 'Launch readiness and customer follow-ups.',context.identity.currentPriority || 'Short review notes. Working with Kapil on the launch review.'];
    }
    lines.forEach(text => { const p = document.createElement('p');p.textContent = text;body.append(p); });
    prepareDialog(infoDialog);
  }

  function showDraft(id) {
    const routine = routines.find(item => item.id === id);
    if (!routine) return;
    const draft = current().routineDrafts[id] || routine;
    const form = draftDialog.querySelector('form');
    form.elements.namedItem('name').value = draft.name;
    form.elements.namedItem('schedule').value = draft.schedule;
    form.querySelectorAll('input').forEach(field => field.setCustomValidity(''));
    prepareDialog(draftDialog);
    draftRoutineId = id;
    form.elements.namedItem('name').focus();
  }

  function updateDraftButtons() {
    host.querySelectorAll('[data-chat-draft]').forEach(button => {
      const added = Boolean(current().routineDrafts[button.dataset.chatDraft]);
      button.textContent = added ? 'Draft added' : 'Add draft';
      button.setAttribute('aria-label',`${added ? 'Edit draft for' : 'Add draft for'} ${routines.find(item => item.id === button.dataset.chatDraft).name}`);
    });
  }

  function attachmentElement(attachment,{removable=false}={}) {
    const item = document.createElement('div');
    item.className = 'owl-chat-attachment';
    if (attachment.url) {
      const image = document.createElement('img');
      image.src = attachment.url;
      image.alt = '';
      item.append(image);
    }
    const name = document.createElement('span');
    name.textContent = attachment.name;
    item.append(name);
    if (removable) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.chatRemove = attachment.id;
      remove.setAttribute('aria-label',`Remove ${attachment.name}`);
      remove.innerHTML = icons.close;
      item.append(remove);
    }
    return item;
  }

  function messageElement(message) {
    const row = document.createElement('div');
    row.className = `owl-chat-message${message.role === 'user' ? ' is-user' : ''}`;
    const bubble = document.createElement('div');
    bubble.className = 'owl-chat-bubble';
    if (message.text) { const text = document.createElement('p');text.textContent = message.text;bubble.append(text); }
    message.attachments?.forEach(attachment => bubble.append(attachmentElement(attachment)));
    const time = document.createElement('p');
    time.className = 'owl-chat-timestamp';
    time.textContent = `${message.role === 'user' ? 'You' : 'Demo reply'} · ${message.time}`;
    row.append(bubble,time);
    return row;
  }

  function resizeInput() {
    input.style.height = '20px';
    input.style.height = `${Math.min(112,Math.max(20,input.scrollHeight))}px`;
    input.style.overflowY = input.scrollHeight > 112 ? 'auto' : 'hidden';
  }

  function renderComposer() {
    input.value = current().draft;
    const attachments = host.querySelector('#chat-draft-attachments');
    attachments.replaceChildren(...current().attachments.map(attachment => attachmentElement(attachment,{removable:true})));
    attachments.hidden = !current().attachments.length;
    sendButton.disabled = !current().draft.trim() && !current().attachments.length;
    resizeInput();
  }

  function renderConversation() {
    host.dataset.chatVersion = version;
    host.querySelector('#chat-opening').innerHTML = opening();
    host.querySelector('#chat-live-messages').replaceChildren(...current().messages.map(messageElement));
    updateDraftButtons();
    renderComposer();
  }

  function send() {
    const conversation = current();
    const text = conversation.draft.trim();
    if (!text && !conversation.attachments.length) return;
    const time = new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    const messages = [
      {role:'user',text,time,attachments:conversation.attachments},
      {role:'owl',text:'Let’s turn that into a clear next step. What would you like to accomplish?',time}
    ];
    conversation.messages.push(...messages);
    conversation.draft = '';
    conversation.attachments = [];
    const log = host.querySelector('#chat-live-messages');
    messages.forEach(message => log.append(messageElement(message)));
    renderComposer();
    setStatus('Message added to this local prototype chat.');
    input.focus({preventScroll:true});
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (!host.hidden) log.lastElementChild.scrollIntoView({block:'end',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    });
  }

  function build() {
    host = document.getElementById('chat-view');
    if (!host) return false;
    host.innerHTML = `<header class="owl-chat-header"><div class="owl-chat-avatar" aria-hidden="true"></div><div class="owl-chat-profile"><h1 id="chat-title" tabindex="-1"><button id="chat-profile-button" type="button" aria-haspopup="dialog"><span></span>${icons.chevron}</button></h1><p>Active now</p></div></header>
      <div class="owl-chat-conversation"><p class="owl-chat-date">Sat, Oct 3, 2026</p><div id="chat-opening" class="owl-chat-opening"></div><p class="owl-chat-timestamp">9:38 AM</p><div id="chat-live-messages" class="owl-chat-live-messages" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions"></div></div>
      <div class="owl-chat-composer-wrap"><div id="chat-draft-attachments" class="owl-chat-draft-attachments" aria-label="Local attachments" hidden></div><form class="owl-chat-composer" aria-label="Message composer"><textarea id="chat-message" rows="1" maxlength="8000" aria-label="Message your Owl" placeholder="What can I help you with today?"></textarea><div class="owl-chat-composer-actions"><button id="chat-attach" class="owl-chat-icon-button" type="button" aria-label="Attach a local file" title="Attach a local file">${icons.clip}</button><button id="chat-dictate" class="owl-chat-icon-button" type="button" aria-label="Try sample dictation" title="Try sample dictation">${icons.mic}</button><button id="chat-send" class="owl-chat-send" type="submit" aria-label="Send message" disabled>${icons.arrow}</button></div></form><input id="chat-attachment-input" type="file" multiple hidden><p id="chat-local-status" class="sr-only" role="status" aria-live="polite"></p></div>
      <dialog id="chat-info-dialog" class="owl-chat-dialog" aria-labelledby="chat-info-title"><button class="dialog-close" data-chat-dismiss type="button" aria-label="Close details">${icons.close}</button><h2 id="chat-info-title"></h2><div class="owl-chat-info-body"></div><div class="dialog-actions"><button class="dialog-button primary" data-chat-dismiss type="button">Close</button></div></dialog>
      <dialog id="chat-draft-dialog" class="owl-chat-dialog" aria-labelledby="chat-draft-title"><form><button class="dialog-close" data-chat-dismiss type="button" aria-label="Close routine draft">${icons.close}</button><h2 id="chat-draft-title">Routine draft</h2><p class="owl-chat-draft-note">This draft stays in this prototype.</p><label class="owl-chat-draft-field">Name<input name="name" maxlength="120" required></label><label class="owl-chat-draft-field">Schedule<input name="schedule" maxlength="120" required></label><div class="dialog-actions"><button class="dialog-button" data-chat-dismiss type="button">Cancel</button><button class="dialog-button primary" type="submit">Save draft</button></div></form></dialog>`;
    composer = host.querySelector('.owl-chat-composer');
    input = host.querySelector('#chat-message');
    sendButton = host.querySelector('#chat-send');
    attachmentInput = host.querySelector('#chat-attachment-input');
    infoDialog = host.querySelector('#chat-info-dialog');
    draftDialog = host.querySelector('#chat-draft-dialog');
    status = host.querySelector('#chat-local-status');
    const composerWrap = host.querySelector('.owl-chat-composer-wrap');
    composerObserver = new ResizeObserver(() => {
      if (host.hidden) return;
      const height = composerWrap.getBoundingClientRect().height;
      if (height > 0) host.style.setProperty('--chat-composer-height',`${Math.ceil(height)}px`);
    });
    composerObserver.observe(composerWrap);
    composer.addEventListener('submit',event => { event.preventDefault();send(); });
    input.addEventListener('input',() => {
      current().draft = input.value;
      sendButton.disabled = !input.value.trim() && !current().attachments.length;
      resizeInput();
    });
    input.addEventListener('keydown',event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault();send(); }
    });
    host.addEventListener('click',event => {
      const action = event.target.closest('[data-chat-action]');
      if (action?.dataset.chatAction === 'note') {
        current().draft = 'Draft my launch review note.';
        renderComposer();
        input.focus();
      } else if (action) showInfo(action.dataset.chatAction);
      const draft = event.target.closest('[data-chat-draft]');
      if (draft) showDraft(draft.dataset.chatDraft);
      if (event.target.closest('#chat-profile-button')) showInfo('profile');
      if (event.target.closest('[data-chat-dismiss]')) closeDialogs(true);
      if (event.target.closest('#chat-attach')) attachmentInput.click();
      if (event.target.closest('#chat-dictate')) {
        const sample = 'Help me prepare my launch review.';
        current().draft = current().draft ? `${current().draft}\n${sample}` : sample;
        renderComposer();
        input.focus();
        setStatus('Sample voice draft added. Edit it before sending.');
      }
      const remove = event.target.closest('[data-chat-remove]');
      if (remove) {
        const item = current().attachments.find(attachment => attachment.id === remove.dataset.chatRemove);
        if (item?.url) URL.revokeObjectURL(item.url);
        current().attachments = current().attachments.filter(attachment => attachment.id !== remove.dataset.chatRemove);
        renderComposer();
        host.querySelector('#chat-attach').focus();
      }
    });
    attachmentInput.addEventListener('change',() => {
      [...attachmentInput.files].forEach(file => current().attachments.push({id:String(++attachmentId),name:file.name,url:file.type.startsWith('image/') ? URL.createObjectURL(file) : null}));
      attachmentInput.value = '';
      renderComposer();
      setStatus('Files attached locally. Nothing has been uploaded.');
      input.focus();
    });
    [infoDialog,draftDialog].forEach(dialog => {
      dialog.addEventListener('close',() => {
        if (restoreDialogFocus && !host.hidden && dialogOpener?.isConnected) dialogOpener.focus({preventScroll:true});
      });
      dialog.addEventListener('click',event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialogs(true);
      });
    });
    draftDialog.querySelector('form').addEventListener('input',event => event.target.setCustomValidity?.(''));
    draftDialog.querySelector('form').addEventListener('submit',event => {
      event.preventDefault();
      if (!draftRoutineId) return;
      const draft = {};
      for (const key of ['name','schedule']) {
        const field = event.currentTarget.elements.namedItem(key);
        draft[key] = field.value.trim();
        if (!draft[key]) { field.setCustomValidity('Please enter a value.');field.reportValidity();return; }
      }
      current().routineDrafts[draftRoutineId] = draft;
      updateDraftButtons();
      closeDialogs(true);
      setStatus('Routine draft saved in this prototype.');
    });
    return true;
  }

  function open({name,studio,color,preferences,identity,selection} = {}) {
    if (!host?.isConnected && !build()) return;
    if (typeof name === 'string' && name.trim()) context.name = name.trim();
    if (studio) context.studio = art.normalize(studio);
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) context.color = color;
    if (preferences && typeof preferences === 'object') context.preferences = {...preferences};
    if (identity && typeof identity === 'object') context.identity = {...identity};
    if (Array.isArray(selection)) context.selection = [...selection];
    host.querySelector('.owl-chat-avatar').innerHTML = art.render(context.studio || art.defaults,context.color);
    const sidebarOwl = document.querySelector('#sidebar [data-nav="Owls"] .nav-icon');
    if (sidebarOwl) sidebarOwl.innerHTML = art.render(context.studio || art.defaults,context.color);
    host.querySelector('#chat-profile-button span').textContent = context.name;
    renderConversation();
  }

  function setVersion(next) {
    const normalized = next === 'no-work' ? 'no-work' : 'live';
    if (version === normalized) return version;
    close();
    version = normalized;
    if (host?.isConnected) renderConversation();
    return version;
  }

  function close() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    closeDialogs(false);
  }

  window.OwlChat = Object.freeze({open,setVersion,close});
})();
