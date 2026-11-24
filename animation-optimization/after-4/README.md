# Animation optimization · v4

Prototype URL: https://woo-mi.github.io/owl/animation-optimization/after-4/

Duplicate of v3, created November 24, 2026, with a smoother message reveal based
on `ani2.mov`. Timeline content, playback order, pauses, workspace, and reply
threads remain the same as v3.

The typing-to-reply handoff and new-message insertion share one motion controller:
reply space grows smoothly, the incoming content fades and rises a few pixels
without scaling text, and bottom-following uses the same animation clock. Reading
older messages interrupts following; reduced motion immediately shows final content.
Bulk transcript reveal and thread navigation preserve the reading position.

Use the top-right selector for v1, v2, v3, and v4. V3 remains the comparison baseline.
Static HTML/CSS/JavaScript; serve the repository root over HTTP. This prototype
uses local sample responses and does not upload files or contact AI services.
