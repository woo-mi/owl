# Animation optimization · after 2

Prototype URL: https://woo-mi.github.io/owl/animation-optimization/after-2/

Independent version with steady conversation behavior, updated November 24, 2026.
The latest interaction requirements take precedence over the earlier top-parking
motion from the supplied Codex recording. All four comparison versions now share the Reply UX Pattern timeline content.

## Motion and reading position

- A sent message has one restrained 8px, 180ms entrance. The shell and whole thread do not glide, scale, or bounce.
- Progress and streamed response text occupy the same assistant article. Text updates in batches with no animation per token or batch; pending replies retain their node identity even when their thread is in the background.
- Replies follow the bottom only if the reader was already there. When reading older messages, the visible message remains anchored and a **Jump to latest** control appears above the composer. Clicking it is the only explicit animated scroll.
- The main conversation, four timeline reply threads, and Goals views fade their content for 160ms while the shell stays fixed. Returning restores the destination's scroll position, draft, attachments, and unseen-response state.
- The composer is anchored at its bottom edge. Textarea and attachment growth update bottom clearance while preserving the visible message; focus never scrolls the conversation.
- Intro playback uses the same shared progress container and scroll-preservation rules. Its sample content and demonstration pacing remain available.
- Reduced motion disables entrance, content fade, and animated jumping. Scrolling can interrupt Jump to latest.

## Tuning

`?tune` opens the existing local motion panel and holds intro playback. Controls now
adjust only the sent-message entrance and explicit Jump to latest. The obsolete
whole-thread glide, landing target, and Thinking shimmer controls are removed.
Settings use a new browser-local storage key so earlier glide values cannot leak
into this version. Normal visits always use the shipped defaults.

Content is shared with `../../reply-ux-pattern/` through the parent timeline adapters.
Static HTML/CSS/JavaScript; no build step. Serve the repository over HTTP.
This is an interaction prototype using sample content, without live AI, accounts,
analytics, file upload, or microphone services. Recent-chat labels remain preview placeholders; the four timeline threads and
Goals workspace are interactive.
