# emoji

Live prototype: https://woo-mi.github.io/owl/emoji/

Based on the **1 default** frame (`tWCyO`) in the shared Owl Pen file.
The page preserves its conversation, four reaction badges, navigation, and
composer as HTML and vector layers. This initial version presents the default
screen; it does not add the separate hover or reaction-picker states.

The conversation stays centered beside the 260 px navigation at desktop sizes.
Compact windows scale the 1440 × 958 source screen proportionally. PNG crops are
copied from the Pen document into `assets/`; the shared Inter font is served
from `../ftux/assets/`. There is no build step.
