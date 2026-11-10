# Vendored emoji picker resources

These unmodified files are served locally so the static prototype has a fixed
picker version and does not depend on runtime CDN requests.

| Local file | Package source |
| --- | --- |
| `emoji-mart-5.6.0.js` | `emoji-mart@5.6.0`, `dist/browser.js` |
| `emoji-data-15.json` | `@emoji-mart/data@1.2.1`, `sets/15/native.json` |
| `emoji-mart-5.6.0.LICENSE` | `emoji-mart@5.6.0`, `LICENSE` |
| `emoji-mart-data-1.2.1.LICENSE` | `@emoji-mart/data@1.2.1`, `LICENSE` |

Official sources: [Emoji Mart repository](https://github.com/missive/emoji-mart),
[Emoji Mart 5.6.0 package](https://www.npmjs.com/package/emoji-mart/v/5.6.0), and
[@emoji-mart/data 1.2.1 package](https://www.npmjs.com/package/@emoji-mart/data/v/1.2.1).
Both packages are copyright Missive and distributed under the MIT License;
their original license notices are retained alongside the files.

The downloaded package archives were checked against the npm registry's
SHA-512 integrity metadata before extraction. The copied files were then
compared byte-for-byte with the extracted originals. This verifies that the
vendored resources match the selected releases; it is not a security audit.
Repeat those checks before replacing either version.

The native data contains Emoji 15 metadata, not emoji artwork. Glyph appearance
comes from the user's operating system. The browser bundle's source-map comment
is retained; its optional debugging source map is not included.
