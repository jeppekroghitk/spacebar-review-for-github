# Spacebar Review for GitHub

A browser extension for reviewing pull requests from the keyboard. On a pull request's
*Files changed* tab, Space marks the next unviewed file as viewed and scrolls to the one after it.
Once every file is viewed, Space opens the *Submit review* menu.

Space does nothing extra while you type in a field, and holding a modifier key leaves it alone.

## Development

The extension is the `app/` folder, loaded as it is:

- **Chrome, Edge, Brave:** `chrome://extensions`, turn on developer mode, **Load unpacked**, pick `app/`.
- **Firefox:** `about:debugging#/runtime/this-firefox`, **Load Temporary Add-on…**, pick
  `app/manifest.json`.

`node dev/build.mjs all` builds the store packages into `dist/`. See
[dev/RELEASING.md](dev/RELEASING.md) for cutting a release.
