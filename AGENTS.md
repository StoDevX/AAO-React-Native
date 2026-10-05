# AAO React Native

## Project Overview

All About Olaf is a React Native mobile app for the St. Olaf College community. It provides students, faculty, and staff with access to campus info, dining menus, course catalogs, campus maps, and more.

- **React Native 0.86.2** with **TypeScript**
- **Expo Router 57** for navigation — file-based, with `experiments.typedRoutes` set in `app.config.ts`
- **Zustand 5** for feature state, **Redux Toolkit** for the older shared slices, **React Query 5** for server state
- **Jest** + **React Native Testing Library** for testing
- **Xcode Cloud** for builds and TestFlight submissions
- Monorepo with internal packages in `modules/`

## Commit Messages

No conventional-commit prefixes. Write `Drop the migration planning docs`, not
`chore: drop the migration planning docs`.

Use the imperative mood, capitalised, with no trailing full stop. Most commits
here are subject-only; when a body is warranted, use it to explain why the
change was needed rather than restating the diff.

## Code Conventions

- TypeScript for all new code — no `any`
- Functional components with hooks only
- `StyleSheet.create()` for all styles — no inline style objects
- **Naming:** PascalCase components, kebab-case files, camelCase variables/functions, UPPER_SNAKE_CASE constants
- **Imports:** React → React Native → third-party → local. Named imports preferred.
- **No Moment.js** — use `date-fns` or `Day.js` for date/time
- Colors from `@frogpond/colors` — follow existing color system
- oxfmt config in `.oxfmtrc.json` (tabs, single quotes, no semis)
- **Comments:** JSDoc (`/** … */` or `/// `) to annotate a declaration — a function, component, type, prop, or exported constant. Plain `//` for a step or a reason inside a function body.
- Comments say what the code does and why, never what it used to do or what changed

## Architecture & Patterns

- `source/features/` holds each feature's non-route code (e.g., `dining/`, `directory/`, `calendar/`); `app/` route files are the screens themselves
- Barrel exports (`index.ts`) for clean imports
- State: React Query for server state; a Zustand store in the feature's own `store.ts` for state that feature owns, persisted to AsyncStorage through `persist` when it must survive a relaunch; `useState` for component-local. Redux Toolkit holds the older shared slices in `source/redux/parts/` — don't add new state there
- iOS is the only supported platform
- Email via `sendEmail`, phone via `callPhone` components
- Error logging via Sentry integration
- React Error Boundaries for component error handling

## Mobile Priorities

These patterns are especially important in this codebase:

- **Lists:** Always use `FlatList`, never `ScrollView` for dynamic data. Memoize list items with `React.memo`.
- **Safe areas:** Use `react-native-safe-area-context` — never hardcode status bar padding
- **Touch targets:** Minimum 44x44pt on all interactive elements
- **Accessibility:** Include `accessibilityLabel` and `accessibilityRole` on all interactive elements
- **Offline:** Handle network unavailability gracefully — use cached data as fallback
- **Performance:** Minimize bridge traffic; use `InteractionManager.runAfterInteractions()` for heavy work
- **Memory:** Clean up subscriptions/listeners in `useEffect` cleanup functions
- **Platform testing:** Test on iOS — verify platform-specific UI patterns

## Testing

- Jest + React Native Testing Library for component tests
- Build and CI tooling is plain Node, so its tests run on `node:test` and live
  beside their subject: `scripts/<name>.test.mjs` and `plugins/<name>.test.ts`.
  Jest's `testMatch` requires a `__tests__/` segment, so a test sitting beside
  its subject cannot end up under both runners.
- A `plugins/*.test.ts` imports its subject with the extension —
  `./with-alternate-icons.ts` — because Node strips the types and loads the
  result as ESM. For the same reason a plugin importing a type as a value
  breaks at runtime, so type imports there are `import type`.
- Tests live adjacent to source files or in `__tests__/` directories
- Mock native modules and external APIs
- Descriptive test names; group with `describe` blocks
- `beforeEach`/`afterEach` for setup/cleanup
- **XCUITest debugging:** iOS UI tests live in `uitests/` and run as sharded CI jobs. When a test fails, two artifacts are uploaded per shard: `uitest-attachments-{shard}` (screenshots extracted via `xcrun xcresulttool export attachments`) and `uitest-results-{shard}.xcresult` (the full XCResult bundle). Start with the attachments for a quick look; open the `.xcresult` bundle in Xcode (or query via `xcrun xcresulttool get --format json --path uitest-results.xcresult`) for full logs, traces, and per-test activity.

**Jest cannot see what a view looks like.** The test environment has no layout
pass, no compositor, and no hit testing. A rendered view there is a tree of the
props we passed — sometimes through stand-ins for components that cannot load at
all. So a test asserting a colour, a size, a spacing, a truncation, or a tap
target is asserting our own input, not the result a user gets, and it will keep
passing while the screen is broken on a device. A row once shipped untappable
because its button style hit-tested only drawn content; every test around it
passed.

In Jest, assert what is genuinely decided in JavaScript: pure functions,
reducers, parsers, data shaping, hooks, and **which branch a component chose** —
the empty state versus the error state versus the list. Those are real decisions
with real logic behind them.

Appearance and interaction — tint, spacing, alignment, truncation, hit targets,
menu and sheet presentation, safe-area behaviour — belong in an XCUITest under
`uitests/`, verified against a screenshot someone actually opens.

If something cannot be checked on the simulator, say so. The failure mode is not
a weak test; it is a weak test that makes a broken feature look covered.

## Development Commands

pnpm is the package manager. npm and yarn both choke on the `workspace:*`
protocol the modules use.

```bash
mise run lint         # all three below, in parallel
mise run lint:oxlint  # oxlint
mise run lint:shell   # shellcheck on every tracked .sh
mise run lint:actions # zizmor on .github/workflows
mise run format       # oxfmt; run `format:check` to validate instead
mise run test         # every test
mise run test:jest    # Jest: app, source, modules
mise run test:node    # node:test: scripts/, plugins/
mise run tsc          # Type check
mise run prebuild     # Generate ios/ from app.config.ts, and install pods
```

### App Variants

A development build can sit alongside the shipping app on one device.
`APP_VARIANT` selects the build at generation time; unset means production, so
every default path is unchanged.

| `APP_VARIANT` | Bundle identifier | Home screen |
| --- | --- | --- |
| *(unset)* / `production` | `NFMTHAZVS9.com.drewvolz.stolaf` | All About Olaf |
| `development` | `…stolaf.dev` | AAO Dev |

Both variants share the windmill icon, so tell them apart by name.

```bash
APP_VARIANT=development mise run prebuild   # then build to your device
```

The URL scheme varies too — two apps claiming one scheme is undefined behaviour.

TestFlight and App Store builds both ship the production identity, so a
TestFlight build replaces the App Store app as it always has.

**A build to a local device needs nothing beyond `mise run device "<DEVICE
NAME>"`.** Sending the dev variant through TestFlight or the App Store is a
different matter: that bundle identifier would need its own App Store Connect
record, which this config does not create.

### App Icons

The app icons are Icon Composer documents in `assets/*.icon`. `ios.icon` in
`app.config.ts` names the primary, `windmill.icon`, and
`plugins/with-alternate-icons.ts` bundles the rest as alternates. Each
alternate's file name is the name `react-native-change-icon` switches to.

Old Main (Retro) is the exception: a static app icon set,
`assets/old-main-retro.xcassets/old-main-retro.appiconset`, with a light and a
dark image and no tinted one, since iOS tints it on its own and a rendered
tinted look would cost another 1024px render. `STATIC_ALTERNATE_ICONS` in the
plugin lists such sets, which it copies into the app's `Images.xcassets`.

Customize's App Icon gallery and the About screen show PNG previews of each icon,
kept in `images/icons/`. Regenerate them after editing an `.icon`:

```bash
mise run icons
```

Each icon gets a light and a dark preview, and the screens follow the app's
appearance. `mise run icons -- --all` also renders the tinted look, to review
a change by eye; the app cannot tell when the home screen is tinted, so those
files are gitignored. Add `--table` to write `images/icons/logos.html`, a
gitignored gallery of every logo, to compare them side by side.

The task needs Xcode, whose Icon Composer renders the previews, and runs them
through oxipng; the Retro set also needs ImageMagick (`brew install imagemagick`). A new `.icon` alternate also needs an entry in `ALTERNATE_ICONS` in
the plugin, in `appIcons` in `images/icons/index.ts`, and in the gallery's
`ICONS` in `source/features/customize/icons.ts`.

The Old Main (Retro) icon's source is an Icon Composer document in
`assets/0-source-icons/old-main-retro.icon`, kept out of the bundle. Its pixel
layers are drawn by `scripts/make-crt-pixels.mjs` from the screen grid in that
file: the cells as `pixels.svg` and `pixels-amber.svg`, and their glow as
quarter-size PNGs rendered from the SVGs in the document's `source/`. Edit the
grid, run `mise run crt-pixels`, then `mise run icons`.

`mise run icons` makes the previews with ictool but the app icon set with
ImageMagick, stacking the document's layers itself. ictool bakes a rounded mask
and a lit rim into its render, iOS draws its own over any app icon, and the dark
one's rim then glows, so the set is a plain full-bleed square. It is converted
to sRGB, 8 bits and no alpha: actool stores a second, 16-bit copy beside every
Display P3 image, and the app icon sets want no alpha. The drawing is Display P3
throughout (the palette holds P3 components, icon.json reads untagged SVG colors
as P3, and the glow PNGs are tagged with the profile, not converted to it), so
only the set's images lose the wider gamut. The stack ignores the document's
translucency and glass, which it matches to within a few percent. A change to
the document's layer order or fill needs the same change in `retroSetImages`.

Every `.icon` costs about 2.3 MiB of each iPhone's download, as actool stores a
flat 1024px render per appearance without loss, and a layer's own images come
on top. A static app icon set costs one render per image it lists. Keep both
down:

- Grain and noise make every render bigger; the Retro icon's backgrounds were
  1.8 MB each until a blur took the grain out.
- A soft layer can be a quarter-size PNG scaled up 4x in icon.json's
  `position`, at no visible cost.
- Icon Composer ignores SVG filters without a word, so a blur or glow stays a
  raster layer.

### Images the app fetches

Contact, building, webcam, news-source and radio-station pictures are not in
the app bundle. The app asks ccc-server for `/v1/images/<group>/<name>.webp`,
which proxies GitHub Pages; `bundle-data` publishes `images/<group>/*.webp` to
`docs/img/<group>/`. The map pin and the radio's record (`images/streaming/vinyl.png`)
stay bundled: both are always drawn, so neither gets a failure state. The
groups are listed in `images/groups.json`.

Keep an original in `images/<group>/source/`, run `mise run images` to write
its WebP beside it, and commit both; the run also removes a WebP whose
original is gone, and a test fails on one that is left. The data names an image by its file name
without the extension (`image: cage`), and `scripts/bundle-images.test.mjs`
fails when a name has no WebP; `source/lib/__tests__/published-images.test.ts`
does the same for the names written in code (radio logos, news sources).

Address images through `remoteImage` in `source/lib/remote-images.ts`, at
render time, since the server is a setting that loads after launch: keep a
name in the data, never a URL in a module-level constant. A device keeps a
fetched image and shows it offline without asking again, so publish a changed
picture under a new name and point the data at it. Draw a fetched picture with
`useImageFailure`, so one that cannot load leaves its row out instead of an
empty frame.

### Custom Symbols

A glyph iOS does not ship, like the Olaf Messenger's castle, is a custom SF
Symbol: a `.symbolset` in `assets/symbols/`, which
`plugins/with-custom-symbols.ts` copies into the asset catalog at prebuild.
Name it in `CUSTOM_SYMBOLS` in `source/features/views.ts`, and `iconImage`
draws it by `assetName` rather than `systemName`.

`mise run trace-symbol -- <image> <name>` traces a logo into one, with
ImageMagick and potrace (`brew install imagemagick potrace`). The image's dark
pixels become the symbol, so a white mark on a dark disc comes out as a disc
with the mark cut out. The Messenger's came from
`https://olafmessenger.com/wp-content/uploads/2021/02/Logo_white-e1713492149523.png`.

The template holds `Regular-S`, `Regular-M` and `Regular-L`. Other weights
fall back to Regular, but a missing scale does not: without `Regular-L`, the
home screen's `imageScale('large')` finds no image and draws nothing, with only
a SwiftUI fault in the log to say so. Xcode's asset compiler also accepts a
malformed template without a word, so check a new or edited symbol on the
simulator, or validate it in the SF Symbols app.

### Local Server Discovery

In dev mode (debug builds, or with the dev-mode override enabled in Settings), the Settings → Server URL screen will automatically discover a `ccc-server` instance running on the same network via mDNS. Discovered servers appear as tappable cells; tapping one fills the URL field.

To use this:
1. Start `ccc-server` with mDNS advertisement enabled: `mise run start:with-server` starts it beside Metro, from a `ccc-server` checkout next to this one (set `CCC_SERVER_DIR` for one elsewhere). Metro keeps the terminal, and Ctrl-C stops both. To run the server alone, `mise run stolaf-college:mdns` in the `ccc-server` repo
2. Run a debug build of the app on a device on the same network
3. Navigate to Settings → Server URL — the server will appear automatically

The feature uses `react-native-zeroconf` (native pod). If the pod hasn't been linked yet (`mise run prebuild`), discovery is silently skipped — the screen won't crash.

### Dining Hours

`data/building-hours/1-3-stav.yaml` and `1-1-cage.yaml` are maintained by a
weekly scrape of Bon Appétit's café pages, which opens a pull request when they
fall behind. Edit `scripts/bonapp-overrides.yaml` rather than those two files —
a hand edit to a `schedule:` block in them is reverted by the next run.

```bash
mise run scrape-dining                   # update the owned files now
node scripts/scrape-bonapp.mjs --check   # report without writing; exits 1 on drift
```

The Lion's Pause, its pizza delivery, the C-Store and every `breakSchedule` are
hand-maintained. Bon Appétit publishes no page for the Pause, and its hours for
The Cave disagree with the college's own — each run reports that disagreement
rather than resolving it.

Bon Appétit's café pages are the better source generally: the Weekly Schedule
table is in the server HTML, and `wp.stolaf.edu/buntrock/eat/` has been wrong
about Stav twice.

### Student Wages

`data/student-wages.yaml` holds the hourly rate for each pay code (ST1–3,
NST1–3, OSA1–3). A monthly scrape of St. Olaf's compensation page, through the
WordPress REST API, opens a pull request when it falls behind; merging
publishes the new rates to the app with no release.

```bash
mise run scrape-student-wages                    # update the file now
node scripts/scrape-student-wages.mjs --check    # report without writing; exits 1 on drift
```

A page that drops, repeats or adds a pay code fails the run and writes
nothing. A new code needs a change to `JobCode` in
`source/features/sis/student-work/posting.ts` first. Jest and the UI tests
read `FIXED_WAGES`, not the data file, so a rate change never breaks them.

### KSTO Schedule

`data/ksto-schedule.yaml` holds KSTO's weekly shows, scraped from the station's
Now Playing post (`https://www.kstoradio.org/2023/03/17/4243/`). That post is
the only schedule KSTO publishes as data: its schedule page is an image, and
the Google Calendar ccc-server used to read stopped at spring 2019. A weekly
scrape opens a pull request when the file falls behind; merging publishes
`ksto-schedule.json`, which ccc-server serves as the `ksto-schedule` calendar.

```bash
mise run scrape-ksto-schedule                   # update the file now
node scripts/scrape-ksto-schedule.mjs --check   # report without writing; exits 1 on drift
```

The post keeps its schedule in a script, which the scrape parses but never
runs. A post the parser does not recognise fails the run and writes nothing.
Times are Central: the post's own script reads the visitor's clock, so it
shows the wrong hour outside Minnesota. `updated` is when KSTO last edited the
post, which tells a schedule left over from an earlier term apart.

### UI Test Fixtures

Under UI tests the map reads copies of each campus's `map/geojson` from
`source/features/map/__fixtures__/`, not ccc-server, so a data publish cannot
move what the map tests measure. Refresh them on purpose, when a test needs a
place or a field the copies lack:

```bash
mise run update-map-fixtures
```

It prints the places each campus added and removed, and how many changed, and
writes nothing when any campus's response has no places. The copies are written
with sorted keys, so the diff shows only the data that moved. Rerun the map UI
tests after a refresh: a moved label point can change what a tap hits.

Olaf Messenger's fetches are answered from
`source/features/mess/__fixtures__/mess.json` under UI tests, and a fetch with
no fixture fails naming its URL. Its URLs depend on what the paper published,
so they are recorded, not listed: with a simulator booted and Metro running,

```bash
TEST_RUNNER_AAO_JS_LOCATION=localhost:<port> mise run update-mess-fixtures
```

runs the Messenger UI tests against the live paper with `--record-fixtures`
and writes every fetch they made. It writes nothing if the tests fail. With
more than one simulator booted, name one with `SIMULATOR_UDID=<udid>`.

### Chaos Runs

`mise run chaos` drives the app at random on a booted simulator while it breaks
network requests, and stops at the first crash, fatal error, unhandled
rejection, error screen or hang. [`uitests/Chaos/README.md`](uitests/Chaos/README.md)
covers reading a finding, replaying a run, what the engine can't do, how it
works, and how to extend it.

```bash
mise run chaos:8081 -- --seed 1234 --duration 10m
mise run chaos:8081 -- --replay logs/chaos/1234
```

`chaos:8081` runs against the Metro on port 8081. For any other, name it with
the `TEST_RUNNER_` prefix -- `TEST_RUNNER_AAO_JS_LOCATION=localhost:8091 mise
run chaos` -- since `xcodebuild` passes the test only prefixed variables, so a
bare `AAO_JS_LOCATION` never arrives. Either way, the run refuses a Metro
serving another checkout. The run exits 0 when it found nothing, 1 when
it found something, and 2 when it never started. Its evidence lands in
`logs/chaos/<seed>/`, which a second run of the same seed won't replace
without `--overwrite`.

A chaos launch passes `--chaos`, not `--uitesting`. Under it the app never
leaves itself, never signs in, and sends nothing to Sentry. Its modules are
imported first in `app/_layout.tsx`, so `fetch` is wrapped before anything
fetches, and they do nothing without the flag. Run `mise run chaos-routes`
after adding a route.

### Releases

Versions come from Changesets. A change that belongs in the release notes adds
a file with `mise run changeset` (a plain markdown file in `.changeset/`:
`"all-about-olaf": patch|minor|major` in the frontmatter, the note below it).
The Release workflow turns those into a "Version Packages" pull request, and a
`prerelease:alpha|beta|rc|none` label on it picks the channel. Do not edit
`version` in `package.json` or add to `CHANGELOG.md` by hand. The logic is in
`scripts/release.mjs`; see CONTRIBUTING.md for the full flow.

## Agent Workflow

**Session startup:** Always run `mise run agent:setup` at the start of every session. This installs dependencies and bundles data files.

**Before committing:** Always run `mise run agent:pre-commit` before committing any changes. This formats code with oxfmt, runs oxlint, shellcheck and zizmor, checks TypeScript types, runs Jest tests, and checks that every module's `@frogpond` dependencies and the lockfile match its package.json. Do not commit if any step fails.

**Dependency upgrades:** Whenever you upgrade a dependency whose version is mentioned in this file (e.g., React Native, React Navigation, React Query, Redux Toolkit, TypeScript, Jest), update the version reference in CLAUDE.md as part of the same change. Stale version references in this file mislead future sessions about the project's current state.

## Superpowers Skills Framework

This project relies on the [Superpowers](https://github.com/obra/superpowers)
skills framework, provided by the `superpowers` agent plugin.

**If the skill listing at session start does not include `using-superpowers`,
`brainstorming`, `test-driven-development`, and the rest of the Superpowers
skills below, the plugin is not installed or not enabled on this machine. Warn
the user before proceeding.**

Brainstorming's visual companion runs its server with `node` from the skill's
own folder, where mise sets no version, so it dies within five seconds ("No
version is set for shim: node"). Start it under this repo's Node instead:

```bash
mise exec -- bash <skill-dir>/scripts/start-server.sh --project-dir "$PWD" --open
```
