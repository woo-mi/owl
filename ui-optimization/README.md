# UI optimization

Responsive implementation of the Pen **third-party** (`TWj7d`) and
**third-party selected** (`vduXK`) screens.

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

Main-screen SVG artwork comes from the Pen frame; navigation artwork and Inter
are shared with the existing Reply UX Pattern prototype.
