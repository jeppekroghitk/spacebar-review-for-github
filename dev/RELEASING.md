# Releasing

## Cutting a release

1. Bump `version` in `app/manifest.json`.
2. Add the section to `CHANGELOG.md` under a `## <version>` heading — the release notes are read
   from it verbatim.
3. Commit, then tag:

   ```sh
   git tag v1.0.1 && git push origin main v1.0.1
   ```

The `release` workflow refuses the tag if it disagrees with `app/manifest.json`, builds both
packages and attaches them to a GitHub release:

| File | Goes to |
| --- | --- |
| `spacebar-review-for-github-<version>-firefox.xpi` | addons.mozilla.org |
| `spacebar-review-for-github-<version>-chrome.zip` | Chrome Web Store, and Edge or Brave unchanged |

Store submission stays manual.

To build the same files locally, with Node 22 or later and nothing to install:

```sh
node dev/build.mjs all   # dist/spacebar-review-for-github-<version>-<browser>.<ext>
```

## What differs per browser

The Chrome package drops `browser_specific_settings`, which holds the Firefox add-on ID and
Mozilla's data-collection declaration. Chrome reads it as an unrecognised key during review.
Everything else is the same in both.

## Firefox — addons.mozilla.org

Upload the `.xpi` under **Add-on Manager → Upload New Version**. Nothing is bundled or minified, so
answer **no** when it asks whether source code must be submitted.

Identity is the `gecko.id` in the manifest. Changing it would orphan every install rather than
update them.

## Chrome — Chrome Web Store

Upload the `.zip` as a new version of the item in the developer console at
<https://chrome.google.com/webstore/devconsole>.
