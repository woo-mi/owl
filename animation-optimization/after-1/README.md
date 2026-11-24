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

- Conversation height, scroll position, and bubble arrivals share a 480ms `cubic-bezier(.2,.8,.2,1)` transition, inspired by the iMessage reference recording.
- Sent bubbles lift 48px into place while earlier messages glide upward. Incoming bubbles use a quieter 18px entrance. All arrivals retain their place in the conversation to avoid overlapping earlier messages.
- The typing pill expands into the reply bubble. Dots dissolve over 100ms, and text fades in from 80–300ms at its final size; the opening surface reveals the text without scaling or reflowing it.
- Typing-to-reply swaps and Show more use the same measured layout transition.
- Scrolling upward interrupts automatic following; an explicit send resumes it.
- Reduced motion, interrupted transitions, view changes, and resizing release temporary geometry and bubble surfaces. Touch scrolling resumes following when the reader returns to the bottom.

The original message content and demonstration pacing are retained. Reaction and
connector reveals are quieter; the typing dots use a slower, smaller movement.

Static HTML/CSS/JavaScript; no build step. Serve the repository over HTTP so both
versions and their shared selector are available.

This is an interaction prototype using sample content, without live AI, accounts,
analytics, file upload, or microphone services.
