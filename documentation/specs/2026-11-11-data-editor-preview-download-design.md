# Data Editor: run the helper in JavaScriptCore, download the rest

## Why

The app carries Node, the helper and ccc-server: 756 MB. ccc-server with its
dependencies is 615 MB of that, and only the phone preview and the Data
Browser's "This Mac" column use it. Most contributors edit, check and submit,
and never start the preview.

The helper the app carries is built from the scripts on the branch the app
was built from, so it falls behind master as soon as one of its scripts
changes there, and the app then refuses to edit until a new release.

A spike (2026-11-11) ran the helper in JavaScriptCore against the repo's
data: list, calendar, load, five edits and three builds gave the same
replies, the same edited files and the same 70 build files as Node, byte for
byte.

## What changes

- The helper runs inside the app, in JavaScriptCore. Editing, checking and
  building need no Node.
- Master's data deploy publishes the helper, built for JavaScriptCore, to
  GitHub Pages beside the data. Each launch downloads the helper and the data
  at the commit that deploy was built from, so the helper always matches the
  data it edits.
- The app bundles oxfmt's standalone binary (5.7 MB), which the helper runs
  to write the data files in the repo's style. The app is about 15 MB.
- The first **Start Preview** downloads Node and ccc-server's source at the
  commit in `macos/DataEditor/ccc-server.ref`, and runs `npm ci` there with
  that Node. Later starts reuse both.
- A new app version that pins another Node or another ccc-server commit
  downloads it at its first Start Preview, then removes the copies of other
  versions.

## What the contributor sees

- **Each launch:** as today, the startup screen says "Downloading…" while it
  fetches a newer commit. The helper (about 1.3 MB) comes with it.
- **An app too old for master's helper:** "An update is needed to edit this
  data", as today. It now appears only when the app and the helper stop
  understanding each other (see Protocol), not when a script changes.
- **First Start Preview:** the toolbar's preview control reads **Downloading
  preview…**, with the yellow light Starting preview… has. Its popover says
  "Getting the preview server ready. This happens once." Node (about 45 MB)
  and ccc-server download then.
- **Stop** works during the preview's download and install, and leaves
  nothing half installed for the next start.
- A failed preview download reads **Preview stopped**, as a crash does. The
  popover says "Couldn't download the preview server." above the last lines
  of the failure, with **Start the preview again**.
- Offline, editing works once the data has been downloaded, and the preview
  once it has been. A first Start Preview offline fails as above.

## How it works

Everything downloaded lives under `~/Library/Application Support/<bundle id>/`:
the workspace (data, and the helper in its `scripts/`), `node/<version>/` and
`ccc/<commit>/`.

### The helper in JavaScriptCore

- **Bundle:** esbuild bundles `scripts/data-editor-helper.mjs` and
  `scripts/bundle-data.mjs` each into one plain script (`iife`), swapping
  Node's built-ins for small stand-ins kept in the repo
  (`scripts/data-editor-jsc/`): the file calls the scripts make (about ten),
  POSIX `path`, `url`, `util`, `module`, a write stream, and `URL` from
  `react-native-url-polyfill`. `import.meta.dirname` and `import.meta.url`
  become the workspace's `scripts/`, where the helper works out `../data`
  and `../images` today.
- **Host:** a Swift `HelperRuntime` owns a `JSVirtualMachine` on its own
  thread. It hands each context the file calls, timers (`setTimeout`,
  `clearTimeout`), `console` and `process`, and runs the timers until each
  call's promise settles.
- **Calls:** the app calls the helper's handlers (`list`, `calendar`, `load`,
  `edit`, `build`) directly, with parameters as JSON text so key order
  survives, and reads the replies as JSON. The stdin protocol and the helper
  process go.
- **bundle-data:** the helper runs it as a second Node process today. The
  stand-in for `child_process.spawn` runs it in a fresh context instead,
  with its own `process.argv`, and reports its exit code and an uncaught
  error the way Node prints one (`Name: message`), which the pipeline reads.
- **oxfmt:** the stand-in for oxfmt's `format(file, text, options)` writes
  the text to a temporary file named like the data file, runs the bundled
  binary with the options as its config, and reads the result back.
- **Serving the build:** the helper's `serve` used Node's `http`. A Swift
  server on port 8790 serves the newest good build folder instead, with the
  same content types, `Cache-Control: no-store`, and 404 for anything else.

### Publishing the helper

- `deploy-data.yml` gains a step, after the data is bundled, that builds the
  helper for JavaScriptCore into `docs/data-editor/`: `helper.js`,
  `bundle-data.js` and `helper.json`, which names the commit (`GITHUB_SHA`)
  and the protocol (below).
- The app reads `data-editor/helper.json` from Pages first, and downloads the
  data at that commit, not at master's newest. Then it downloads the two
  scripts into the workspace's `scripts/`. If `helper.json` names another
  commit by the time they arrive, a deploy landed meanwhile, and the app
  starts the download again.
- The check for a newer commit reads `helper.json` too, so it offers an
  update once Pages has one, a few minutes after the merge.
- Offline, the workspace keeps the helper with the data it was fetched with.

### Protocol

`data-editor-helper.mjs` exports `PROTOCOL`, a whole number, and
`helper.json` repeats it. The app holds the number it speaks, and refuses a
helper with another one ("An update is needed…"). Changing a handler's
parameters or its reply's shape bumps both, in the change that makes it.
This replaces the comparison of the helper's files with master's.

### oxfmt

- The build downloads `oxfmt-aarch64-apple-darwin.tar.gz` from oxc's GitHub
  release for the version in the repo's `package.json`, refuses it unless it
  matches the SHA-256 in `macos/DataEditor/oxfmt.sha256`, and copies the
  binary into the app's resources.
- Bumping oxfmt in the repo needs the new checksum in that file; the build
  fails until it is there.

### Node, for the preview

- **What:** the URL and SHA-256 of Node's macOS arm64 archive, copied at
  build time from `mise.lock`'s `tools.node."platforms.macos-arm64"` entry
  into the app's resources as `node.json`.
- **Download:** the archive into a staging folder; refused unless its
  SHA-256 matches; unpacked there. The staging folder is renamed to
  `node/<version>/`, and only then is Node treated as ready.
- **Signature:** the Node Foundation signs and notarizes the binary, with
  `disable-library-validation` among its entitlements, so it loads
  ccc-server's native add-ons without the app signing it.

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
  is the install treated as ready.
- **Run:** `CccRunner.Configuration.bundled` takes the install folder as
  `cccRoot`, and the downloaded Node as `node`.
- **When:** `startPreview()` gains a step before the build: without a ready
  Node and install for the pinned versions, download them, reporting a new
  `installing` state. Everything after is unchanged.

### Clean up

After a ready Node or ccc-server, the other versions' folders and any
staging folders beside them are removed.

## Build

- `embed-runtime.sh` downloads and checks oxfmt, and writes `node.json` and
  `ccc-server.ref` beside it. It no longer copies Node, the helper or
  ccc-server.
- `scripts/build-data-editor-helper.mjs` builds for JavaScriptCore, with
  the stand-ins, and writes `helper.json`.
- The UI tests load the helper built from the checkout, as they run the
  checkout's scripts today.
- The e2e test (`macos/DataEditor/e2e/preview.test.mjs`) is unchanged; it
  takes a ccc-server checkout from `CCC_ROOT` as before.

## What this gives up

- The helper runs on a different engine in the app than in CI. A parity
  test (below) catches the stand-ins falling behind the scripts.
- `URL` from the polyfill handles international domain names differently
  from Node's. The data has none today.
- Each saved edit takes about 85 ms instead of 5 ms, mostly starting oxfmt's
  binary; a build takes 40–95 ms instead of about 500 ms.
- The app's oxfmt can trail the repo's until the next release, so a file the
  app writes could format differently from what `mise run format:check`
  wants, if oxfmt changed its output in between.
- Notarization covers what the app ships, not what it downloads. Node is
  checked against a SHA-256 the app carries and is signed by its makers;
  ccc-server's packages are checked against its lockfile, at a commit the
  app pins.
- The first preview takes a minute or two and needs the network.

## Testing

- **Parity (app unit test):** runs the helper built from the checkout in
  `HelperRuntime` and the checkout's scripts in Node (the tests'
  `DATA_EDITOR_NODE`) through the same steps on a copy of the repo's data:
  list, calendar, load, edits that format, edits that break the schema and
  the overlap check, and builds. Every reply, every data file and every
  build file must match.
- **node:test:** the helper build writes `helper.json` with the commit it is
  given and `PROTOCOL`.
- **Kit unit tests:** downloading the data and the helper at `helper.json`'s
  commit; starting again when the commit changes mid-download; refusing a
  helper whose protocol differs; the build server's replies; where Node and
  an install live for a version; that an archive whose SHA-256 differs is
  refused and leaves nothing behind; that a staging folder is never taken for
  a ready copy; which folders the cleanup removes; the preview control's
  title and click for `installing`.
- **A manual check**, written into the PR: a fresh Application Support,
  launch, the data and helper download and the editor opens and saves an
  edit; Start Preview, Node and ccc-server install and the preview runs;
  Stop during the install, then start again; offline, a second launch edits
  and starts the preview.

## Out of scope

Shrinking ccc-server's own dependencies; running ccc-server without Node.
