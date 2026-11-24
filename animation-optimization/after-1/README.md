# Animation optimization · after 1

Prototype URL: https://woo-mi.github.io/owl/animation-optimization/after-1/

Independent version of the animation optimization prototype, copied November 23,
2026. The original experience remains at `../` as **before**. Use the top-right
selector to switch between **before** and **after 1**.

The version retains conversation playback, replies, workspace, and Owl
customization. Its prototype source and assets are local copies; only the version
selector script and stylesheet are shared with the parent directory. Inner view,
variant, and bubble-format IDs remain unchanged.

## Motion in after 1

Measured from a 60fps recording of Messages on macOS (Nov 23, 2026, 9:20 PM). Bubble
positions and opacities were tracked frame by frame and fitted to the curves below.
The values live in the `MOTION` table at the top of `chat-motion.js`.

| Moment | What moves |
| --- | --- |
| Send | The thread glides up for 370ms on `cubic-bezier(.30, .86, .37, 1)`. The typed text becomes a blue bar over the composer that collapses into the bubble (158ms). The bubble rises from the composer on a spring (damping .72, 554ms period, about 4% overshoot) while growing from 0.76 to full size. |
| Typing dots | Appear 600ms after a send. The thread glides up for 290ms after a 40ms delay, and the bubble pops in on a spring (damping .51, 324ms period, about 17% overshoot). |
| Reply | Fades in over 280ms and scales .944 → 1 over 90ms while the typing bubble fades out beneath it. |
| Arrival | The thread glides up for 215ms and the bubble fades in over 310ms. It rides the thread with no lift of its own. |
| Switching views | A hard cut, as in the recording. |

- Everything moves with `transform` and `opacity`. The final layout and scroll position apply immediately, then the difference is animated away on the compositor. Height and `scrollTop` are never animated frame by frame.
- Interrupting a motion (a second send, Show more) starts from where the bubbles and thread visibly are, so nothing jumps.
- Scrolling upward interrupts automatic following; an explicit send resumes it. Touch scrolling resumes following when the reader returns to the bottom.
- Reduced motion, view changes, and resizing release temporary geometry and ghost elements.

The original message content and demonstration pacing are retained. Reaction and
connector reveals are quieter; the typing dots use a slower, smaller movement.

## Tuning the motion

Add `?tune` to the page URL ([after-1/?tune](https://woo-mi.github.io/owl/animation-optimization/after-1/?tune)). The panel edits the live `MOTION` table in `chat-motion.js`, so the next motion you trigger uses the new value.

- Drag the two handles on a curve or type the four numbers. Dashed lines are the values measured from the recording.
- Springs use the names UIKit and SwiftUI use: response (the period of the undamped spring) and damping (1 means no bounce).
- The play buttons replay a send, the typing dots and reply, an arrival, or the whole scripted conversation. With **Replay on release** on, letting go of a handle or slider replays that moment.
- Settings persist in your browser only. **Copy values** copies the whole table as JSON, and **Reset all** restores the measured values.
- `?tune` holds the intro playback; use **Full run** to play it.

Static HTML/CSS/JavaScript; no build step. Serve the repository over HTTP so both
versions and their shared selector are available.

This is an interaction prototype using sample content, without live AI, accounts,
analytics, file upload, or microphone services.
