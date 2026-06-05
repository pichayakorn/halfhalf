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
- **Full Offline PWA:** Fully installable on your device's home screen and functions completely offline via service worker caches.
- **Persistent Storage:** Your calculations archive and daily cap changes are saved locally to `localStorage` so they persist across page refreshes.

## Technologies Used

- **HTML5 & CSS3:** Semantics and custom variables tailored for a Nordic Light theme.
- **Vanilla JavaScript:** Reactive computations, service worker lifecycle, and localStorage management.
- **Lucide Icons:** SVG icons loaded dynamically via CDN.
- **Google Fonts:** Inter & Instrument Serif.

## Running Locally

To host this locally:
1. Clone or download this folder.
2. Spin up any simple HTTP server (e.g. `npx http-server`).
3. Open `http://localhost:8080` in your browser.

## Author

Made by [pichayakorn](https://github.com/pichayakorn).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
