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
  const extras = [
    ['grin', 'Smile', '😀'], ['laugh', 'Laugh', '😂'], ['celebrate', 'Celebrate', '🎉'],
    ['fire', 'Fire', '🔥'], ['clap', 'Clap', '👏'], ['thanks', 'Thanks', '🙏'],
    ['hundred', 'Hundred', '💯'], ['rocket', 'Rocket', '🚀'], ['idea', 'Idea', '💡'],
    ['think', 'Thinking', '🤔'], ['hooray', 'Hooray', '🙌'], ['wow', 'Wow', '😮'],
  ].map(([id, label, glyph]) => ({ id, label, glyph }));
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
    previous.bubble.classList.remove('is-open');
    active = null;
    if (returnFocus) previous.trigger.focus();
  };
  const openPicker = state => {
    if (active === state) return closePicker(true);
    closePicker();
    active = state;
    state.picker.hidden = false;
    state.bubble.classList.add('is-open');
    state.trigger.setAttribute('aria-expanded', 'true');
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
      badge.addEventListener('click', () => openPicker(state));
      state.bubble.append(badge);
      state.badge = badge;
    }
    state.options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.reaction === state.selected)));
    announce(remove ? 'Reaction removed' : `${reaction.label} reaction added`);
    closePicker(true);
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
    more.setAttribute('role', 'menu');
    more.setAttribute('aria-label', 'More reactions');
    const extraOptions = extras.map(reaction => {
      const choice = button(reaction.label, 'reaction-option reaction-glyph');
      choice.textContent = reaction.glyph;
      choice.dataset.reaction = reaction.id;
      choice.setAttribute('role', 'menuitemradio');
      choice.setAttribute('aria-checked', 'false');
      choice.addEventListener('click', () => selectReaction(state, reaction));
      more.append(choice);
      state.options.push(choice);
      return choice;
    });
    state.more = more;
    state.moreButton = choices[5];
    state.moreButton.setAttribute('aria-haspopup', 'menu');
    state.moreButton.setAttribute('aria-expanded', 'false');
    state.moreButton.setAttribute('aria-controls', more.id);
    state.moreButton.addEventListener('click', () => {
      more.hidden = !more.hidden;
      state.moreButton.setAttribute('aria-expanded', String(!more.hidden));
      if (!more.hidden) extraOptions[0].focus();
    });
    picker.append(more);
    picker.addEventListener('keydown', event => {
      navigateOptions(event, more.contains(event.target) ? extraOptions : choices);
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
      if (event.target === bubble && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault(); openPicker(state);
      }
    });
    bubble.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') bubble.classList.add('touch-active');
    });
    bubble.append(actions, picker);
    bubble.querySelectorAll('svg').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
    states.push(state);
  });
  document.addEventListener('pointerdown', event => {
    if (active && !active.bubble.contains(event.target)) closePicker();
    states.forEach(state => { if (!state.bubble.contains(event.target)) state.bubble.classList.remove('touch-active'); });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault();
    if (!active.more.hidden) {
      active.more.hidden = true;
      active.moreButton.setAttribute('aria-expanded', 'false');
      active.moreButton.focus();
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
  input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
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
    screen.classList.add('has-local-messages');
    screen.style.setProperty('--conversation-height', `${byId('e7JA4').offsetTop + byId('e7JA4').scrollHeight + 24}px`);
    input.value = '';
    send.disabled = true;
    replyTo = null;
    replyContext.hidden = true;
    composer.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    input.focus();
    announce('Message added to this prototype');
  };
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendMessage(); }
  });
  const fitPreview = () => screen.style.setProperty('--preview-scale', Math.min(1, window.innerWidth / 1440));
  fitPreview();
  window.addEventListener('resize', fitPreview);
})();
