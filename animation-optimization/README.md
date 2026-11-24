# Animation optimization

Live prototype: https://woo-mi.github.io/owl/animation-optimization/

The **v1**, **v2**, **v3**, and **v4** versions all use the
conversation from `../reply-ux-pattern/?version=timeline`: 34 messages across
seven dated sections, eight report/chat cards, four reply threads, and the
12-topic conversation index. Updated November 24, 2026.

The renderer, reference styles, index, and workspace content are shared directly
with Reply UX Pattern. `timeline-adapter.js` resolves assets against that source;
`timeline-thread.js` and `timeline-workspace.js` retain each comparison's motion
and reading state. Serve the repository root, not this subdirectory alone.

The picker maps **v1** to the original before version, **v2** to after 1, and
**v3** to after 3. V1 and v3 keep the original animations; v2 uses the recorded
iMessage-style transition. The removed after 2 URL redirects to v1. Existing
URLs for the remaining versions stay valid. V4 duplicates v3 and adds a smooth
typing-to-reply height transition with synchronized scrolling and no text scaling.
Reduced-motion preferences are respected.

Static HTML/CSS/JavaScript; no build step. This is an interaction prototype using
sample content, without live AI, accounts, analytics, upload, or microphone services.
