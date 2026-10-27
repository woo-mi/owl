/* Conversation layouts from the same-named frames in Owl - MVP.pen. */
(() => {
  'use strict';
  const frames = [
    { id: 'no-bullet', frame: 'IzDd5', morning: ['YNDHz', 'IdWyJ', 'hz5n7', 'SaiTr', 'tnRXJ', 'y90M0'], revenue: ['BNBUV'], delivery: ['NDE0Y'], drivers: ['bdYl1'], request: 'A08uOR', bullets: false, split: false },
    { id: 'no-bullet-break-replies', frame: 'Jt73l', morning: ['P9uBo', 'EIIIJ', 'vJjVg', 'I0f3N', 'PdjGt', 'TewBr'], revenue: ['eu8uh', 'zt3tG', 'w5Eiat', 'pcI73'], delivery: ['ZNSU9', 'gdKch', 'gKW1H', 'B586qg'], drivers: ['M9tdS', 'ctYft', 'q4uDFn', 'MHyoV'], request: 'v3bUR', bullets: false, split: true },
    { id: 'bullet', frame: 'A543a8', morning: ['wXmhv', 'c483y', 'OmpdY', 'FT2Sz', 'EG9cL', 'R5GG9'], revenue: ['Km7gM'], delivery: ['gZfPo'], drivers: ['FjoX1'], request: 'K4zewu', bullets: true, split: false },
    { id: 'bullet-break-replies', frame: 'Q354X', morning: ['oIlly', 'gTcjT', 'GwVTn', 'uQBf4', 'OsQOO', 'YVKUr'], revenue: ['j7oUI', 'Dbs56', 'NB5ur', 'FzEt5'], delivery: ['WjyTX', 'cAxJd', 'vLXjH', 'oP9J2'], drivers: ['rmBWq', 'a4OJu', 'H1t27', 'IJMhe'], request: 'f5fsF', bullets: true, split: true },
    { id: 'bullet-break-replies-character', frame: 'fXYGm', morning: ['SepJX', 'tiHOJ', 'V7zNP', 'dQBke', 'TUtrk', 'H1tMr'], revenue: ['p0frx', 'bpQum', 'WnJ8m', 'G9E19r'], delivery: ['ltjFP', 'YgiSv', 'oX5fP', 'hjFhI'], drivers: ['d8je5', 'ABrm4', 'GZq9f', 'Z0BTyS'], request: 'xUWcu', bullets: true, split: true, trends: { down: '↓', up: '↑' } },
    { id: 'bullet-break-replies-character-tilt', frame: 'BUoAI', morning: ['MJ4VT', 'RTceP', 'xtV0S', 'L2Gsqh', 'j7Uea', 'mf1A8'], revenue: ['mEWHM', 'l2MWZU', 'dW6jz', 'PadWH'], delivery: ['PUOCa', 'ruS6W', 'u0Y0ma', 'WAs4D'], drivers: ['Kxiob', 'lF9WM', 'I7a2e', 'aIQpx'], request: 'I0TPL2', bullets: true, split: true, trends: { down: '↘', up: '↗' } },
    { id: 'bullet-break-replies-more-characters', frame: 'f2O6C', morning: ['gJI9r', 'yhJfx', 'jqxHV', 'lHayT', 'XrAGC', 'Jy0JZ'], revenue: ['qbHDr', 'Rd4wj', 'LwnDt', 'B9HLh'], delivery: ['XnI0J', 'a5TTL3', 'ukamR', 'rIdMK'], drivers: ['VJyy2', 'c4ERz', 'bIHKx', 'KDDAv'], request: 'tXkdu', bullets: true, split: true, trends: { down: '↘', up: '↗' }, insightGlyphs: true }
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
  function applyTrendCharacters(content, frame) {
    if (!frame.trends) return;
    const directions = {
      'tf-region': 'down',
      'tf-accounts': 'down',
      'tf-largest-deals': 'down',
      'tf-offsets': 'up',
      'tf-bundles': 'down'
    };
    for (const [source, direction] of Object.entries(directions)) {
      content.querySelector(`[data-source-id="${source}"]`).dataset.trendArrow = frame.trends[direction];
    }
  }
  function applyInsightGlyphs(content, frame) {
    if (!frame.insightGlyphs) return;
    content.querySelectorAll('.unfurl-list > li').forEach(item => {
      item.dataset.insightGlyph = item.dataset.trendArrow || '•';
    });
    const glyphs = { 'tf-exceptions': '→', 'tf-product': '↘', 'tf-measurement': '•' };
    for (const [source, glyph] of Object.entries(glyphs)) {
      content.querySelector(`[data-source-id="${source}"]`).dataset.insightGlyph = glyph;
    }
    // The Pen frame leads with positive change, followed by the declines.
    const offsets = content.querySelector('[data-source-id="tf-offsets"]');
    const largestDeals = content.querySelector('[data-source-id="tf-largest-deals"]');
    largestDeals.before(offsets);
  }
  for (const frame of frames) {
    const template = document.createElement('template');
    template.innerHTML = window.MVPViews['multiple-bubbles'].html;
    const content = template.content;
    applyTrendCharacters(content, frame);
    applyInsightGlyphs(content, frame);
    const [morning, revenue, delivery, drivers, request] = content.querySelectorAll('article.assistant-message');
    const morningGroup = group('morning');
    morningGroup.append(bubble(morning.querySelector('[data-source-id="tf-morning"]').cloneNode(true), frame.morning[0], 'pen-morning-label'));
    [...morning.querySelectorAll('.unfurl-list > li')].forEach((item, index) => {
      morningGroup.append(bubble(singleItem(item, frame.bullets), frame.morning[index + 1], frame.bullets ? 'pen-morning-bulleted' : 'pen-morning-plain'));
    });
    morning.replaceWith(morningGroup);
    // Pen deliberately puts July on the second row in these named frames.
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
  // Aligned starts with the same conversation and replies, with its own saved view state.
  variants.aligned = Object.freeze({ ...variants['bullet-break-replies-more-characters'] });
  window.MVPBubbleViews = Object.freeze(variants);
  // The dated prototype starts from Aligned and has independent conversation/reply state.
  window.MVPViews['latest-oct-27'] = {
    label: 'the latest Oct 27',
    html: variants.aligned.html
  };
  window.MVPViews['latest-oct-27-replies'] = {
    label: 'Clicked replies',
    html: variants.aligned.replyHtml
  };
})();
