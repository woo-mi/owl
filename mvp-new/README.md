# MVP NEW

Live prototype: https://woo-mi.github.io/owl/mvp-new/

Source: Pen frame **Gliphs + bold - text only** (B6Lij3) in Owl - MVP.
https://app.pen.dev/s/NkUDjTTIECnwknVNo18zLMn1g4yJO243rHjoDroOPkM

Static HTML/CSS/JavaScript; no build step. Serve this directory over HTTP.

The screen preserves the source report, Inter typography, tabular numeral glyphs,
selected bold metrics, sidebar, avatar, and composer. Includes local composer,
attachment selection, mode selection, and responsive navigation.
Message hover reply controls and the floating reply panel are removed.

This is an interaction prototype. Responses use the supplied sample report;
no live AI, account, analytics, file upload, or microphone service is connected.
Files remain local. Existing prototypes are unchanged.

The bottom-right version menu switches between Text only, Unfurling v1, Unfurling v2,
Text + Unfurling, Multiple bubbles, and Full Screen Workspace. Each view has a shareable URL using the view query parameter.
Additional source frames: Furling 1 (j5h7z), Furling 2 (tffsf), and
Text + Furling (TTZhU). Per-view drafts and scroll positions are preserved.
Native thumbnail artwork and reactions are exported from the corresponding Pen frames.

Multiple bubbles is an independent copy of Text + Unfurling, with its own
conversation and reply drafts, attachments, and scroll position. Open it at
https://woo-mi.github.io/owl/mvp-new/?view=multiple-bubbles.

Full Screen Workspace is a separate copy of Multiple bubbles with the same
initial layout and interactions, and independent conversation and reply state.
Open it at https://woo-mi.github.io/owl/mvp-new/?view=full-screen-workspace.

Multiple bubbles has a second format control ordered as no bullet,
no bullet · break replies, bullet, and bullet · break replies. The default,
bullet, keeps the original layout. Break modes separate the
existing assistant sections and top-level list items into bubbles. Formatting
keeps the conversation nodes and drafts intact, applies to its reply view, and
is shareable through the `bubbles` query parameter. Other prototype views keep
their original presentation.
