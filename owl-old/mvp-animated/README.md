# MVP with animation

Live prototype: https://woo-mi.github.io/owl/mvp-animated/

Independent animated copy of https://woo-mi.github.io/owl/for-dev/, updated
October 28, 2026 from commit `57512e328b3acf8d538d0fe50411e297c7656206`.
The base link opens Oct 28 V2 with the current Profile, Tasks, Artifacts,
Memory, owl customization, saved sidebar icon, timestamps, and conversation design.
The version and variant controls are omitted, matching For dev.

The existing automatic conversation playback is preserved: messages arrive about
two seconds apart, emoji reactions animate separately, and thread connectors
appear after their reactions. Sending a message uses the existing typing and
reply animation. Opening the workspace or replies finishes initial playback;
returning to the conversation preserves its state rather than replaying it.
Reduced-motion preferences show the full conversation without entrance animation.

All assets and interactions are local copies, so changes here do not modify
For dev. Static HTML/CSS/JavaScript; no build step. Serve this directory over HTTP.
This is an interaction prototype using sample content, without live AI, accounts,
analytics, file upload, or microphone services.
