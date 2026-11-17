/* The Links use cases reproduce the four “dot style” Pen frames. */
(() => {
  'use strict';
  const versions = ['links', 'links-2', 'links-3', 'links-4'];
  const assets = 'assets/links/';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const artifacts = {
    'linear-app': {
      title:'Linear Issue Workbench', description:'Explore open deals by stage, owner, and expected close date.',
      type:'App', source:'wisdomai.example', icon:assets + 'app-icon.svg',
      thumbnail:assets + 'linear-issue-workbench-thumbnail.svg', thumbnailAlt:'Pipeline Health board preview'
    },
    'bigquery-docs': {
      title:'Connect to Google BigQuery', description:'Connect WisdomAI to Google BigQuery using a service account, with optional Google OAuth for user queries.',
      type:'Docs', source:'docs.wisdom.ai', metaLabel:'docs.wisdom.ai', icon:assets + 'globe-icon.svg',
      href:'https://docs.wisdom.ai/getting-started/connect-data-sources/connect-to-google-bigquery'
    },
    'gcp-docs': {
      title:'Set up a GCP service account for WisdomAI', description:'Create a GCP service account, assign the required BigQuery roles, and generate a JSON key for WisdomAI.',
      type:'Docs', source:'docs.wisdom.ai', metaLabel:'docs.wisdom.ai', icon:assets + 'globe-icon.svg',
      href:'https://docs.wisdom.ai/getting-started/connect-data-sources/set-up-gcp-service-account'
    },
    ...window.ReplyLinksExtraArtifacts
  };
  const previewHash = key => `#links-${key}-preview`;
  const sourceLabel = artifact => artifact.metaLabel || `${artifact.type} · ${artifact.source}`;
  function localPreviewURL(key, version) {
    const params = new URLSearchParams({version});
    if (new URL(location.href).searchParams.get('theme') === 'dark') params.set('theme', 'dark');
    return `?${params}${previewHash(key)}`;
  }
  function makeUI(version) {
    const destination = key => artifacts[key].href || localPreviewURL(key, version);
    const attributes = key => artifacts[key].href ? 'target="_blank" rel="noopener noreferrer"' : `aria-haspopup="dialog" data-links-preview="${escape(key)}"`;
    return {
      flow:(frame, html) => `<div class="ftux-flow reply-pattern reply-timeline reply-links" data-pen-frame="${escape(frame)}" data-links-case="${escape(version)}"><div class="ftux-turns">${html}</div></div>`,
      topic:(id, title, excerpt, html) => `<section id="${escape(id)}" class="links-topic" data-links-topic data-links-title="${escape(title)}" data-links-excerpt="${escape(excerpt)}">${html}</section>`,
      date:text => `<div class="timeline-date">${escape(text)}</div>`,
      bubble:(html, {wide = true} = {}) => `<div class="timeline-bubble${wide ? ' timeline-bubble-wide' : ''} ftux-bubble">${html}</div>`,
      outgoing:(text, options = {}) => `<div class="timeline-message timeline-stack timeline-outgoing"><div class="links-outgoing-content"${options.width ? ` style="width:min(${Number(options.width)}px, 100%)"` : ''}>${options.reaction ? `<img class="links-request-reaction" src="${escape(options.reaction)}" alt="Eyes reaction" width="32" height="36">` : ''}<p class="timeline-bubble ftux-user-bubble">${escape(text)}</p></div>${options.read ? `<span class="reply-links-read">${escape(options.read)}</span>` : ''}</div>`,
      link:(key, label = artifacts[key].title) => `<a class="links-inline" href="${escape(destination(key))}" ${attributes(key)}><span class="links-inline-icon" aria-hidden="true"><img src="${assets}link-icon.svg" alt="" width="12.756" height="12.742"></span><span class="links-inline-label">${escape(label)}</span></a>`,
      card:key => {
        const artifact = artifacts[key];
        return `<a class="timeline-card links-app-card${artifact.type === 'Docs' ? ' links-docs-card' : ''}" data-artifact-type="${escape(artifact.type)}" href="${escape(destination(key))}" ${attributes(key)} aria-label="${escape(artifact.href ? `Open ${artifact.title} in a new tab` : `Preview ${artifact.title} ${artifact.type.toLowerCase()}`)}"><span class="timeline-card-details"><span class="timeline-card-copy"><strong>${escape(artifact.title)}</strong><span>${escape(artifact.description)}</span></span><span class="timeline-card-meta"><img src="${escape(artifact.icon)}" alt="" width="16" height="16"><span>${escape(sourceLabel(artifact))}</span></span></span>${artifact.thumbnail ? `<img class="timeline-card-thumbnail" src="${escape(artifact.thumbnail)}" alt="${escape(artifact.thumbnailAlt)}" width="124" height="125">` : ''}</a>`;
      }
    };
  }
  function firstCase(ui) {
    return ui.flow('CL0T5', ui.date('Today, Mon, Oct 13 7:02 AM') +
      ui.topic('links-live-app', 'Linear Issue Workbench', 'An existing Live App related to the Linear domain, using the same Linear WisdomAI domain as your Owls tickets.',
        ui.outgoing("No no that's okay. Can you attach any live-app related to linear domain") +
        ui.bubble("Got it. I'm stopping the Mary Poppins app recreation and will attach an existing Live App related to the Linear domain instead.") +
        ui.bubble(`Attached ${ui.link('linear-app', 'Linear Issue Workbeach')}. It uses the same <strong>Linear WisdomAI</strong> domain we used for your Owls tickets`) +
        ui.card('linear-app') +
        ui.bubble("The Mary Poppins rebuild is fully stopped. Its unused duplicate app still exists; I left it untouched rather than deleting it without your say-so.")) +
      ui.topic('links-conversation-request', 'Attach a conversation', 'Can you also attach a conversation as well.', ui.outgoing('Can you also attach a conversation as well.')));
  }
  function secondCase(ui) {
    return ui.flow('QpdYG', ui.date('Today, Mon, Oct 13 7:02 AM') +
      ui.topic('links-bigquery-setup', 'Connect WisdomAI to BigQuery', 'Add a BigQuery connection using a service-account JSON key and the required Google Cloud roles.',
        ui.bubble('In WisdomAI, open <strong>Connections</strong> → <strong>Add Connection</strong> → <strong>BigQuery</strong>.', {wide:false}) +
        ui.bubble('Enter a connection name, paste your service-account JSON, add the Google Cloud project ID, optionally restrict datasets, then click <strong>Save and Sync metadata</strong>.') +
        ui.bubble(`${ui.link('bigquery-docs')} If you do not have the JSON key yet, create a GCP service account with <strong>BigQuery Data Viewer</strong>, <strong>BigQuery Job User</strong>, and <strong>BigQuery Read Session User</strong>, then generate a JSON key from its <strong>Keys</strong> tab.`) +
        ui.bubble(`Treat that file like a password. ${ui.link('gcp-docs')} Sources`, {wide:false}) +
        ui.card('bigquery-docs') + ui.card('gcp-docs')));
  }
  window.ReplyLinksContent = (version = 'links') => {
    const ui = makeUI(version);
    if (version === 'links-2') return secondCase(ui);
    if (version === 'links-3' || version === 'links-4') return window.ReplyLinksExtraContent(version, ui);
    return firstCase(ui);
  };

  let dialog;
  let opener;
  let initialPreviewChecked = false;
  function openPreview(key, trigger) {
    const artifact = artifacts[key];
    if (!artifact || artifact.href) return;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'indexing-preview links-app-preview';
      dialog.setAttribute('aria-labelledby', 'links-preview-title');
      dialog.innerHTML = '<header><h2 id="links-preview-title"></h2><button type="button" aria-label="Close preview">×</button></header><div class="indexing-preview-content"></div>';
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
    dialog.querySelector('h2').textContent = artifact.title;
    dialog.querySelector('.indexing-preview-content').innerHTML = `${artifact.thumbnail ? `<img class="links-preview-artwork" src="${escape(artifact.thumbnail)}" alt="${escape(artifact.thumbnailAlt)}" width="124" height="125">` : ''}<p>${escape(artifact.description)}</p><p class="links-preview-source"><img src="${escape(artifact.icon)}" alt="" width="16" height="16">${escape(sourceLabel(artifact))}</p>`;
    opener = trigger;
    if (!dialog.open) dialog.showModal();
  }
  function previewKey(url) {
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.searchParams.get('version') !== document.body.dataset.replyVersion) return;
    return Object.keys(artifacts).find(key => !artifacts[key].href && url.hash === previewHash(key) && document.querySelector(`.reply-links [data-links-preview="${key}"]`));
  }
  function syncPreviewTheme() {
    const version = document.body.dataset.replyVersion;
    if (!versions.includes(version)) return;
    let changed = false;
    document.querySelectorAll('.reply-links a[href], #indexing-menu a[href], #indexing-nav-preview a[href]').forEach(link => {
      const key = previewKey(new URL(link.href, location.href));
      if (!key) return;
      const href = localPreviewURL(key, version);
      if (link.getAttribute('href') === href) return;
      link.setAttribute('href', href);
      changed = true;
    });
    // The navigator caches artifact objects, so refresh them from the updated cards.
    if (changed) window.dispatchEvent(new Event('ftux-state-change'));
  }
  window.addEventListener('reply-theme-change', syncPreviewTheme);
  document.addEventListener('click', event => {
    if (!versions.includes(document.body.dataset.replyVersion) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    const key = previewKey(new URL(link.href, location.href));
    if (!key) return;
    event.preventDefault();
    openPreview(key, link);
  });
  window.addEventListener('reply-version-change', () => {
    initialPreviewChecked = true;
    dialog?.close();
    if (location.hash.startsWith('#links-')) history.replaceState(history.state, '', location.pathname + location.search);
    // The controller may restore a previously visited case instead of rendering it again.
    requestAnimationFrame(syncPreviewTheme);
  });
  window.addEventListener('popstate', () => {
    dialog?.close();
    requestAnimationFrame(syncPreviewTheme);
  });
  function openInitialPreview() {
    if (initialPreviewChecked || !document.querySelector('.reply-links') || !versions.includes(document.body.dataset.replyVersion)) return;
    initialPreviewChecked = true;
    const key = previewKey(new URL(location.href));
    if (key) openPreview(key, document.querySelector(`.reply-links [data-links-preview="${key}"]`));
  }
  window.addEventListener('DOMContentLoaded', openInitialPreview);
  window.addEventListener('indexing-ready', openInitialPreview);
})();
