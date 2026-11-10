# emoji

Live prototype: https://woo-mi.github.io/owl/emoji/

Based on the **1 default** frame (`tWCyO`) in the shared Owl Pen file.
The page preserves its conversation, four reaction badges, navigation, and
composer as HTML and vector layers. Hover or focus an Owl bubble to reveal
**2 hovered**. Its smile button opens **3 clicked**, using the original six
cropped icons and picker dimensions from Pen.

Selecting a reaction adds the blue badge from **4 reacted**. Click the badge
to change it; choosing the selected reaction again removes it. Click outside
or press Escape to dismiss the picker. Arrow keys move through choices; the
plus icon opens more reactions. Tapping a message reveals its controls.

Copy includes the full message and numeric values. Reply opens a quoted local
composer; sending adds a message to this prototype only. Reload resets all
interactions. No messages are sent to a backend.

The conversation stays centered beside the 260 px navigation at desktop sizes,
growing up to 1040 px on wide windows. The composer stays at the viewport bottom
and messages scroll independently. Below 1100 px the sidebar becomes an icon
rail; below 768 px messages wrap and actions move beneath each Owl bubble.
Pickers stay inside the viewport and flip above their trigger when needed.
PNG crops are copied from the Pen document into `assets/`; the shared Inter font is served
from `../ftux/assets/`. There is no build step.
