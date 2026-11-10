(() => {
  'use strict';
  const byId = id => document.querySelector(`[data-pencil-id="${id}"]`);
  const screen = byId('tWCyO');
  screen.setAttribute('role', 'main');
  screen.setAttribute('aria-label', 'Owl emoji reactions');
  byId('nWGqT').setAttribute('role', 'navigation');
  byId('nWGqT').setAttribute('aria-label', 'Main navigation');
  document.querySelectorAll('svg').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
  for (const [id, label] of [
    ['yvOcu', 'Thumbs-up reaction'],
    ['jaw62', 'Eyes reaction'],
    ['Y03sUD', 'Check reaction'],
    ['M2zkA', 'Heart reaction'],
  ]) {
    const badge = byId(id);
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', label);
  }
  const reactions = [
    { id: 'like', label: 'Thumbs up', glyph: '👍' },
    { id: 'dislike', label: 'Thumbs down', glyph: '👎' },
    { id: 'eyes', label: 'Eyes', glyph: '👀' },
    { id: 'check', label: 'Check', glyph: '✅' },
    { id: 'heart', label: 'Heart', glyph: '❤️' },
  ];
  const states = [];
  let active = null;
  let replyTo = null;
  let toastTimer;
  const status = document.createElement('div');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  const toast = document.createElement('div');
  toast.className = 'prototype-toast';
  toast.hidden = true;
  document.body.append(status, toast);
  const announce = message => { status.textContent = message; };
  const notify = message => {
    announce(message);
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
  };
  const button = (label, className) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.setAttribute('aria-label', label);
    return element;
  };
  const messageText = bubble => Array.from(bubble.querySelectorAll('[data-pencil-name^="Line "]'))
    .map(line => Array.from(line.children).map(child => child.tagName.toLowerCase() === 'svg'
      ? child.getAttribute('data-pencil-name').split(' — ')[0]
      : child.textContent.trim()).join(' '))
    .join(' ').replace(/\s+([,.:;])/g, '$1');
  const closePicker = (returnFocus = false) => {
    if (!active) return;
    const previous = active;
    previous.picker.hidden = true;
    previous.more.hidden = true;
    previous.moreButton.setAttribute('aria-expanded', 'false');
    previous.trigger.setAttribute('aria-expanded', 'false');
    previous.anchor?.setAttribute('aria-expanded', 'false');
    if (returnFocus) (previous.anchor?.isConnected ? previous.anchor : previous.badge || previous.trigger).focus({ preventScroll: true });
    previous.bubble.classList.remove('is-open');
    active = null;
  };
  const positionPicker = () => {
    if (!active) return;
    const anchor = (active.anchor || active.trigger).getBoundingClientRect();
    const scrollport = byId('keLVD').getBoundingClientRect();
    if (anchor.bottom < scrollport.top || anchor.top > scrollport.bottom) return closePicker();
    if (!active.more.hidden) active.more.style.height = `${Math.max(120, Math.min(400, window.innerHeight - 86))}px`;
    const height = 54 + (active.more.hidden ? 0 : active.more.offsetHeight + 8);
    const left = Math.max(12, Math.min(anchor.left + anchor.width / 2 - 117.5, window.innerWidth - 246));
    const below = anchor.bottom + 1.5;
    const top = below + height <= window.innerHeight - 12 ? below : Math.max(8, anchor.top - height - 4);
    active.picker.style.left = `${left}px`;
    active.picker.style.top = `${top}px`;
    if (!active.more.hidden) {
      const width = active.more.offsetWidth;
      active.more.style.left = `${Math.max(12, Math.min(left + 234 - width, window.innerWidth - width - 12))}px`;
      active.more.style.top = `${top + 62}px`;
    }
  };
  const openPicker = (state, anchor = state.trigger) => {
    if (active === state) return closePicker(true);
    closePicker();
    active = state;
    state.anchor = anchor;
    state.bubble.classList.remove('actions-dismissed');
    state.picker.hidden = false;
    state.bubble.classList.add('is-open');
    state.trigger.setAttribute('aria-expanded', 'true');
    anchor.setAttribute('aria-expanded', 'true');
    positionPicker();
    const selected = state.options.find(option => option.dataset.reaction === state.selected);
    (selected && !selected.closest('[hidden]') ? selected : state.options[0]).focus({ preventScroll: true });
  };
  const selectReaction = (state, reaction) => {
    const remove = state.selected === reaction.id;
    state.selected = remove ? null : reaction.id;
    state.badge?.remove();
    state.badge = null;
    if (!remove) {
      const badge = button(`Change ${reaction.label.toLowerCase()} reaction on Owl message ${state.number}`, 'owl-reaction');
      badge.setAttribute('aria-haspopup', 'menu');
      badge.setAttribute('aria-expanded', 'false');
      badge.setAttribute('aria-controls', state.picker.id);
      const circle = document.createElement('span');
      circle.className = 'reaction-circle';
      const glyph = document.createElement(reaction.id === 'like' ? 'img' : 'span');
      if (reaction.id === 'like') {
        glyph.src = 'assets/thumbs-up-transparent.png';
        glyph.alt = '';
      } else {
        glyph.className = 'reaction-glyph';
        glyph.textContent = reaction.glyph;
      }
      glyph.setAttribute('aria-hidden', 'true');
      badge.append(circle, glyph);
      badge.addEventListener('click', () => openPicker(state, badge));
      state.bubble.append(badge);
      state.badge = badge;
    }
    state.options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.reaction === state.selected)));
    announce(remove ? 'Reaction removed' : `${reaction.label} reaction added`);
    closePicker();
    state.bubble.classList.remove('touch-active');
    (state.badge || state.bubble).focus({ preventScroll: true });
    // Keep restored focus and the stationary pointer from reopening the toolbar.
    state.bubble.classList.add('actions-dismissed');
  };
  const navigateOptions = (event, choices) => {
    const current = choices.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % choices.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + choices.length) % choices.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = choices.length - 1;
    if (next !== undefined) { event.preventDefault(); choices[next].focus(); }
  };

  ['pIDQi', 'xmYHW', 'hdtSQ'].forEach((id, index) => {
    const bubble = byId(id);
    const number = index + 1;
    const text = messageText(bubble);
    const paragraph = document.createElement('p');
    paragraph.className = 'owl-message-copy';
    for (const part of text.split(/(\$?\d+(?:\.\d+)?M?)/g)) {
      if (/^\$?\d/.test(part)) {
        const number = document.createElement('strong');
        number.textContent = part;
        paragraph.append(number);
      } else paragraph.append(document.createTextNode(part));
    }
    bubble.replaceChildren(paragraph);
    let row = bubble.parentElement;
    while (row && row !== byId('dvbeu')) {
      row.classList.add('owl-message-row');
      row = row.parentElement;
    }
    bubble.classList.add('owl-message');
    bubble.tabIndex = 0;
    bubble.setAttribute('aria-label', `Owl message ${number}: ${text}`);
    const actions = document.querySelector('#message-actions-template').content.firstElementChild.cloneNode(true);
    actions.classList.add('message-actions');
    actions.setAttribute('role', 'toolbar');
    actions.setAttribute('aria-label', `Actions for Owl message ${number}`);
    const actionButtons = Array.from(actions.children).map((icon, actionIndex) => {
      const label = ['Add reaction to', 'Reply to', 'Copy'][actionIndex];
      const control = button(`${label} Owl message ${number}`, 'message-action');
      icon.replaceWith(control);
      control.append(icon);
      return control;
    });
    const [trigger, reply, copy] = actionButtons;
    const picker = document.querySelector('#reaction-picker-template').content.firstElementChild.cloneNode(true);
    picker.classList.add('reaction-picker');
    picker.id = `reaction-picker-${number}`;
    picker.hidden = true;
    picker.setAttribute('role', 'menu');
    picker.setAttribute('aria-label', 'Choose a reaction');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', picker.id);
    const state = { bubble, number, text, trigger, picker, reply, selected: null, badge: null, options: [] };
    const choices = Array.from(picker.children).map((item, reactionIndex) => {
      const reaction = reactions[reactionIndex];
      const choice = button(reaction ? reaction.label : 'More reactions', 'reaction-option');
      for (const attribute of item.attributes) choice.setAttribute(attribute.name, attribute.value);
      choice.append(...item.childNodes);
      choice.setAttribute('role', reaction ? 'menuitemradio' : 'menuitem');
      if (reaction) {
        choice.dataset.reaction = reaction.id;
        choice.setAttribute('aria-checked', 'false');
        choice.addEventListener('click', () => selectReaction(state, reaction));
        state.options.push(choice);
      }
      item.replaceWith(choice);
      return choice;
    });
    const more = document.createElement('div');
    more.className = 'more-reactions';
    more.id = `more-reactions-${number}`;
    more.hidden = true;
    more.setAttribute('role', 'dialog');
    more.setAttribute('aria-label', 'Emoji picker');
    state.more = more;
    state.moreButton = choices[5];
    state.moreButton.setAttribute('aria-haspopup', 'dialog');
    state.moreButton.setAttribute('aria-expanded', 'false');
    state.moreButton.setAttribute('aria-controls', more.id);
    state.moreButton.addEventListener('click', () => {
      more.hidden = !more.hidden;
      state.moreButton.setAttribute('aria-expanded', String(!more.hidden));
      if (!more.hidden && !state.library) {
        state.library = createOwlEmojiLibrary({
          onSelect: emoji => {
            const quick = reactions.find(reaction => reaction.glyph === emoji.native);
            selectReaction(state, quick || { id: `emoji:${emoji.unified.toLowerCase()}`, label: emoji.name, glyph: emoji.native });
          },
          onStatus: notify,
          onResize: positionPicker,
        });
        more.append(state.library.element);
      }
      positionPicker();
      if (!more.hidden) state.library.open();
    });
    more.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        more.hidden = true;
        state.moreButton.setAttribute('aria-expanded', 'false');
        state.moreButton.focus();
        positionPicker();
        return;
      }
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const shadow = more.querySelector('em-emoji-picker')?.shadowRoot;
      const controls = [...(shadow?.querySelectorAll('input, button') || []), ...more.querySelectorAll('button')]
        .filter(element => element.tabIndex >= 0 && !element.disabled && element.getClientRects().length && !element.closest('[hidden]'));
      const focused = document.activeElement.shadowRoot?.activeElement || document.activeElement;
      if (!controls.length) return;
      event.preventDefault();
      event.stopPropagation();
      const index = controls.indexOf(focused);
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }, true);
    picker.append(more);
    picker.addEventListener('keydown', event => {
      if (more.contains(event.target)) return;
      navigateOptions(event, choices);
      if (event.key === 'Tab') {
        event.preventDefault();
        closePicker();
        (event.shiftKey ? trigger : reply).focus();
      }
    });
    trigger.addEventListener('click', () => openPicker(state));
    reply.addEventListener('click', () => {
      closePicker();
      replyTo = state;
      quote.textContent = state.text;
      replyContext.hidden = false;
      input.focus();
      composer.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(state.text); notify('Message copied'); }
      catch { notify('Copy unavailable. Select the message text to copy it.'); }
    });
    bubble.addEventListener('keydown', event => {
      bubble.classList.remove('actions-dismissed');
      if (event.target === bubble && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault(); openPicker(state);
      }
    });
    bubble.addEventListener('pointerdown', event => {
      bubble.classList.remove('actions-dismissed');
      if (event.pointerType === 'touch') bubble.classList.add('touch-active');
    });
    bubble.addEventListener('pointermove', () => bubble.classList.remove('actions-dismissed'));
    bubble.addEventListener('focusin', () => bubble.classList.remove('actions-dismissed'));
    bubble.append(actions);
    document.body.append(picker);
    bubble.querySelectorAll('svg').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
    states.push(state);
  });
  document.addEventListener('pointerdown', event => {
    if (active && !active.bubble.contains(event.target) && !active.picker.contains(event.target)) closePicker();
    states.forEach(state => { if (!state.bubble.contains(event.target)) state.bubble.classList.remove('touch-active'); });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault();
    if (!active.more.hidden) {
      active.more.hidden = true;
      active.moreButton.setAttribute('aria-expanded', 'false');
      active.moreButton.focus();
      positionPicker();
    } else closePicker(true);
  });

  const composer = byId('OZ1fa');
  const input = document.createElement('textarea');
  input.className = 'message-input';
  input.rows = 1;
  input.placeholder = byId('X3oItu').textContent.trim();
  input.setAttribute('aria-label', 'Message Owl');
  byId('X3oItu').replaceWith(input);
  const oldSend = byId('IlmnT');
  const send = button('Send message', 'send-message');
  send.style.cssText = oldSend.style.cssText;
  send.append(...oldSend.childNodes);
  send.disabled = true;
  oldSend.replaceWith(send);
  const replyContext = document.createElement('div');
  replyContext.className = 'reply-context';
  replyContext.hidden = true;
  const replyLabel = document.createElement('strong');
  replyLabel.textContent = 'Replying to Owl';
  const quote = document.createElement('p');
  const cancel = button('Cancel reply', 'cancel-reply');
  cancel.textContent = '×';
  cancel.addEventListener('click', () => { replyTo = null; replyContext.hidden = true; input.focus(); });
  replyContext.append(replyLabel, quote, cancel);
  composer.append(replyContext);
  input.addEventListener('input', () => {
    send.disabled = !input.value.trim();
    input.style.height = '20px';
    input.style.height = `${Math.min(input.scrollHeight, 100)}px`;
  });
  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;
    const turn = document.createElement('div');
    turn.className = 'local-message';
    const bubble = document.createElement('div');
    bubble.className = 'local-message-bubble';
    if (replyTo) {
      const quoted = document.createElement('blockquote');
      quoted.textContent = replyTo.text;
      bubble.append(quoted);
    }
    bubble.append(document.createTextNode(text));
    const stamp = document.createElement('time');
    stamp.textContent = 'Just now';
    turn.append(bubble, stamp);
    byId('dvbeu').append(turn);
    input.value = '';
    input.style.height = '20px';
    send.disabled = true;
    replyTo = null;
    replyContext.hidden = true;
    byId('keLVD').scrollTo({ top: byId('keLVD').scrollHeight, behavior: 'smooth' });
    input.focus();
    announce('Message added to this prototype');
  };
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendMessage(); }
  });
  byId('keLVD').addEventListener('scroll', positionPicker, { passive: true });
  window.addEventListener('resize', positionPicker);
})();
