# React Native 0.72 → 0.73 Upgrade Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade react-native from 0.72.9 to 0.73.9, updating all configuration files, native iOS code, Babel/Metro setup, workspace module peer dependencies, and existing patches.

**Architecture:** This is an iOS-only React Native app with 27 workspace modules in `modules/`. The upgrade touches the root `package.json`, Babel config (new preset name), Metro config (version bump), AppDelegate (new `getBundleURL` pattern), Podfile (remove deprecated helpers), and all workspace module peer dependencies. No Android changes are needed.

**Tech Stack:** React Native 0.73.9, React 18.2.0, Hermes, CocoaPods, TypeScript 5.9.3, Jest 29.7.0

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `package.json` | Bump `react-native`, `@react-native/metro-config`, replace `metro-react-native-babel-preset` with `@react-native/babel-preset` |
| Modify | `babel.config.js` | Switch preset from `module:metro-react-native-babel-preset` to `module:@react-native/babel-preset`, remove now-builtin plugin |
| Modify | `ios/AllAboutOlaf/AppDelegate.mm` | Add `getBundleURL` method, delegate from `sourceURLForBridge:` |
| Modify | `ios/Podfile` | Remove `__apply_Xcode_12_5_M1_post_install_workaround`, remove explicit Hermes/Fabric flags |
| Modify | 27× `modules/*/package.json` | Update `react-native` peer dependency from `^0.72.9` to `^0.73.0` |
| Verify | `contrib/0001-rn.patch` | Patches `@callstack/react-theme-provider` types — not RN-specific, should still apply |
| Verify | `contrib/0002-datetimepicker-yoga.patch` | Patches Yoga types in datetimepicker — verify against RN 0.73 Yoga version |
| Verify | `contrib/0003-sentry-thread-cache.patch` | Patches Sentry pod source — verify still needed with same Sentry version |
| Verify | `contrib/0004-sentry-ucontext.patch` | Patches Sentry pod source — verify still needed with same Sentry version |
| Verify | `contrib/0005-sentry-terminate.patch` | Patches Sentry pod source — verify still needed with same Sentry version |
| Regenerate | `ios/Podfile.lock` | Must be regenerated after dependency updates |
| No change | `metro.config.js` | Already uses `@react-native/metro-config` — import is compatible |
| No change | `jest.config.ts` | Uses `react-native` preset which auto-resolves — no version-specific config |
| No change | `tsconfig.json` | No RN-version-specific settings |
| No change | `react-native.config.js` | Project config unchanged between versions |
| No change | `.github/workflows/` | No RN-version-specific CI config |

---

### Task 1: Update Root `package.json` Dependencies

**Files:**
- Modify: `package.json`

This task updates the core React Native dependency and its companion packages. The key changes are:
1. `react-native` 0.72.9 → 0.73.9
2. `@react-native/metro-config` 0.72.11 → 0.73.5
3. Replace `metro-react-native-babel-preset` (deprecated) with `@react-native/babel-preset`
4. `react` stays at 18.2.0 (compatible with both 0.72 and 0.73)

- [ ] **Step 1: Update react-native version**

In `package.json`, change the `react-native` dependency:

```json
// Before (line 64)
"react-native": "0.72.9",

// After
"react-native": "0.73.9",
```

- [ ] **Step 2: Update @react-native/metro-config version**

In `package.json`, change the `@react-native/metro-config` devDependency:

```json
// Before (line 105)
"@react-native/metro-config": "0.72.11",

// After
"@react-native/metro-config": "0.73.5",
```

- [ ] **Step 3: Replace metro-react-native-babel-preset with @react-native/babel-preset**

In `package.json`, remove `metro-react-native-babel-preset` from devDependencies and add `@react-native/babel-preset`:

```json
// Remove (line 136)
"metro-react-native-babel-preset": "0.76.8",

// Add in devDependencies (alphabetical position, near other @react-native packages)
"@react-native/babel-preset": "0.73.21",
```

- [ ] **Step 4: Run npm install**

```bash
npm install --ignore-scripts
```

Expected: Successful install. The `package-lock.json` will be updated with new resolved versions.

- [ ] **Step 5: Verify react-native version resolves correctly**

```bash
node -e "console.log(require('react-native/package.json').version)"
```

Expected output: `0.73.9`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: bump react-native 0.72.9 → 0.73.9 and companion packages"
```

---

### Task 2: Update Babel Configuration

**Files:**
- Modify: `babel.config.js`

React Native 0.73 renamed the Babel preset from `metro-react-native-babel-preset` to `@react-native/babel-preset`. Additionally, `@babel/plugin-transform-export-namespace-from` is now included by default in the new preset, so it can be removed.

- [ ] **Step 1: Update babel.config.js**

Replace the full contents of `babel.config.js`:

```javascript
// Before
module.exports = {
	presets: [
		'module:metro-react-native-babel-preset',
		'@babel/preset-typescript',
	],
	plugins: [
		'@babel/plugin-transform-export-namespace-from',
		['@babel/plugin-transform-private-methods', {loose: true}],
		// the react-native-reanimated plugin must come last
		'react-native-reanimated/plugin',
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}

// After
module.exports = {
	presets: [
		'module:@react-native/babel-preset',
		'@babel/preset-typescript',
	],
	plugins: [
		['@babel/plugin-transform-private-methods', {loose: true}],
		// the react-native-reanimated plugin must come last
		'react-native-reanimated/plugin',
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
```

Changes:
- Line 3: `module:metro-react-native-babel-preset` → `module:@react-native/babel-preset`
- Removed `@babel/plugin-transform-export-namespace-from` (now included in the new preset)

- [ ] **Step 2: Verify Babel config loads without errors**

```bash
node -e "const config = require('./babel.config.js'); console.log(JSON.stringify(config.presets))"
```

Expected: `["module:@react-native/babel-preset","@babel/preset-typescript"]`

- [ ] **Step 3: Commit**

```bash
git add babel.config.js
git commit -m "chore: migrate babel preset to @react-native/babel-preset"
```

---

### Task 3: Update iOS AppDelegate

**Files:**
- Modify: `ios/AllAboutOlaf/AppDelegate.mm`

React Native 0.73 introduces a new `getBundleURL` pattern in AppDelegate. The `sourceURLForBridge:` method now delegates to `getBundleURL`. This is required for the new debugging infrastructure in 0.73.

- [ ] **Step 1: Update AppDelegate.mm**

Replace the full contents of `ios/AllAboutOlaf/AppDelegate.mm`:

```objc
// Before
#import "AppDelegate.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"AllAboutOlaf";

  // set up the requests cacher
  NSURLCache *URLCache = [[NSURLCache alloc] initWithMemoryCapacity:4 * 1024 * 1024   // 4 MiB
                                                       diskCapacity:20 * 1024 * 1024  // 20 MiB
                                                           diskPath:nil];
  [NSURLCache setSharedURLCache:URLCache];

  // ignore vibrate/silent switch when playing audio
  [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayback error: nil];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

// After
#import "AppDelegate.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"AllAboutOlaf";

  // set up the requests cacher
  NSURLCache *URLCache = [[NSURLCache alloc] initWithMemoryCapacity:4 * 1024 * 1024   // 4 MiB
                                                       diskCapacity:20 * 1024 * 1024  // 20 MiB
                                                           diskPath:nil];
  [NSURLCache setSharedURLCache:URLCache];

  // ignore vibrate/silent switch when playing audio
  [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayback error: nil];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
```

Changes:
- `sourceURLForBridge:` now delegates to `getBundleURL`
- New `getBundleURL` method contains the actual bundle URL logic
- All custom code (URLCache, AVAudioSession) is preserved unchanged

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlaf/AppDelegate.mm
git commit -m "chore: update AppDelegate for RN 0.73 getBundleURL pattern"
```

---

### Task 4: Update iOS Podfile

**Files:**
- Modify: `ios/Podfile`

React Native 0.73 removes the `__apply_Xcode_12_5_M1_post_install_workaround` helper (no longer needed with modern Xcode). Additionally, the explicit `:hermes_enabled` and `:fabric_enabled` flags can be simplified since Hermes is the default in 0.73 and the flags API changed.

- [ ] **Step 1: Remove the M1 workaround from Podfile**

In `ios/Podfile`, remove line 56:

```ruby
# Remove this line (line 56):
__apply_Xcode_12_5_M1_post_install_workaround(installer)
```

This function was removed from `react_native_pods.rb` in 0.73. Calling it will cause a `pod install` error.

- [ ] **Step 2: Simplify use_react_native! flags**

In `ios/Podfile`, simplify the `use_react_native!` call. In RN 0.73, the `get_default_flags()` function and `:hermes_enabled`/`:fabric_enabled` flags are no longer used — Hermes is always on by default.

```ruby
# Before (lines 30-42)
config = use_native_modules!

# Flags change depending on the env values.
flags = get_default_flags()

use_react_native!(
    :path => config[:reactNativePath],
    # Hermes is now enabled by default. Disable by setting this flag to false.
    :hermes_enabled => flags[:hermes_enabled],
    :fabric_enabled => flags[:fabric_enabled],
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/.."
)

# After
config = use_native_modules!

use_react_native!(
    :path => config[:reactNativePath],
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/.."
)
```

Changes:
- Removed `flags = get_default_flags()` (deprecated in 0.73)
- Removed `:hermes_enabled => flags[:hermes_enabled]` (Hermes is default)
- Removed `:fabric_enabled => flags[:fabric_enabled]` (flag removed)

- [ ] **Step 3: Verify Podfile syntax**

```bash
cd ios && ruby -c Podfile
```

Expected: `Syntax OK`

- [ ] **Step 4: Commit**

```bash
git add ios/Podfile
git commit -m "chore: update Podfile for RN 0.73 — remove deprecated helpers and flags"
```

---

### Task 5: Update Workspace Module Peer Dependencies

**Files:**
- Modify: 27 files in `modules/*/package.json`

All 27 workspace modules that declare `react-native` as a peer dependency need updating from `^0.72.9` to `^0.73.0`.

The full list of modules:
1. `modules/add-to-device-calendar/package.json`
2. `modules/badge/package.json`
3. `modules/button/package.json`
4. `modules/constants/package.json`
5. `modules/context-menu/package.json`
6. `modules/datepicker/package.json`
7. `modules/event-list/package.json`
8. `modules/filter/package.json`
9. `modules/food-menu/package.json`
10. `modules/html-content/package.json`
11. `modules/icon/package.json`
12. `modules/info-header/package.json`
13. `modules/layout/package.json`
14. `modules/lists/package.json`
15. `modules/listview/package.json`
16. `modules/markdown/package.json`
17. `modules/navigation-buttons/package.json`
18. `modules/navigation-tabs/package.json`
19. `modules/notice/package.json`
20. `modules/open-url/package.json`
21. `modules/separator/package.json`
22. `modules/silly-card/package.json`
23. `modules/storage/package.json`
24. `modules/tableview/package.json`
25. `modules/toolbar/package.json`
26. `modules/touchable/package.json`
27. `modules/viewport/package.json`

- [ ] **Step 1: Batch-update all module peer dependencies**

Run from the repo root:

```bash
cd /home/runner/work/AAO-React-Native/AAO-React-Native
for f in modules/*/package.json; do
  if grep -q '"react-native": "\^0\.72\.9"' "$f"; then
    sed -i 's/"react-native": "\^0\.72\.9"/"react-native": "\^0.73.0"/' "$f"
    echo "Updated: $f"
  fi
done
```

- [ ] **Step 2: Verify all modules updated**

```bash
grep -r '"react-native": "\^0.72' modules/*/package.json
```

Expected: No output (no remaining 0.72 references).

```bash
grep -c '"react-native": "\^0.73.0"' modules/*/package.json | grep -v ':0$'
```

Expected: 27 files each showing `:1`.

- [ ] **Step 3: Re-run npm install to update workspace links**

```bash
npm install --ignore-scripts
```

Expected: Clean install with no peer dependency warnings about react-native version.

- [ ] **Step 4: Commit**

```bash
git add modules/*/package.json package-lock.json
git commit -m "chore: update workspace module peer deps to react-native ^0.73.0"
```

---

### Task 6: Review and Update Patches

**Files:**
- Verify: `contrib/0001-rn.patch` through `contrib/0005-sentry-terminate.patch`

Each existing patch must be evaluated for compatibility with RN 0.73. The patches apply to `node_modules/` (patches 0001-0002) and `ios/Pods/` (patches 0003-0005).

- [ ] **Step 1: Evaluate patch 0001 (react-theme-provider types)**

File: `contrib/0001-rn.patch`
Target: `node_modules/@callstack/react-theme-provider/typings/index.d.ts`

This patch fixes a TypeScript type issue in `@callstack/react-theme-provider`. It is NOT related to React Native internals — it patches a third-party package. **Action: Keep as-is.** The patch will continue to apply regardless of RN version.

- [ ] **Step 2: Evaluate patch 0002 (datetimepicker Yoga)**

File: `contrib/0002-datetimepicker-yoga.patch`
Target: `node_modules/@react-native-community/datetimepicker/ios/RNDateTimePickerShadowView.m`

This patch changes `YGNodeConstRef` to `YGNodeRef` in the datetimepicker native code. React Native 0.73 ships Yoga 0.2.0 (up from 0.1.x in 0.72). **Action: Test whether this patch is still needed.** The upstream datetimepicker version 8.6.0 may have already fixed this. Try applying the patch after `npm install` — if it applies cleanly, keep it. If the underlying code has changed, verify the issue is fixed upstream and remove the patch.

To test:

```bash
patch -p0 --dry-run < contrib/0002-datetimepicker-yoga.patch
```

If output shows "Reversed (or previously applied) patch detected" or "FAILED", the patch context has changed and needs investigation.

- [ ] **Step 3: Evaluate patches 0003-0005 (Sentry)**

Files: `contrib/0003-sentry-thread-cache.patch`, `contrib/0004-sentry-ucontext.patch`, `contrib/0005-sentry-terminate.patch`
Target: `ios/Pods/Sentry/Sources/...`

These patches fix C++ compilation issues in the Sentry iOS SDK and are applied AFTER `pod install` (they patch files in the `ios/Pods/` directory). They target `@sentry/react-native` 5.9.1. **Action: Keep as-is for now.** These patches are version-locked to the Sentry pod, not to React Native. They will continue to apply as long as `@sentry/react-native` stays at 5.9.1. If the Sentry pod version changes during the `pod install` with RN 0.73, the patches may need updating.

- [ ] **Step 4: Commit any patch changes (if needed)**

```bash
# Only if patches were modified or removed
git add contrib/
git commit -m "chore: update patches for RN 0.73 compatibility"
```

---

### Task 7: Regenerate iOS Pods

**Files:**
- Regenerate: `ios/Podfile.lock`

After all JS/config changes are committed, CocoaPods must be re-run to install the new React Native 0.73 pods and regenerate the lock file.

- [ ] **Step 1: Clean existing Pods**

```bash
cd ios
rm -rf Pods
rm Podfile.lock
```

- [ ] **Step 2: Install pods**

```bash
cd ios
bundle exec pod install
```

Expected: Successful pod installation. Watch for:
- React-Core should resolve to 0.73.9
- Hermes-engine should resolve to a 0.73.x version
- No errors about missing `__apply_Xcode_12_5_M1_post_install_workaround`
- No errors about `get_default_flags`

If `bundle exec pod install` fails with the patch application, temporarily comment out the `system('cd .. && scripts/apply-patches.sh')` line in the Podfile, run pod install, then re-enable it.

- [ ] **Step 3: Verify patches apply to new Pods**

```bash
cd ..
scripts/apply-patches.sh
```

Expected: All patches apply (possibly with "offset" warnings, which are OK). Check for FAILED messages.

- [ ] **Step 4: Commit updated Podfile.lock**

```bash
git add ios/Podfile.lock
git commit -m "chore: regenerate Podfile.lock for RN 0.73"
```

---

### Task 8: Run JavaScript Validation

**Files:**
- No changes — validation only

Run the full JS validation suite to ensure nothing is broken.

- [ ] **Step 1: Run TypeScript type checking**

```bash
npx tsc --noEmit
```

Expected: No new type errors. React Native 0.73 ships updated TypeScript types. If new errors appear, they indicate API changes that need addressing.

- [ ] **Step 2: Run ESLint**

```bash
node_modules/.bin/eslint source/ modules/
```

Expected: No new lint errors.

- [ ] **Step 3: Run Jest tests**

```bash
node_modules/.bin/jest --no-coverage
```

Expected: All existing tests pass. Pay attention to:
- Tests that mock RN internals (e.g., `react-native/Libraries/EventEmitter/NativeEventEmitter` in `scripts/jest-setup.js`)
- Tests that use `react-test-renderer`

- [ ] **Step 4: Run Prettier check**

```bash
node_modules/.bin/prettier --check .
```

Expected: No formatting issues.

- [ ] **Step 5: Fix any failures and commit**

If any step fails, fix the issue and commit:

```bash
git add -A
git commit -m "fix: address JS validation issues from RN 0.73 upgrade"
```

---

### Task 9: Verify iOS Build

**Files:**
- No changes — validation only

Build the iOS project to verify native compilation succeeds.

- [ ] **Step 1: Build iOS project**

```bash
cd ios
xcodebuild -workspace AllAboutOlaf.xcworkspace \
  -scheme AllAboutOlaf \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build
```

Expected: BUILD SUCCEEDED. If there are compilation errors, they likely relate to:
- Deprecated RN API changes in native modules
- Yoga version changes affecting third-party pods
- New Hermes binary compatibility

- [ ] **Step 2: Fix any build errors and commit**

If build fails, address the errors and commit:

```bash
git add -A
git commit -m "fix: address iOS build issues from RN 0.73 upgrade"
```

---

### Task 10: Smoke Test the App

**Files:**
- No changes — manual testing only

Run the app in the iOS simulator to verify basic functionality.

- [ ] **Step 1: Start Metro bundler**

```bash
npx react-native start --reset-cache
```

Expected: Metro starts successfully and shows "Welcome to Metro" message.

- [ ] **Step 2: Run app in simulator**

In a separate terminal:

```bash
npx react-native run-ios
```

Expected: App launches in the iOS simulator. Verify:
- App loads without red screen errors
- Navigation works (tap through tabs)
- No console warnings about deprecated APIs

- [ ] **Step 3: Verify Hermes is running**

In the Metro terminal or React Native debugger, verify Hermes is the JS engine:

```javascript
// In the app or debugger console:
console.log(typeof HermesInternal !== 'undefined' ? 'Hermes' : 'Not Hermes')
```

Expected: `Hermes`

---

## Dependency Compatibility Notes

The following third-party dependencies should be verified for RN 0.73 compatibility. All listed versions are already compatible based on their published peer dependency ranges, but any issues during testing should be addressed:

| Package | Version | RN 0.73 Compatible? | Notes |
|---------|---------|---------------------|-------|
| `react-native-gesture-handler` | 2.31.0 | ✅ Yes | Supports 0.73+ |
| `react-native-reanimated` | 3.7.2 | ✅ Yes | Supports 0.73+ |
| `react-native-screens` | 3.24.0 | ✅ Yes | Supports 0.73+ |
| `react-native-safe-area-context` | 4.14.1 | ✅ Yes | Supports 0.73+ |
| `@react-navigation/*` | 6.x | ✅ Yes | No RN version constraint |
| `react-native-webview` | 13.16.1 | ✅ Yes | Supports 0.73+ |
| `react-native-device-info` | 11.1.0 | ✅ Yes | Supports 0.73+ |
| `react-native-ios-context-menu` | 1.15.3 | ✅ Yes | iOS-only, no RN version constraint |
| `react-native-keychain` | 8.2.0 | ✅ Yes | Supports 0.73+ |
| `@sentry/react-native` | 5.9.1 | ✅ Yes | Supports 0.73+ |
| `react-native-paper` | 5.15.0 | ✅ Yes | JS-only, no native module |
| `@react-native-async-storage/async-storage` | 1.24.0 | ✅ Yes | Supports 0.73+ |
| `@react-native-community/datetimepicker` | 8.6.0 | ✅ Yes | Verify Yoga patch |
| `@react-native-community/netinfo` | 11.5.2 | ✅ Yes | Supports 0.73+ |
| `@react-native-picker/picker` | 2.5.1 | ✅ Yes | Supports 0.73+ |
| `@react-native-clipboard/clipboard` | 1.16.3 | ✅ Yes | Supports 0.73+ |
| `detox` | 20.50.1 | ✅ Yes | Supports 0.73+ |
| `react-native-restart` | 0.0.27 | ⚠️ Verify | Older package, test during build |
| `react-native-search-bar` | 3.5.1 | ⚠️ Verify | Less maintained, test during build |

## Key RN 0.73 Breaking Changes (Applicable to This Project)

1. **Babel Preset Rename**: `metro-react-native-babel-preset` → `@react-native/babel-preset` (Task 2)
2. **AppDelegate `getBundleURL`**: New method required for debugging infrastructure (Task 3)
3. **Podfile `__apply_Xcode_12_5_M1_post_install_workaround` removed**: Function no longer exists (Task 4)
4. **Podfile `get_default_flags()` removed**: Hermes is always default (Task 4)
5. **`@babel/plugin-transform-export-namespace-from` now built-in**: Can be removed from babel config (Task 2)
6. **Minimum iOS version**: 13.4 (project targets 17.2, no issue)
7. **Symlink support stable**: Already used via npm workspaces — no change needed
8. **New debugger**: Automatically available with 0.73 — no config needed

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Yoga version change breaks datetimepicker patch | Medium | Test patch; update or remove if upstream fixed |
| Sentry pod patches fail on new pod versions | Low | Sentry version unchanged; patches target pod source |
| Third-party native module build failures | Low | All key deps support 0.73; build validation in Task 9 |
| Jest test failures from RN internal API changes | Low | Internal mock in jest-setup.js is minimal |
| Metro bundler startup issues | Very Low | Metro config format unchanged between 0.72→0.73 |
