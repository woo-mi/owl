# Animation optimization

Live prototype: https://woo-mi.github.io/owl/animation-optimization/

The **before**, **after 1**, **after 2**, and **after 3** versions all use the
conversation from `../reply-ux-pattern/?version=timeline`: 34 messages across
seven dated sections, eight report/chat cards, four reply threads, and the
12-topic conversation index. Updated November 24, 2026.

The renderer, reference styles, index, and workspace content are shared directly
with Reply UX Pattern. `timeline-adapter.js` resolves assets against that source;
`timeline-thread.js` and `timeline-workspace.js` retain each comparison's motion
and reading state. Serve the repository root, not this subdirectory alone.

Each version keeps its own playback and send controller. Before and after 3 keep
the original animations; after 1 uses the recorded iMessage-style transition;
after 2 uses one subtle send entrance, one persistent streamed reply container,
reader-preserving updates, Jump to latest, fixed-shell content fades, and a
bottom-anchored composer. Reduced-motion preferences are respected.

Static HTML/CSS/JavaScript; no build step. This is an interaction prototype using
sample content, without live AI, accounts, analytics, upload, or microphone services.
