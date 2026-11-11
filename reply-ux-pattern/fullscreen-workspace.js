/* Workspace Page (Pen PGWL8): a full-page workspace beside the compact app rail. */
(() => {
  'use strict';
  const SECTIONS = ['profile', 'goals', 'connections', 'schedules', 'artifacts', 'memory', 'settings', 'history'];
  const LABELS = { profile: 'Profile', goals: 'Goals', connections: 'Connections', schedules: 'Schedules', artifacts: 'Artifacts', memory: 'Memory', settings: 'Settings', history: 'History' };
  const icon = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const backIcon = icon('<path d="m14 6-6 6 6 6"/>');
  const arrowIcon = icon('<path d="m5 12 7-7 7 7M12 5v15"/>');
  // Original Central Icon System target artwork from the Goals Pen frame.
  const goalsIcon = icon('<path transform="translate(14.25 2.23417)" d="M3.626.17583l.874 2.84 2.84.874c.08487.02607.14954.0952.16991.18162.02037.08641-.00662.17715-.07091.23838l-2.81 2.66c-.3717.35106-.86373.54644-1.375.546H0V4.26183c.00008-.51107.19581-1.00271.547-1.374l2.659-2.81c.06109-.06431.15169-.09144.23807-.07128.08638.02016.15562.08457.18193.16928"/><path transform="translate(6.76095 6.821)" d="M4.23905 0C1.58539.52736-.23662 2.98014.02495 5.67303c.26157 2.69288 2.52155 4.74917 5.2271 4.75597 2.51637-.00011 4.68089-1.78084 5.166-4.25"/><path transform="translate(2.75023 2.74942)" d="M9.74977.01358C5.92294-.19337 2.36481 1.98094.80311 5.48073c-1.5617 3.49979-.80351 7.60016 1.90642 10.31009 2.70993 2.70993 6.8103 3.46812 10.31009 1.90642 3.49979-1.5617 5.6741-5.11984 5.46715-8.94666m-6.987-1.75-2.25 2.25"/>');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function start() {
    const content = window.FullscreenWorkspaceContent;
    const schedules = window.FullscreenSchedules;
    const memory = window.FullscreenMemory;
    const history = window.FullscreenHistory;
    const profile = window.WorkspaceProfile;
    const isOct28 = () => document.body.dataset.prototypeView === 'latest-oct-28';
    const isLatest = () => ['latest-oct-27', 'latest-oct-28'].includes(document.body.dataset.prototypeView);
    const presentationKey = () => isOct28() ? `latest-oct-28:${window.MVPVersions.getVariant()}` : isLatest() ? document.body.dataset.prototypeView : 'legacy';
    const defaultSection = () => isOct28() ? 'goals' : isLatest() ? 'schedules' : 'connections';
    const initialSection = defaultSection();
    const sectionEnabled = id => ['profile', 'goals'].includes(id) ? isOct28() : !(isLatest() && ['connections', 'history'].includes(id));
    const sectionLabel = id => isLatest() && id === 'schedules' ? 'Tasks' : LABELS[id];
    const taskController = () => isLatest() ? window.LatestTasks : schedules;
    const trigger = document.getElementById('chief-profile');
    const dialog = document.createElement('dialog');
    dialog.id = 'fullscreen-workspace';
    dialog.className = 'fsw-dialog workspace-page';
    dialog.setAttribute('role', 'region');
    dialog.setAttribute('aria-labelledby', 'fsw-title');
    dialog.innerHTML = `<aside class="fsw-sidebar"><button type="button" class="fsw-close workspace-chat-back" aria-label="Back to Owl Chat">${icon('<path d="M19 12H5m6-6-6 6 6 6"/>')}<span>Owl Chat</span></button><div class="fsw-identity"><div class="fsw-avatar" aria-hidden="true"></div><div><strong>Chief of staff</strong><span>Active now</span></div></div><div class="fsw-navigation" role="tablist" aria-label="Workspace sections" aria-orientation="vertical">${SECTIONS.map(id => `<button type="button" id="fsw-nav-${id}" class="fsw-nav" role="tab" aria-controls="fsw-section-${id}" aria-selected="${id === 'connections'}" tabindex="${id === 'connections' ? 0 : -1}" data-fsw-section="${id}">${id === 'goals' ? goalsIcon : id === 'history' ? history.icon : content.icons[id === 'profile' ? 'schedules' : id] || ''}<span>${LABELS[id]}</span></button>`).join('')}</div></aside><div class="fsw-main"><header class="fsw-header"><button type="button" class="fsw-back" aria-label="Back to Memory" hidden>${backIcon}</button><h2 id="fsw-title">Connections</h2><button type="button" class="fsw-new-goal" hidden>New goal</button></header><div class="fsw-scroll">${SECTIONS.map(id => `<section id="fsw-section-${id}" class="fsw-panel-content" role="tabpanel" aria-labelledby="fsw-nav-${id}" tabindex="0" ${id === 'connections' ? '' : 'hidden'}></section>`).join('')}<section class="fsw-detail" tabindex="-1" hidden></section></div><form class="fsw-composer"><textarea rows="1" aria-label="Message Chief of staff in workspace" placeholder="Get quick answers and dig in with follow-ups"></textarea><button type="submit" aria-label="Send workspace message" disabled>${arrowIcon}</button></form><div class="fsw-notice" role="status" aria-live="polite"></div></div>`;
    document.body.append(dialog);
    const avatar = trigger.querySelector('[data-pencil-name="ii"]') || trigger.querySelector('.agent-avatar > *');
    if (avatar) {
      const clone = avatar.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      dialog.querySelector('.fsw-avatar').append(clone);
    } else {
      dialog.querySelector('.fsw-avatar').innerHTML = '<img src="assets/owl-mark.svg" alt="">';
    }
    const scroll = dialog.querySelector('.fsw-scroll');
    const detail = dialog.querySelector('.fsw-detail');
    const title = dialog.querySelector('#fsw-title');
    const back = dialog.querySelector('.fsw-back');
    const input = dialog.querySelector('.fsw-composer textarea');
    const composer = dialog.querySelector('.fsw-composer');
    composer.hidden = true;
    dialog.dataset.section = initialSection;
    const send = dialog.querySelector('.fsw-composer button');
    const closeButton = dialog.querySelector('.fsw-close');
    const newGoalButton = dialog.querySelector('.fsw-new-goal');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const sectionScroll = new Map();
    let section = initialSection;
    let presentation = presentationKey();
    const rememberedSections = new Map();
    const scrollKey = id => `${presentation}:${id}`;
    let closing = false;
    let closeTimer;
    let noticeTimer;
    let detailOpener;
    let detailScroll = 0;

    const isActive = () => ['full-screen-workspace', 'latest-oct-27', 'latest-oct-28'].includes(document.body.dataset.prototypeView) ||
      (document.body.dataset.prototypeView === 'multiple-bubbles' &&
       ['bullet-break-replies-more-characters', 'aligned'].includes(document.body.dataset.bubbleFormat));
    const host = id => dialog.querySelector(`#fsw-section-${id}`);
    function announce(message) {
      clearTimeout(noticeTimer);
      dialog.querySelector('.fsw-notice').textContent = message;
      noticeTimer = setTimeout(() => { dialog.querySelector('.fsw-notice').textContent = ''; }, 5000);
    }
    function syncTrigger() {
      const expanded = isActive() ? dialog.open && !closing : document.getElementById('workspace-panel')?.classList.contains('is-open');
      trigger.setAttribute('aria-controls', isActive() ? dialog.id : 'workspace-panel');
      trigger.setAttribute('aria-expanded', String(!!expanded));
      trigger.setAttribute('aria-label', `${expanded ? 'Close' : 'Open'} ${trigger.querySelector('.agent-profile-name').textContent} workspace`);
    }
    function syncLayoutControl() {
      window.dispatchEvent(new CustomEvent('workspace-layout-control-change', {
        detail:{visible:dialog.open && !closing && section === 'goals'}
      }));
    }
    function setHeader(isDetail = false) {
      title.textContent = sectionLabel(section);
      dialog.dataset.section = section;
      dialog.dataset.detail = String(isDetail);
      composer.hidden = section !== 'memory';
      newGoalButton.hidden = section !== 'goals' || isDetail;
      back.hidden = !isDetail;
      back.setAttribute('aria-label', `Back to ${sectionLabel(section)}`);
      syncLayoutControl();
    }
    function render(id) {
      if (id === 'memory') return;
      host(id).innerHTML = id === 'profile' ? profile.render() : id === 'goals' ? window.WorkspaceGoals.render() : id === 'schedules' ? taskController().render()
        : id === 'artifacts' && isLatest() ? window.LatestArtifacts.render()
        : id === 'history' ? history.render() : content.render(id);
    }
    SECTIONS.filter(id => id !== 'memory').forEach(render);
    memory.mount(host('memory'), {
      onDetailChange: ({isDetail}) => {
        if (section === 'memory') { setHeader(isDetail); scroll.scrollTop = 0; }
      }, announce
    });
    function setSection(id, focus = false, rememberScroll = true) {
      if (!SECTIONS.includes(id) || !sectionEnabled(id)) return;
      if (rememberScroll) sectionScroll.set(scrollKey(section), scroll.scrollTop);
      const changed = section !== id;
      section = id;
      detail.hidden = true;
      SECTIONS.forEach(key => {
        host(key).hidden = key !== id;
        const button = dialog.querySelector(`#fsw-nav-${key}`);
        button.setAttribute('aria-selected', String(key === id));
        button.tabIndex = key === id ? 0 : -1;
      });
      if (id === 'memory' && changed) memory.resetView();
      setHeader(id === 'memory' && memory.isDetail());
      scroll.scrollTop = sectionScroll.get(scrollKey(id)) || 0;
      if (focus) dialog.querySelector(`#fsw-nav-${id}`).focus({preventScroll:true});
    }
    function syncPresentation() {
      const next = presentationKey();
      for (const id of SECTIONS) dialog.querySelector(`#fsw-nav-${id}`).hidden = !sectionEnabled(id);
      dialog.querySelector('#fsw-nav-schedules span').textContent = sectionLabel('schedules');
      if (next !== presentation) {
        rememberedSections.set(presentation, section);
        sectionScroll.set(scrollKey(section), scroll.scrollTop);
        presentation = next;
        memory.setPrototype(document.body.dataset.prototypeView);
        render('profile');
        render('goals');
        render('schedules');
        render('artifacts');
        setSection(rememberedSections.get(next) || defaultSection(), false, false);
      }
    }
    function showDetail(detailTitle, html, opener) {
      detailOpener = opener || document.activeElement;
      detailScroll = scroll.scrollTop;
      host(section).hidden = true;
      detail.innerHTML = `<h3>${esc(detailTitle)}</h3>${html}`;
      detail.hidden = false;
      setHeader(true);
      scroll.scrollTop = 0;
      detail.focus({preventScroll:true});
    }
    function goBack() {
      if (!detail.hidden) {
        detail.hidden = true;
        host(section).hidden = false;
        setHeader(false);
        scroll.scrollTop = detailScroll;
        (detailOpener?.isConnected ? detailOpener : dialog.querySelector(`#fsw-nav-${section}`))?.focus({preventScroll:true});
      } else if (section === 'memory' && memory.isDetail()) memory.back();
    }
    function open() {
      if (!isActive()) return;
      clearTimeout(closeTimer);
      closing = false;
      if (dialog.open) { dialog.classList.remove('is-closing'); return; }
      setSection(defaultSection());
      window.dispatchEvent(new Event('mvp-workspace-open'));
      dialog.classList.remove('is-closing');
      document.body.classList.add('fullscreen-workspace-open', 'workspace-page-open');
      document.getElementById('main').inert = true;
      dialog.show();
      syncLayoutControl();
      syncTrigger();
      closeButton.focus({preventScroll:true});
    }
    function close({restoreFocus = true, immediate = false} = {}) {
      if (!dialog.open) return;
      schedules.closeEditor({restoreFocus:false});
      window.LatestTasks?.closeEditor({restoreFocus:false});
      window.WorkspaceGoals?.closeEditor({restoreFocus:false});
      window.OwlCustomizer?.close({restoreFocus:false});
      window.OwlStudio?.close({restoreFocus:false});
      clearTimeout(closeTimer);
      closing = true;
      syncLayoutControl();
      dialog.classList.add('is-closing');
      const finish = () => {
        dialog.close();
        closing = false;
        dialog.classList.remove('is-closing');
        document.body.classList.remove('fullscreen-workspace-open', 'workspace-page-open');
        document.getElementById('main').inert = false;
        syncTrigger();
        if (restoreFocus) trigger.focus({preventScroll:true});
      };
      if (immediate || reduced.matches || dialog.classList.contains('workspace-page')) finish();
      else closeTimer = setTimeout(finish, 180);
    }
    function ask(prompt) {
      close({restoreFocus:false,immediate:true});
      const chatInput = document.getElementById('message-input');
      chatInput.value = [chatInput.value.trim(), prompt].filter(Boolean).join('\n');
      chatInput.dispatchEvent(new Event('input',{bubbles:true}));
      chatInput.focus({preventScroll:true});
    }
    function refreshSchedules() {
      render('schedules');
      if (section === 'schedules' && !detail.hidden) {
        detail.innerHTML = `<h3>All tasks</h3>${taskController().render({directory:true})}`;
      }
    }
    const api = { showDetail, ask, announce, refreshSchedules, rerender: render, back: goBack };
    dialog.addEventListener('click', event => {
      const nav = event.target.closest('[data-fsw-section]');
      if (nav) return setSection(nav.dataset.fswSection);
      if (event.target.closest('.fsw-close')) return close();
      if (event.target.closest('.fsw-new-goal')) return window.WorkspaceGoals.openNew(newGoalButton, api);
      if (event.target.closest('.fsw-back')) return goBack();
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }
      if (section === 'profile') profile.handleClick(event, api);
      else if (section === 'goals') window.WorkspaceGoals.handleClick(event, api);
      else if (section === 'schedules') taskController().handleClick(event, api);
      else if (section === 'artifacts' && isLatest()) window.LatestArtifacts.handleClick(event, api);
      else if (section === 'history') history.handleClick(event, api);
      else if (section !== 'memory') content.handleClick(event, api);
    });
    dialog.addEventListener('input', event => {
      if (section === 'goals') window.WorkspaceGoals.handleInput(event, api);
    });
    dialog.addEventListener('change', event => {
      if (section === 'settings') content.handleChange(event, api);
    });
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      if (!detail.hidden || (section === 'memory' && memory.isDetail())) goBack();
      else close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape' && (!detail.hidden || (section === 'memory' && memory.isDetail()))) {
        event.preventDefault();
        event.stopPropagation();
        goBack();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      const tab = event.target.closest('[role="tab"]');
      if (!tab) return;
      const list = tab.closest('[role="tablist"]');
      const buttons = [...list.querySelectorAll('[role="tab"]')].filter(button => !button.hidden);
      const vertical = list.getAttribute('aria-orientation') === 'vertical';
      const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
      let index = buttons.indexOf(tab);
      if (event.key === nextKey) index = (index + 1) % buttons.length;
      else if (event.key === prevKey) index = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[index].click();
      if (buttons[index].isConnected) buttons[index].focus({preventScroll:true});
    });
    input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
    dialog.querySelector('.fsw-composer').addEventListener('submit', event => {
      event.preventDefault();
      const prompt = input.value.trim();
      if (!prompt) return;
      input.value = ''; send.disabled = true;
      ask(prompt);
    });
    document.getElementById('sidebar').addEventListener('click', event => {
      const nav = event.target.closest('[data-nav]');
      if (nav && /^(new|owls?|chat)$/i.test(nav.dataset.nav)) close({restoreFocus:false,immediate:true});
    }, true);
    closeButton.addEventListener('pointerdown', () => { closeButton.focus({preventScroll:true}); });
    for (const name of ['mvp-view-change','mvp-variant-change','mvp-bubble-format-change','popstate']) window.addEventListener(name, () => {
      close({restoreFocus:false,immediate:true});
      syncPresentation();
      syncTrigger();
    });
    window.addEventListener('workspace-layout-version-change', () => {
      render('goals');
      if (section === 'goals') scroll.scrollTop = 0;
    });
    window.MVPFullscreenWorkspace = Object.freeze({open,close,toggle:()=>dialog.open?close():open(),isOpen:()=>dialog.open,isActive,setTab:setSection});
    memory.setPrototype(document.body.dataset.prototypeView);
    syncPresentation();
    setSection(initialSection, false, false);
    syncTrigger();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
