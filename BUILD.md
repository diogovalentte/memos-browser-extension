# Build and release

## Local build

```
./build.sh            # Chrome(ium)
./build.sh --firefox  # Firefox
```

The extension is generated in `dist/`. To test it:

- **Chrome(ium)**: `chrome://extensions` → enable developer mode → "Load unpacked" → select `dist/`.
- **Firefox**: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on…" → select `dist/manifest.json`. It must be the Firefox build (`--firefox`), the Chrome manifest fails with `background.service_worker is currently disabled`.

## Release

1. Bump the version in `package.json`, `package-lock.json`, `src/manifest.json` and `firefox/manifest.json` (`npm version X.Y.Z --no-git-tag-version` updates the first two).
2. Commit, create the tag `vX.Y.Z` and push the branch and the tag.
3. The tag triggers the `Publish Package` workflow (`.github/workflows/publish.yaml`), which:
   - creates the GitHub release with `memos-browser-extension-chrome.zip` and `memos-browser-extension-firefox.zip`;
   - submits the new version to [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/memos/) with `web-ext sign`, sending the source code (`git archive` of the tag), the build instructions for the reviewer and the commit subjects since the previous tag as release notes.

The Firefox version goes to Mozilla's review queue; the workflow doesn't wait for the approval. Follow it in [Manage My Submissions](https://addons.mozilla.org/en-US/developers/addons).

### Firefox Add-ons API keys

The workflow needs two repository secrets:

| Secret | Value |
|---|---|
| `AMO_JWT_ISSUER` | "JWT issuer" from the API keys page |
| `AMO_JWT_SECRET` | "JWT secret" from the API keys page |

Generate them in [addons.mozilla.org/developers/addon/api/key](https://addons.mozilla.org/en-US/developers/addon/api/key/) and save them in the repository settings → Secrets and variables → Actions.

## Manual Firefox submission (fallback)

If the workflow step fails:

1. Download `memos-browser-extension-firefox.zip` from the GitHub release.
2. Generate the source code zip: `git archive --format=zip -o memos-browser-extension-source.zip vX.Y.Z`.
3. In [Manage My Submissions](https://addons.mozilla.org/en-US/developers/addons) → Memos → "Upload New Version", upload the Firefox zip.
4. When asked about source code, answer yes and upload the source code zip. It's required because the build is bundled by Vite.
5. Build instructions for the reviewer: `Requires Node.js and npm. Build with: chmod +x ./build.sh && ./build.sh --firefox. The extension is generated in the dist/ folder.`
6. Fill in the release notes and submit.
