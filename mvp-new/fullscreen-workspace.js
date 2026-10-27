/* The workspace prototype and More characters format share the full-screen dialog. */
(() => {
  'use strict';
  const SECTIONS = ['connections', 'schedules', 'artifacts', 'memory', 'history'];
  const LABELS = { connections: 'Connections', schedules: 'Schedules', artifacts: 'Artifacts', memory: 'Memory', history: 'History' };
  const icon = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const closeIcon = icon('<path d="m6 6 12 12M6 18 18 6"/>');
  const backIcon = icon('<path d="m14 6-6 6 6 6"/>');
  const arrowIcon = icon('<path d="m5 12 7-7 7 7M12 5v15"/>');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function start() {
    const content = window.FullscreenWorkspaceContent;
    const schedules = window.FullscreenSchedules;
    const memory = window.FullscreenMemory;
    const history = window.FullscreenHistory;
    const trigger = document.getElementById('chief-profile');
    const dialog = document.createElement('dialog');
    dialog.id = 'fullscreen-workspace';
    dialog.className = 'fsw-dialog';
    dialog.setAttribute('aria-labelledby', 'fsw-title');
    dialog.innerHTML = `<aside class="fsw-sidebar"><div class="fsw-identity"><div class="fsw-avatar" aria-hidden="true"></div><div><strong>Chief of staff</strong><span>Active now</span></div></div><div class="fsw-navigation" role="tablist" aria-label="Workspace sections" aria-orientation="vertical">${SECTIONS.map(id => `<button type="button" id="fsw-nav-${id}" class="fsw-nav" role="tab" aria-controls="fsw-section-${id}" aria-selected="${id === 'connections'}" tabindex="${id === 'connections' ? 0 : -1}" data-fsw-section="${id}">${id === 'history' ? history.icon : content.icons[id] || ''}<span>${LABELS[id]}</span></button>`).join('')}</div></aside><div class="fsw-main"><header class="fsw-header"><button type="button" class="fsw-back" aria-label="Back to Memory" hidden>${backIcon}</button><h2 id="fsw-title">Connections</h2><button type="button" class="fsw-close" aria-label="Close workspace">${closeIcon}</button></header><div class="fsw-scroll">${SECTIONS.map(id => `<section id="fsw-section-${id}" class="fsw-panel-content" role="tabpanel" aria-labelledby="fsw-nav-${id}" tabindex="0" ${id === 'connections' ? '' : 'hidden'}></section>`).join('')}<section class="fsw-detail" tabindex="-1" hidden></section></div><form class="fsw-composer"><textarea rows="1" aria-label="Message Chief of staff in workspace" placeholder="Get quick answers and dig in with follow-ups"></textarea><button type="submit" aria-label="Send workspace message" disabled>${arrowIcon}</button></form><div class="fsw-notice" role="status" aria-live="polite"></div></div>`;
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
    dialog.dataset.section = 'connections';
    const send = dialog.querySelector('.fsw-composer button');
    const closeButton = dialog.querySelector('.fsw-close');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const sectionScroll = new Map();
    let section = 'connections';
    let closing = false;
    let closeTimer;
    let noticeTimer;
    let detailOpener;
    let detailScroll = 0;

    const isActive = () => document.body.dataset.prototypeView === 'full-screen-workspace' ||
      (document.body.dataset.prototypeView === 'multiple-bubbles' &&
       document.body.dataset.bubbleFormat === 'bullet-break-replies-more-characters');
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
      trigger.setAttribute('aria-label', `${expanded ? 'Close' : 'Open'} Chief of staff workspace`);
    }
    function setHeader(isDetail = false) {
      title.textContent = LABELS[section];
      dialog.dataset.section = section;
      composer.hidden = !['memory', 'history'].includes(section);
      back.hidden = !isDetail;
      back.setAttribute('aria-label', `Back to ${LABELS[section]}`);
    }
    function render(id) {
      if (id === 'memory') return;
      host(id).innerHTML = id === 'schedules' ? schedules.render() : id === 'history' ? history.render() : content.render(id);
    }
    SECTIONS.filter(id => id !== 'memory').forEach(render);
    memory.mount(host('memory'), {
      onDetailChange: ({isDetail}) => {
        if (section === 'memory') { setHeader(isDetail); scroll.scrollTop = 0; }
      }, announce
    });
    function setSection(id, focus = false) {
      if (!SECTIONS.includes(id)) return;
      sectionScroll.set(section, scroll.scrollTop);
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
      scroll.scrollTop = sectionScroll.get(id) || 0;
      if (!reduced.matches && changed) host(id).animate([{ opacity: .2, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 130, easing: 'ease-out' });
      if (focus) dialog.querySelector(`#fsw-nav-${id}`).focus({preventScroll:true});
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
      window.dispatchEvent(new Event('mvp-workspace-open'));
      dialog.classList.remove('is-closing');
      dialog.showModal();
      document.body.classList.add('fullscreen-workspace-open');
      syncTrigger();
      closeButton.focus({preventScroll:true});
    }
    function close({restoreFocus = true, immediate = false} = {}) {
      if (!dialog.open) return;
      schedules.closeEditor({restoreFocus:false});
      clearTimeout(closeTimer);
      closing = true;
      dialog.classList.add('is-closing');
      const finish = () => {
        dialog.close();
        closing = false;
        dialog.classList.remove('is-closing');
        document.body.classList.remove('fullscreen-workspace-open');
        syncTrigger();
        if (restoreFocus) trigger.focus({preventScroll:true});
      };
      if (immediate || reduced.matches) finish();
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
        detail.innerHTML = `<h3>All tasks</h3>${schedules.render({directory:true})}`;
      }
    }
    const api = { showDetail, ask, announce, refreshSchedules };
    dialog.addEventListener('click', event => {
      const nav = event.target.closest('[data-fsw-section]');
      if (nav) return setSection(nav.dataset.fswSection);
      if (event.target.closest('.fsw-close')) return close();
      if (event.target.closest('.fsw-back')) return goBack();
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }
      if (section === 'schedules') schedules.handleClick(event, api);
      else if (section === 'history') history.handleClick(event, api);
      else if (section !== 'memory') content.handleClick(event, api);
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
      const tab = event.target.closest('[role="tab"]');
      if (!tab) return;
      const list = tab.closest('[role="tablist"]');
      const buttons = [...list.querySelectorAll('[role="tab"]')];
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
    closeButton.addEventListener('pointerdown', () => { closeButton.focus({preventScroll:true}); });
    for (const name of ['mvp-view-change','mvp-bubble-format-change','popstate']) window.addEventListener(name, () => {
      close({restoreFocus:false,immediate:true});
      syncTrigger();
    });
    window.MVPFullscreenWorkspace = Object.freeze({open,close,toggle:()=>dialog.open?close():open(),isOpen:()=>dialog.open,isActive,setTab:setSection});
    syncTrigger();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
