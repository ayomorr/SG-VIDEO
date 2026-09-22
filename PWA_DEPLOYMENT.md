# PWA deployment guide for Scroll Detect

This project is set up as a Progressive Web App (PWA) and can be installed from a browser without using the App Store or Play Store.

## What is already included

- Web app manifest at `/manifest.webmanifest`
- App icons for installable usage
- Service worker for offline caching
- Install guidance in the UI
- Mobile-friendly metadata and app config

## Deployment requirements

For a PWA to install reliably, the app must be served over HTTPS.

Use a real domain such as:

- https://scrolldictive.app
- https://www.scrolldictive.app
- any production hosting provider with HTTPS enabled

## Recommended hosting options

- Vercel
- Netlify
- Cloudflare Pages
- any static or Node host with HTTPS

## Important note

A PWA is not the same as a native App Store app. It installs from the browser and behaves like an app, but it does not get distributed by Apple or Google app stores unless you wrap it in a native shell later.

## Browser install flow

### Android

- Open the site in Chrome or Edge
- Tap the menu
- Choose Install app / Add to home screen

### iPhone / iPad

- Open the site in Safari
- Tap the Share button
- Tap Add to Home Screen

## Production checklist

- Deploy to HTTPS
- Confirm the manifest loads at `/manifest.webmanifest`
- Confirm the service worker loads at `/sw.js`
- Confirm icons exist in `/public`
- Test on mobile Safari and Chrome
- Ensure the app is not behind a blocked or mixed-content environment

## Optional next step: native app stores

If you later want App Store or Play Store distribution, store the same app inside a native wrapper such as Capacitor.

This keeps the web app logic and adds native packaging for app-store submission.
