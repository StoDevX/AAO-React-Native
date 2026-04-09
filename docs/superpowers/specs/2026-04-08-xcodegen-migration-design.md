# XcodeGen Migration Design

## Goal

Replace the manually-managed `project.pbxproj` with an XcodeGen `project.yml` as the source of truth for the Xcode project configuration. This eliminates merge conflicts on the pbxproj and makes project settings human-readable and reviewable.

## Approach

Direct, faithful migration — reproduce the current pbxproj exactly in YAML, then gitignore the generated file. No cleanup or refactoring of build settings during migration.

## New File: `ios/project.yml`

### Project-Level Settings

- **Project name:** AllAboutOlaf
- **iOS deployment target:** 17.2
- **Development team:** TMK6S7TPX2
- **Build configurations:** Debug, Release
- **xcconfig includes:** Set automatically by CocoaPods during `pod install`

### Target: AllAboutOlaf (application)

- **Sources:** `AllAboutOlaf/` (AppDelegate.mm, main.m)
- **Resources:** Auto-detected from sources (Images.xcassets, LaunchScreen.storyboard) plus `PrivacyInfo.xcprivacy` and windmill icon PNGs
- **Info.plist:** `AllAboutOlaf/Info.plist`
- **Entitlements:** `AllAboutOlaf/AllAboutOlaf.entitlements`
- **Bridging header:** `AllAboutOlafUITests/AllAboutOlaf-Bridging-Header.h`
- **Product name:** `AllAboutOlaf`
- **Bundle identifier:** `NFMTHAZVS9.com.drewvolz.stolaf`
- **Code signing (Debug):** Manual, "Apple Development", provisioning profile `match Development NFMTHAZVS9.com.drewvolz.stolaf`
- **Code signing (Release):** Manual, "iPhone Distribution", provisioning profile `match AppStore NFMTHAZVS9.com.drewvolz.stolaf`
- **Build scripts (defined in project.yml):**
  1. React Native bundle script (`export NODE_BINARY=node\n../node_modules/react-native/scripts/react-native-xcode.sh`)
- **Build scripts (added automatically by `pod install`, NOT in project.yml):**
  1. CocoaPods manifest check (`diff Podfile.lock Manifest.lock`)
  2. CocoaPods framework embed (`Pods-AllAboutOlaf-frameworks.sh`)
  3. CocoaPods resources copy (`Pods-AllAboutOlaf-resources.sh`)

### Target: AllAboutOlafUITests (UI testing bundle)

- **Sources:** `AllAboutOlafUITests/` (Swift test files, SnapshotHelper files)
- **Info.plist:** `AllAboutOlafUITests/Info.plist`
- **Bundle identifier:** `hawkrives.All-About-Olaf-UI-Tests`
- **Dependencies:** AllAboutOlaf (test host)
- **Code signing:** Matching existing UI test config
- **Build scripts:** CocoaPods framework/resource scripts are added automatically by `pod install`

### Scheme: AllAboutOlaf

- Build: AllAboutOlaf target
- Test: AllAboutOlafUITests
- Run/Profile/Archive: AllAboutOlaf target
- Matches existing `.xcscheme` configuration

## Modified Files

### `scripts/pods.sh`

Add `xcodegen generate` before `pod install`:

```bash
# After cd ios:
xcodegen generate
bundle exec pod install --deployment
```

### `.mise.toml`

Add xcodegen as a tool dependency:

```toml
[tools]
xcodegen = "latest"
```

### `.gitignore`

Add:

```
ios/AllAboutOlaf.xcodeproj/project.pbxproj
ios/AllAboutOlaf.xcodeproj/project.xcworkspace/
ios/AllAboutOlaf.xcodeproj/xcshareddata/
```

## Git Cleanup

Remove generated files from tracking without deleting them locally:

```bash
git rm --cached ios/AllAboutOlaf.xcodeproj/project.pbxproj
git rm --cached -r ios/AllAboutOlaf.xcodeproj/project.xcworkspace/
git rm --cached -r ios/AllAboutOlaf.xcodeproj/xcshareddata/
```

## Developer Workflow

1. Clone repo
2. `npm install`
3. `mise run pods` (generates xcodeproj via xcodegen, then installs pods)
4. Open `AllAboutOlaf.xcworkspace` in Xcode
5. Build and run

When `project.yml` changes (e.g., after pulling), re-run `mise run pods`.

## CI / Fastlane

Fastlane references do not change. XcodeGen outputs to the same `ios/AllAboutOlaf.xcodeproj` path, so existing Fastfile references (`XCODE_PROJECT`, `GYM_WORKSPACE`, `GYM_SCHEME`) remain valid. CI needs an updated setup step: before building, it must install XcodeGen (via Homebrew) and run `xcodegen generate` before `pod install`. The `detox.config.js` also needs to read the deployment target from `ios/project.yml` instead of the pbxproj.

## Validation

After generating with XcodeGen, verify:

- Project builds successfully in Xcode
- Both targets are present with correct bundle identifiers
- Code signing settings match (manual, correct profiles)
- Build scripts execute in correct order
- UI tests can be run
- Fastlane build lane succeeds
