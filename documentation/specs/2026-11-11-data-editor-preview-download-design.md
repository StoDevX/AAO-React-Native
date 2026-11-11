# Data Editor: download the preview server when it is first needed

## Why

The app carries Node, the helper and ccc-server. ccc-server with its
dependencies is 615 MB of the app's 756 MB, and only the phone preview and
the Data Browser's "This Mac" column use it. Most contributors edit, check
and submit, and never start the preview.

## What changes

- The app bundles Node, npm and the helper: about 150 MB.
- The first **Start Preview** downloads ccc-server's source at the commit in
  `macos/DataEditor/ccc-server.ref` and runs `npm ci` there with the bundled
  Node and npm. Later starts reuse that install.
- A new app version that pins another commit installs that commit at its
  first Start Preview, then removes the installs of other commits.

## What the contributor sees

- The toolbar's preview control reads **Downloading preview…** while the
  download and install run, with the same yellow light as Starting preview…
  Its popover says "Getting the preview server ready. This happens once."
- **Stop** works during the download and install, and leaves nothing half
  installed for the next start.
- A failure reads **Preview stopped**, as a crash does. The popover says
  "Couldn't download the preview server." above the last lines of npm's
  output, with **Start the preview again**.
- Offline, the preview works once it has been downloaded. The first Start
  Preview offline fails as above.

## How it works

- **Where:** `~/Library/Application Support/<bundle id>/ccc/<commit>/`.
- **Download:** GitHub's archive of the repository at the pinned commit,
  unpacked into a staging folder beside the install folder.
- **Install:** `node <runtime>/npm/bin/npm-cli.js ci --no-audit --no-fund`
  in the staging folder, with the bundled Node first on `PATH`, so install
  scripts (workerd, esbuild, sharp) run on that Node. npm checks each package
  against the lockfile's integrity hash. Whether `--omit=dev` still leaves a
  working `wrangler dev` is measured while planning, and used if it does.
- **Done:** the staging folder is renamed to the install folder, and only
  then is the install treated as ready. A rename that never happened leaves
  no install, so the next start begins again.
- **Clean up:** after a ready install, other commits' folders and any
  staging folder are removed.
- **Run:** `CccRunner.Configuration.bundled` takes the install folder as
  `cccRoot`, as it takes the bundled folder today.

The model's `startPreview()` gains the step before the build: when there is
no ready install for the pinned commit, install it, reporting a new
`installing` state. Everything after is unchanged.

## Build

- `embed-runtime.sh` stops cloning ccc-server, and copies Node's bundled npm
  (`lib/node_modules/npm`) beside `node`.
- `ccc-server.ref` moves into the app's resources, so the app knows which
  commit to install.
- The e2e test (`macos/DataEditor/e2e/preview.test.mjs`) is unchanged; it
  takes a ccc-server checkout from `CCC_ROOT` as before.

## What this gives up

- Notarization covers what the app ships, not what npm installs later. The
  install is what a developer's `npm ci` would put on their Mac, checked
  against ccc-server's lockfile, from a commit the app pins.
- The first preview needs the network and takes a minute or two.

## Testing

- **Kit unit tests:** where an install lives for a commit; that a staging
  folder is never taken for an install; which folders the cleanup removes;
  the control's title and click for `installing`.
- **A manual check**, written into the PR: a fresh Application Support,
  Start Preview, the install finishes and the preview runs; Stop during the
  install, then start again; offline, a second launch starts the preview
  from the install.
- No UI test: the UI tests have no ccc to run, now or before.

## Out of scope

Shrinking ccc-server's own dependencies; downloading Node or the helper.
