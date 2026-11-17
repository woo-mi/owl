/* The visible conversation from Pen's “dot style” frame (CL0T5). */
(() => {
  'use strict';
  const previewHash = '#links-linear-app-preview';
  const previewURL = '?version=links' + previewHash;
  const assets = 'assets/links/';
  const description = 'Explore open deals by stage, owner, and expected close date.';

  window.ReplyLinksContent = () => `<div class="ftux-flow reply-pattern reply-timeline reply-links" data-pen-frame="CL0T5">
    <div class="ftux-turns">
      <div class="timeline-date">Today, Mon, Oct 13 7:02 AM</div>
      <section id="links-live-app" class="links-topic" data-links-topic data-links-title="Linear Issue Workbench" data-links-excerpt="An existing Live App related to the Linear domain, using the same Linear WisdomAI domain as your Owls tickets.">
        <div class="timeline-message timeline-stack timeline-outgoing"><p class="timeline-bubble ftux-user-bubble">No no that's okay. Can you attach any live-app related to linear domain</p></div>
        <p class="timeline-bubble timeline-bubble-wide ftux-bubble">Got it. I'm stopping the Mary Poppins app recreation and will attach an existing Live App related to the Linear domain instead.</p>
        <p class="timeline-bubble timeline-bubble-wide ftux-bubble">Attached <a class="links-inline" href="${previewURL}" aria-haspopup="dialog"><span class="links-inline-icon" aria-hidden="true"><img src="${assets}link-icon.svg" alt="" width="12.756" height="12.742"></span><span class="links-inline-label">Linear Issue Workbeach</span></a>. It uses the same <strong>Linear WisdomAI</strong> domain we used for your Owls tickets</p>
        <a class="timeline-card links-app-card" href="${previewURL}" aria-haspopup="dialog" aria-label="Preview Linear Issue Workbench app">
          <span class="timeline-card-details"><span class="timeline-card-copy"><strong>Linear Issue Workbench</strong><span>${description}</span></span><span class="timeline-card-meta"><img src="${assets}app-icon.svg" alt="" width="16" height="16"><span>App · wisdomai.example</span></span></span>
          <img class="timeline-card-thumbnail" src="${assets}linear-issue-workbench-thumbnail.svg" alt="Pipeline Health board preview" width="124" height="125">
        </a>
        <p class="timeline-bubble timeline-bubble-wide ftux-bubble">The Mary Poppins rebuild is fully stopped. Its unused duplicate app still exists; I left it untouched rather than deleting it without your say-so.</p>
      </section>
      <section id="links-conversation-request" class="links-topic" data-links-topic data-links-title="Attach a conversation" data-links-excerpt="Can you also attach a conversation as well.">
        <div class="timeline-message timeline-stack timeline-outgoing"><p class="timeline-bubble ftux-user-bubble">Can you also attach a conversation as well.</p></div>
      </section>
    </div>
  </div>`;

  let dialog;
  let opener;
  function openPreview(trigger) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'indexing-preview links-app-preview';
      dialog.setAttribute('aria-labelledby', 'links-preview-title');
      dialog.innerHTML = `<header><h2 id="links-preview-title">Linear Issue Workbench</h2><button type="button" aria-label="Close app preview">×</button></header><div class="indexing-preview-content"><img class="links-preview-artwork" src="${assets}linear-issue-workbench-thumbnail.svg" alt="Pipeline Health board preview" width="124" height="125"><p>${description}</p><p class="links-preview-source"><img src="${assets}app-icon.svg" alt="" width="16" height="16">App · wisdomai.example</p></div>`;
      document.body.append(dialog);
      dialog.querySelector('header button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      });
      dialog.addEventListener('close', () => {
        const target = opener?.checkVisibility() ? opener : document.querySelector('.reply-links .links-app-card');
        target?.focus({preventScroll:true});
      });
    }
    opener = trigger;
    if (!dialog.open) dialog.showModal();
  }
  document.addEventListener('click', event => {
    if (document.body.dataset.replyVersion !== 'links' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.searchParams.get('version') !== 'links' || url.hash !== previewHash) return;
    event.preventDefault();
    openPreview(link);
  });
  window.addEventListener('reply-version-change', () => dialog?.close());
  window.addEventListener('popstate', () => dialog?.close());
  window.addEventListener('DOMContentLoaded', () => {
    if (new URLSearchParams(location.search).get('version') === 'links' && location.hash === previewHash) openPreview(document.querySelector('.links-app-card'));
  });
})();
