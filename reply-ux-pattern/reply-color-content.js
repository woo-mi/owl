/* Color and spacing variants share the conversation copied from Pen for V3. */
window.ReplyColorContent = (baseHTML, version) => {
  const variants = {
    v4:{frame:'DBpU5', first:false, connectors:'all'},
    v5:{frame:'r8oLW7', first:true, connectors:'all'},
    v6:{frame:'hhV0d', first:true, connectors:'time'},
    v7:{frame:'uDGee', first:false, connectors:'none'},
    v8:{frame:'iaibf', first:true, connectors:'none'},
    v9:{frame:'w0mpbK', first:false, connectors:'all'}
  };
  const variant = variants[version];
  const template = document.createElement('template');
  template.innerHTML = baseHTML;
  const flow = template.content.querySelector('.reply-pattern');
  flow.dataset.penFrame = variant.frame;
  flow.classList.add('reply-color-topics');
  if (variant.first) flow.classList.add('reply-color-first');
  if (version === 'v5') flow.classList.add('reply-color-first-quote');
  flow.querySelectorAll('.reply-topic-label, .reply-red-note').forEach(node => node.remove());
  flow.querySelectorAll('.reply-topic-anchor').forEach(node => node.replaceWith(...node.children));

  const bubbles = [...flow.querySelectorAll('.reply-bubble')];
  bubbles.forEach((node, index) => {
    node.dataset.replyTopic = index >= 13 ? 'revenue' : index >= 8 && index <= 11 ? 'app' : 'goals';
  });
  const decliningAccounts = bubbles[14].querySelectorAll('.reply-insight')[1].lastElementChild;
  decliningAccounts.innerHTML = decliningAccounts.innerHTML
    .replace('again: ', 'again: <br>')
    .replace(', SonicEdge', ', <br>SonicEdge');
  bubbles[17].classList.add('reply-revenue-handoff');
  flow.querySelectorAll('#reply-revenue .ftux-read, #reply-app-request .ftux-read').forEach(node => {
    node.textContent = '';
    node.classList.add('reply-empty-stamp');
    node.setAttribute('aria-hidden', 'true');
  });
  if (variant.connectors !== 'all') {
    flow.querySelectorAll('.reply-connector, .reply-loop-connector, .reply-long-connector').forEach(node => node.remove());
  }

  if (version === 'v9') {
    flow.classList.add('reply-tickers');
    flow.querySelectorAll('.reply-empty-stamp').forEach(node => node.remove());
    flow.querySelectorAll('.reply-connector path').forEach(node => node.setAttribute('stroke-width', '4'));
    const divider = document.createElement('div');
    divider.className = 'reply-ticker-divider';
    divider.setAttribute('aria-hidden', 'true');
    flow.querySelector('.reply-loop-connector').replaceWith(divider);
    const thread = document.createElement('div');
    thread.className = 'reply-ticker-thread';
    thread.setAttribute('aria-hidden', 'true');
    thread.innerHTML = '<svg viewBox="0 0 56 51" width="56" height="51" fill="none"><path d="M55 2h-13c-26 0-40 17-40 47" stroke="#E9E9EB" stroke-width="4" stroke-linecap="round"/></svg><span></span>';
    flow.querySelector('.reply-long-connector').replaceWith(thread);
  }

  if (variant.connectors === 'none') {
    flow.classList.add('reply-spaced');
    const date = flow.querySelector('.reply-date');
    const prompt = flow.querySelector('.reply-prompt-turn');
    const revenue = flow.querySelector('#reply-revenue');
    const app = flow.querySelector('#reply-app-request');
    const goalsReturn = flow.querySelector('#reply-q4-return');
    const revenueReturn = flow.querySelector('#reply-revenue-return');
    const insight = flow.querySelector('#reply-insight-request');
    flow.querySelectorAll('.reply-empty-stamp, .reply-group-separator').forEach(node => node.remove());
    const group = (children, className = '') => {
      const node = document.createElement('div');
      node.className = `reply-space-group ${className}`;
      node.append(...children);
      return node;
    };
    const stack = group([
      group([prompt, group([group(bubbles.slice(0, 3)), bubbles[3]], 'reply-space-gap')]),
      revenue,
      group(bubbles.slice(4, 8)),
      group([app, group(bubbles.slice(8, 12))]),
      group([goalsReturn, bubbles[12]]),
      revenueReturn,
      insight,
      group(bubbles.slice(13))
    ], 'ftux-turns reply-space-gap');
    flow.replaceChildren(date, stack);
  }
  return flow.outerHTML;
};
