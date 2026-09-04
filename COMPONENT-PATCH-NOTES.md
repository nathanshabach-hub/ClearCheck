# ClearCheck — PWA Upgrade Patch Notes

This patch adds Progressive Web App (installable, offline-capable) support
to your existing ClearCheck / Dip & Dose Vite + React project, plus two
mobile-usability fixes identified during device-preview testing.

## Files in this bundle

public/manifest.json          — App name, icons, colours, display mode
public/sw.js                  — Service worker (offline caching)
public/icons/icon-192.png     — Home-screen icon (standard, 192x192)
public/icons/icon-512.png     — Home-screen icon (standard, 512x512)
public/icons/icon-maskable-192.png  — Adaptive icon for Android (192x192)
public/icons/icon-maskable-512.png  — Adaptive icon for Android (512x512)
index.html                    — Updated with manifest link, theme colour,
                                 Apple PWA meta tags, and service worker
                                 registration script
COMPONENT-PATCH-NOTES.md       — This file

## How to install into your existing project

1. Copy the `public/` folder from this bundle into your project root,
   merging with your existing `public/` folder (create one if you don't
   have it yet — Vite serves anything in `public/` at the site root).

2. Replace your existing `index.html` with the one in this bundle, OR
   manually merge in the <head> additions:
   - <link rel="manifest" href="/manifest.json" />
   - <meta name="theme-color" content="#0B4F4A" />
   - apple-touch-icon and apple-mobile-web-app meta tags
   - the service worker registration <script> block at the bottom of <body>

3. In your component file (DipAndDose.jsx / ClearCheck.jsx), apply the two
   small usability tweaks below.

## Fix 1 — Bigger tap targets on the colour swatches

Your swatch buttons are currently 34px tall, below Apple's recommended
44x44pt minimum touch target. In the ParamRow component, change:

    height: 34,

to:

    height: 44,

This is a one-line change with no other layout impact, since the buttons
already use flex: 1 for width.

## Fix 2 — Better numeric keyboard on mobile for the volume input

Your volume field uses type="number", which on iOS Safari shows a keyboard
with a decimal point and minus sign the user doesn't need. Change the
<input> in the "Water volume" section from:

    <input
      type="number"
      value={volume}
      onChange={(e) => setVolume(Number(e.target.value))}
      ...

to:

    <input
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      value={volume}
      onChange={(e) => setVolume(Number(e.target.value))}
      ...

inputMode="numeric" tells iOS and Android to show a plain numeric keypad
instead of the full decimal/signed number keyboard.

## Testing the PWA

1. Run `npm run dev` as usual and open the app in Chrome or Edge on
   desktop first — you should see an install icon (a small monitor with
   a down arrow) appear in the address bar. That confirms the manifest
   and service worker registered correctly.

2. To test true "add to home screen" behaviour, you need HTTPS or
   localhost — Vite's dev server on localhost qualifies automatically,
   but if you deploy to a real domain later, it must be served over
   HTTPS (most hosts, including Cloudflare and cPanel with a free
   Let's Encrypt cert, handle this by default).

3. On an actual iPhone: open the site in Safari, tap the Share icon,
   then "Add to Home Screen." On Android/Chrome: you'll usually see an
   automatic "Install app" banner or an option in the browser's menu.

4. Once installed, launching from the home screen icon opens the app
   without browser chrome (no address bar), matching the `"display":
   "standalone"` setting in manifest.json.

## Notes on the icons

The four PNG icons included are a simple placeholder design (a teal
rounded-square background with an aqua water-drop mark) generated to get
you unblocked immediately. Swap them out for your own branded icon later
by replacing the four PNG files in public/icons/ — keep the same
filenames and pixel dimensions (192x192 and 512x512) so manifest.json
doesn't need to change.

## What this does NOT do

This does not convert ClearCheck into a native iOS or Android app (no
App Store / Play Store packaging, no native APIs). A PWA installed this
way behaves like an app from the user's perspective (home-screen icon,
full-screen launch, works offline for previously-visited pages) but is
still fundamentally your existing web app, just installable. If you later
want true native distribution, tools like Capacitor can wrap this same
React code for App Store / Play Store submission without a rewrite.
