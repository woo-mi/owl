# Reply UX Pattern

Live URL: https://woo-mi.github.io/owl/reply-ux-pattern/

The default is **more than three topics**. Explicit version links retain
their selected version.

All conversation content appears immediately without animation.

New Chat restores the complete conversation. The composer, conversation index,
Connections dialog, workspace, and Owl customization remain available.
The prototype is a static design sample; no messages or account actions are sent.

The bottom-right picker shows **one topic - time gap**, **two topics**,
and **more than three topics**, in that order. The selection is stored in the URL.
The **timeline** option follows those existing versions. It duplicates the
one-topic time-gap shell with the conversation in Pen frame `ZyjHC` (timeline),
preserving its visible order, blue Ayush/Kapil bubbles, gray Owl bubbles,
timestamps, and linked previews. Its date navigation uses one dark gray active tick
and gray inactive ticks, with the original white preview cards.
Direct link: https://woo-mi.github.io/owl/reply-ux-pattern/?version=timeline

In timeline, **Unread** and **1 Reply** beneath “What did you learn about me?”
open the focused reply screen from Pen frame `s1WgPQ`. The popup fades and lifts
over a blurred conversation, with reduced-motion support. Close, Escape,
clicking outside the thread, or browser Back returns to the same scroll position
and draft. Its composer adds replies locally to this thread only.
Direct thread link: https://woo-mi.github.io/owl/reply-ux-pattern/?version=timeline&timeline-thread=profile

**2 Unread** and **5 Replies** under “Can you help me grow the dau/mau for chat?”
open Pen frame `SuBGR` with the same popup interactions. Its eight messages retain
the 16px grouped user-message gaps, blue Ayush/Kapil bubbles, and Owl timestamps.
Each reply thread keeps its own draft, attachments, and local replies.
Direct thread link: https://woo-mi.github.io/owl/reply-ux-pattern/?version=timeline&timeline-thread=chat-growth

**2 Unread** and **5 Replies** under “Similarly build some understanding of chat
as a surface…” open Pen frame `B9TkG`. This longer thread opens at its latest
update and composer, with earlier messages available by scrolling up. The four
Owl timestamps and the Rubrik Usage Drop preview card are preserved.
Direct thread link: https://woo-mi.github.io/owl/reply-ux-pattern/?version=timeline&timeline-thread=chat-surface

**5 Unread** and **6 Replies** under “Friday was gandhi jayanti, could be the
reason?” open Pen frame `WkXzo` at its latest update. The popup preserves the six
replies, memory-update notice, timestamps, BigQuery links, and five preview cards.
Direct thread link: https://woo-mi.github.io/owl/reply-ux-pattern/?version=timeline&timeline-thread=gandhi-jayanti

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

**more than three topics** duplicates colored ticks and adds matching
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
V2 links open two topics; V3 links open more than three topics.
V4–V9 links continue to open color code.
Each remaining version keeps its own messages, draft, and scroll position.
