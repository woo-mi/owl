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

/* Updated single- and two-topic frames preserve the V1/V2 conversation structure. */
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
  return flow.outerHTML;
};
