# UI optimization

Responsive implementation of the Pen **third-party** (`TWj7d`) and
**third-party selected** (`vduXK`), **Clarification** (`uFv2D`),
**Clarification - custom answer** (`x8yUdq`), and **Clarification selected**
(`DlYvu`) screens.

Published at https://woo-mi.github.io/owl/ui-optimization/.

The Claude request card preserves the design content and desktop layout. The
sidebar is copied from the Links prototype, including its icons, ordering, recent
chats, and account avatar. At 900px and below it uses the same 48px compact rail;
on phones the request fields stack. The page grows and scrolls on shorter screens.

Selecting **Allow once** transitions the request into the compact selected card.
The 420ms transition fades the details, shrinks the card, and reveals the summary.
Reduced motion shows the result immediately. Repeated clicks are ignored, layout
resizing safely completes the animation, and keyboard focus follows the result.
Reloading resets the prototype. The approval is simulated locally; it does not
call Claude or Linear. Deny, navigation, and the composer remain static.

The Links-style version selector switches between **third-party** (default) and
**Clarification** (`?version=clarification`). Clarification offers two answers or
a custom text field; Submit appears when custom text is entered. Choosing an
answer uses the same compact transition and displays the actual selected text.
Switching versions preserves each screen's state, supports browser history, and
safely completes an active transition. On narrow screens the selector occupies
a row above the composer to avoid overlapping it.

Main-screen SVG artwork comes from the Pen frame; navigation artwork and Inter
are shared with the existing Reply UX Pattern prototype.
