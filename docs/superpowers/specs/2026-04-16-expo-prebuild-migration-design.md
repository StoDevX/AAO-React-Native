# Expo Prebuild Migration — Phase 1 Design

- **Status:** Draft
- **Authors:** @claude (paired with project owner)
- **Date:** 2026-04-16
- **Branch:** `claude/expo-prebuild-migration-plan-2v3ST`
- **Phase:** 1 of 4 (Prebuild adoption only — see *Follow-up specs* below)

## Context

The AAO React Native app currently consumes Expo as a library (Expo SDK 53, RN
0.79.6) on top of a hand-maintained `ios/` native project. Individual `expo-*`
packages are installed via npm and `use_expo_modules!` is invoked from the
Podfile, but there is no `app.json`/`app.config.*`, no config plugins, and every
iOS customization (`Info.plist`, `AppDelegate.swift`, the Xcode project,
`Podfile`) is edited by hand.

Maintaining the native project this way works, but it accumulates drift over
time. Each React Native and Expo upgrade requires manually reconciling our
hand-edited `ios/` against the boilerplate the upstream templates would have
produced. Pod install diffs, AppDelegate API renames, and Info.plist additions
all require human attention even when nothing in the app's actual customization
has changed.

The end goal — over multiple phases — is to migrate to Expo's recommended
**Prebuild** workflow (eventually with Continuous Native Generation / CNG), and
to land on Expo SDK 55. SDK 55 is a hard wall: it mandates React Native 0.83,
Xcode 26+, and the New Architecture, which we have explicitly opted out of via
the Podfile (`RCT_NEW_ARCH_ENABLED = '0'`) and `react-native-restart-newarch`.
Each of those is independently risky, so we decompose the work into four
phases:

1. **Phase 1 (this spec):** Introduce Prebuild on the existing SDK 53 / RN 0.79
   stack. Express every iOS customization as `app.config.ts` + config plugins.
   Keep `ios/` checked into git. No SDK or RN version bump.
2. **Phase 2 (separate spec):** Bump Expo SDK 53 → 54 / RN 0.79 → 0.81. Stays on
   the Legacy Architecture (SDK 54 is the last SDK that supports it).
3. **Phase 3 (separate spec):** Bump Expo SDK 54 → 55 / RN 0.81 → 0.83. Adopts
   the New Architecture, which requires per-library compatibility verification.
4. **Phase 4 (separate spec):** Switch to true CNG — gitignore `ios/`, rehome
   the XCUITests so they survive a `--clean` regeneration.

Doing all four at once would mean four interleaved migrations with no clear
attribution when something breaks. Doing Phase 1 first proves the
plugin/prebuild model against the codebase as it exists today, before any
moving target on top.

## Goals

- Express every existing iOS native customization as either an `app.config.ts`
  field or a config plugin (library-provided where available, local where not).
- After this spec lands, `npx expo prebuild --clean -p ios` produces an `ios/`
  directory that is *functionally equivalent* to the hand-maintained one (see
  the acceptance checklist).
- All build, test, and CI flows that today say "react-native ..." or "edit the
  pbxproj/Info.plist directly" instead route through Expo CLI and the config
  layer.
- Set up the codebase to make Phases 2–4 routine rather than fraught.

## Non-Goals

- **No React Native version bump.** Stays on 0.79.6.
- **No Expo SDK bump.** Stays on 53.0.27.
- **No New Architecture adoption.** `RCT_NEW_ARCH_ENABLED = 0` stays in effect
  (now expressed via `expo-build-properties` instead of an inline Podfile env
  override).
- **No CNG.** `ios/` remains tracked in git. Switching to CNG (and rehoming
  XCUITests) is deferred to Phase 4.
- **No EAS Build / EAS Update adoption.** Builds continue to run on local
  Xcode + Fastlane in GitHub Actions / Xcode Cloud as they do today.
- **No Android support.** The app is iOS-only; `expo prebuild` is invoked with
  `-p ios`. We do not generate or maintain an `android/` tree.
- **No changes to `source/`, `modules/*`, `index.js`, `metro.config.js`,
  `babel.config.js`, or any product feature.** This is a build/native-config
  migration only.
- **No byte-for-byte equivalence of the regenerated `ios/`.** Expo's templates
  produce a different (but equivalent) project structure; we accept the
  cosmetic delta and document it.

## Scope summary

| Area | In scope | Out of scope |
|---|---|---|
| `app.config.ts` | Author it | — |
| Config plugins | 3 local + 2 library-provided | — |
| `ios/` | Regenerate via prebuild, keep tracked | Move to `.gitignore` (Phase 4) |
| RN version | — | Bump (Phase 2/3) |
| Expo SDK | — | Bump (Phase 2/3) |
| New Architecture | — | Adopt (Phase 3) |
| XCUITests | Stay where they are; folded into `with-xcuitest-target.ts` | Rehome outside `ios/` (Phase 4) |
| GitHub Actions / Fastlane | Updated for prebuild | — |
| `mise` tasks | Switched to Expo CLI | — |
| `@react-native-community/cli` | Removed (gated on Step 0 verification) | — |
| Android | — | Everything |

## End-State Architecture

### What lives where

After Phase 1, the relationship between the repo and the iOS native project
looks like this:

```
app.config.ts            ← single source of truth for iOS native config
plugins/                 ← local config plugins (3 files)
  with-app-delegate-customizations.ts
  with-alternate-icons.ts
  with-xcuitest-target.ts
ios/                     ← tracked in git, but treated as generated output
  AllAboutOlaf/            (regenerated by `expo prebuild --clean`)
  AllAboutOlaf.xcodeproj/
  AllAboutOlafUITests/     (17 Swift files — re-added by with-xcuitest-target plugin)
  Podfile
  Podfile.lock
```

Humans do not hand-edit anything under `ios/`. All iOS native changes flow
through `app.config.ts` or the `plugins/` directory, followed by
`npx expo prebuild --clean -p ios`. The resulting `ios/` diff is reviewed and
committed.

### Files added

- `app.config.ts` — TypeScript config (not `app.json`) so we get type checking
  and can reference computed values. Declares app metadata plus every
  `ios.infoPlist` override, and references every config plugin.
- `plugins/with-app-delegate-customizations.ts` — string-patches
  `AppDelegate.swift` to preserve three customizations: the `URLCache`
  sizing (4 MiB memory / 20 MiB disk), the `AVAudioSession.playback` category,
  and the `--reset-state` launch-argument handler that scrubs Library,
  `RCTAsyncLocalStorage_V1`, and `UserDefaults`.
- `plugins/with-alternate-icons.ts` — adds the `icon_type_windmill`
  alternate-icon entries to both `CFBundleIcons` and `CFBundleIcons~ipad`, and
  copies `images/icons/windmill@{2x,3x}{,~iPad}.png` into the iOS bundle via a
  pbxproj Resources build phase.
- `plugins/with-xcuitest-target.ts` — ensures the `AllAboutOlafUITests` target
  exists in the generated `.xcodeproj` with the 17 Swift test files, the
  `AllAboutOlaf-Bridging-Header.h`, and its `Info.plist`. Also injects the
  Podfile `ExpoUITestsAutolinkingFix` monkey-patch and the `inherit! :none`
  target-definition clause that keeps the UITests target from picking up the
  main target's Expo autolinking manager.

### Files modified (but still tracked in git)

- `ios/**` — contents are now considered regenerable output. Humans don't edit
  them. A `CLAUDE.md` note and a `CONTRIBUTING.md` note codify this.
- `package.json` — adds `expo-build-properties` and `@expo/config-plugins`;
  removes `@react-native-community/cli` and `@react-native-community/cli-platform-ios`
  from `devDependencies` (gated on Step 0 verification). `scripts.prepare`
  unchanged.
- `.mise.toml`:
  - `tasks.ios`: `react-native run-ios` → `expo run:ios`
  - `tasks.start`: `react-native start` → `expo start`
  - `tasks.prebuild` (new): `expo prebuild --clean -p ios`
  - `tasks.bundle:ios`: either switches to `expo export --platform ios` or
    keeps invoking `react-native bundle …` directly (resolved in
    implementation; Metro itself ships the `bundle` command).
- `ios/ci_scripts/ci_post_clone.sh` — uncomment/activate the
  `npx expo prebuild` line that is already present as a TODO.
- `.github/workflows/build-and-deploy.yml`, `cocoapods.yml`, `check.yml`,
  `copilot-setup-steps.yml` — each iOS-touching workflow gains a
  `npx expo prebuild --clean -p ios --no-install` step before `pod install`.
  The ccache integration moves from the Podfile's `USE_CCACHE` env-variable
  branching to a `with:`-keyed CI action that wraps `PATH`.
- `fastlane/Fastfile` — add a prebuild step before build lanes if not already
  handled by `ci_post_clone.sh` for the App Store Connect path.
- `CLAUDE.md`, `CONTRIBUTING.md` — document that iOS native changes flow
  through `app.config.ts` + `plugins/`, and that the `ios/` tree is
  effectively generated output.

### Files deleted

- `react-native.config.js` — the `@react-native-community/cli` config file.
  With the CLI itself removed, this has no consumer. (Retained temporarily
  if Step 0 verification shows `use_native_modules!` still needs it.)

### Files unchanged

- `source/**`, `modules/**`, `scripts/**` (except the `ci_post_clone.sh` noted
  above), `index.js`, `metro.config.js`, `babel.config.js`, `tsconfig.json`,
  `eslint.config.mjs`, `jest.config.ts`.
- `contrib/*.patch` and `scripts/apply-patches.sh` — these patch `node_modules/`
  only; they run via the `prepare` script on install and do not intersect with
  the prebuild pipeline.
- `assets/Sunset.svg` — only consumed in JS; no native wiring needed.

### Developer workflow after Phase 1

- **Run the app locally:** `mise run ios` (unchanged command; now invokes
  `expo run:ios` internally).
- **Start Metro:** `mise run start` (now `expo start`).
- **Change an Info.plist key, add a native dep, tweak the AppDelegate:** edit
  `app.config.ts` (for declarative fields) or the appropriate `plugins/` file
  (for AppDelegate/pbxproj/Podfile modifications), then
  `mise run prebuild && mise run pod:install`, review the `ios/` diff, commit
  it alongside the config change.
- **Upgrade a native dependency:** `npm install …`, then
  `mise run prebuild && mise run pod:install`. Commit the `ios/` diff together
  with the package.json change.
- **Rerun the acceptance checklist** (see below) whenever a change touches
  `app.config.ts`, any file under `plugins/`, or any of the vendored `ios/`
  workflow scripts.

### What this unlocks for Phases 2–4

- Phase 2 (SDK 54 upgrade) becomes: bump `expo`, bump RN, run prebuild, diff.
  The customizations we used to hand-reconcile are now declarative.
- Phase 3 (SDK 55 + New Arch) becomes: flip `ios.newArchEnabled` in
  `expo-build-properties`, bump RN, audit each native lib for New-Arch
  compatibility, run prebuild, diff. Dropping the hand-maintained Podfile tweak
  means the old-arch override is cleanly expressed and cleanly removed.
- Phase 4 (CNG) becomes: move XCUITests out of `ios/` to a tracked sibling
  location, update `with-xcuitest-target.ts` to source them from there, add
  `/ios` to `.gitignore`. The plugin authorship done in Phase 1 is what makes
  CNG feasible at all.

## Config Plugin Inventory

This is the definitive list of how each current iOS customization is expressed
after Phase 1. Anything not listed here either has no native footprint or is
handled by Expo's prebuild defaults.

### A. Expressed as `app.config.ts` fields (no plugin)

| Customization | Current location | New expression |
|---|---|---|
| App display name | `Info.plist` `CFBundleDisplayName` | `expo.name` |
| Bundle identifier | `pbxproj` `PRODUCT_BUNDLE_IDENTIFIER` | `expo.ios.bundleIdentifier` |
| Version | `Info.plist` `CFBundleShortVersionString` | `expo.version` |
| Build number | `Info.plist` `CFBundleVersion` | `expo.ios.buildNumber` |
| URL scheme (`AllAboutOlaf://`) | `Info.plist` `CFBundleURLTypes` | `expo.scheme` |
| iPad support | `UISupportedInterfaceOrientations~ipad` | `expo.ios.supportsTablet` |
| Orientation set | `UISupportedInterfaceOrientations` | `expo.orientation` (+ explicit list under `ios.infoPlist` if finer control needed) |
| ATS exceptions | `Info.plist` `NSAppTransportSecurity` | `expo.ios.infoPlist.NSAppTransportSecurity` (preserved verbatim from today's plist) |
| Status bar style | `Info.plist` `UIStatusBarStyle` | `expo.ios.infoPlist.UIStatusBarStyle = "UIStatusBarStyleDarkContent"` |
| View-controller-based status bar | `Info.plist` `UIViewControllerBasedStatusBarAppearance` | `expo.ios.infoPlist` |
| Non-exempt encryption declaration | `Info.plist` `ITSAppUsesNonExemptEncryption` | `expo.ios.config.usesNonExemptEncryption = false` |
| Audio background mode | `Info.plist` `UIBackgroundModes = ["audio"]` | `expo.ios.infoPlist.UIBackgroundModes` |
| Primary app icon | `Images.xcassets/AppIcon.appiconset` | `expo.ios.icon` (pointing at a 1024px source) |

### B. Library-provided config plugins (install + add to `plugins` array)

| Plugin | Source | What it handles |
|---|---|---|
| `expo-build-properties` | `npm install expo-build-properties` | `ios.deploymentTarget = "14.0"`; `ios.newArchEnabled = false` (removed in Phase 3); optional `ios.useFrameworks` toggle. Replaces every Podfile knob we currently hand-edit for build settings. |
| `@react-native-vector-icons/*` plugin | Ships with the vector-icons packages we already depend on (`entypo`, `ionicons`, `material-design-icons`) as of the 2026-04-15 release | Registers Entypo, Ionicons, and MaterialDesignIcons `.ttf` files: adds them to `UIAppFonts` and creates the Copy Files build phase that puts them in the bundle. Replaces today's hand-maintained Xcode build phase that references `${PODS_ROOT}/../../node_modules/@react-native-vector-icons/*/fonts/*.ttf`. |

`expo-font` stays installed only if some part of the JS codebase uses its
runtime API; if not, it is removed. Implementation determines this by grep.

### C. Local config plugins (we author and own)

Three files under `plugins/`, each a TypeScript module implementing a `ConfigPlugin`.

#### `plugins/with-app-delegate-customizations.ts`

String-patches `AppDelegate.swift` via `withAppDelegate` from
`@expo/config-plugins`. Preserves the three behaviors currently in
`application(_:didFinishLaunchingWithOptions:)`:

1. **`--reset-state` launch-argument handler.** If
   `ProcessInfo.processInfo.arguments.contains("--reset-state")`, delete
   `Library/Application Support/{bundleId}`, delete
   `Library/Application Support/RCTAsyncLocalStorage_V1`, and clear
   `UserDefaults.standard.removePersistentDomain(forName: bundleId)`. Used by
   the XCUITests to start from a clean slate.
2. **`URLCache` sizing.** `URLCache(memoryCapacity: 4 MiB, diskCapacity: 20 MiB)`
   assigned to `URLCache.shared`. Tunes the network cache for the app's
   specific traffic profile.
3. **`AVAudioSession.playback` category.** `try? AVAudioSession.sharedInstance().setCategory(.playback)`.
   Ensures streaming audio plays while the device is on silent.

Injection strategy: locate a sentinel immediately after
`self.moduleName = "AllAboutOlaf"` (which Expo's default AppDelegate template
writes) and insert our three blocks between it and the `super` call to
`application(_:didFinishLaunchingWithOptions:)`. The plugin is idempotent — it
checks for a marker comment before writing, so re-running `prebuild` doesn't
duplicate the code. A matching `import AVFoundation` line is added if not
already present.

If Expo's default AppDelegate changes shape across SDK versions, this plugin
is the first place to break; the brittleness is accepted and documented.

#### `plugins/with-alternate-icons.ts`

Two `Mod`s bundled together:

1. **`withInfoPlist`**: merges
   ```
   CFBundleIcons.CFBundleAlternateIcons.icon_type_windmill = {
     CFBundleIconFiles: ["windmill"],
     UIPrerenderedIcon: true,
   }
   ```
   and the same under `CFBundleIcons~ipad` for iPad.

2. **`withXcodeProject`**: ensures the four PNGs at
   `images/icons/windmill@{2x,3x}{,~iPad}.png` are referenced as
   `PBXFileReference`s and included in the main target's Resources build phase.
   The paths match what today's `pbxproj` already has
   (`path = "../images/icons/windmill@2x.png"` etc.).

Keeps `react-native-change-icon` working. If the library ships its own Expo
config plugin in our installed version (`5.0.0`) or a newer one we choose to
upgrade to, we prefer the library's plugin and delete this file (decided in
Step 0 pre-flight).

#### `plugins/with-xcuitest-target.ts`

The riskiest plugin. Three concerns, all about the `AllAboutOlafUITests`
target:

1. **Reinstate the target in `project.pbxproj`** (`withXcodeProject` mod). If
   the target is missing after prebuild (e.g., after `--clean`), recreate it
   with:
   - Source files: the 17 `.swift` files under `ios/AllAboutOlafUITests/`.
   - Bridging header: `AllAboutOlaf-Bridging-Header.h`.
   - Info.plist: `ios/AllAboutOlafUITests/Info.plist`.
   - Test host: the `AllAboutOlaf` app target.
   - Swift version and deployment target matching the main target.

2. **Add `inherit! :none` to the UITests Podfile target definition**
   (`withPodfile` mod). Without this, the UITests target inherits the main
   target's Expo-autolinked pod dependencies and pulls in framework linkage
   the UITests don't need.

3. **Inject `ExpoUITestsAutolinkingFix` monkey-patch at the top of the
   Podfile** (`withPodfile` mod). This is the workaround currently at lines
   7–24 of `ios/Podfile`. It prepends a module onto
   `Pod::Podfile::TargetDefinition` that returns `nil` for
   `autolinking_manager` when `name == 'AllAboutOlafUITests'`, so
   `expo-modules-autolinking` skips the UITests target entirely. Without this,
   `ExpoModulesProvider.swift` and the "[Expo] Configure project" run script
   get added to the UITests target, which then fails to link because the
   Expo static libraries aren't linked into UITests.

All three mods are idempotent — re-running `prebuild` is safe and repeatable.

### D. Dropped entirely (no longer expressed anywhere)

These were part of the current `ios/` setup but are being removed, not
re-implemented:

- **`STRIP_INSTALLED_PRODUCT = YES`** post-install build-setting override.
  Falling back to CocoaPods defaults.
- **`scripts/apply-patches.sh` invocation inside Podfile `post_install`.**
  The script still runs via the `prepare` npm lifecycle hook, which is the
  correct trigger (it patches `node_modules/`, not `ios/`). The Podfile
  invocation was belt-and-suspenders.
- **`inhibit_all_warnings!`** on the main target. Falling back to default
  warning visibility. If CI noise becomes unmanageable, we can reconsider.
- **ccache via `USE_CCACHE` + Podfile branching**
  (`ccache_enabled` block setting `CLANG_ENABLE_EXPLICIT_MODULES = NO`). The
  ccache integration moves into GitHub Actions as a `with:`-keyed setup action
  that installs ccache and wraps `PATH`. The Podfile no longer branches on
  `USE_CCACHE`.
- **`react-native.config.js`**, **`@react-native-community/cli`**,
  **`@react-native-community/cli-platform-ios`**. Gated on Step 0
  verification (see Migration Steps): if RN 0.79's `use_native_modules!`
  autolinking still functions without the community CLI installed, we drop
  all three.

### Summary count

- **12** declarative fields on `app.config.ts`
- **2** library-provided plugins (`expo-build-properties`,
  vector-icons plugin)
- **3** local plugins (`with-app-delegate-customizations`,
  `with-alternate-icons`, `with-xcuitest-target`)
- **5** customizations explicitly dropped

## Migration Steps

Seven steps, mapped to three PRs. Each step is one or a small number of
logical commits; each leaves the repo in a working state so failures are
bisectable.

### Step 0 — Pre-flight verification (no commits)

Before any code changes, confirm three load-bearing assumptions. Findings are
captured in the PR 1 description.

1. **`react-native-change-icon` config plugin status.** Check the installed
   version (`5.0.0`) and the library's upstream repository. If it ships an
   Expo config plugin, use it in place of `plugins/with-alternate-icons.ts`.
2. **Does RN 0.79's `use_native_modules!` require `@react-native-community/cli`
   to be installed?** Remove the CLI (temporarily, locally) from
   `node_modules` and run `pod install`. If non-Expo libraries
   (`react-native-keychain`, `react-native-webview`, `react-native-reanimated`,
   etc.) are still autolinked, we can drop the CLI as a direct devDep. If
   not, keep it but still drop our `mise`/CI direct invocations of it.
3. **`@react-native-vector-icons/*` plugin compatibility.** Verify the plugin
   released 2026-04-15 works with our installed version (`13.1.0`) and
   documents the `app.config.ts` shape it expects.

### Step 1 — Add `app.config.ts` and Expo dependencies

(Part of PR 1. No behavior change.)

- Create `app.config.ts` with all **Section A** declarative fields.
- `npm install expo-build-properties @expo/config-plugins`.
- Add `expo-build-properties` to `plugins` with
  `{ ios: { deploymentTarget: "14.0", newArchEnabled: false } }`.
- Add the `@react-native-vector-icons/*` plugin (or equivalent config) to
  `plugins`.
- **Do not run `expo prebuild` yet.** Existing `ios/` remains
  source-of-truth.

Verification: `mise run agent:pre-commit` passes; `mise run ios` still
launches the app; no visible change anywhere else.

### Step 2 — Author the three local plugins

(Part of PR 1. Still no behavior change.)

- `plugins/with-app-delegate-customizations.ts`.
- `plugins/with-alternate-icons.ts` (skip if Step 0 #1 found an upstream
  plugin).
- `plugins/with-xcuitest-target.ts`.

Each plugin is wired into `app.config.ts`'s `plugins` array but still never
invoked because we don't run `prebuild` in PR 1. Where practical, each plugin
has a unit test using `@expo/config-plugins` test helpers.

Verification: `mise run tsc` and `mise run test` pass; the plugins type-check
and their unit tests pass; app still builds via the existing `ios/`.

### Step 3 — First prebuild + diff iteration

(PR 2. This is the cutover.)

Local dev loop:

1. `mv ios ios.preexpo` (never committed; local backup only).
2. `npx expo prebuild --clean -p ios`.
3. `cd ios && pod install`.
4. Diff the resulting `ios/` against `ios.preexpo`. Expect significant
   cosmetic diff in `Podfile`, `project.pbxproj`, `Info.plist` key ordering.
5. Build and run the app; run all 17 XCUITests; run through the acceptance
   checklist below.
6. For every checklist item that fails, adjust the relevant plugin and repeat
   from step 2.

When the checklist passes, `rm -rf ios.preexpo` and commit the regenerated
`ios/` as one commit: `chore: regenerate ios/ via expo prebuild`.

### Step 4 — Replace RN CLI with Expo CLI in tooling

(PR 2, after Step 3.)

- `.mise.toml`:
  - `tasks.ios.run`: `"expo run:ios"`.
  - `tasks.start.run`: `"expo start"`.
  - Add `tasks.prebuild.run`: `"expo prebuild --clean -p ios"`.
  - `tasks.bundle:ios`: decide between `expo export --platform ios` and
    keeping the `react-native bundle` invocation verbatim. Either works —
    this is a style call documented in the PR.
- Delete `react-native.config.js` (gated on Step 0 #2).
- Remove `@react-native-community/cli` and `@react-native-community/cli-platform-ios`
  from `devDependencies` (gated on Step 0 #2).
- Uncomment the `npx expo prebuild` line in
  `ios/ci_scripts/ci_post_clone.sh` and restructure the script so prebuild
  happens before `pod install`.

Verification: after these changes, `mise run start`, `mise run ios`,
`mise run prebuild`, and `mise run bundle:ios` all succeed; `mise run tsc`
and `mise run test` still pass.

### Step 5 — CI workflow updates

(PR 2, after Step 4.)

- `.github/workflows/build-and-deploy.yml`: insert
  `npx expo prebuild --clean -p ios --no-install` before `pod install`.
  Replace the `USE_CCACHE=1` env wiring with a `with:`-keyed ccache setup
  action that installs ccache and modifies `PATH`.
- `.github/workflows/cocoapods.yml`: redesign. The current workflow
  auto-commits pod-install-induced changes to `Podfile.lock` +
  `project.pbxproj`. In the new world, dependency changes flow through
  `expo prebuild`, which can change more files. Replace the workflow with
  one that runs `expo prebuild --clean && pod install` on dependency PRs
  and auto-commits any of `ios/Podfile`, `ios/Podfile.lock`,
  `ios/AllAboutOlaf.xcodeproj/project.pbxproj`, `ios/AllAboutOlaf/Info.plist`.
  Or, reduce its scope to Renovate-triggered PRs only.
- `.github/workflows/check.yml` and
  `.github/workflows/copilot-setup-steps.yml`: add prebuild before any
  step that expects `ios/Pods/` or the main app target to exist.
- `fastlane/Fastfile`: add a prebuild step before build lanes if not already
  handled by `ci_post_clone.sh` for the Xcode Cloud / App Store Connect path.

Verification: every touched workflow passes on the PR branch; the sharded
XCUITest job passes end-to-end.

### Step 6 — Documentation + follow-up spec stubs

(PR 3.)

- `CLAUDE.md`:
  - New "Native iOS configuration" section explaining `app.config.ts` +
    `plugins/` as the source of truth, and that `ios/**` is regenerable.
  - Update the *Development Commands* section with the new `mise` task
    names and intents.
  - Update the project-overview version references if any changed
    (Expo/RN stay the same in Phase 1, but the project structure changed).
- `CONTRIBUTING.md`: same "don't hand-edit `ios/`" note, and a pointer to
  `mise run prebuild`.
- Create three stub design specs at `docs/superpowers/specs/`:
  - `2026-04-16-expo-sdk-54-upgrade-design.md` (Phase 2).
  - `2026-04-16-expo-sdk-55-newarch-upgrade-design.md` (Phase 3).
  - `2026-04-16-expo-prebuild-cng-rehoming-design.md` (Phase 4).

Each stub carries the context it needs to stand on its own: the RN versions
involved, the per-library New-Arch audit (Phase 3), the XCUITest rehoming
options (Phase 4). Full brainstorming and design happens when that phase is
ready to start; the stubs exist so the Phase 1 context isn't lost.

### Step 7 — Final verification + PR open

(PR 3 wraps up; this step straddles PR 2 and PR 3 as the "make sure nothing
regressed" pass.)

- Clean clone, `mise run agent:setup`, `mise run prebuild`,
  `mise run pod:install`, `mise run ios`. App boots.
- All 17 XCUITests pass in CI under the sharded test job.
- Release build via Fastlane succeeds.
- Sentry release upload succeeds (Sentry integration unchanged, but the
  build paths did change).

## PR Breakdown

### PR 1 — "Add Expo prebuild scaffolding (no behavior change)"

**Contents:** Steps 1 + 2.

**Characteristics:**

- Zero runtime change. The app still builds and runs via the existing
  committed `ios/`. `expo prebuild` is never invoked.
- Adds `app.config.ts`, adds plugins, wires them up — but none of it has
  any effect until PR 2 runs `prebuild`.
- Safe to merge on its own. If something later forces us to back out of
  prebuild entirely, PR 1 is harmless to keep.
- Review focus: correctness of `app.config.ts` fields against today's
  `Info.plist`, correctness of each local plugin, unit-test coverage.

### PR 2 — "Cut over to expo prebuild"

**Contents:** Steps 3 + 4 + 5, merged atomically.

**Characteristics:**

- The dangerous PR. Regenerates `ios/`, deletes the RN CLI, rewires
  `mise` + CI.
- Large diff, most of it regenerated `ios/` (not actual logic change).
- PR description includes the full prebuild diff summary and every item
  in the acceptance checklist marked pass/fail with evidence.
- Cannot be split further without leaving `main` broken between
  intermediate PRs. Either it all merges or none of it does.

### PR 3 — "Document Expo prebuild workflow + create follow-up specs"

**Contents:** Step 6 + any Step-7 cleanup discovered during PR 2
verification.

**Characteristics:**

- Small, low-risk, fast review.
- Captures the Phase 2/3/4 context in stub specs so future-us doesn't have
  to rediscover it.

## Acceptance Criteria

The migration is complete when every item below holds. These are the bar for
merging PR 2. The PR description records pass/fail for each item with evidence
(build logs, screenshots, test output).

### Functional equivalence

1. **Debug build succeeds** locally (`mise run ios` on a clean clone after
   `mise run agent:setup`) and in CI.
2. **Release build succeeds** via Fastlane end-to-end, produces an `.ipa`
   that uploads to App Store Connect.
3. **All 17 XCUITests pass** both locally and under the sharded CI job
   (no newly-skipped tests, no flake introduced).
4. **Bundle identity matches:** display name "All About Olaf", bundle
   identifier, version, build number, URL scheme (`AllAboutOlaf://`),
   entitlements — all identical to the pre-migration app.
5. **Alternate app icon works:** `react-native-change-icon` can switch to
   and from `icon_type_windmill` on both iPhone and iPad, and the PNGs
   render correctly at all sizes.
6. **Custom fonts load:** Entypo, Ionicons, and MaterialDesignIcons glyphs
   render in-app as they did before (visually verified on at least one
   screen for each font family).
7. **ATS exceptions preserved:** `NSAllowsArbitraryLoadsInWebContent = true`
   and the `localhost` exception both in effect. WebViews that worked before
   still work.
8. **Audio playback works on silent:** play any audio stream with the
   device's mute switch engaged — audio still plays (proves
   `AVAudioSession.playback` wiring survived).
9. **URL cache sized correctly:** inspect `URLCache.shared` at runtime —
   reports 4 MiB memory / 20 MiB disk.
10. **`--reset-state` launch arg still clears state:** launch the app with
    `--reset-state` via `xcodebuild test -only-testing:… -testLaunchArgument "--reset-state"`
    and confirm Application Support is cleared, `RCTAsyncLocalStorage_V1` is
    removed, and `UserDefaults` for the bundle ID is empty.

### Tooling equivalence

11. `mise run lint`, `mise run pretty:check`, `mise run tsc`,
    `mise run test`, and `mise run agent:pre-commit` all pass.
12. `mise run ios`, `mise run start`, `mise run prebuild`, and
    `mise run bundle:ios` all succeed end-to-end.
13. `scripts/apply-patches.sh` still runs during `npm install` /
    `mise run agent:setup`, and both existing sentinels pass
    (`0001-rn.patch`, `0002-rn-abortsignal.patch`).
14. **Sentry release upload** succeeds on release builds (the build paths
    that feed `sentry-cli` changed — verify end-to-end, don't assume).

### Prebuild reproducibility

15. Running `mise run prebuild` twice in a row produces no diff (prebuild +
    plugins are idempotent).
16. Running `mise run prebuild` from a clean clone after `mise run agent:setup`
    produces an `ios/` that builds and passes the XCUITests without any
    post-prebuild manual intervention.

## Risks and Mitigations

### High

- **`with-xcuitest-target.ts` is bespoke and brittle.** If Expo's prebuild
  template restructures the `pbxproj` shape in a future SDK, this plugin
  breaks. *Mitigation:* the plugin is idempotent and detects its existing
  output; the functional-equivalence acceptance check #3 (UITests pass) will
  catch regressions immediately during Phase 2/3 upgrades. If the plugin
  becomes the long pole, rehoming XCUITests outside `ios/` is a Phase 4
  escape hatch.
- **AppDelegate patching is string-based and depends on Expo's template
  shape.** Expo has changed AppDelegate language (Objective-C → Swift) and
  structure across recent SDKs. *Mitigation:* the plugin anchors on
  `self.moduleName = "AllAboutOlaf"` as its insertion sentinel and verifies
  the line exists before editing; if not, prebuild fails loudly rather
  than producing a silently-wrong AppDelegate.
- **First prebuild may not converge cleanly.** Step 3 is open-ended
  iteration; if a plugin produces the wrong output we iterate until it
  doesn't. *Mitigation:* Step 3 is local-only until checklist passes;
  nothing is committed until convergence.

### Medium

- **Unknown consumers of `@react-native-community/cli`.** Something in the
  mono-repo or a mise task might shell out to `react-native` we haven't
  noticed. *Mitigation:* Step 0 #2 explicitly tests this; if found, we
  keep the CLI as a transitive dep and only drop the direct `mise` / CI
  invocations.
- **`expo-font` vs. the vector-icons plugin.** The vector-icons plugin
  may or may not use `expo-font` under the hood, and our JS may or may not
  use `expo-font`'s runtime API. *Mitigation:* grep the JS codebase during
  Step 1; keep or drop `expo-font` accordingly.
- **Xcode Cloud / `ci_post_clone.sh`.** The script runs before CocoaPods;
  adding `expo prebuild` means adding an npm-driven step to a formerly
  ruby/cocoapods-only bootstrap. *Mitigation:* the script already installs
  `node` via mise, so the infrastructure exists; verify end-to-end on a
  real Xcode Cloud build before PR 2 lands.

### Low

- **Default launch screen looks different.** We drop the custom
  `LaunchScreen.storyboard` and accept whatever prebuild generates.
  *Mitigation:* visually verify the generated launch screen is acceptable;
  if not, add an `expo-splash-screen` plugin in a follow-up (not in
  Phase 1).
- **CI autocommit noise.** The redesigned `cocoapods.yml` workflow may
  produce larger or noisier auto-commits on dependency PRs. *Mitigation:*
  tune during Phase 1; worst case, disable the auto-commit and require
  manual prebuild-then-commit on dependency updates until Phase 4.

## Open Items

These are flagged for the implementation plan to resolve; they do not block
the design.

1. Confirm `react-native-change-icon@5.0.0`'s config plugin story
   (Step 0 #1). If present, swap `with-alternate-icons.ts` for the
   library's plugin.
2. Confirm RN 0.79's `use_native_modules!` works without
   `@react-native-community/cli` installed (Step 0 #2). Gate the
   devDep removal on the answer.
3. Confirm the `@react-native-vector-icons/*` config plugin released
   2026-04-15 is compatible with `13.1.0` or requires an upgrade
   (Step 0 #3). If an upgrade is required, assess whether to bump in this
   PR or defer to Phase 2.
4. Grep the JS codebase for `expo-font` runtime usage. Keep or drop the
   package accordingly.
5. Decide whether `mise run bundle:ios` switches to
   `expo export --platform ios` or keeps calling `react-native bundle`
   verbatim. Either works; pick based on alignment with `bundle`
   subcommand stability.
6. Confirm that the default Expo-prebuild launch screen is acceptable.
   If not, add an explicit `expo-splash-screen` plugin (not in Phase 1
   unless verification demands it).
7. `AllAboutOlaf-Bridging-Header.h` — confirm the bridging header path
   under prebuild matches the existing reference and the UITests compile
   cleanly with it.

## Follow-up Specs

Stubs created at the end of PR 3. Each one becomes its own
brainstorm → design → plan → implementation cycle when its time comes.

- **Phase 2 — `2026-04-16-expo-sdk-54-upgrade-design.md`**
  Bump Expo SDK 53 → 54 and RN 0.79 → 0.81. Stays on Legacy Architecture.
  Known concerns: `expo-file-system` legacy API split, precompiled
  XCFrameworks, Xcode version bump.
- **Phase 3 — `2026-04-16-expo-sdk-55-newarch-upgrade-design.md`**
  Bump Expo SDK 54 → 55 and RN 0.81 → 0.83. Adopt the New Architecture.
  Known concerns: iOS min version 15.1, Xcode 26+, per-library New Arch
  compatibility audit (every native lib in `package.json` gets evaluated),
  removal of `react-native-restart-newarch`, flipping
  `ios.newArchEnabled = true` in `expo-build-properties`.
- **Phase 4 — `2026-04-16-expo-prebuild-cng-rehoming-design.md`**
  Switch to true CNG. Move `AllAboutOlafUITests/` out of `ios/` to a
  tracked sibling directory. Update `with-xcuitest-target.ts` to source
  from the new location. Add `/ios` to `.gitignore`. Simplify
  `cocoapods.yml` (no more auto-commits — `ios/` isn't tracked).

## References

- [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54)
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55)
- [Continuous Native Generation docs](https://docs.expo.dev/workflow/continuous-native-generation/)
- Existing `ios/Podfile` (lines 7–24): the `ExpoUITestsAutolinkingFix`
  monkey-patch that `with-xcuitest-target.ts` will inject.
- Existing `ios/AllAboutOlaf/AppDelegate.swift`: the three behaviors that
  `with-app-delegate-customizations.ts` preserves.
- Project issue #7453 (referenced in Podfile comment): prior New Arch
  investigation — relevant context for Phase 3.
