/* Conversation index for Pen S2Qem, “indexing content”. */
(() => {
  'use strict';
  function start() {
    const messages = document.getElementById('messages');
    const tagTopics = () => {
      const pipeline = messages.querySelector('[data-pen-section="morning"]');
      const revenue = messages.querySelector('[data-pen-section="revenue"]');
      if (!document.body.classList.contains('replies-open')) {
        if (pipeline) pipeline.id = 'indexing-topic-pipeline';
        if (revenue) revenue.id = 'indexing-topic-revenue';
      }
      // Preserve the distinct App and Chat destinations from the design.
      messages.querySelectorAll('.unfurl-block').forEach(block => {
        if (block.querySelector('.unfurl-card-title')?.textContent.trim() !== 'September Revenue Drivers') return;
        block.querySelectorAll('a[href]').forEach(link => {
          link.href = 'https://ayush.gowisdom.ai/apps/app_af105ef5a93d4b77a5e9922cd6ffa91f/view';
        });
      });
    };
    tagTopics();
    window.addEventListener('indexing-ready', tagTopics);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
