/* Artifacts from the Apps, Reports, and Chats workspace frames in Owl MVP. */
(() => {
  'use strict';

  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const categories = [
    { id: 'apps', label: 'Apps', noun: 'app' },
    // The Pen frame is named Agents; its visible tab label is Reports.
    { id: 'reports', label: 'Reports', noun: 'report', source: 'agents' },
    { id: 'chats', label: 'Chats', noun: 'chat' }
  ];
  const previews = {
    apps: [
      { id: 'deal-risk-app', title: 'Deal risk app', description: 'Review deal risks and follow-up priorities in one place.', thumbnail: 'list', heading: 'Deal risks' },
      { id: 'coverage-model', title: 'Coverage model', description: 'Explore pipeline coverage and the assumptions behind the model.', thumbnail: 'matrix', heading: 'Coverage' },
      { id: 'control-room', title: 'Control Room — Leadership Deck', description: 'View the “Live App Views by Account” tiles in the Control Room leadership deck.', thumbnail: 'list', heading: 'Control Room' }
    ],
    reports: [
      { id: 'churn-watch', title: 'Churn watch', description: 'Review account risk signals and follow-up opportunities.', thumbnail: 'signals', heading: 'Risk signals' },
      { id: 'weekly-forecast', title: 'Weekly forecast', description: 'Review the weekly forecast and the updates behind it.', thumbnail: 'text', heading: 'Forecast' },
      { id: 'daily-pipeline-brief', title: 'Daily Pipeline Brief', description: 'Review daily pipeline changes and follow-up priorities.', thumbnail: 'text', heading: 'Pipeline brief' }
    ],
    chats: [
      { id: 'q4-slip-analysis', title: 'Q4 slip analysis', description: 'Explore Q4 deal timing and questions about slipped close dates.', thumbnail: 'chat', heading: 'Q4 analysis' },
      { id: 'apac-hiring', title: 'APAC hiring Q&A', description: 'Review questions and answers about APAC hiring plans.', thumbnail: 'chat', heading: 'APAC hiring' },
      { id: 'september-revenue-drivers', title: 'September Revenue Drivers', description: 'Explore monthly revenue, customer changes and product bundle drivers.', thumbnail: 'chat', heading: 'Revenue drivers' }
    ]
  };
  const categoriesByView = new Map();
  const isOct28 = () => document.body.dataset.prototypeView === 'latest-oct-28';
  const isGallery = categoryId => isOct28() && ['apps', 'reports'].includes(categoryId);
  const isChatGrid = categoryId => isOct28() && categoryId === 'chats';
  // Preview artwork exported from the updated Apps and Reports Pen frames.
  const galleryPreviews = {
    'deal-risk-app': 'bar-chart',
    'coverage-model': 'line-chart',
    'control-room': 'matrix',
    'control-room-oct-28': 'bar-chart',
    'control-room-sep-30': 'bar-chart',
    'churn-watch': 'bar-chart',
    'weekly-forecast': 'matrix',
    'daily-pipeline-brief': 'line-chart'
  };
  // The updated Apps frame f2BDqP includes two additional dated deck cards.
  const oct28Apps = [
    ...previews.apps,
    ...['oct-28', 'sep-30'].map(date => ({ ...previews.apps[2], id: `control-room-${date}` }))
  ];
  const artifactActivity = {
    apps: {
      'deal-risk-app': '· Edited 1 hr ago',
      'coverage-model': '· Created 1 day ago',
      'control-room': '· Created 1 week ago',
      'control-room-oct-28': '· Created Oct 28',
      'control-room-sep-30': '· Created Sep 30'
    },
    reports: {
      'churn-watch': '· Edited 1 hr ago',
      'weekly-forecast': '· Created 1 day ago',
      'daily-pipeline-brief': '· Created 1 week ago'
    },
    chats: {
      'q4-slip-analysis': '· Edited 1 hr ago',
      'apac-hiring': '· Created 1 day ago',
      'september-revenue-drivers': '· Created 1 week ago'
    }
  };

  function itemsFor(categoryId, all = false) {
    const category = categories.find(item => item.id === categoryId);
    const source = window.FullscreenWorkspaceContent?.data?.artifactGroups?.[category.source || category.id] || [];
    const shown = isOct28() && categoryId === 'apps' ? oct28Apps : previews[categoryId];
    return all ? [...shown, ...source.filter(item => !shown.some(preview => preview.id === item.id))] : shown;
  }

  // These schematic thumbnail shapes retain the source Pen geometry at 80 × 78.
  function thumbnail(item) {
    if (!item.thumbnail) return `<img class="latest-artifact-thumbnail-image" src="assets/fsw-grid-${escape(item.id)}.png" width="80" height="78" alt="">`;
    const rect = (x, y, width, height, fill, radius = 0.634146) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"/>`;
    let shapes = rect(6.341463, 18.390244, 66.585366, 0.634146, '#EEEEEE', 1.268293);
    if (item.thumbnail === 'matrix') {
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
        shapes += rect(6.341463 + col * 22.195122, 26.634146 + row * 12.682927, 18.390244, 8.878049, row === col ? '#E1E9F5' : '#F0F2F5', 1.902439);
      }
    } else if (item.thumbnail === 'chat') {
      shapes += rect(20.292683, 27.268293, 50.731707, 14.585366, '#EBF1FA', 3.170732);
      shapes += rect(26.634146, 32.975610, 36.780488, 1.902439, '#98A9C4');
      shapes += rect(6.341463, 47.560976, 59.609756, 18.390244, '#F0F1F3', 3.170732);
      shapes += rect(12.048780, 52.634146, 45.658537, 1.902439, '#C1C6CE');
      shapes += rect(12.048780, 58.341463, 31.707317, 1.902439, '#C1C6CE');
    } else {
      for (let row = 0; row < 3; row++) {
        const y = 27.902439 + row * 13.317073;
        if (item.thumbnail === 'list') shapes += rect(6.975610, y - 0.634146, 4.439024, 5.707317, '#DEE5EF', 1.268293);
        if (item.thumbnail === 'signals') shapes += `<circle cx="9.195122" cy="${y + 2.219512}" r="2.219512" fill="none" stroke="#9DA7B7" stroke-width="1"/>`;
        const plain = item.thumbnail === 'text';
        shapes += rect(plain ? 6.341463 : 16.487805, y, plain ? 58.341463 : 48.829268, 1.902439, '#BEC5D0');
        shapes += rect(plain ? 6.341463 : 16.487805, y + 4.439024, plain ? 41.219512 : 33.609756, 1.268293, '#E0E4EA');
      }
    }
    return `<svg class="latest-artifact-thumbnail-image" width="80" height="78" viewBox="0 0 80 78" aria-hidden="true"><rect width="80" height="78" fill="#FCFCFD"/><text x="6.341463" y="12.682927" fill="#606674" font-family="Inter, sans-serif" font-size="5.073171" font-weight="500">${escape(item.heading)}</text>${shapes}</svg>`;
  }

  function sourceRow(item, categoryId) {
    const activity = isOct28() && !isChatGrid(categoryId) ? artifactActivity[categoryId]?.[item.id] : '';
    if (activity) {
      return `<span class="latest-artifact-domain latest-artifact-domain-with-activity"><img src="assets/wisdom-card-logo.svg" width="12.8576" height="14" alt=""><span class="latest-artifact-source-details"><span>ayush.gowisdom.ai</span><span class="latest-artifact-activity">${escape(activity)}</span></span></span>`;
    }
    return '<span class="latest-artifact-domain"><img src="assets/wisdom-card-logo.svg" width="16" height="17.422" alt=""><span>ayush.gowisdom.ai</span></span>';
  }

  function card(item, categoryId) {
    if (isGallery(categoryId)) {
      return `<button type="button" class="latest-artifact-card" data-latest-artifact-action="detail" data-latest-artifact-id="${escape(item.id)}" data-latest-artifact-category="${categoryId}" aria-label="Open ${escape(item.title)}"><span class="latest-artifact-gallery-preview">${galleryThumbnail(item)}</span><span class="latest-artifact-copy"><span class="latest-artifact-title-description"><span class="latest-artifact-title">${escape(item.title)}</span><span class="latest-artifact-description">${escape(item.description)}</span></span><span class="latest-artifact-gallery-time">Edited 2 days ago</span></span></button>`;
    }
    const description = isChatGrid(categoryId) && item.id === 'september-revenue-drivers'
      ? 'Explore monthly revenue, customer changes and product...'
      : item.description;
    return `<button type="button" class="latest-artifact-card" data-latest-artifact-action="detail" data-latest-artifact-id="${escape(item.id)}" data-latest-artifact-category="${categoryId}" aria-label="Open ${escape(item.title)}"><span class="latest-artifact-copy"><span class="latest-artifact-title-description"><span class="latest-artifact-title">${escape(item.title)}</span><span class="latest-artifact-description">${escape(description)}</span></span>${sourceRow(item, categoryId)}</span><span class="latest-artifact-thumbnail">${thumbnail(item)}</span></button>`;
  }

  function galleryThumbnail(item) {
    const preview = galleryPreviews[item.id];
    return preview
      ? `<img class="latest-artifact-gallery-image" src="assets/artifact-gallery/${preview}.png" width="588" height="291" alt="">`
      : thumbnail(item);
  }

  function cards(categoryId, all = false) {
    return `<div class="latest-artifact-cards${isGallery(categoryId) ? ' latest-artifact-gallery-grid' : isChatGrid(categoryId) ? ' latest-artifact-chat-grid' : ''}">${itemsFor(categoryId, all).map(item => card(item, categoryId)).join('')}</div>`;
  }

  function render() {
    const selectedCategory = categoriesByView.get(document.body.dataset.prototypeView) || 'apps';
    return `<div class="latest-artifacts${isGallery(selectedCategory) ? ' latest-artifact-gallery' : isChatGrid(selectedCategory) ? ' latest-artifact-chats' : ''}"><div class="latest-artifact-tabs" role="tablist" aria-label="Artifact categories">${categories.map(category => `<button type="button" id="latest-artifact-tab-${category.id}" class="latest-artifact-tab" role="tab" aria-controls="latest-artifact-panel" aria-selected="${category.id === selectedCategory}" tabindex="${category.id === selectedCategory ? 0 : -1}" data-latest-artifact-category-tab="${category.id}">${category.label}</button>`).join('')}</div><section class="latest-artifact-section" id="latest-artifact-panel" role="tabpanel" aria-labelledby="latest-artifact-tab-${selectedCategory}">${cards(selectedCategory)}${isOct28() ? '' : `<div class="latest-artifact-footer"><button type="button" class="latest-artifact-see-all" data-latest-artifact-action="all" data-latest-artifact-category="${selectedCategory}" aria-label="See all ${selectedCategory}">See all</button></div>`}</section></div>`;
  }

  function handleClick(event, api = {}) {
    const tab = event.target.closest('[data-latest-artifact-category-tab]');
    if (tab) {
      const next = tab.dataset.latestArtifactCategoryTab;
      if (!categories.some(category => category.id === next)) return false;
      categoriesByView.set(document.body.dataset.prototypeView, next);
      api.rerender?.('artifacts');
      document.getElementById(`latest-artifact-tab-${next}`)?.focus({ preventScroll: true });
      return true;
    }
    const target = event.target.closest('[data-latest-artifact-action]');
    if (!target) return false;
    const action = target.dataset.latestArtifactAction;
    const category = categories.find(item => item.id === target.dataset.latestArtifactCategory);
    if (action === 'ask') {
      api.ask?.(target.dataset.latestArtifactPrompt);
      return true;
    }
    if (!category) return false;
    if (action === 'all') {
      api.showDetail?.(`All ${category.label.toLowerCase()}`, `<div class="latest-artifact-directory">${cards(category.id, true)}</div>`, target);
      return true;
    }
    if (action === 'detail') {
      const item = itemsFor(category.id, true).find(artifact => artifact.id === target.dataset.latestArtifactId);
      if (!item) return false;
      const prompt = `Open ${item.title} and show me the latest details.`;
      api.showDetail?.(item.title, `<div class="latest-artifact-detail"><p class="latest-artifact-detail-category">${category.label}</p><p class="latest-artifact-detail-description">${escape(item.description)}</p><div class="latest-artifact-detail-thumbnail${isGallery(category.id) ? ' latest-artifact-gallery-detail-preview' : ''}">${isGallery(category.id) ? galleryThumbnail(item) : thumbnail(item)}</div><button type="button" class="latest-artifact-ask" data-latest-artifact-action="ask" data-latest-artifact-prompt="${escape(prompt)}">Ask about this ${category.noun}</button></div>`, target);
      return true;
    }
    return false;
  }

  window.LatestArtifacts = Object.freeze({ render, handleClick });
})();
