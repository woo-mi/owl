/* One canonical conversation for all four animation comparisons. */
(() => {
  'use strict';
  const source = new URL('../reply-ux-pattern/', document.currentScript.src);
  const template = document.createElement('template');
  template.innerHTML = window.ReplyTimelineContent('timeline');
  template.content.querySelectorAll('[src^="assets/"], [href^="assets/"]').forEach(node => {
    const attribute = node.hasAttribute('src') ? 'src' : 'href';
    node.setAttribute(attribute, new URL(node.getAttribute(attribute), source).href);
  });
  template.content.querySelectorAll('.assistant-message').forEach(node => node.classList.add('message-source'));
  const html = template.innerHTML;
  window.AnimationTimeline = Object.freeze({ html });
  window.MVPViews['latest-oct-28'].html = html;
  window.MVPViews['latest-oct-28'].label = 'Timeline';
  document.body.classList.add('indexing-prototype', 'ftux-prototype');
  document.body.dataset.ftuxStage = 'complete';
  document.body.dataset.replyVersion = 'timeline';
  document.body.dataset.replyLayout = 'timeline';

  // The source index can be reused without its static send/scroll controller.
  window.FTUX = Object.freeze({
    getIndexState: () => ({ stage:'complete', total:7, connectedCount:7, connectingTools:[], artifactReady:false }),
    pauseAutoScroll: () => window.dispatchEvent(new Event('animation-timeline-open')),
    openConnections: () => document.querySelector('[data-nav="Connections"]')?.click(),
    getConversationHTML: () => html
  });

  function start() {
    const messages = document.getElementById('messages');
    const scroller = document.getElementById('chat-scroll');
    messages.addEventListener('click', event => {
      const link = event.target.closest('a.reply-count[href^="#timeline-message-"]');
      if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      window.FTUX.pauseAutoScroll();
      const target = messages.querySelector(link.getAttribute('href'));
      if (!target) return;
      const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 80;
      scroller.scrollTo({ top:Math.max(0, top), behavior:'instant' });
      target.tabIndex = -1;
      target.focus({ preventScroll:true });
    });
    window.dispatchEvent(new Event('indexing-ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
