/* Pipeline review examples from Pen's current dot style 3 and dot style 4 frames. */
(() => {
  'use strict';
  const assets = 'assets/links/';
  const request = 'I’m preparing for our weekly pipeline review. Summarize what changed since last week, highlight the deals that need attention, and explain what I should do next. Include the live app for digging into accounts, the weekly report for my briefing, and the chat where we discussed owners and follow-ups.';

  window.ReplyLinksExtraArtifacts = {
    'pipeline-app': {
      title: 'Pipeline Health',
      description: 'Explore open deals by stage, owner, and expected close date.',
      type: 'App',
      source: 'wisdomai.example',
      url: 'https://wisdomai.example/apps/pipeline-health',
      thumbnail: assets + 'pipeline-health-thumbnail.svg',
      thumbnailAlt: 'Pipeline Health board with three stages and deal cards',
      icon: assets + 'pipeline-app-icon.svg'
    },
    'pipeline-report': {
      title: 'Weekly Pipeline Review',
      description: 'A snapshot of coverage, deal movement, and risks to watch.',
      type: 'Report',
      source: 'wisdomai.example',
      url: 'https://wisdomai.example/reports/weekly-pipeline-review',
      thumbnail: assets + 'weekly-pipeline-review-thumbnail.svg',
      thumbnailAlt: 'Weekly Review report with a four-bar chart',
      icon: assets + 'pipeline-report-icon.svg'
    },
    'pipeline-chat': {
      title: 'Q4 Pipeline Follow-ups',
      description: 'Catch up on the discussion about deal risks and next steps.',
      type: 'Chat',
      source: 'wisdomai.example',
      url: 'https://wisdomai.example/chats/q4-pipeline-follow-ups',
      thumbnail: assets + 'pipeline-follow-ups-thumbnail.svg',
      thumbnailAlt: 'Q4 Follow-ups conversation with incoming and outgoing messages',
      icon: assets + 'pipeline-chat-icon.svg'
    }
  };

  const bullet = (symbol, html) => `<div class="timeline-bullet"><span aria-hidden="true">${symbol}</span><span>${html}</span></div>`;
  const userOptions = {width:442, reaction:assets + 'pipeline-request-reaction.png'};

  window.ReplyLinksExtraContent = (version, ui) => {
    if (version === 'links-3') {
      const answer = `For this week’s pipeline review, start with ${ui.link('pipeline-app', 'Pipeline Health')} to explore<br class="links-source-break"> open deals by owner, stage, and expected close date. Use <br class="links-source-break">${ui.link('pipeline-report', 'Weekly Pipeline Review')} to compare this week with last week and identify<br class="links-source-break"> stalled deals or changes worth discussing. Then open ${ui.link('pipeline-chat', 'Q4 Pipeline Follow-ups')}<br class="links-source-break"> for the team’s latest owner updates, unresolved blockers, and proposed next steps.<br class="links-source-break"> Together, these give you the live view, the weekly snapshot, and the discussion<br class="links-source-break"> behind the numbers. Validate dates and owners before turning the findings into<br class="links-source-break"> a review checklist.`;
      return ui.flow('Z2cIy',
        ui.date('Today, Tue, Nov 10 · 2:10 PM') +
        ui.topic('links-pipeline-resources', 'Weekly pipeline review', 'The live pipeline app, weekly report, and follow-up chat for preparing the review.',
          ui.outgoing(request, userOptions) +
          ui.bubble(`<p>${answer}</p>`) +
          ui.card('pipeline-app') + ui.card('pipeline-report') + ui.card('pipeline-chat')));
    }
    if (version === 'links-4') {
      return ui.flow('rbHMn',
        ui.date('Today, Tue, Nov 10 · 2:10 PM') +
        ui.topic('links-pipeline-health', 'Pipeline health · Nov 2–8', 'Open pipeline grew to $9.1M, stalled deals fell to 12, and the forecast remained $3.5M.',
          ui.outgoing(request, {...userOptions, read:'Read 5:12 AM'}) +
          ui.bubble(`<p><strong>Pipeline health · Nov 2–8</strong></p>
            ${bullet('↑', 'Open pipeline: $8.4M → $9.1M (+8.3%).')}
            ${bullet('↓', 'Stalled deals: 18 → 12 (−33.3%).')}
            ${bullet('→', 'Forecast: $3.5M, unchanged from last week.')}
            ${bullet('•', 'Pipeline grew and fewer deals are stalled, but that alone does not justify raising the forecast. My recommendation is to validate close dates and next steps on the largest opportunities first.')}
            <p>Use ${ui.link('pipeline-app', 'Pipeline Health')} to filter by owner, stage, and expected close date.</p>`) +
          ui.card('pipeline-app')) +
        ui.topic('links-pipeline-review', 'What to bring to the review', 'Compare the same pipeline and close-date window, then focus on deal movement and remaining stalled accounts.',
          ui.bubble(`<p><strong>What to bring to the review</strong></p>
            ${bullet('•', `${ui.link('pipeline-report', 'Weekly Pipeline Review')} compares the same pipeline and close-date window across both snapshots, so the changes are comparable.`)}
            ${bullet('•', 'Focus the discussion on new opportunities, deals that moved stages, and the remaining stalled accounts. Check whether each priority deal has a dated customer next step before treating it as close-ready.')}`) +
          ui.card('pipeline-report')) +
        ui.topic('links-pipeline-follow-ups', 'Owners and follow-ups', 'Review the latest owner responses, unresolved risks, and proposed next steps before drafting reminders.',
          ui.bubble(`<p><strong>Owners and follow-ups</strong></p>
            ${bullet('•', `${ui.link('pipeline-chat', 'Q4 Pipeline Follow-ups')} keeps the context behind the numbers: owner updates, unresolved deal risks, and proposed next steps.`)}
            ${bullet('•', 'Start with the latest owner responses before drafting reminders. Ask for missing dates or blockers, and keep any proposed forecast changes separate until the supporting evidence is reviewed.')}`) +
          ui.card('pipeline-chat') +
          ui.bubble('<p>Want me to draft a review checklist with owners and next steps, without sending any messages?</p>')));
    }
    return '';
  };
})();
