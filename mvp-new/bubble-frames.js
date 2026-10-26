/* Conversation layouts from the four same-named frames in Owl - MVP.pen. */
(() => {
  'use strict';
  const frames = [
    { id: 'no-bullet', frame: 'IzDd5', morning: ['YNDHz', 'IdWyJ', 'hz5n7', 'SaiTr', 'tnRXJ', 'y90M0'], revenue: ['BNBUV'], delivery: ['NDE0Y'], drivers: ['bdYl1'], request: 'A08uOR', bullets: false, split: false },
    { id: 'no-bullet-break-replies', frame: 'Jt73l', morning: ['P9uBo', 'EIIIJ', 'vJjVg', 'I0f3N', 'PdjGt', 'TewBr'], revenue: ['eu8uh', 'zt3tG', 'w5Eiat', 'pcI73'], delivery: ['ZNSU9', 'gdKch', 'gKW1H', 'B586qg'], drivers: ['M9tdS', 'ctYft', 'q4uDFn', 'MHyoV'], request: 'v3bUR', bullets: false, split: true },
    { id: 'bullet', frame: 'A543a8', morning: ['wXmhv', 'c483y', 'OmpdY', 'FT2Sz', 'EG9cL', 'R5GG9'], revenue: ['Km7gM'], delivery: ['gZfPo'], drivers: ['FjoX1'], request: 'K4zewu', bullets: true, split: false },
    { id: 'bullet-break-replies', frame: 'Q354X', morning: ['oIlly', 'gTcjT', 'GwVTn', 'uQBf4', 'OsQOO', 'YVKUr'], revenue: ['j7oUI', 'Dbs56', 'NB5ur', 'FzEt5'], delivery: ['WjyTX', 'cAxJd', 'vLXjH', 'oP9J2'], drivers: ['rmBWq', 'a4OJu', 'H1t27', 'IJMhe'], request: 'f5fsF', bullets: true, split: true }
  ];
  const stamp = '<div class="replies-date-stamp">Today, Mon, Oct 13 7:02 AM</div>';
  const variants = {};
  function group(section) {
    const node = document.createElement('div');
    node.className = 'pen-bubble-group';
    node.dataset.penSection = section;
    return node;
  }
  function bubble(content, sourceId, className = '') {
    const node = document.createElement('article');
    node.className = `message assistant-message unfurl-bubble pen-bubble ${className}`.trim();
    if (sourceId) node.dataset.penNode = sourceId;
    node.append(content);
    return node;
  }
  function singleItem(item, bullets) {
    const list = document.createElement('ul');
    list.className = `unfurl-list${bullets ? '' : ' pen-list-plain'}`;
    list.append(item.cloneNode(true));
    return list;
  }
  function sectionGroup(article, section, split, nodeIds = []) {
    const result = group(section);
    if (split) [...article.children].forEach((child, index) => result.append(bubble(child.cloneNode(true), nodeIds[index])));
    else {
      article.classList.add('pen-bubble');
      if (nodeIds[0]) article.dataset.penNode = nodeIds[0];
      result.append(article);
    }
    return result;
  }
  for (const frame of frames) {
    const template = document.createElement('template');
    template.innerHTML = window.MVPViews['multiple-bubbles'].html;
    const content = template.content;
    const [morning, revenue, delivery, drivers, request] = content.querySelectorAll('article.assistant-message');
    const morningGroup = group('morning');
    morningGroup.append(bubble(morning.querySelector('[data-source-id="tf-morning"]').cloneNode(true), frame.morning[0], 'pen-morning-label'));
    [...morning.querySelectorAll('.unfurl-list > li')].forEach((item, index) => {
      morningGroup.append(bubble(singleItem(item, frame.bullets), frame.morning[index + 1], frame.bullets ? 'pen-morning-bulleted' : 'pen-morning-plain'));
    });
    morning.replaceWith(morningGroup);
    // Pen deliberately puts July on the second row in all four named frames.
    const monthly = revenue.querySelector('[data-source-id="tf-monthly"] .message-copy');
    monthly.innerHTML = monthly.innerHTML.replace(' · Jul ', ' ·<br>Jul ');
    revenue.replaceWith(sectionGroup(revenue.cloneNode(true), 'revenue', frame.split, frame.revenue));
    const deliveryGroup = group('delivery');
    if (frame.split) {
      deliveryGroup.append(bubble(delivery.firstElementChild.cloneNode(true), frame.delivery[0]));
      [...delivery.querySelectorAll(':scope > .unfurl-list > li')].forEach((item, index) => {
        deliveryGroup.append(bubble(singleItem(item, frame.bullets), frame.delivery[index + 1]));
      });
    } else {
      const copy = delivery.cloneNode(true);
      copy.classList.add('pen-bubble');
      copy.dataset.penNode = frame.delivery[0];
      deliveryGroup.append(copy);
    }
    delivery.replaceWith(deliveryGroup);
    const largestDeals = drivers.querySelector('[data-source-id="tf-largest-deals"] .message-copy');
    largestDeals.innerHTML = largestDeals.innerHTML.replace('again: Aegis', 'again:<br>Aegis').replace(', SonicEdge', ',<br>SonicEdge');
    drivers.replaceWith(sectionGroup(drivers.cloneNode(true), 'drivers', frame.split, frame.drivers));
    request.classList.add('pen-bubble', 'pen-request');
    request.dataset.penNode = frame.request;
    const latest = document.createElement('div');
    latest.className = 'pen-frame-transcript';
    latest.dataset.penFrame = frame.frame;
    latest.append(content);
    const userTurn = latest.querySelector('.unfurl-user-turn').cloneNode(true);
    userTurn.querySelector('.unfurl-thread-connector')?.remove();
    const replyRevenue = latest.querySelector('[data-pen-section="revenue"]').cloneNode(true);
    replyRevenue.querySelector('.unfurl-show-more').href = '#clicked-replies-detail';
    const preview = latest.querySelector('.unfurl-block').cloneNode(true);
    const replies = latest.querySelector('.unfurl-thread-detail').cloneNode(true);
    replies.id = 'clicked-replies-detail';
    const replyScreen = document.createElement('div');
    replyScreen.className = 'pen-frame-transcript pen-frame-replies';
    replyScreen.dataset.penFrame = frame.frame;
    replyScreen.innerHTML = stamp + userTurn.outerHTML + replyRevenue.outerHTML + preview.outerHTML + stamp + replies.outerHTML;
    variants[frame.id] = Object.freeze({ html: latest.outerHTML, replyHtml: replyScreen.outerHTML });
  }
  window.MVPBubbleViews = Object.freeze(variants);
})();
