/* Source: Pen frame S9VbBy, color code. Conversation structure matches V3. */
window.ReplyColorContent = baseHTML => {
  const template = document.createElement('template');
  template.innerHTML = baseHTML;
  const flow = template.content.querySelector('.reply-pattern');
  flow.dataset.penFrame = 'S9VbBy';
  flow.classList.add('reply-color-code');
  flow.querySelectorAll('.reply-topic-label, .reply-red-note').forEach(node => node.remove());
  flow.querySelectorAll('.reply-topic-anchor').forEach(node => node.replaceWith(...node.children));
  // The source keeps empty receipt rows so reaction and message positions stay aligned.
  flow.querySelectorAll('.ftux-read').forEach(node => {
    node.textContent = '';
    node.classList.add('reply-empty-stamp');
    node.setAttribute('aria-hidden', 'true');
  });
  flow.querySelectorAll('.reply-connector path, .reply-loop-connector path').forEach(node => {
    node.setAttribute('stroke-width', '4');
    node.setAttribute('stroke', '#1c67c433');
  });
  flow.querySelector('#reply-app-request .reply-connector path').setAttribute('stroke', '#20985533');
  const revenueConnector = flow.querySelector('.reply-long-connector path');
  revenueConnector.setAttribute('stroke-width', '4');
  revenueConnector.setAttribute('stroke', '#c3418b33');
  return flow.outerHTML;
};

/* Apply the current frame without changing the shared V1/V2 source conversations. */
window.ReplyTopicContent = (baseHTML, version) => {
  const template = document.createElement('template');
  template.innerHTML = baseHTML;
  const flow = template.content.querySelector('.reply-pattern');
  flow.dataset.penFrame = version === 'two-topics' ? 'ceIsC' : 'P12Pau';
  flow.classList.add('reply-color-code');
  flow.querySelectorAll('.reply-connector path, .reply-loop-connector path').forEach(node => {
    node.setAttribute('stroke-width', '4');
    node.setAttribute('stroke', '#1c67c433');
  });
  flow.querySelectorAll('.ftux-read').forEach(node => {
    node.textContent = '';
    node.classList.add('reply-empty-stamp');
    node.setAttribute('aria-hidden', 'true');
  });
  if (version === 'one-topic-time-gap') {
    flow.classList.add('reply-one-topic');
    flow.querySelector('.reply-date').textContent = 'Today, Mon, Oct 13';
    flow.querySelector('.reply-prompt-turn').remove();
    const turns = flow.querySelector('.ftux-turns');
    const [q4, deals, owners, growth, fixes, runtime, question, audit] = turns.querySelectorAll('.reply-bubble');
    const stack = (className, ...children) => {
      const node = document.createElement('div');
      node.className = className;
      node.append(...children);
      return node;
    };
    const stamped = bubble => {
      const stamp = document.createElement('div');
      stamp.className = 'reply-one-topic-stamp';
      stamp.textContent = '9:48 AM';
      return stack('reply-one-topic-stamped', bubble, stamp);
    };
    const context = document.createElement('div');
    context.className = 'reply-one-topic-context';
    const prefix = document.createElement('span');
    prefix.textContent = 'replied to a thread:';
    const quote = document.createElement('span');
    quote.className = 'reply-one-topic-quote';
    quote.textContent = 'how are you doing on my goals? why did you not reach out to me with...';
    context.append(prefix, quote);
    const first = stack('reply-one-topic-group', stack('reply-one-topic-stamped', context, q4), deals, stamped(owners));
    first.dataset.replyTopic = 'goal-updates';
    turns.replaceChildren(
      first,
      stack('reply-one-topic-group', growth, fixes, runtime, stamped(question)),
      stamped(audit)
    );
  }
  return flow.outerHTML;
};
