/* Source: Pen frame bvO7d, including its red design annotations. */
window.ReplyV3Content = (baseHTML, {paragraph, bubble, userTurnHTML, secondTopicHTML}) => {
  const template = document.createElement('template');
  template.innerHTML = baseHTML;
  const base = template.content;
  const turns = [...base.querySelector('.ftux-turns').children];
  const copy = index => turns[index].outerHTML;
  const annotate = (html, topic, kind = '') => `<section class="reply-topic-anchor ${kind}"><span class="reply-topic-label">Topic ${topic}</span>${html}</section>`;
  const quotedPrompt = (text, count, target, connector = true) => `<div class="reply-prompt-turn${connector ? '' : ' reply-quote-compact'}"><div class="reply-prompt"><p>${text}</p></div><a class="reply-count" href="#${target}">${count} Replies</a>${connector ? '<svg class="reply-connector" viewBox="0 0 56 51" width="56" height="51" fill="none" aria-hidden="true"><path d="M55 2h-13c-26 0-40 17-40 47" stroke="#E9E9EB" stroke-width="6" stroke-linecap="round"/></svg>' : ''}</div>`;
  const richList = rows => `<ul class="reply-insights">${rows.map(([glyph, html]) => `<li class="reply-insight"><span class="reply-glyph" aria-hidden="true">${glyph}</span><span>${html}</span></li>`).join('')}</ul>`;
  const question = 'how are you doing on my goals? why did you not reach out to me with updates over the last few days?';
  const revenueQuestion = 'what are the revenue numbers - what are driving the changes?';
  const repeatedAudit = turns[9].cloneNode(true);
  repeatedAudit.id = 'reply-q4-repeat-audit';
  const appTurn = `<div id="reply-app-request" class="reply-app-turn reply-v3-user">
    <aside class="reply-red-note">The reason using a connecting line here, even though Owl is replying to the previous message, because there are three or more ongoing conversation topics.</aside>
    ${userTurnHTML('hey can you turn this into an app i can share with my leadership? also share an html version of it here? also make a ppt version of this app and share the ppt here?', [], true, 'assets/reply-v3-eyes.png', 'Eyes reaction')}
    <svg class="reply-connector" viewBox="0 0 56 51" width="56" height="51" fill="none" aria-hidden="true"><path d="M55 2h-13c-26 0-40 17-40 47" stroke="#E9E9EB" stroke-width="6" stroke-linecap="round"/></svg>
  </div>`;
  const appReplies =
    bubble(paragraph("I've started on all three. They'll come back in this thread: the Live App link for leadership, the offline HTML file and the PPT deck.")) +
    bubble(richList([['•', 'What goes in the app: monthly revenue from April to September 2024, the <strong>$9.24M</strong> drop from August to September, the split by region and the accounts that moved most.']])) +
    bubble(richList([['↓', 'Product split: it will carry a clear caveat, because <strong>$8.47M</strong> of September revenue has no usable product code.']])) +
    bubble(richList([['•', "Before I share it: I'll check every tile against Wisdom's own numbers. The app stays visible only to you until you tell me who in leadership should get it."]]));
  const interleaved = `<div class="reply-interleaved-topics">
    ${annotate(`<div id="reply-revenue-return">${quotedPrompt(revenueQuestion, 1, 'reply-revenue-summary', false)}</div>`, 'B', 'reply-topic-quote')}
    ${annotate(`<div id="reply-insight-request" class="reply-v3-user">${userTurnHTML("What's is the key insights from Back to Q4", [], true, 'assets/reply-v2-reaction.png')}</div>`, 'D')}
    <svg class="reply-long-connector" viewBox="0 0 58 198" preserveAspectRatio="none" width="58" height="198" fill="none" aria-hidden="true"><path d="M56 53l-16 0c-25 0-37 15-37 41l0 95m0-61c0 25 27 25 27 10 0-16-27-16-27 15" stroke="#E9E9EB" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
  </div>`;
  const revenueReplies =
    bubble('<p>Revenue fell <strong>$9.24M</strong> (<strong>-48%</strong>) to <strong>$10.11M</strong> in September, after an August spike to <strong>$19.35M</strong>. Revenue is lumpy and is set by a few large deals.</p>', '', 'reply-revenue-summary') +
    bubble(richList([
      ['↑', 'New September wins offset part of the drop: Neptune Vortex (<strong>+$619K</strong>), QuantumLink Specter (<strong>+$557K</strong>), EcoSphere Onyx (<strong>+$512K</strong>)'],
      ['↓', "August's large deals didn't happen again: Aegis Blaze Studios (<strong>-$1.24M</strong>), EchoTech Mirage Networks (<strong>-$985K</strong>), SonicEdge Fury (<strong>-$564K</strong>), Hyperion Blaze (<strong>-$529K</strong>)"],
      ['↓', 'Large Marketing Starter and Professional bundles caused most of the product-side decline']
    ]), 'Root cause') +
    bubble(richList([
      ['•', 'Six-month swings: <strong>$2.9M → $13.8M → $10.0M → $6.0M → $19.3M → $10.1M</strong>. This makes forecasts and quarterly targets unreliable'],
      ['•', 'Revenue depends heavily on a handful of accounts each month']
    ]), 'Business impact') +
    bubble(richList([
      ['•', 'Build a big-deal pipeline so a large win closes every month, not every other month'],
      ['•', 'Push large Marketing bundle buyers toward multi-year or phased contracts to smooth revenue'],
      ['•', 'Track the top-10 customer share each month as a revenue concentration KPI']
    ]), 'Actions') +
    bubble(paragraph('Ayush asked above for a revenue drivers app for leadership, plus HTML and PPT versions in this thread. Source: B2B finance domain, analysis.') + paragraph('Include monthly revenue trend, customer change drivers and product bundle change drivers. Please post the app link, HTML and PPT here when done.'));
  return `<div class="ftux-flow reply-pattern reply-multi-topics" data-pen-frame="bvO7d">
    ${base.querySelector('.reply-date').outerHTML}
    ${annotate(base.querySelector('.reply-prompt-turn').outerHTML, 'A', 'reply-topic-quote')}
    <div class="ftux-turns">
      ${copy(0) + copy(1) + copy(2) + copy(3) + copy(9)}
      ${annotate(secondTopicHTML(), 'B')}
      ${copy(4) + copy(5) + copy(6) + copy(7)}
      ${annotate(appTurn, 'C', 'reply-topic-app')}
      ${appReplies}
      ${annotate(`<div id="reply-q4-return">${quotedPrompt(question, 5, 'reply-q4-repeat-audit')}</div>`, 'A', 'reply-topic-quote')}
      ${repeatedAudit.outerHTML}
      ${interleaved}
      ${revenueReplies}
    </div>
  </div>`;
};
