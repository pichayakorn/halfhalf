# HalfHalf

A beautiful, Nordic Minimalist 60/40 co-pay Progressive Web App (PWA) calculator designed specifically for mobile smartphone viewports.

It simplifies co-payment splits where the government covers **60%** and you pay **40%**, incorporating a daily subsidy limit.

## Features

- **Locked 60/40 Ratio:** Calculations are hardcoded to the 60:40 split structure for speed and simplicity.
- **Editable Inline Cap:** Adjust your remaining daily government subsidy directly from the main tracker widget.
- **Bidirectional Inputs:** Enter the original price, the government portion, or your portion—the other two values calculate instantly.
- **No-Scroll Mobile Design:** Specifically optimized to fit fully on smartphone screens without vertical page scrolling.
- **Logs Archive Drawer:** Review saved calculations, search entries, or clear history in a sleek sliding menu drawer.
- **Export to CSV:** Download your calculation history to a spreadsheet file.
- **Daily Reset:** Only today's records count against the subsidy cap, so it refreshes every day.
- **Light & Dark Themes:** Follows your system setting, with a manual toggle.
- **Full Offline PWA:** Fully installable on your device's home screen and functions completely offline via service worker caches. No third-party requests: fonts and icons are bundled.
- **Persistent Storage:** Your calculations archive and daily cap changes are saved locally to `localStorage` so they persist across page refreshes.

## Technologies Used

- **HTML5 & CSS3:** Semantics and custom variables for light and dark themes.
- **Vanilla JavaScript:** `calc.js` holds the pure split logic (integer satang, unit tested); `app.js` handles the UI, service worker registration and localStorage.
- **Lucide Icons:** Inlined as an SVG sprite in `index.html` (ISC license).
- **Fonts:** Inter & Instrument Serif, self-hosted in `fonts/`.

## Running Locally

To host this locally:
1. Clone or download this folder.
2. Spin up any simple HTTP server (e.g. `npx http-server`).
3. Open `http://localhost:8080` in your browser.

## Tests

The calculation logic is covered by Node's built-in test runner (Node 18+, no dependencies):

```sh
npm test
```

## Author

Made by [pichayakorn](https://github.com/pichayakorn).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
