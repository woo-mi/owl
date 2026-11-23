/* Conversation history from the History frame in Owl - MVP.pen. */
(() => {
  'use strict';

  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const icon = svg('M3 12a9 9 0 1 0 2.8-6.5L3 8M3 3v5h5M12 7v5l4 2');
  const chevron = svg('m9 6 6 6-6 6');
  const entries = [
    {
      id: 'revenue-drivers',
      title: 'September revenue drivers',
      summary: 'Large-deal changes, product bundles, and actions to smooth monthly revenue.',
      replies: '2 replies',
      excerpts: [
        'Revenue fell $9.24M (−48%) to $10.11M in September, after an August spike to $19.35M. Revenue is lumpy and is set by a few large deals.',
        'New September wins offset part of the drop: Neptune Vortex (+$619K), QuantumLink Specter (+$557K), EcoSphere Onyx (+$512K).',
        "August’s large deals didn’t happen again: Aegis Blaze Studios (−$1.24M), EchoTech Mirage Networks (−$985K), SonicEdge Fury (−$564K), Hyperion Blaze (−$529K).",
        'Build a big-deal pipeline so a large win closes every month, push large Marketing bundle buyers toward multi-year or phased contracts, and track the top-10 customer share each month.'
      ]
    },
    {
      id: 'leadership-app',
      title: 'Revenue app for leadership',
      summary: 'Requested a shareable live app, an offline HTML report, and a PowerPoint deck.',
      excerpts: [
        'Can you turn this into an app I can share with my leadership? Also share an HTML version and a PPT version here?',
        'I’ve started on all three. They’ll come back in this thread: the Live App link for leadership, the offline HTML file and the PPT deck.',
        'The app will include monthly revenue from April to September 2024, the $9.24M drop from August to September, the split by region and the accounts that moved most.',
        'Product split: it will carry a clear caveat, because $8.47M of September revenue has no usable product code. The app stays visible only to you until you tell me who in leadership should get it.'
      ]
    },
    {
      id: 'september-analysis',
      title: 'September 2024 revenue analysis',
      summary: 'Closed-won revenue was $10.11M, down $9.24M (47.8%) from August.',
      excerpts: [
        'September closed-won revenue was $10.11M, down $9.24M (−47.8%) from August’s $19.35M. August was the outlier month, so September’s drop is mostly a fall back from that peak rather than a collapse.',
        'Monthly revenue, Apr–Sep 2024: Apr $2.93M · May $13.83M · Jun $10.02M · Jul $6.01M · Aug $19.35M · Sep $10.11M.',
        'All three regions fell. US-West fell the most at −$4.96M, which is 54% of the drop. US-Central fell −$2.18M and US-East −$2.11M.',
        'Revenue is closed-won total contract value, counted by close date. There is no customer segment field, so the analysis could not break it down by segment.'
      ]
    },
    {
      id: 'morning-pipeline',
      title: 'Morning pipeline report',
      summary: '$23.36M across 205 open deals, stalled follow-ups, and live app adoption.',
      excerpts: [
        'Pipeline health: $23.36M open across 205 deals. The pipeline is still top-heavy in early stages: Discovery $10.91M / 117 deals, Decision Making $5.84M / 27, Scoping $5.39M / 52, and Technical Validation $1.23M / 9.',
        'Wells Fargo – Finance Use Case ($1.5M) is still the largest stale-next-step deal. Other stalled deals include BMO, Davis Polk & Wardwell, Teradata, Abbott, and Adobe. Vanguard also has two separate $300k deals with very stale follow-up.',
        'Pipeline Health Command Center is built out, but telemetry still shows very limited usage and appears mostly owner-only. The next adoption signals are unique viewers, repeat visits, and share/edit activity.'
      ]
    },
    {
      id: 'arr-definitions',
      title: 'Weekly update and ARR definitions',
      summary: 'Sales reported $3.1M and Finance $2.4M; align on one governed Net New ARR metric.',
      excerpts: [
        'Here’s why Marcus gets three answers: Sales reports $3.1M for new-logo bookings by signed date. Finance reports $2.4M for new logo + expansion − contraction by start date—the board number.',
        'When no metric matched, an answer of approximately $2.8M was improvised from arr_usd and varied by wording.',
        'Create one governed Net New ARR metric using Finance’s definition. Add synonyms so “new ARR” and “net new” resolve to it, and keep New Logo Bookings as a separate Sales metric.'
      ]
    },
    {
      id: 'business-metrics',
      title: 'Monthly business metrics',
      summary: 'Net revenue $4.82M (+12.4%), orders 38,410, and a 2.1% return rate.',
      excerpts: [
        'Here’s how your key metrics compare with last month.',
        'Net revenue: $4.82M, up 12.4%. Orders: 38,410, up 6.1%. Average order value: $125.50, up 5.9%. Return rate: 2.1%, down 0.3 percentage points.'
      ]
    },
    {
      id: 'weekly-pipeline',
      title: 'Weekly sales pipeline update',
      summary: 'Scheduled for Fridays at 7:00 AM PT in Slack · #sales-pipeline.',
      excerpts: [
        'I noticed you have a Sales Pipeline Review every Monday. Would you like a weekly pipeline update every Friday, so you have time to review it before Monday’s meeting?',
        'Weekly Sales Pipeline Update: Friday at 7:00 AM, America/Los_Angeles. Deliver to Slack · #sales-pipeline.',
        'Your pipeline update is scheduled ahead of your Monday review.'
      ]
    }
  ];

  function render() {
    return `<div class="fsw-history"><p class="fsw-history-intro">Revisit reports, questions, and follow-ups from your conversation.</p><ul class="fsw-history-list" aria-label="Conversation history">${entries.map(entry => `<li><button type="button" class="fsw-history-row" data-fsw-history="open" data-history-id="${entry.id}" aria-label="Open ${escape(entry.title)}"><span class="fsw-history-copy"><span class="fsw-history-title">${escape(entry.title)}</span><span class="fsw-history-summary">${escape(entry.summary)}</span></span>${entry.replies ? `<span class="fsw-history-replies">${escape(entry.replies)}</span>` : ''}${chevron}</button></li>`).join('')}</ul></div>`;
  }

  function handleClick(event, api = {}) {
    const button = event.target.closest('[data-fsw-history]');
    if (!button) return false;
    const entry = entries.find(item => item.id === button.dataset.historyId);
    if (!entry) return false;
    if (button.dataset.fswHistory === 'ask') {
      api.ask?.(`Tell me more about ${entry.title.toLowerCase()} from our conversation.`);
      return true;
    }
    if (button.dataset.fswHistory === 'open') {
      const html = `<div class="fsw-history-detail"><p class="fsw-history-detail-label">From your conversation${entry.replies ? ` · ${escape(entry.replies)}` : ''}</p>${entry.excerpts.map(text => `<p>${escape(text)}</p>`).join('')}<button type="button" class="fsw-content-primary" data-fsw-history="ask" data-history-id="${entry.id}">Ask about this conversation</button></div>`;
      api.showDetail?.(entry.title, html, button);
      return true;
    }
    return false;
  }

  window.FullscreenHistory = Object.freeze({ render, handleClick, icon });
})();
