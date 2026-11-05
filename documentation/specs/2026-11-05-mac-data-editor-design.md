# Mac data editor: design

## Purpose

A native macOS app that lets someone who is not a developer — student
workers, office staff — edit the data All About Olaf ships, see the edit in
the real app on their phone, and submit it for review as a pull request.
They need no git, Node, mise or Xcode.

Success for v1: a staff member downloads the app, signs in to GitHub, changes
their office's building hours, sees the change on their own phone's App Store
copy of All About Olaf, and opens a pull request, without help.

## Decisions

| Question | Decision |
|---|---|
| Who it is for | Non-developers first |
| How edits return | The contributor signs in to GitHub; the app forks, commits and opens a PR. Submission sits behind a `ChangeSubmitter` protocol so a no-account route can replace it later |
| v1 scope | Building hours only, end to end |
| Fidelity | The app runs the real `bundle-data` and the real ccc-server, so a preview is what production would serve |
| Campus | St. Olaf only (Carleton's data lives in another repo) |
| Platform | macOS 27 or later (matching Radio), Apple Silicon only |
| Distribution | Developer ID signed and notarized, published on GitHub Releases, updated through Sparkle. Kept sandbox-compatible so a TestFlight build can follow |

## How data reaches the app today

`data/*.yaml` → `scripts/bundle-data.mjs` → JSON published on
`stolaf.dev/AAO-React-Native/` → ccc-server. ccc fetches hours and breaks
itself and resolves the schedules (`source/schedules/resolve.ts`) before
answering `/spaces/hours`; other routes in `workers/src/pages-routes.ts`
redirect the phone straight to `stolaf.dev`. `pages-json` reads only from
`stolaf.dev` and `carls-app.github.io`.

Any build of the app, store builds included, can turn on dev mode from the
Home notice. Developer → Server URL then lists ccc servers found over Bonjour
(`_ccc-server._tcp`, declared in `app.config.ts`).

## Architecture

The app lives at `macos/DataEditor/`, beside `Radio`.

### Units

1. **Workspace.** Downloads `data/` at a commit from GitHub into Application
   Support, records that commit as the base, and tracks the files changed
   since. Offers to update to master when it moves.
2. **Pipeline helper.** A long-running process on the bundled Node, spoken to
   in newline-delimited JSON over stdio. Methods: `load(file)`,
   `save(file, value)`, `validate(file)`, `build()`. It owns all YAML reading
   and writing, using the `yaml` package's Document API, so comments, key
   order and quoting survive and diffs stay small. It runs the bundled copies
   of AAO's scripts.
3. **Hours editor.** A sidebar of buildings grouped by category and a detail
   pane: the week's services as a timeline, plus exceptions and break
   schedules. Validation errors show against their fields.
4. **Local data server.** Serves the latest `build()` output over HTTP on the
   local network, not only on localhost, because redirected routes send the
   phone straight to it.
5. **ccc runner.** Starts and supervises the bundled `wrangler dev` with
   `PAGES_ORIGIN_OVERRIDE` pointing at the data server. ccc's dev script
   already advertises over Bonjour. Shows status and the log tail.
6. **Data browser.** Requests any ccc route and shows the JSON, with Local and
   Production columns side by side.
7. **Submitter.** `ChangeSubmitter` protocol; v1 ships `GitHubSubmitter`:
   device-flow sign-in, fork, branch, commit through the Git Data API, open
   the PR.

### ccc-server change

A dev-only `PAGES_ORIGIN_OVERRIDE`, passed to `wrangler dev` as a var by the
ccc runner and never set in `wrangler.jsonc`, so a deploy cannot carry it. When
set:

- the `STOLAF()` URL helper in `workers/src/pages-routes.ts` builds URLs on
  that origin, so `pages-json`, the hours and breaks reads, and the redirects
  all follow it;
- the override origin is allowed in `pages-json`'s host check;
- hours and breaks skip the source cache, so each rebuild shows on the next
  refresh.

Production keeps today's host allowlist and caching.

## Flow

### Edit

1. Selecting a building calls `load(file)`. The helper returns the parsed
   value and keeps the Document.
2. Each edit sends the whole value to `save(file, value)`. The helper applies
   it to the Document, writes the YAML, and runs `validate(file)`: the
   file's schema from `data/_schemas` and the schedule-reference checks.
   Errors come back with JSON paths.

### Preview

3. After a valid save, debounced by about 500 ms, the app calls `build()`,
   which runs `bundle-data` into the data server's directory. `bundle-data`
   checks every schedule before writing anything, so an invalid file stops
   the build: the server keeps the last good build and the app names the
   file that blocks it.
4. On the phone, in dev mode, the contributor picks "ccc-server edu.stolaf
   (<Mac name>)" under Developer → Server URL and pulls to refresh.

### Submit

5. A Changes view lists edited files with readable diffs.
6. "Submit for review…" asks for a one-line summary, then signs in if
   needed, forks if needed, branches from the base commit, commits the
   changed files and opens the PR with the summary and the app version.
7. The app keeps the PR link and shows its state (open, changes requested,
   merged). After a merge it offers to update the workspace to master.

## Errors

- **Master has moved:** the PR still targets the base commit and GitHub
  shows any conflict. Updating the workspace replays local edits; a file
  changed on both sides asks which version to keep.
- **ccc crashes:** restart it and show the log tail.
- **Port 8787 is taken:** ccc refuses to start; the app says why.
- **Offline:** editing and preview work. Submission waits for the network.
- **Scripts newer than the app:** see Versioning.

## Versioning

The app bundles `scripts/` with its `node_modules`, and a ccc-server build,
from the commits it was built from. At run time it downloads only `data/`,
including `data/_schemas`, so validation follows the data. If master's
`scripts/` tree hash differs from the one bundled, the app blocks editing with
"An update is needed to edit this data" and offers the Sparkle update. CI
publishes a new build whenever `scripts/` changes.

## Packaging

- A GitHub Actions macOS job builds the app, places arm64 Node, the ccc build
  and the scripts inside it, signs every bundled binary with hardened
  runtime, notarizes, and publishes the release and Sparkle appcast.
- Helpers stay within what App Sandbox allows — child processes inherit the
  sandbox (`com.apple.security.inherit`), the app may listen
  (`network.server`), V8 may JIT (`cs.allow-jit`), files stay in the
  container — so a TestFlight build needs entitlements, not a redesign.

## Testing

- **Pipeline helper** (`node:test`, beside its subject): load followed by an
  unchanged save leaves each of the 51 hours files byte-identical; edits land
  where intended; errors carry the right path.
- **ccc** (vitest): the override does nothing outside `wrangler dev`; with it,
  `STOLAF()` URLs, redirects and `pages-json` use it, and hours skip the
  cache.
- **Swift** unit tests: workspace base and change tracking, the stdio
  protocol client, and `GitHubSubmitter` against `URLProtocol` stubs for the
  fork → branch → commit → PR sequence.
- **XCUITests**, in the style of Radio's: pick a building, edit, see a
  validation error, fix it, see it in Changes.
- **End to end** in CI: boot the helper and ccc, edit a fixture through the
  helper, and check that `/spaces/hours` reflects it.

## Out of scope for v1

Other data types and generic schema-driven forms; Carleton; submitting
without a GitHub account; running ccc on workerd directly to shrink the app;
Intel Macs; TestFlight and the Mac App Store.
