// Minimal service worker — presence of a fetch handler makes the app
// installable (PWA). Everything falls through to the network.
self.addEventListener('fetch', () => {})
