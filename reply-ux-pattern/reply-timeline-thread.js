/*
 * Reply popup storyboard (Pen s1WgPQ, SuBGR, B9TkG and WkXzo)
 * 0ms: keep the timeline in place; fade in its frosted overlay.
 * 0–260ms: lift the focused thread 16px and settle it at full size.
 * Close: fade and lower the thread over 180ms, then restore its opener.
 * Reduced motion skips both transforms and fades.
 */
(() => {
  'use strict';
  const THREADS = {
    profile: {
      title:'What did you learn about me?',
      groups:[['SN8ox'], ['C7hyC8']]
    },
    'chat-growth': {
      title:'Can you help me grow the dau/mau for chat?',
      groups:[['m8is7b'], ['yRqck'], ['wSwXA'], ['R56w6', 'ECtpL', 'k5sIEa', 'XxtbI'], ['aDGGZ']]
    },
    'chat-surface': {
      title:'Similarly build some understanding of chat as a surface. Why don’t you connect to my slack? But only read no write',
      groups:[['bUhpm'], ['zCpXs'], ['CY9hb'], ['Dr5fX'], ['z2iL42']],
      initialScroll:'end'
    },
    'gandhi-jayanti': {
      title:'Friday was gandhi jayanti, could be the reason?',
      groups:[['ABTkz'], ['VLFVG'], ['pY3xS'], ['g0x3g'], ['D3TJch'], ['ExjZ8'], ['VKDzT'], ['lxiD8']],
      initialScroll:'end'
    }
  };

  // Each thread owns its cached messages, composer draft, attachments and motion.
  function createThread(key, thread) {
    const STAGE = { CLOSED:0, OPENING:1, OPEN:2, CLOSING:3 };
    const TIMING = { open:260, close:180 };
    const MOTION = { offset:16, scale:.985, enter:'cubic-bezier(.16, 1, .3, 1)', exit:'cubic-bezier(.4, 0, 1, 1)' };
    const PARAM = 'timeline-thread';
    const HISTORY_KEY = 'timelineThreadEntry';
    const sessionToken = `${key}-${Date.now()}`;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let stage = STAGE.CLOSED;
    let dialog, header, profile, content, scroller, dock, composer, input, send, files, attachments, status;
    let opener, savedScroll = 0, generation = 0, animations = [], pendingFiles = [];
    let pointerStartedOutside = false, followingBottom = false, composerWidth = 0;
    const active = () => document.body.dataset.replyVersion === 'timeline' && document.body.dataset.prototypeView === 'latest-oct-28' && !document.body.classList.contains('workspace-page-open');
    const requested = () => new URL(location.href).searchParams.get(PARAM) === key;

    function cleanClone(source) {
      const clone = source.cloneNode(true);
      for (const element of [clone, ...clone.querySelectorAll('*')]) {
        element.removeAttribute('id');
        element.removeAttribute('aria-controls');
        element.removeAttribute('aria-labelledby');
        element.removeAttribute('data-timeline-message');
        element.classList.remove('is-compact');
      }
      return clone;
    }

    function fitToMain() {
      if (!dialog?.open) return;
      const rect = document.querySelector('main.main').getBoundingClientRect();
      Object.assign(dialog.style, {left:`${rect.left}px`, top:`${rect.top}px`, width:`${rect.width}px`, height:`${rect.height}px`});
      syncComposer(followingBottom);
    }

    const atBottom = () => scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 24;

    function syncHeader() {
      if (!dialog?.open || !profile) return;
      // Match the main chat's hysteresis so the header does not flicker at the top.
      const threshold = profile.classList.contains('is-compact') ? 8 : 48;
      const compact = scroller.scrollTop > threshold;
      profile.classList.toggle('is-compact', compact);
      header.classList.toggle('is-compact', compact);
    }

    function syncComposerDock(keepBottom = atBottom()) {
      if (!dialog?.open) return;
      const height = dock.offsetHeight;
      if (height <= 0) return;
      dialog.style.setProperty('--timeline-thread-dock-height', `${height}px`);
      if (keepBottom) scroller.scrollTop = scroller.scrollHeight;
      followingBottom = atBottom();
      syncHeader();
    }

    function syncComposer(keepBottom = atBottom()) {
      composerWidth = dock.clientWidth;
      input.style.height = '17px';
      const maximum = Number.parseFloat(getComputedStyle(input).maxHeight) || 120;
      const height = Math.min(input.value ? Math.max(17, input.scrollHeight) : 17, maximum);
      input.style.height = `${height}px`;
      input.style.overflowY = input.scrollHeight > maximum ? 'auto' : 'hidden';
      composer.classList.toggle('is-multiline', height > 26);
      send.disabled = !input.value.trim() && !pendingFiles.length;
      syncComposerDock(keepBottom);
    }

    function renderAttachments() {
      attachments.replaceChildren();
      pendingFiles.forEach((file, index) => {
        const chip = document.createElement('span');
        chip.className = 'attachment-chip';
        const label = document.createElement('span');
        label.textContent = file.name;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Remove ${file.name}`);
        remove.addEventListener('click', () => { pendingFiles.splice(index, 1); renderAttachments(); input.focus(); });
        chip.append(label, remove);
        attachments.append(chip);
      });
      syncComposer();
    }

    function buildDialog() {
      if (dialog) return true;
      const sourceGroups = thread.groups.map(group => group.map(id => document.getElementById(`timeline-message-${id}`)));
      if (sourceGroups.some(group => group.some(source => !source))) return false;
      dialog = document.createElement('dialog');
      dialog.id = `timeline-${key}-thread`;
      dialog.className = 'timeline-thread-dialog';
      dialog.setAttribute('aria-label', `${thread.title} - reply opened`);
      header = cleanClone(document.querySelector('.main > .agent-header'));
      header.classList.add('timeline-thread-header');
      profile = header.querySelector('.agent-profile');
      if (profile) {
        const label = document.createElement('div');
        label.className = profile.className;
        label.append(...profile.childNodes);
        profile.replaceWith(label);
        profile = label;
      }
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'timeline-thread-close';
      close.setAttribute('aria-label', 'Close reply thread');
      close.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 20 20M26 6 6 26"/></svg>';
      close.addEventListener('click', requestClose);
      scroller = document.createElement('div');
      scroller.className = 'timeline-thread-scroll';
      scroller.addEventListener('scroll', () => {
        followingBottom = atBottom();
        syncHeader();
      }, {passive:true});
      content = document.createElement('div');
      content.className = 'timeline-thread-content';
      const messages = document.createElement('div');
      messages.className = 'timeline-thread-messages reply-timeline';
      for (const sources of sourceGroups) {
        const group = document.createElement('div');
        group.className = 'timeline-group timeline-stack';
        group.style.setProperty('--timeline-gap', '16px');
        for (const source of sources) {
          const message = cleanClone(source);
          message.querySelectorAll('.timeline-context').forEach(element => element.remove());
          // Focused frames omit outgoing receipts; Owl reply timestamps remain.
          if (message.classList.contains('timeline-outgoing')) {
            message.querySelectorAll('.timeline-footer, .timeline-stamp').forEach(element => element.remove());
          }
          group.append(message);
        }
        messages.append(group);
      }
      composer = cleanClone(document.getElementById('message-form'));
      composer.classList.add('timeline-thread-composer');
      dock = document.createElement('div');
      dock.className = 'timeline-thread-composer-dock';
      composer.querySelector('.mode-picker')?.remove();
      input = composer.querySelector('textarea');
      input.value = '';
      input.setAttribute('aria-label', `Reply to ${thread.title}`);
      input.placeholder = 'What can I help you with today?';
      send = composer.querySelector('[type="submit"]');
      send.setAttribute('aria-label', 'Send reply');
      files = composer.querySelector('[type="file"]');
      composer.querySelector('[aria-label="Attach files"]').addEventListener('click', () => files.click());
      files.addEventListener('change', () => {
        pendingFiles.push(...files.files);
        files.value = '';
        renderAttachments();
      });
      const mic = composer.querySelector('[aria-label="Dictate a message"]');
      mic.classList.remove('is-listening');
      mic.setAttribute('aria-pressed', 'false');
      mic.addEventListener('click', () => { status.textContent = 'Voice input is not available in this prototype. Type a reply below.'; input.focus(); });
      attachments = document.createElement('div');
      attachments.className = 'timeline-thread-attachments';
      status = document.createElement('div');
      status.className = 'timeline-thread-status';
      status.setAttribute('role', 'status');
      input.addEventListener('input', () => syncComposer());
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
          event.preventDefault();
          composer.requestSubmit();
        }
      });
      composer.addEventListener('submit', event => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text && !pendingFiles.length) return;
        const message = document.createElement('div');
        message.className = 'timeline-message timeline-stack timeline-outgoing';
        message.style.setProperty('--timeline-gap', '4px');
        const bubble = document.createElement('article');
        bubble.className = 'message user-message ftux-user-bubble timeline-bubble timeline-stack';
        const copy = document.createElement('p');
        copy.className = 'timeline-text';
        copy.textContent = [text, ...pendingFiles.map(file => file.name)].filter(Boolean).join('\n');
        bubble.append(copy);
        const stamp = document.createElement('div');
        stamp.className = 'timeline-stamp';
        stamp.textContent = new Intl.DateTimeFormat('en-US', {hour:'numeric', minute:'2-digit'}).format(new Date());
        stamp.style.alignSelf = 'flex-end';
        stamp.style.padding = '0 13px';
        message.append(bubble, stamp);
        messages.append(message);
        input.value = '';
        pendingFiles = [];
        renderAttachments();
        scroller.scrollTop = scroller.scrollHeight;
        followingBottom = true;
        syncHeader();
        status.textContent = 'Reply added to this prototype thread.';
        input.focus({preventScroll:true});
      });
      content.append(messages);
      scroller.append(content);
      dock.append(attachments, composer);
      dialog.append(header, close, scroller, dock, status);
      document.body.append(dialog);
      new ResizeObserver(() => {
        if (!dialog.open || !dock.clientWidth) return;
        if (dock.clientWidth !== composerWidth) syncComposer(followingBottom);
        else syncComposerDock();
      }).observe(dock);
      dialog.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
      dialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); requestClose(); }
      });
      const outside = target => target === dialog || target === scroller;
      dialog.addEventListener('pointerdown', event => { pointerStartedOutside = outside(event.target); });
      dialog.addEventListener('click', event => { if (pointerStartedOutside && outside(event.target)) requestClose(); });
      return true;
    }

    async function transition(open) {
      const token = ++generation;
      const opacity = getComputedStyle(dialog).opacity;
      const layers = [content, dock].map(element => ({
        element,
        opacity:getComputedStyle(element).opacity,
        transform:getComputedStyle(element).transform
      }));
      animations.forEach(animation => animation.cancel());
      animations = [];
      if (!reducedMotion.matches) {
        const options = {duration:open ? TIMING.open : TIMING.close, easing:open ? MOTION.enter : MOTION.exit, fill:'both'};
        const offset = `translateY(${MOTION.offset}px) scale(${MOTION.scale})`;
        animations = [
          dialog.animate([{opacity:open && stage === STAGE.CLOSED ? 0 : opacity}, {opacity:open ? 1 : 0}], options),
          ...layers.map(layer => layer.element.animate([
            {opacity:open && stage === STAGE.CLOSED ? 0 : layer.opacity, transform:open && stage === STAGE.CLOSED ? offset : layer.transform},
            {opacity:open ? 1 : 0, transform:open ? 'translateY(0) scale(1)' : offset}
          ], options))
        ];
      }
      stage = open ? STAGE.OPENING : STAGE.CLOSING;
      await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
      if (token !== generation) return;
      animations.forEach(animation => animation.cancel());
      animations = [];
      stage = open ? STAGE.OPEN : STAGE.CLOSED;
      if (!open) {
        dialog.close();
        const anotherThreadOpen = document.querySelector('.timeline-thread-dialog[open]');
        if (!anotherThreadOpen) document.body.classList.remove('timeline-thread-open');
        if (active() && !anotherThreadOpen) {
          document.getElementById('chat-scroll').scrollTop = savedScroll;
          const target = opener?.isConnected ? opener : document.querySelector(`[data-timeline-thread="${key}"]`);
          target?.focus({preventScroll:true});
        }
      }
    }

    function openThread(trigger) {
      if (!active() || !buildDialog()) return;
      if (trigger) opener = trigger;
      if (stage === STAGE.OPEN || stage === STAGE.OPENING) return;
      if (!dialog.open) {
        savedScroll = document.getElementById('chat-scroll').scrollTop;
        dialog.showModal();
        document.body.classList.add('timeline-thread-open');
        fitToMain();
        syncComposer();
        scroller.scrollTop = thread.initialScroll === 'end' ? scroller.scrollHeight : 0;
        followingBottom = atBottom();
        syncHeader();
        dialog.querySelector('.timeline-thread-close').focus({preventScroll:true});
      }
      transition(true);
    }

    function clearParameter() {
      const url = new URL(location.href);
      url.searchParams.delete(PARAM);
      const state = {...history.state};
      delete state[HISTORY_KEY];
      history.replaceState(state, '', url);
    }

    function requestClose() {
      if (stage === STAGE.CLOSED || stage === STAGE.CLOSING) return;
      transition(false);
      if (!requested()) return;
      if (history.state?.[HISTORY_KEY] === sessionToken) history.back();
      else clearParameter();
    }

    function syncLocation() {
      if (active() && requested()) openThread();
      else if (stage !== STAGE.CLOSED && stage !== STAGE.CLOSING) transition(false);
    }

    function start() {
      document.addEventListener('click', event => {
        const trigger = event.target.closest(`[data-timeline-thread="${key}"]`);
        if (!trigger || !active()) return;
        event.preventDefault();
        event.stopPropagation();
        if (!requested()) {
          const url = new URL(location.href);
          url.searchParams.set(PARAM, key);
          history.pushState({...history.state, [HISTORY_KEY]:sessionToken}, '', url);
        }
        openThread(trigger);
      }, true);
      window.addEventListener('resize', fitToMain);
      window.addEventListener('popstate', syncLocation);
      const leaveThread = () => {
        if (requested()) clearParameter();
        if (stage !== STAGE.CLOSED && stage !== STAGE.CLOSING) transition(false);
      };
      for (const eventName of ['reply-version-change', 'mvp-view-change']) {
        window.addEventListener(eventName, () => {
          // The version picker announces its initial view once more on the next frame.
          // That notification must not dismiss a valid direct link to this thread.
          if (active()) syncLocation();
          else leaveThread();
        });
      }
      window.addEventListener('mvp-workspace-open', leaveThread);
      syncLocation();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
  }
  Object.entries(THREADS).forEach(([key, thread]) => createThread(key, thread));
})();
