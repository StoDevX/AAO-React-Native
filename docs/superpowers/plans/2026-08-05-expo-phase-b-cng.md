# Expo Phase B: Continuous Native Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate `ios/` from `app.config.ts` and stop tracking it, so every iOS customization is expressed declaratively or as a config plugin.

**Architecture:** Three PRs. First shrink the native surface by replacing third-party modules with Expo equivalents; then write the config and plugins under unit test while the tracked `ios/` is still authoritative; then cut over in one reversible step.

**Tech Stack:** Expo config plugins (`@expo/config-plugins`), the `xcode` npm package, Jest, CocoaPods, XCUITest, GitHub Actions, Fastlane, Xcode Cloud.

**Spec:** `docs/superpowers/specs/2026-08-05-expo-sdk57-newarch-cng-design.md`

## Global Constraints

- iOS only. There is no `android/` directory.
- Starting state is the end state of Phase A: Expo 57, React Native 0.86.2, New Architecture on, `ios/` still tracked.
- Tasks 1 and 2 must not change build behaviour. `ios/` stays authoritative until Task 3.
- Every task ends green on `mise run agent:pre-commit`, `xcodebuild build-for-testing`, and both UITest shards.
- Never disable, delete, or rename a test to make a task pass.
- Never skip or bypass the `hk` pre-commit hook.
- TypeScript for all new code; no `any`. Prettier config lives in `package.json` (tabs, single quotes, no semicolons).
- Jest discovers `**/__tests__/**/*.(spec|test).(js|ts|tsx)`, so plugin tests belong at `plugins/__tests__/<name>.test.ts`. No Jest config change is needed.
- `tsconfig.json` includes `**/*.ts`, so `app.config.ts` and `plugins/*.ts` are type-checked automatically. No tsconfig change is needed.
- `mise run lint` covers `source/ modules/ scripts/ images/` only. Task 2 must add `plugins/`.
- Four customizations are dropped deliberately and must NOT be reproduced: `STRIP_INSTALLED_PRODUCT`, `inhibit_all_warnings!`, the ccache Podfile branching (it moves into `expo-build-properties`), and `react-native.config.js`.
- **The Podfile's `apply-patches.sh` call is a fifth candidate, but it cannot simply be dropped — see Task 3, Step 6.** `.npmrc` now sets `ignore-scripts=true`, so npm never runs the `prepare` hook, and the generated Podfile will not call it either. Something must apply `contrib/*.patch` before a pod install or a build, or `0003` (fmt) and `0004`–`0006` (change-icon, ios-utilities) silently stop being applied and the app builds subtly wrong.

## What Phase A learned

Phase A ran six rungs against this codebase and turned up things the original spec did not anticipate. They apply to Phase B too.

1. **`min-release-age` in `~/.npmrc` caps every version choice.** A developer with it set cannot install anything published inside that window, and `expo install --fix` will happily write a version that then fails with `ETARGET ... with a date before <date>`. Compute the newest installable version rather than trusting a nominal pin. It also blocks security fixes, which are by nature new: `brace-expansion` and `postcss` both needed an explicit `--min-release-age=0` exception, agreed case by case.

2. **Reject the downgrades `expo install --fix` proposes.** This repo runs ahead of the SDK's pins in ten packages. Diff `package.json` before and after and restore anything it lowered.

3. **Sweep the workspace peer ranges.** 25 packages under `modules/` declare peers on `react-native`, and four on `@react-navigation/native`. A caret on a `0.x` version pins the minor, so `npm install` fails with ERESOLVE before anything else can run. `modules/open-url` also pins `expo-web-browser`.

4. **`pod install` cannot cross a major React Native version in place.** `Podfile.lock` and `Pods/Local Podspecs` keep the old `RCT-Folly`/`fmt` pairing and CocoaPods aborts. Delete `ios/Pods` and `ios/Podfile.lock` and regenerate.

5. **Keep derived data at `ios/build` exactly.** React Native's `set_RCTNewArchEnabled_in_info_plist` runs `find ios/ -name Info.plist` and skips paths containing the literal `"build/"`. Any other name — `ios/build-device`, `ios/build-oldarch` — makes it parse a built app's *binary* Info.plist and abort `pod install` with an opaque `invalid byte sequence in UTF-8`.

6. **There are now six contrib patches, not three.** `0004` (change-icon), `0005` and `0006` (both ios-utilities) all postdate the original spec. Task 1 Step 9 deletes `0005` and `0006` along with the library.

7. **Green unit tests and green UITests are not sufficient for native changes.** Both missed a broken app-icon feature and a tab-bar crash. Every task that touches native code ends with the device checklist below.

## Device verification checklist

Run on hardware, not the simulator, after any task that changes native dependencies or the Xcode project. Each item exists because something in Phase A broke it.

| # | Check | Guards |
| --- | --- | --- |
| 1 | Tab bars: switch tabs, and tap an already-selected tab | `react-native-screens` `RNSTabBarController` crashed on repeated selection |
| 2 | Context menus: Reddit post long-press, home notice, bus day-picker | `contrib/0005`, `0006`; removed by Task 1 Step 9 |
| 3 | Alternate app icons: switch to windmill and back | `react-native-change-icon`; its UITest is skipped, so there is no automated coverage |
| 4 | mDNS discovery: Settings → Server URL with `ccc-server` running | `react-native-zeroconf`, legacy interop |
| 5 | Device info: compose a support email, check the fields | `react-native-device-info`, legacy interop; the Settings version cell does *not* exercise it |
| 6 | Restart | `react-native-restart-newarch` |
| 7 | Animations: navigation transitions, swipe-to-dismiss, Paper ripples | Reanimated 4 + worklets |

## Reference

PR #7544 (`claude/expo-prebuild-pr1-scaffolding`) contains an earlier, unmerged implementation of three of these plugins. Read it before writing Task 2 — in particular it documents that the `xcode` package's `addTarget` writes `name` and `productName` wrapped in quotes while `findTargetKey` does an unquoted exact match, so the quotes must be stripped after creation or subsequent lookups fail. Do not copy it wholesale; it targets SDK 53.

---

### Task 1: Replace third-party native modules with Expo equivalents (PR B1)

Every native pod removed here is one less thing prebuild must reproduce. Each replacement is its own commit so a regression is bisectable.

**Files:**
- Modify: `package.json`
- Modify: call sites found per-module by `rg`

**Interfaces:**
- Consumes: Phase A's Expo 57 install.
- Produces: a smaller native dependency set. Task 2's plugin inventory depends on which modules survive.

- [ ] **Step 1: List the current native surface**

```bash
rg -n '^  - ' ios/Podfile.lock | rg -v 'React|RCT|Yoga|boost|DoubleConversion|fmt|glog|hermes|fast_float|SocketRocket' | sed 's/ (.*//' | sort -u
```

Record the list. This is the set Task 2 would otherwise have to support.

- [ ] **Step 2: Replace `react-native-device-info`**

It is a legacy `RCTBridgeModule` running through the interop layer — the highest-risk survivor from Phase A. Find the call sites:

```bash
rg -n 'react-native-device-info' source/ modules/
```

Install the Expo equivalents and migrate each site:

```bash
npx expo install expo-device expo-application
npm uninstall react-native-device-info
```

Mapping: app version → `Application.nativeApplicationVersion`; build number → `Application.nativeBuildVersion`; device model → `Device.modelName`; OS version → `Device.osVersion`.

- [ ] **Step 3: Verify the device-info replacement**

```bash
mise run pod:install
mise run agent:pre-commit
```

Then build and run the UITests (commands in Task 3 Step 12), and manually confirm the Settings screen still shows version and device strings rather than blanks.

- [ ] **Step 4: Commit the device-info replacement**

```bash
git add package.json package-lock.json source/ modules/ ios/Podfile.lock
git commit -m "refactor: replace react-native-device-info with expo-device and expo-application"
```

- [ ] **Step 5: Replace `@react-native-clipboard/clipboard`**

```bash
rg -n '@react-native-clipboard/clipboard' source/ modules/
npx expo install expo-clipboard
npm uninstall @react-native-clipboard/clipboard
```

Mapping: `Clipboard.setString(s)` → `Clipboard.setStringAsync(s)`; `Clipboard.getString()` → `Clipboard.getStringAsync()`. Both Expo functions are async — the call sites need `await`.

- [ ] **Step 6: Verify and commit the clipboard replacement**

```bash
mise run pod:install
mise run agent:pre-commit
```

Build, run UITests, and manually confirm every copy-to-clipboard affordance still works.

```bash
git add package.json package-lock.json source/ modules/ ios/Podfile.lock
git commit -m "refactor: replace @react-native-clipboard/clipboard with expo-clipboard"
```

- [ ] **Step 7: Evaluate `react-native-keychain`**

```bash
rg -n 'react-native-keychain' source/ modules/
```

`expo-secure-store` is the Expo equivalent, but it does not expose every Keychain option (access groups, biometric prompts, server/username-scoped entries). Read the call sites first. If they use only get/set/delete of a single string, migrate:

```bash
npx expo install expo-secure-store
npm uninstall react-native-keychain
```

If they use anything `expo-secure-store` lacks, **keep `react-native-keychain`** — it already supports the New Architecture and needs no plugin. Record the decision and its reason in the PR description; do not migrate and then paper over a missing capability.

- [ ] **Step 8: Verify and commit the keychain decision**

If migrated: `mise run pod:install`, `mise run agent:pre-commit`, build, UITests, and manually verify credentials still save and load across an app restart. Then commit. If kept, there is nothing to commit for this step — say so.

- [ ] **Step 9: Leave `react-native-zeroconf` alone**

Expo has no mDNS-browsing equivalent. It stays. It is dev-only, already fails silently when the pod is absent, and needs no plugin. Note this explicitly in the PR description so a reviewer does not ask.

- [ ] **Step 10: Re-list the native surface and record the delta**

Re-run Step 1's command and put a before/after list in the PR description. This is the number Task 2's plugin inventory is sized against.

---

### Task 2: `app.config.ts` and config plugins (PR B2)

Scaffolding only. `ios/` stays authoritative and nothing here runs `expo prebuild`, so this PR cannot change build behaviour. Every plugin is developed test-first.

**Files:**
- Create: `app.config.ts`
- Create: `plugins/with-app-delegate-customizations.ts`
- Create: `plugins/with-alternate-icons.ts`
- Create: `plugins/with-xcuitest-target.ts`
- Create: `plugins/with-privacy-manifest.ts` (only if Step 19 shows it is needed)
- Create: `plugins/__tests__/with-app-delegate-customizations.test.ts`
- Create: `plugins/__tests__/with-alternate-icons.test.ts`
- Create: `plugins/__tests__/with-xcuitest-target.test.ts`
- Modify: `.mise.toml` (the `lint` task)
- Modify: `package.json` (devDependencies)

**Interfaces:**
- Consumes: Task 1's final dependency set.
- Produces:
  - `app.config.ts` default-exports an `ExpoConfig` object.
  - `patchAppDelegate(contents: string): string` — pure string transform, exported from `plugins/with-app-delegate-customizations.ts` alongside the default-exported plugin.
  - `addAlternateIcons(infoPlist: Record<string, unknown>): Record<string, unknown>` — pure transform, exported from `plugins/with-alternate-icons.ts`.
  - `ensureUITestTarget(project: XcodeProject, opts: {name: string, sourceDir: string}): XcodeProject` — exported from `plugins/with-xcuitest-target.ts`.
  - `patchPodfileForUITests(contents: string): string` — pure string transform, exported from `plugins/with-xcuitest-target.ts`.
  - Task 3 imports none of these directly; it runs `expo prebuild`, which loads them via `app.config.ts`.

- [ ] **Step 1: Install the plugin toolchain**

```bash
npm install --save-dev @expo/config-plugins expo-build-properties @types/xcode
```

Let npm resolve versions against the installed Expo 57 — do not pin by hand. Confirm no peer warnings:

```bash
npm ls @expo/config-plugins expo-build-properties
```

- [ ] **Step 2: Add `plugins/` to the lint task**

In `.mise.toml`, the `lint` task currently ends `source/ modules/ scripts/ images/`. Change it to:

```toml
[tasks.lint]
description = "Run ESLint"
run = "eslint --report-unused-disable-directives --max-warnings=0 --cache source/ modules/ scripts/ images/ plugins/"
```

Without this, nothing in `plugins/` is ever linted.

- [ ] **Step 3: Write the failing test for the AppDelegate transform**

Create `plugins/__tests__/with-app-delegate-customizations.test.ts`. The transform must be idempotent (prebuild may run repeatedly) and must fail loudly if its anchor disappears after an RN upgrade.

```ts
import {patchAppDelegate} from '../with-app-delegate-customizations'

const STOCK = `import Expo
import React
import UIKit

class AppDelegate: ExpoAppDelegate {
	override func application(
		_ application: UIApplication,
		didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
	) -> Bool {
		return super.application(application, didFinishLaunchingWithOptions: launchOptions)
	}
}
`

describe('patchAppDelegate', () => {
	it('imports AVFoundation', () => {
		expect(patchAppDelegate(STOCK)).toContain('import AVFoundation')
	})

	it('configures the shared URLCache', () => {
		expect(patchAppDelegate(STOCK)).toContain('URLCache.shared = urlCache')
	})

	it('sets the audio session to playback so the silent switch is ignored', () => {
		expect(patchAppDelegate(STOCK)).toContain(
			'AVAudioSession.sharedInstance().setCategory(.playback)',
		)
	})

	it('handles the --reset-state launch argument', () => {
		expect(patchAppDelegate(STOCK)).toContain('--reset-state')
	})

	it('is idempotent', () => {
		const once = patchAppDelegate(STOCK)
		expect(patchAppDelegate(once)).toBe(once)
	})

	it('throws when its anchor is missing', () => {
		expect(() => patchAppDelegate('class AppDelegate {}')).toThrow(
			/didFinishLaunchingWithOptions/,
		)
	})
})
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
npx jest plugins/__tests__/with-app-delegate-customizations.test.ts
```

Expected: FAIL, cannot resolve `../with-app-delegate-customizations`.

- [ ] **Step 5: Implement the AppDelegate plugin**

Create `plugins/with-app-delegate-customizations.ts`. Export `patchAppDelegate` as a pure string transform and default-export a `ConfigPlugin` that applies it via the `withAppDelegate` mod. Use begin/end marker comments so idempotency is a string check rather than a guess, and `throw` when the anchor is absent so an RN upgrade that moves the anchor fails the build instead of silently dropping our behaviour.

The four behaviours to inject, copied from the current `ios/AllAboutOlaf/AppDelegate.swift`, are: `import AVFoundation`; a `URLCache` with 4 MiB memory and 20 MiB disk assigned to `URLCache.shared`; `try? AVAudioSession.sharedInstance().setCategory(.playback)`; and the `--reset-state` block that clears `Application Support/<bundleId>`, `RCTAsyncLocalStorage_V1`, and the `UserDefaults` persistent domain.

- [ ] **Step 6: Run the test to verify it passes**

```bash
npx jest plugins/__tests__/with-app-delegate-customizations.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 7: Commit the AppDelegate plugin**

```bash
git add plugins/with-app-delegate-customizations.ts plugins/__tests__/with-app-delegate-customizations.test.ts
git commit -m "feat: add with-app-delegate-customizations config plugin"
```

- [ ] **Step 8: Write the failing test for the alternate-icons transform**

Create `plugins/__tests__/with-alternate-icons.test.ts`.

```ts
import {addAlternateIcons} from '../with-alternate-icons'

describe('addAlternateIcons', () => {
	it('registers the windmill icon for iPhone', () => {
		const result = addAlternateIcons({}) as Record<string, any>
		expect(
			result.CFBundleIcons.CFBundleAlternateIcons.icon_type_windmill
				.CFBundleIconFiles,
		).toEqual(['windmill'])
	})

	it('registers the windmill icon for iPad', () => {
		const result = addAlternateIcons({}) as Record<string, any>
		expect(
			result['CFBundleIcons~ipad'].CFBundleAlternateIcons.icon_type_windmill
				.CFBundleIconFiles,
		).toEqual(['windmill'])
	})

	it('preserves unrelated keys', () => {
		const result = addAlternateIcons({CFBundleName: 'AllAboutOlaf'})
		expect(result.CFBundleName).toBe('AllAboutOlaf')
	})

	it('is idempotent', () => {
		const once = addAlternateIcons({})
		expect(addAlternateIcons(once)).toEqual(once)
	})
})
```

- [ ] **Step 9: Run the test to verify it fails**

```bash
npx jest plugins/__tests__/with-alternate-icons.test.ts
```

Expected: FAIL, cannot resolve `../with-alternate-icons`.

- [ ] **Step 10: Implement the alternate-icons plugin**

Create `plugins/with-alternate-icons.ts`. Export `addAlternateIcons` as a pure transform over the Info.plist object, and default-export a `ConfigPlugin` composing `withInfoPlist` (for the two `CFBundleIcons` keys, with `UIPrerenderedIcon: true` as the current plist has) and `withXcodeProject` (to add `windmill@2x.png`, `windmill@3x.png`, `windmill@2x~iPad.png`, and `windmill@3x~iPad.png` as resources on the main target). Those four PNGs currently live in the Xcode project as loose resources, not in an asset catalog — copy them into a tracked directory the plugin can read from, since `ios/` disappears in Task 3.

- [ ] **Step 11: Run the test to verify it passes**

```bash
npx jest plugins/__tests__/with-alternate-icons.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 12: Commit the alternate-icons plugin**

```bash
git add plugins/with-alternate-icons.ts plugins/__tests__/with-alternate-icons.test.ts images/ assets/
git commit -m "feat: add with-alternate-icons config plugin"
```

- [ ] **Step 13: Write the failing test for the UITest target plugin**

This is the riskiest plugin: prebuild does not generate test targets, so without it the entire XCUITest suite vanishes on every generation. Create `plugins/__tests__/with-xcuitest-target.test.ts`.

```ts
import xcode from 'xcode'
import {ensureUITestTarget, patchPodfileForUITests} from '../with-xcuitest-target'

const STOCK_PODFILE = `target 'AllAboutOlaf' do
  use_expo_modules!
end
`

describe('patchPodfileForUITests', () => {
	it('disables expo autolinking for the UITests target', () => {
		expect(patchPodfileForUITests(STOCK_PODFILE)).toContain(
			"return nil if name == 'AllAboutOlafUITests'",
		)
	})

	it('nests the UITests target with inherit! :none', () => {
		const result = patchPodfileForUITests(STOCK_PODFILE)
		expect(result).toContain("target 'AllAboutOlafUITests' do")
		expect(result).toContain('inherit! :none')
	})

	it('is idempotent', () => {
		const once = patchPodfileForUITests(STOCK_PODFILE)
		expect(patchPodfileForUITests(once)).toBe(once)
	})
})

describe('ensureUITestTarget', () => {
	const load = () => {
		const project = xcode.project(
			'plugins/__tests__/fixtures/project.pbxproj',
		)
		project.parseSync()
		return project
	}

	it('creates the target when absent', () => {
		const project = ensureUITestTarget(load(), {
			name: 'AllAboutOlafUITests',
			sourceDir: 'uitests',
		})
		expect(project.pbxTargetByName('AllAboutOlafUITests')).toBeDefined()
	})

	it('stores the target name unquoted so lookups succeed', () => {
		const project = ensureUITestTarget(load(), {
			name: 'AllAboutOlafUITests',
			sourceDir: 'uitests',
		})
		const target = project.pbxTargetByName('AllAboutOlafUITests')
		expect(target.name).not.toMatch(/^"/)
	})

	it('is idempotent', () => {
		let project = ensureUITestTarget(load(), {
			name: 'AllAboutOlafUITests',
			sourceDir: 'uitests',
		})
		project = ensureUITestTarget(project, {
			name: 'AllAboutOlafUITests',
			sourceDir: 'uitests',
		})
		const targets = Object.values(
			project.pbxNativeTargetSection(),
		).filter((t: any) => t?.name === 'AllAboutOlafUITests')
		expect(targets).toHaveLength(1)
	})
})
```

The unquoted-name test exists because the `xcode` package's `addTarget` writes `name` wrapped in quotes while `findTargetKey` matches unquoted — the trap documented in PR #7544.

- [ ] **Step 14: Create the pbxproj fixture**

The test needs a real project file to mutate. Copy the current one:

```bash
mkdir -p plugins/__tests__/fixtures
cp ios/AllAboutOlaf.xcodeproj/project.pbxproj plugins/__tests__/fixtures/project.pbxproj
```

Committing a fixture rather than reading `ios/` directly matters: `ios/` is gone after Task 3, and a test that reads it would break.

- [ ] **Step 15: Run the test to verify it fails**

```bash
npx jest plugins/__tests__/with-xcuitest-target.test.ts
```

Expected: FAIL, cannot resolve `../with-xcuitest-target`.

- [ ] **Step 16: Implement the UITest target plugin**

Create `plugins/with-xcuitest-target.ts`. Export `patchPodfileForUITests` and `ensureUITestTarget`, and default-export a `ConfigPlugin` composing `withDangerousMod` (to patch the generated Podfile) and `withXcodeProject` (to create the target). `ensureUITestTarget` must add every `.swift` file under `sourceDir`, including the `Screens/` subdirectory, and strip the quotes the `xcode` package adds to `name` and `productName`.

- [ ] **Step 17: Run the test to verify it passes**

```bash
npx jest plugins/__tests__/with-xcuitest-target.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 18: Commit the UITest target plugin**

```bash
git add plugins/with-xcuitest-target.ts plugins/__tests__/with-xcuitest-target.test.ts plugins/__tests__/fixtures/
git commit -m "feat: add with-xcuitest-target config plugin"
```

- [ ] **Step 19: Resolve the privacy-manifest open item**

Read Expo's config schema for `ios.privacyManifests` and compare it against every key in `ios/PrivacyInfo.xcprivacy`. If the schema covers them all, use it in `app.config.ts` and write no plugin. If it does not, create `plugins/with-privacy-manifest.ts` following the same shape as the alternate-icons plugin, with tests. Record which branch you took and why.

- [ ] **Step 20: Resolve the ccache open item**

CI passes `USE_CCACHE=1` and the current Podfile branches on it. Check whether `expo-build-properties` exposes an `ios.ccacheEnabled` property:

```bash
node -p "Object.keys(require('./node_modules/expo-build-properties/build/pluginConfig.js'))"
```

and read its README. If it exists, use it. If not, ccache needs another route in Task 3 — record the finding here so Task 3 is not surprised.

- [ ] **Step 21: Write `app.config.ts`**

Port every declarative field from `ios/AllAboutOlaf/Info.plist` and the Xcode project. Anything without a first-class Expo field goes through `ios.infoPlist`. The full set: bundle identifier, display name `All About Olaf`, URL scheme `AllAboutOlaf`, version, deployment target 14.0 via `expo-build-properties`, `NSAppTransportSecurity` (`NSAllowsArbitraryLoadsInWebContent` plus the localhost exception), `NSBonjourServices: ['_ccc-server._tcp.']`, `NSLocalNetworkUsageDescription`, `UIBackgroundModes: ['audio']`, `UIStatusBarStyle: 'UIStatusBarStyleDarkContent'`, `UIViewControllerBasedStatusBarAppearance: false`, both orientation arrays, `UIAppFonts` (Entypo.ttf, Ionicons.ttf, MaterialDesignIcons.ttf), `ITSAppUsesNonExemptEncryption: false`, and `UIRequiredDeviceCapabilities: ['armv7']`.

Set `ios.buildNumber` from the environment so Xcode Cloud's build number becomes an input to generation rather than a post-hoc `agvtool` edit:

```ts
buildNumber: process.env.CI_BUILD_NUMBER ?? '1',
```

Register the plugins: `expo-build-properties`, the three `@react-native-vector-icons/*` font plugins, and the local plugins by relative path.

- [ ] **Step 22: Verify the whole gate**

```bash
mise run agent:pre-commit
```

Expected: prettier, eslint (now including `plugins/`), tsc (now including `app.config.ts` and `plugins/`), and jest all pass.

- [ ] **Step 23: Prove no behaviour changed**

```bash
mise run pod:install
```

Then build and run the UITests using the commands in Task 3 Step 12. Because nothing ran `expo prebuild`, results must be identical to before this PR. If anything differs, something in this PR reached the build when it should not have.

- [ ] **Step 24: Commit the config**

```bash
git add app.config.ts .mise.toml package.json package-lock.json
git commit -m "feat: add app.config.ts describing the iOS project declaratively"
```

---

### Task 3: Cut over to prebuild (PR B3)

The one-way door. `ios/` becomes generated and untracked.

**Files:**
- Move: `ios/AllAboutOlafUITests/` → `uitests/`
- Move: `ios/ci_scripts/` → `ci_scripts/`
- Move: `ios/AuthKey_WPMP*` → outside `ios/`
- Modify: `.gitignore`, `.github/workflows/check.yml`, `.github/workflows/build-and-deploy.yml`, `.github/workflows/cocoapods.yml`, `fastlane/platforms/ios.rb`, `.mise.toml`
- Delete: `react-native.config.js`, `ios/` (tracked copy)

**Interfaces:**
- Consumes: `app.config.ts` and the plugins from Task 2.
- Produces: a repository where `npx expo prebuild -p ios` reconstructs the entire Xcode project.

- [ ] **Step 1: Capture the baseline before generating anything**

This is the acceptance artifact for the whole cutover. Without it there is no way to detect a silently missing plist key.

```bash
mkdir -p /tmp/cng-baseline
cp ios/AllAboutOlaf/Info.plist /tmp/cng-baseline/Info.plist
xcodebuild -showBuildSettings \
  -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf \
  > /tmp/cng-baseline/build-settings.txt
```

- [ ] **Step 2: Rehome the XCUITest sources**

```bash
git mv ios/AllAboutOlafUITests uitests
```

The suite is 17 test files plus `Screens/`, `Screen.swift`, `TestIdentifiers.swift`, `UITestCase.swift`, `XCUITestHelpers.swift`, `AllAboutOlaf-Bridging-Header.h`, and `Info.plist`. All move.

- [ ] **Step 3: Rehome the Xcode Cloud scripts**

```bash
git mv ios/ci_scripts ci_scripts
```

Inside `ios/` these would be destroyed by every prebuild.

The App Store Connect API key needs different treatment. It is **not** tracked: `fastlane/platforms/ios.rb:142-160` clones the `match` repo at runtime and copies `AuthKey_WPMP85A826.p8` into `ios/`. So the risk is ordering, not tracking — a prebuild running after the copy would delete it. Fix it at the destination instead, in `fastlane/platforms/ios.rb:151`:

```ruby
		token_dest = "#{dest}/ios/AuthKey_WPMP85A826.p8"
```

becomes:

```ruby
		# outside ios/, which `mise run prebuild` regenerates from scratch
		token_dest = "#{dest}/fastlane/AuthKey_WPMP85A826.p8"
```

Nothing requires the key to sit in `ios/` — `app_store_connect_api_key` takes the path as `key_filepath` a few lines below. Add `fastlane/AuthKey_*.p8` to `.gitignore`; it is currently absent, which only went unnoticed because the file lived under a directory that was already ignored in part.

- [ ] **Step 4: Point the shard splitter at the new location**

In `.github/workflows/check.yml`, the `uitest-plan` job runs:

```
python3 scripts/split-uitests.py --test-dir ios/AllAboutOlafUITests --shards 2
```

Change `--test-dir` to `uitests`. Verify the matrix is unchanged from before the move:

```bash
python3 scripts/split-uitests.py --test-dir uitests --shards 2
```

Expected: the same 16 classes across 2 shards as the pre-move run.

- [ ] **Step 5: Add the prebuild task**

In `.mise.toml`, add:

```toml
[tasks.prebuild]
description = "Generate the native iOS project from app.config.ts"
run = "npx expo prebuild --platform ios"
```

- [ ] **Step 6: Keep the patches applying once the Podfile is generated**

Do this *before* generating, because it is easy to miss afterwards: everything still builds, just from unpatched sources.

Today `ios/Podfile:80` ends `post_install` with `system('cd .. && scripts/apply-patches.sh')`, and that is the only thing applying `contrib/*.patch` before a pod install or a build. The generated Podfile will not have it, and `.npmrc` sets `ignore-scripts=true` so npm's `prepare` hook never runs either.

Losing it is silent and expensive: `0003` stops disabling fmt's consteval path, `0004` lets app-icon switching go back to a silent no-op, and `0005`/`0006` break `react-native-ios-utilities` — the exact failures Phase A spent days on.

Make the mise tasks own it, the way `lint`, `tsc` and `test` already do:

```toml
[tasks."pod:install"]
depends = ["prepare"]

[tasks.prebuild]
depends = ["prepare"]
```

Verify the dependency actually fires rather than assuming:

```bash
# put a patched file back to its upstream state, then run pod:install alone
grep -c "RCT_NEW_ARCH_ENABLED" node_modules/react-native-change-icon/ios/ChangeIcon.h   # expect 1 (unpatched)
mise run pod:install
grep -c "RCT_NEW_ARCH_ENABLED" node_modules/react-native-change-icon/ios/ChangeIcon.h   # expect 0 (prepare ran)
```

If Task 1 Step 9 landed, `0005` and `0006` are already gone and only `0001`–`0004` remain.

- [ ] **Step 7: Generate the project for the first time**

```bash
rm -rf ios
mise run prebuild
```

Expected: `ios/` is recreated, containing `AllAboutOlaf.xcodeproj`, `Podfile`, `AppDelegate.swift`, and the `AllAboutOlafUITests` target created by our plugin.

- [ ] **Step 8: Diff the generated project against the baseline**

The acceptance gate.

```bash
diff /tmp/cng-baseline/Info.plist ios/AllAboutOlaf/Info.plist
xcodebuild -showBuildSettings \
  -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf \
  > /tmp/cng-generated-settings.txt
diff /tmp/cng-baseline/build-settings.txt /tmp/cng-generated-settings.txt
```

Every difference must be either one of the five deliberate drops listed in Global Constraints, or a plugin bug to fix now. Paste both diffs into the PR description with a line-by-line verdict. Do not proceed past this step with an unexplained difference.

- [ ] **Step 9: Confirm the UITest target actually exists**

```bash
xcodebuild -list -workspace ios/AllAboutOlaf.xcworkspace
```

Expected: `AllAboutOlafUITests` appears. If it does not, `with-xcuitest-target` is broken — fix it in Task 2's plugin, not with a manual Xcode edit.

- [ ] **Step 10: Stop tracking `ios/`**

Add to `.gitignore`:

```
# generated by `mise run prebuild` from app.config.ts
/ios/
```

Then remove the tracked copy:

```bash
git rm -r --cached ios
```

- [ ] **Step 11: Delete the now-dead config**

```bash
git rm react-native.config.js
```

The generated Podfile supersedes it.

- [ ] **Step 12: Rewire the CI cache keys**

In `.github/workflows/check.yml`, the `ios-cache-check` and `ios-build` jobs hash `**/project.pbxproj`, `ios/Podfile`, `**/Podfile.lock`, `ios/AllAboutOlaf/**`, and `ios/AllAboutOlafUITests/**`. None of those are tracked any more, so the key would be constant and the cache permanently stale — worse than no cache.

Replace with an `@expo/fingerprint` hash, which SDK 57 already provides as a dependency of `expo`. Add a step that computes it and writes it to `$GITHUB_OUTPUT`, then use that value in the cache key in place of the `hashFiles(...)` call. Confirm the CLI's exact invocation and output shape first:

```bash
npx @expo/fingerprint --help
```

Add a `prebuild` step to `ios-build` before `mise run pod:install`.

- [ ] **Step 13: Build and test locally**

```bash
mise run pod:install
set -o pipefail
xcodebuild build-for-testing \
  -workspace ios/AllAboutOlaf.xcworkspace \
  -scheme AllAboutOlaf \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath ios/build \
  -only-testing:AllAboutOlafUITests \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
  | xcbeautify
xcodebuild test-without-building \
  -xctestrun "$(find ios/build/Build/Products -name '*.xctestrun' -print -quit)" \
  -destination 'platform=iOS Simulator,name=iPhone 17e' \
  | xcbeautify
```

Expected: build succeeds; all suites pass; `ModuleCampusMapTests` skipped.

- [ ] **Step 14: Rewire Fastlane**

`fastlane/platforms/ios.rb` points `gym` at `ios/AllAboutOlaf.xcworkspace` and `ios/build`, which prebuild recreates at the same paths — so those need no change. Add a prebuild invocation before `gym` so a clean checkout has a project to build. The `token_dest` change is already done in Step 3; confirm `load_app_store_connect_api_token` still resolves the key by running the lane.

- [ ] **Step 15: Rewire the Xcode Cloud scripts**

In `ci_scripts/ci_post_clone.sh`, replace the trailing placeholder:

```bash
# if/when we go to Expo
# npx expo prebuild
```

with a real `mise run prebuild` call, placed after `npm ci` and `mise run bundle-data` and before `mise run pod:install`. Note that the script's `cd ../../` assumed it lived in `ios/ci_scripts/`; from the repo root it must become `cd ..` — verify the working directory rather than assuming.

In `ci_pre_xcodebuild.sh`, delete the `agvtool new-version -all "$CI_BUILD_NUMBER"` call entirely. `app.config.ts` now reads `CI_BUILD_NUMBER` (Task 2 Step 21), so the build number is set at generation time. Keep the guard that fails when `CI_BUILD_NUMBER` is unset.

- [ ] **Step 16: Confirm `.xcode.env.local` is finally being read**

Deferred here from Phase A on purpose: prebuild fixes this for free, and hand-editing `project.pbxproj` before B3 would be discarded when `ios/` is regenerated.

Until this step, `ci_post_clone.sh`'s `.xcode.env.local` write is **dead code**. The hand-maintained "Bundle React Native code and images" build phase is:

```sh
export NODE_BINARY=node
../node_modules/react-native/scripts/react-native-xcode.sh
```

`react-native-xcode.sh` only consumes `$NODE_BINARY`; the script that *sources* `.xcode.env` and `.xcode.env.local` is `scripts/xcode/with-environment.sh`, which this phase never invokes. So the absolute Homebrew node path that `ci_post_clone.sh` computes has never reached any build, and Xcode Cloud has been relying on `node` being on `PATH` — the exact thing that script's own comment says it cannot rely on.

Prebuild generates upstream's form, which does invoke it:

```sh
set -e
WITH_ENVIRONMENT="$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"
REACT_NATIVE_XCODE="$REACT_NATIVE_PATH/scripts/react-native-xcode.sh"
/bin/sh -c "\"$WITH_ENVIRONMENT\" \"$REACT_NATIVE_XCODE\""
```

Verify after the first prebuild:

```bash
grep -c "with-environment.sh" ios/AllAboutOlaf.xcodeproj/project.pbxproj
```

Expected: at least 1. If it is 0, prebuild did not generate the standard bundle phase and the node resolution is still broken — investigate before proceeding.

Then confirm the mitigation actually works end to end: `with-environment.sh` echoes `Node found at: <path>` when it sources a `NODE_BINARY`. Write a throwaway `ios/.xcode.env.local` pointing at a known-good absolute node path, build, and check that line appears in the log with that path rather than a bare `node`.

- [ ] **Step 17: Confirm Xcode Cloud finds the relocated scripts**

Resolve the open item from the spec: Xcode Cloud discovers `ci_scripts/` at the repository root or alongside the Xcode project. Since the project no longer exists at checkout time, the root is the only workable location. Confirm against Apple's documentation and record the citation in the PR description. If the root is not supported, the scripts must instead be generated into `ios/ci_scripts/` by a plugin — say so rather than leaving it untested.

- [ ] **Step 18: Verify regeneration from nothing**

The real test of CNG: a clean checkout must produce a working project.

```bash
rm -rf ios
mise run prebuild
mise run pod:install
xcodebuild -list -workspace ios/AllAboutOlaf.xcworkspace
```

Expected: `AllAboutOlafUITests` present, pods resolve, no manual steps.

- [ ] **Step 19: Verify the gate**

```bash
mise run agent:pre-commit
```

- [ ] **Step 20: Update CLAUDE.md**

Document that `ios/` is generated and must not be hand-edited, that `mise run prebuild` regenerates it, that iOS customizations go in `app.config.ts` or `plugins/`, and that XCUITests live in `uitests/`. Update the XCUITest debugging section's path reference from `ios/AllAboutOlafUITests/` to `uitests/`.

- [ ] **Step 21: Commit**

```bash
git add -A
git commit -m "feat: generate the iOS project with Expo prebuild

ios/ is now generated from app.config.ts and no longer tracked.
XCUITests move to uitests/, Xcode Cloud scripts to ci_scripts/."
```

---

## Rollback

Tasks 1 and 2 revert cleanly — `ios/` is still tracked and authoritative through both.

Task 3 is the one-way door. Its revert restores the tracked `ios/` from git history; run `mise run pod:install` afterwards. It must land only after Tasks 1 and 2 are merged and green on master, so that a revert never has to unwind plugin work at the same time.

## Exit criteria

- `rm -rf ios && mise run prebuild && mise run pod:install` produces a buildable project from a clean checkout.
- `ios/` is gitignored and absent from `git ls-files`.
- `xcodebuild -list` shows the `AllAboutOlafUITests` target; both shards green with `ModuleCampusMapTests` skipped.
- The Task 3 Step 7 diffs are in the PR description, every line accounted for.
- No `agvtool` call remains in `ci_scripts/`.
- CLAUDE.md tells the next session not to hand-edit `ios/`.
