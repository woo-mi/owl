# Animation optimization · after 2

Prototype URL: https://woo-mi.github.io/owl/animation-optimization/after-2/

Independent duplicate of **before**, created November 24, 2026. Its original
conversation playback, workspace, and customization are retained. Sending a
message uses the transition read from a Codex desktop recording (below).

Use the top-right selector to switch between **before**, **after 1**, **after 2**, and **after 3**.
Prototype files and assets are local copies; only the version selector script and
stylesheet are shared with the parent directory.

## Motion in after 2

Read from a screen recording of the Codex desktop app (Nov 24, 2026, 11:10 AM). The
recorder kept only five frames of the glide, so its curve is an estimate; `?tune` below
lets you match it by eye. The values live in the `MOTION` table at the top of
`send-transition.js`.

| Moment | What moves |
| --- | --- |
| Send | The composer clears and the sent bubble joins the thread below the fold. The whole thread glides up until the bubble parks near the top: about 440ms for a 600px move on `cubic-bezier(.3, 0, .2, 1)`, longer for longer moves. |
| Thinking | Replaces the typing dots. Appears 200ms after the send, under the bubble. One highlight sweeps across it 940ms later (830ms long), then again every 3.2s. |
| Reply | Fades in over 240ms while "Thinking" fades out. The bubble stays where it parked. |

- Only transform and opacity move. The final scroll position lands at once and the difference is animated away, so the browser's own smooth scroll is never used.
- Blank runway under the thread lets even a short thread park the bubble at the top. It shrinks as the reply grows. If the layout above the bubble changes, the bubble stays on its spot until the reader scrolls.
- A very long jump glides only its last 1.2 screens.
- The intro playback, its scripted replies, and the other views keep the original behavior.

## Tuning the motion

Add `?tune` to the page URL ([after-2/?tune](https://woo-mi.github.io/owl/animation-optimization/after-2/?tune)). The panel edits the live `MOTION` table, so the next send uses the new value.

- Drag the two handles on the curve or type the four numbers. The dashed line is the value read from the recording.
- With **Replay on release** on, letting go of a handle or slider sends a sample message so you can see the change.
- Settings persist in your browser only. **Copy values** copies the whole table as JSON, and **Reset all** restores the original values.
- `?tune` holds the intro playback so the panel is usable at once.

Static HTML/CSS/JavaScript; no build step. Serve the repository over HTTP.
This is an interaction prototype using sample content, without live AI, accounts,
analytics, file upload, or microphone services.
