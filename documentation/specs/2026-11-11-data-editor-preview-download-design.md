# Data Editor: download the helper, Node and the preview server

## Why

The app carries Node, the helper and ccc-server: 756 MB. ccc-server with its
dependencies is 615 MB of that, and only the phone preview and the Data
Browser's "This Mac" column use it. Node is 117 MB, and the first launch
already needs the network to download the data. Most contributors edit, check
and submit, and never start the preview.

The helper the app carries is built from the scripts on the branch the app
was built from, so it falls behind master as soon as one of its scripts
changes there, and the app then refuses to edit until a new release.

## What changes

- The app bundles only oxfmt's package, whose native binding the helper
  loads: about 20 MB in all.
- Master's data deploy publishes the bundled helper to GitHub Pages beside
  the data. Each launch downloads the helper and the data at the commit that
  deploy was built from, so the helper always matches the data it edits.
- The first launch downloads Node, with its npm, alongside the data, and
  checks it against the SHA-256 the app carries. Later launches reuse it.
- The first **Start Preview** downloads ccc-server's source at the commit in
  `macos/DataEditor/ccc-server.ref` and runs `npm ci` there with that Node
  and npm. Later starts reuse that install.
- A new app version that pins another Node or another ccc-server commit
  downloads it when first needed, then removes the copies of other versions.

## What the contributor sees

- **Each launch:** as today, the startup screen says "Downloading…" while it
  fetches a newer commit. The helper (about 1.3 MB) comes with it.
- **An app too old for master's helper:** "An update is needed to edit this
  data", as today; it now appears only when the app and the helper stop
  understanding each other (see Protocol), not when a script changes.

- **First launch:** the startup screen's "Downloading…" covers Node too
  (about 45 MB more). A failure shows the screen's error and Try Again, as a
  failed data download does today.
- **First Start Preview:** the toolbar's preview control reads **Downloading
  preview…**, with the yellow light Starting preview… has. Its popover says
  "Getting the preview server ready. This happens once."
- **Stop** works during the preview's download and install, and leaves
  nothing half installed for the next start.
- A failed preview install reads **Preview stopped**, as a crash does. The
  popover says "Couldn't download the preview server." above the last lines
  of npm's output, with **Start the preview again**.
- Offline, editing and the preview work once each has been downloaded. A
  first launch offline fails as a data download does today; a first Start
  Preview offline fails as above.

## How it works

Everything downloaded lives under `~/Library/Application Support/<bundle id>/`:
the workspace (data, and the helper in its `scripts/`), `node/<version>/` and
`ccc/<commit>/`.

### The helper

- **Published:** `deploy-data.yml` builds the helper with
  `scripts/build-data-editor-helper.mjs` into `docs/data-editor/`:
  `data-editor-helper.mjs`, `bundle-data.mjs` and `helper.json`, which names
  the commit (`GITHUB_SHA`) and the protocol (below). oxfmt stays external
  and is not published: the runner's binding is Linux's.
- **Fetched:** the app reads `data-editor/helper.json` from Pages first and
  downloads the data at that commit, not at master's newest. Then it
  downloads the two scripts into the workspace's `scripts/`, beside the
  app's own copy of oxfmt's package as `node_modules`. If `helper.json`
  names another commit by the time the scripts arrive, a deploy landed
  meanwhile, and the app starts the download again.
- **Newer data:** the check for a newer commit reads `helper.json` too, so it
  offers an update once Pages has one, a few minutes after the merge.
- **Offline:** the workspace keeps the helper with the data it was fetched
  with.

### Protocol

`data-editor-helper.mjs` exports `PROTOCOL`, a whole number, and
`helper.json` repeats it. The app holds the number it speaks, and refuses a
helper with another one ("An update is needed…"). Changing a request's or a
reply's shape bumps both, in the change that makes it. This replaces the
comparison of the helper's files with master's.

### Node

- **What:** the URL and SHA-256 of Node's macOS arm64 archive, copied at
  build time from `mise.lock`'s `tools.node."platforms.macos-arm64"` entry
  into the app's resources as `node.json`. The repo's own Node pin decides
  the app's.
- **Download:** the archive into a staging folder; refused unless its
  SHA-256 matches; unpacked there.
- **Done:** the staging folder is renamed to `node/<version>/`, and only then
  is Node treated as ready.
- **Signature:** the Node Foundation signs and notarizes the binary, with
  `disable-library-validation` among its entitlements, so it loads the
  native add-ons the helper (oxfmt) and ccc-server use without the app
  signing it. Checked on 24.22.0: the helper's tests pass on that binary.
- **When:** in `launch()`, before the helper starts. The helper runs on it,
  as it runs on the bundled Node today.

### ccc-server

- **Download:** GitHub's archive of the repository at the pinned commit,
  unpacked into a staging folder beside the install folder.
- **Install:** `<node>/bin/node <node>/lib/node_modules/npm/bin/npm-cli.js ci
  --no-audit --no-fund` in the staging folder, with Node's `bin` first on
  `PATH`, so install scripts (workerd, esbuild, sharp) run on that Node. npm
  checks each package against the lockfile's integrity hash. Whether
  `--omit=dev` still leaves a working `wrangler dev` is measured while
  planning, and used if it does.
- **Done:** the staging folder is renamed to `ccc/<commit>/`, and only then
  is the install treated as ready. A rename that never happened leaves no
  install, so the next start begins again.
- **Run:** `CccRunner.Configuration.bundled` takes the install folder as
  `cccRoot`, and the downloaded Node as `node`.
- **When:** `startPreview()` gains the step before the build: when there is
  no ready install for the pinned commit, install it, reporting a new
  `installing` state. Everything after is unchanged.

### Clean up

After a ready Node or ccc-server, the other versions' folders and any
staging folders beside them are removed.

## Build

- `embed-runtime.sh` copies oxfmt's package (with this Mac's binding), and
  writes `node.json` and `ccc-server.ref` beside it.
- `deploy-data.yml` gains a step that builds the helper into
  `docs/data-editor/` after the data is bundled.
- The Embed Runtime phase copies that folder, as now.
- The e2e test (`macos/DataEditor/e2e/preview.test.mjs`) is unchanged; it
  takes a ccc-server checkout from `CCC_ROOT` as before.

## What this gives up

- Notarization covers what the app ships, not what it downloads. Node is
  checked against a SHA-256 the app carries and is signed by its makers;
  ccc-server's packages are checked against its lockfile, at a commit the
  app pins.
- The first launch takes a little longer, and the first preview a minute or
  two, each needing the network.

## Testing

- **node:test:** the helper build writes `helper.json` with the commit it is
  given and `PROTOCOL`, and leaves oxfmt out of `docs/data-editor/`.
- **Kit unit tests:** downloading the data and the helper at `helper.json`'s
  commit; starting again when the commit changes mid-download; refusing a
  helper whose protocol differs; where Node and an install live for a version; that an
  archive whose SHA-256 differs is refused and leaves nothing behind; that a
  staging folder is never taken for a ready copy; which folders the cleanup
  removes; reading `node.json`; the preview control's title and click for
  `installing`.
- **A build test** (node:test, beside the embed script): `node.json` matches
  `mise.lock`'s macOS arm64 entry.
- **A manual check**, written into the PR: a fresh Application Support,
  launch, Node and the data download and the editor opens; Start Preview,
  the install finishes and the preview runs; Stop during the install, then
  start again; offline, a second launch edits and starts the preview.
- No UI test: the UI tests bring their own Node and have no ccc to run, now
  or before.

## Out of scope

Shrinking ccc-server's own dependencies; publishing oxfmt's binding.
