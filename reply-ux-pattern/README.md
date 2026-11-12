# Reply UX Pattern

Live URL: https://woo-mi.github.io/owl/reply-ux-pattern/

The default is **color code · colored previews**. Explicit version links retain
their selected version.

All conversation content appears immediately without animation.

New Chat restores the complete conversation. The composer, conversation index,
Connections dialog, workspace, and Owl customization remain available.
The prototype is a static design sample; no messages or account actions are sent.

The bottom-right picker shows **color code · colored previews**,
**one topic - time gap**, and **two topics**. The selection is stored in the URL.
**color code** and **color code · colored ticks** are hidden from the picker
but remain available through their existing direct links.

**color code** matches Pen frame `S9VbBy`. Gray assistant bubbles have no colored
borders. Blue, green, and magenta connectors use 4px strokes at 20% opacity;
user prompts and Replies text use their corresponding topic colors. The frame
retains 16px message gaps and the V3 tick navigator; receipt text is hidden.

**color code · colored ticks** is a separate copy of color code with blue,
magenta, green, and purple navigator ticks matching the four conversation topics.
Its active tick, hover previews, and jump controls retain the same behavior.
The original color code version keeps its black and gray ticks.

**color code · colored previews** duplicates colored ticks and adds matching
solid topic-color backgrounds to the navigator previews, with white titles
and descriptions. The colored ticks version keeps its white preview cards.

**one topic - time gap** matches Pen frame `P12Pau`, retaining the V1
conversation with blue prompt text, Replies, and 4px time-gap connectors.
Its navigator has one blue topic tick and preview.

**two topics** matches Pen frame `ceIsC`, retaining the V2 conversation
with the same blue connectors and a magenta revenue prompt. Its navigator
has blue and magenta topic ticks and matching previews with white text.
Both new options preserve 16px gaps and gray assistant bubbles.

V1–V9 have been removed from the picker. V1 links open one topic - time gap;
V2 links open two topics; V3 links open color code · colored previews.
V4–V9 links continue to open color code.
Each remaining version keeps its own messages, draft, and scroll position.
