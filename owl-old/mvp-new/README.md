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
Text + Unfurling, Multiple bubbles, Full Screen Workspace, Oct 27, and Oct 28 (the latest). Each view has a shareable URL using the view query parameter.
Additional source frames: Furling 1 (j5h7z), Furling 2 (tffsf), and
Text + Furling (TTZhU). Per-view drafts and scroll positions are preserved.
Native thumbnail artwork and reactions are exported from the corresponding Pen frames.

Multiple bubbles is an independent copy of Text + Unfurling, with its own
conversation and reply drafts, attachments, and scroll position. Open it at
https://woo-mi.github.io/owl/mvp-new/?view=multiple-bubbles.

Full Screen Workspace is a separate copy of Multiple bubbles with the same
initial layout and interactions, and independent conversation and reply state.
Open it at https://woo-mi.github.io/owl/mvp-new/?view=full-screen-workspace.

Oct 27 is an independent copy of Multiple bubbles → Aligned, placed
directly below Full Screen Workspace in the version menu. It keeps the Aligned
conversation, replies, card alignment, and full-screen workspace, with its own
conversation/reply drafts, attachments, and scroll positions. Its presentation
stays Aligned, so it does not show the bubble-format picker.
Open it at https://woo-mi.github.io/owl/mvp-new/?view=latest-oct-27.

Oct 28 (the latest) duplicates Oct 27 and appears directly below it in the version
menu. It starts with the same Aligned conversation and workspace, with separate
conversation/reply drafts, attachments, task edits, and workspace state.
Open it at https://woo-mi.github.io/owl/mvp-new/?view=latest-oct-28.
Its profile header changes to the compact “when scroll up” Pen frame once the
conversation scrolls, and expands again at the top. This also applies to replies;
other prototype versions retain their existing header.

Its workspace starts on Tasks and omits Connections and History. Tasks uses the Pen frame's
Upcoming, In progress, and Done sections, with independent task editing state.
Artifacts has Apps, Reports, and Chats tabs with the corresponding Pen previews
in one column. Reports follows the visible tab label in the frame named
"full screen workspace - Artifacts - Agents". Other prototype versions retain
their existing workspace presentation.

Multiple bubbles has a second format control ordered as Original, no bullet,
no bullet · break replies, bullet, and bullet · break replies. Original is the
default and restores the initial layout. Break modes separate the
existing assistant sections and top-level list items into bubbles. Formatting
keeps the conversation nodes and drafts intact, applies to its reply view, and
is shareable through the `bubbles` query parameter. Other prototype views keep
their original presentation.

The October 28 workspace opens on Profile, followed by Tasks, Artifacts, and
Memory. It follows Pen frames `xJiXZ`, `sAAB9`, `HrpAn`, `f2BDqP`, `pLLSI`,
`gjPiJ`, and `EITos`. Profile includes local file editors, activity views,
and delegation-channel previews. Tasks uses compact rows and the revised edit
dialog; Apps includes artifact activity dates. Memory has Search and reference
chats and Import memory, with the Generate memory setting removed in this view.
October 27 retains its previous workspace presentation.
