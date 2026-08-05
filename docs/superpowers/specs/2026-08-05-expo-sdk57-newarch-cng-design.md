# Expo SDK 57, the New Architecture, and Continuous Native Generation

**Date:** 2026-08-05
**Status:** Draft, awaiting review
**Supersedes:** [#7542](https://github.com/StoDevX/AAO-React-Native/issues/7542) (Phase 1 design spec, 2026-04-16)

## Goal

Move the app to Expo SDK 57 and Continuous Native Generation, so that `ios/` is
generated from `app.config.ts` rather than hand-maintained. Other work depends on
landing this.

## Context

The app runs Expo SDK 54.0.33 as a library on React Native 0.81.5, with a tracked
`ios/` directory and the New Architecture explicitly disabled
(`ios/Podfile` sets `RCT_NEW_ARCH_ENABLED=0`; `Info.plist` sets
`RCTNewArchEnabled` to false).

Expo SDK 57 pins React Native 0.86.2. React Native removed the legacy
architecture in 0.82, so SDK 57 forces the New Architecture. This is not a
version bump with a migration attached; it is two migrations that happen to
share a deadline.

[#7453](https://github.com/StoDevX/AAO-React-Native/issues/7453) has tracked New
Architecture adoption since April. Every prerequisite it lists is now met —
including `react-native-ios-context-menu` 3.x, whose checkbox is stale
(`package.json` has 3.2.1). The plan recorded there is: reach RN 0.81, upgrade
`ios-context-menu`, enable the New Architecture, then continue the RN upgrades.
This spec executes that plan and carries it through to CNG.

### Prior art

- **#7542** (closed) — a four-phase prebuild design written against SDK 53. Its
  first two phases (prebuild on SDK 53, then 53→54) are moot: the app is on 54.
  Its ordering put prebuild before the New Architecture; this spec inverts that.
  The document lives only on `claude/expo-prebuild-migration-plan-2v3ST`.
- **#7544** (open draft) — `app.config.ts` plus three config plugins, with tests.
  We start clean, but it is worth reading before writing `with-xcuitest-target`;
  it documents a real trap in the `xcode` package (`addTarget` writes quoted
  `name`/`productName`, `findTargetKey` matches unquoted).
- **#7339**, `hawken/expo-2026`, `codex/hawken/expo-2026-drew` — an Expo Router
  migration. Out of scope.
- **`claude/replace-deps-expo-KvQ1l`** — Expo-module dependency replacement,
  44 commits. Its content informs PR B1 but is not merged wholesale.

## Non-goals

Expo Router. EAS Build — Fastlane, Xcode Cloud, and GitHub Actions stay.
Android. The `source/` → `src/` rename. oxfmt/oxlint (#7463).

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Ordering | New Architecture first, then CNG | A runtime-model change bundled with a version bump cannot be bisected — the argument in #7453 |
| Version ladder | Step 54→55→56→57 | Each SDK's breakage is attributable to that SDK |
| `ios/` fate | Full CNG: generated and gitignored | The point of the exercise |
| XCUITest sources | Move to a tracked top-level `uitests/` | Source of truth must not live in a generated directory |
| Dependency swaps | Only what blocks the New Architecture, then a deliberate pass before CNG | Every native pod removed is one less plugin to write |
| Delivery | Stacked PRs, finely grained | Bisectability |
| Build pipeline | Unchanged | Orthogonal to this work |

## Dependency inventory

Sixteen of nineteen third-party native modules already support the New
Architecture: they declare `codegenConfig` and reference
`install_modules_dependencies` or `RCT_NEW_ARCH_ENABLED` in their podspecs. This
includes `react-native-ios-context-menu` 3.2.1, `react-native-ios-utilities`
5.1.4, `react-native-change-icon` 5.0.0, and `react-native-keychain` 10.0.0.

Three lack codegen:

| Module | Reality | Assessment |
|---|---|---|
| `@react-native-vector-icons/{entypo,ionicons,material-design-icons}` 13.1.0 | Resource-only pods (`s.resources = 'fonts/*.ttf'`), no native source | Not a risk. Each ships an `app.plugin.js` for Phase B |
| `react-native-device-info` 15.0.2 | Legacy ObjC `RCTBridgeModule`, depends only on `React-Core` | Depends on the legacy-module interop layer under bridgeless. Verify in A2; candidate for `expo-device` + `expo-application` in B1 |
| `react-native-zeroconf` 0.14.0 | Same | Same. Dev-only mDNS discovery, already fails silently when the pod is absent — lowest stakes in the set |

Version divergences to reconcile along the ladder. None block; all will make
`expo-doctor` complain:

- `@react-native-async-storage/async-storage` 3.1.0 — SDK 55/56/57 pin 2.2.0. We are ahead.
- `@sentry/react-native` 8.11.0 (Renovate #7603 wants 8.12.0) — SDK 57 pins `~7.11.0`. We are ahead by a major.
- `react-native-gesture-handler` 2.31.0 → `~2.32.0`; `react-native-screens` 4.24.0 → `~4.26.0`.
- Already matching SDK 57 exactly: `netinfo` 12.0.1, `picker` 2.11.4,
  `datetimepicker` 9.1.0, `webview` 13.16.1, `safe-area-context` 5.7.0.

JS-only libraries need behavioural smoke-testing, not native work:
`react-native-paper`, `react-native-tableview-simple`, `react-native-popover-view`,
`react-native-network-logger`, `react-native-button`, `react-native-typography`.
They break under the New Architecture only if they touch removed internals —
grep for `findNodeHandle` and direct `UIManager` calls in A1.

`react-native-restart-newarch` 1.0.85 is a fork that exists for New Architecture
support and currently runs on the legacy one. After A2, check whether upstream
`react-native-restart` suffices; if so, drop the fork.

## Phase A — New Architecture and version ladder

`ios/` stays tracked throughout. Every PR here reverts cleanly.

### A0 — Disable the Campus Map UITest

`ModuleCampusMapTests.testIsReachableFromHomescreen` fails roughly nine runs in
ten. The cause is structural, not incidental: `CampusMapScreen.dismissSafari()`
waits on the `SFSafariViewController` "Done" button, and its own comment records
that Safari and WebKit initialisation under the iOS 26 simulator ranges from one
second to over ten. A longer timeout cannot fix a test whose subject is another
process's launch time.

Every later PR in this spec gates on green UITests. A test that fails 90% of the
time makes that gate meaningless, so this comes first.

Skip it with `throw XCTSkip(...)` naming a tracking issue — do not delete the
file and do not rename the method. Skipping keeps the code compiling, keeps the
class visible to `scripts/split-uitests.py`, and reports as *skipped* rather than
*passed*, which is the honest signal. Re-enabling it is the last item in this
spec's follow-up list.

### A1 — New Architecture audit

Verify the two legacy-interop modules (`react-native-device-info`,
`react-native-zeroconf`) and grep the JS-only libraries for removed internals.
Replace only what genuinely blocks. Still on legacy architecture, so this PR is
verifiable in isolation.

### A2 — Enable the New Architecture

Set `RCT_NEW_ARCH_ENABLED=1` and `RCTNewArchEnabled` true. Still SDK 54 /
RN 0.81.5. This is #7453's payload and the checkpoint that matters most: it is
the one change where "it builds" and "it works" diverge, because interop
failures are runtime failures.

Beyond the standard gate, A2 requires manual device verification of features the
UITests do not cover: alternate app icons (`react-native-change-icon`),
Settings → Server URL mDNS discovery (`react-native-zeroconf`), device-info
readouts, and the restart path (`react-native-restart-newarch`).

### A3 — Reanimated 4

`react-native-reanimated` 3.19.5 → 4.x, adding `react-native-worklets` (Reanimated 4
split worklets into a separate native module). Reanimated 4 needs the New
Architecture but only RN 0.78+, so it lands on RN 0.81 as its own change rather
than riding along with an RN bump.

### A4 — SDK 55

Expo 55, RN 0.83.10, React 19.2.0, Reanimated 4.2.1, worklets 0.7.4,
gesture-handler ~2.30.0, screens ~4.23.0.

### A5 — SDK 56

Expo 56, RN 0.85.3, React 19.2.3, Reanimated 4.3.1, worklets 0.8.3,
gesture-handler ~2.31.1, screens ~4.26.0.

### A6 — SDK 57

Expo 57, RN 0.86.2, Reanimated 4.5.1, worklets 0.10.1, gesture-handler ~2.32.0.
At this point the app is on target versions with `ios/` still hand-maintained.

## Phase B — Continuous Native Generation

### B1 — Expo-module replacement pass

Evaluate each remaining third-party native module one at a time against its
final RN version, replacing with an Expo equivalent where the swap is clean.
Obvious candidates: `react-native-device-info` → `expo-device` +
`expo-application`; `@react-native-clipboard/clipboard` → `expo-clipboard`;
`react-native-keychain` → `expo-secure-store`. Each swap is its own commit with
its own verification. Cross-reference `claude/replace-deps-expo-KvQ1l`.

### B2 — `app.config.ts` and plugins, no behaviour change

`ios/` remains authoritative. Nothing runs `expo prebuild`. This PR adds the
declarative config and the plugins, under unit-test coverage.

Declarative in `app.config.ts`: bundle identifier, display name, URL scheme,
version, deployment target 14.0, ATS exceptions
(`NSAllowsArbitraryLoadsInWebContent`, localhost), `NSBonjourServices` and
`NSLocalNetworkUsageDescription`, `UIBackgroundModes: [audio]`, status bar style,
supported orientations (phone and iPad), `UIAppFonts`, and
`ITSAppUsesNonExemptEncryption`. Anything without a first-class field goes
through `ios.infoPlist` passthrough — including the legacy
`UIRequiredDeviceCapabilities: [armv7]`.

Plugins:

| Plugin | Replaces |
|---|---|
| `expo-build-properties` (library) | Deployment target; and the ccache setting CI relies on via `USE_CCACHE`, if `ios.ccacheEnabled` covers it — see Open Items |
| `@react-native-vector-icons/*` `app.plugin.js` (library) | The three font pods |
| `with-app-delegate-customizations` (local) | The four `AppDelegate.swift` overrides: `URLCache` sizing, `AVAudioSession` playback category, `--reset-state` handling, pre-bundled-jsbundle fallback |
| `with-alternate-icons` (local) | `CFBundleIcons` and `CFBundleIcons~ipad` entries, the four `windmill@*.png` resources, and the "Alternate Icons" build phase |
| `with-xcuitest-target` (local) | Creates the `AllAboutOlafUITests` target from `uitests/`, and re-applies the Podfile autolinking shim |
| `with-privacy-manifest` (local, or `ios.privacyManifests`) | `ios/PrivacyInfo.xcprivacy` |

Dropped deliberately: `STRIP_INSTALLED_PRODUCT`, `inhibit_all_warnings!`, the
Podfile's `apply-patches.sh` call, and `react-native.config.js`. The generated
Podfile supersedes them.

### B3 — Cutover

Rehome `ios/AllAboutOlafUITests/` to a tracked `uitests/`. Run `expo prebuild`.
Gitignore `ios/`. Rewire the build:

1. **`ios-cache-check` must change.** Its key hashes `**/project.pbxproj`,
   `ios/Podfile`, `**/Podfile.lock`, `ios/AllAboutOlaf/**`, and
   `ios/AllAboutOlafUITests/**` — under CNG none of those are tracked, so the key
   would be constant and the cache permanently stale. Replace with
   `@expo/fingerprint`, which SDK 57 already pulls in as a dependency of `expo`
   and which exists to hash everything affecting the native build.
2. **`ios-build` gains a prebuild step** before `mise run pod:install`.
3. **`ios/ci_scripts/` moves to repo-root `ci_scripts/`.** Inside `ios/` it would
   be wiped by every prebuild. Replace `ci_post_clone.sh`'s trailing
   `# if/when we go to Expo` comment with the real invocation.
4. **`ci_pre_xcodebuild.sh` stops using `agvtool`.** Mutating the generated
   project fights the generator. Instead `app.config.ts` reads `CI_BUILD_NUMBER`
   from the environment into `ios.buildNumber`, making the build number an input
   to generation. Xcode Cloud is developer-only today, so changing how versioning
   works affects no users.
5. **`scripts/split-uitests.py --test-dir ios/AllAboutOlafUITests`** → `uitests/`.
6. **Fastlane.** `gym` points at `ios/AllAboutOlaf.xcworkspace` and `ios/build`,
   which survive prebuild unchanged; `fastlane/platforms/ios.rb` needs a prebuild
   step ahead of `gym`. Separately, `load_app_store_connect_api_token`
   (`fastlane/platforms/ios.rb:142-160`) clones the `match` repo at runtime and
   copies `AuthKey_WPMP85A826.p8` into `ios/`. The key is not tracked, so the
   risk is ordering rather than deletion-on-checkout: a prebuild after the copy
   destroys it. Point `token_dest` outside `ios/` instead.
7. **`mise run bundle:ios`** still writes into `ios/`, which is fine for a build
   artifact, but the `ios-bundle` job's cache paths require prebuild to have run.

## Verification

Every PR in both phases passes, in order: `mise run agent:pre-commit` (prettier,
eslint, tsc, jest), a clean `xcodebuild build-for-testing`, and both UITest
shards green. A PR that cannot turn the UITests green is held while the
responsible library is fixed. Tests are not disabled to make a PR merge — A0 is
the single deliberate exception, taken before the ladder starts and reversed at
the end.

A2 additionally requires the manual device checks listed above.

B3 additionally requires a diff of the generated `Info.plist` and build settings
against the current committed ones, taken before `ios/` is deleted. Every
difference is either one of the four deliberate drops or a plugin bug. This diff
is the cutover's acceptance artifact; it is the only way to catch a silently
missing plist key before it ships.

## Rollback

Phase A PRs revert cleanly — `ios/` stays tracked, so reverting a version bump
restores a known-good project.

B3 is the one-way door. After it, `ios/` is gitignored and the tracked project is
gone. Mitigations: B3 is a single PR whose revert restores `ios/` from history,
and it lands only after B1 and B2 are merged and green on master.

## Open items

Resolve during the PR that first depends on each; none block writing the plan.

1. Does `expo-build-properties` expose an `ios.ccacheEnabled` property? If not,
   CI's ccache setup needs another route (B2).
2. Does the Expo config schema's `ios.privacyManifests` cover every key in our
   `PrivacyInfo.xcprivacy`? If not, write `with-privacy-manifest` (B2).
3. Does Xcode Cloud discover `ci_scripts/` at the repository root, or only
   alongside the Xcode project? Determines item 3 of B3.
4. Can upstream `react-native-restart` replace `react-native-restart-newarch`
   once the New Architecture is on (A2)?
5. Confirm `@expo/fingerprint`'s CLI entry point and output shape for the cache
   key (B3).

## Follow-up

Re-enable `ModuleCampusMapTests`. The underlying problem is that the test asserts
on another process's launch behaviour. A fix likely means asserting the app's own
state — that the campus map link was opened — rather than driving Safari's UI.
Tracked separately; not part of this spec's delivery.
