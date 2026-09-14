# Innovex Security Chrome Extension

This directory contains the desktop Chrome/Chromium Manifest V3 client for Innovex Security.

## Architecture

- `manifest.json` — MV3 configuration
- `background.js` — service worker; reads the active tab URL and calls the Innovex scan API
- `content.js` — displays an in-page warning banner for high-risk results
- `popup.html` / `popup.js` / `popup.css` — extension popup UI
- `icons/` — extension icons (replace the placeholder references with final branded icons before publishing)

The extension delegates detection to the existing Innovex Security API at `/api/scan/url`, so URL heuristics and URLhaus intelligence remain centralized in the existing server-side scanner.

Set `API_BASE_URL` in `background.js` to the deployed Innovex Security origin before loading the extension in Chrome.
