# XcodeGen Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manually-managed `project.pbxproj` with an XcodeGen `project.yml`, making Xcode project config human-readable and eliminating merge conflicts.

**Architecture:** A single `ios/project.yml` becomes the source of truth. `scripts/pods.sh` runs `xcodegen generate` before `pod install`. The generated `.xcodeproj` contents are gitignored.

**Tech Stack:** XcodeGen, CocoaPods, mise

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `ios/project.yml` | XcodeGen project spec — the new source of truth |
| Modify | `scripts/pods.sh` | Add `xcodegen generate` before `pod install` |
| Modify | `.mise.toml` | Add `xcodegen` tool dependency |
| Modify | `.gitignore` | Ignore generated xcodeproj contents |
| Remove from git | `ios/AllAboutOlaf.xcodeproj/project.pbxproj` | No longer tracked (generated) |
| Remove from git | `ios/AllAboutOlaf.xcodeproj/project.xcworkspace/` | No longer tracked (generated) |
| Remove from git | `ios/AllAboutOlaf.xcodeproj/xcshareddata/` | No longer tracked (generated) |

---

## Task 1: Create `ios/project.yml`

**Files:**
- Create: `ios/project.yml`

This is the core of the migration. The YAML must faithfully reproduce the current pbxproj's build settings, targets, and scripts.

**Key facts extracted from the existing pbxproj:**

- Project-level configs: Debug and Release, with extensive compiler warnings enabled
- Deployment target: iOS 17.2
- Swift version: 5.0, C++ standard: c++17
- AllAboutOlaf target: app, sources are `AppDelegate.mm` and `main.m`, resources include `Images.xcassets`, `LaunchScreen.storyboard`, `PrivacyInfo.xcprivacy`, and windmill PNG files from `../images/icons/`
- AllAboutOlafUITests target: UI testing bundle, sources are `AllAboutOlafUITests.swift` and `fastlane/SnapshotHelper.swift`
- CocoaPods build phases (`[CP] Check Pods Manifest.lock`, `[CP] Embed Pods Frameworks`, `[CP] Copy Pods Resources`) are injected by `pod install` — do NOT define them in project.yml
- The only custom build script to define is "Bundle React Native code and images"
- The existing scheme references a stale `AllAboutOlafTests` target and a legacy `libReact.a` build entry — these don't exist in the pbxproj and should be omitted from the XcodeGen scheme
- `SnapshotHelper.swift` lives at `ios/fastlane/SnapshotHelper.swift` (path relative to ios/ is `fastlane/SnapshotHelper.swift`)

- [ ] **Step 1: Create `ios/project.yml`**

Create the file with the following content:

```yaml
name: AllAboutOlaf
options:
  bundleIdPrefix: ""
  deploymentTarget:
    iOS: "17.2"
  xcodeVersion: "1300"
  developmentLanguage: en
  defaultConfig: Release

configs:
  Debug: debug
  Release: release

settings:
  base:
    ALWAYS_SEARCH_USER_PATHS: "NO"
    CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED: "YES"
    CLANG_CXX_LANGUAGE_STANDARD: "c++17"
    CLANG_CXX_LIBRARY: "libc++"
    CLANG_ENABLE_MODULES: "YES"
    CLANG_ENABLE_OBJC_ARC: "YES"
    CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING: "YES"
    CLANG_WARN_BOOL_CONVERSION: "YES"
    CLANG_WARN_COMMA: "YES"
    CLANG_WARN_CONSTANT_CONVERSION: "YES"
    CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS: "YES"
    CLANG_WARN_DIRECT_OBJC_ISA_USAGE: YES_ERROR
    CLANG_WARN_EMPTY_BODY: "YES"
    CLANG_WARN_ENUM_CONVERSION: "YES"
    CLANG_WARN_INFINITE_RECURSION: "YES"
    CLANG_WARN_INT_CONVERSION: "YES"
    CLANG_WARN_NON_LITERAL_NULL_CONVERSION: "YES"
    CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF: "YES"
    CLANG_WARN_OBJC_LITERAL_CONVERSION: "YES"
    CLANG_WARN_OBJC_ROOT_CLASS: YES_ERROR
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES"
    CLANG_WARN_RANGE_LOOP_ANALYSIS: "YES"
    CLANG_WARN_STRICT_PROTOTYPES: "YES"
    CLANG_WARN_SUSPICIOUS_MOVE: "YES"
    CLANG_WARN_UNREACHABLE_CODE: "YES"
    CLANG_WARN__DUPLICATE_METHOD_MATCH: "YES"
    CODE_SIGN_IDENTITY[sdk=iphoneos*]: "iPhone Developer"
    CURRENT_PROJECT_VERSION: 16
    ENABLE_STRICT_OBJC_MSGSEND: "YES"
    EXCLUDED_ARCHS[sdk=iphonesimulator*]: i386
    GCC_C_LANGUAGE_STANDARD: gnu99
    GCC_NO_COMMON_BLOCKS: "YES"
    GCC_WARN_64_TO_32_BIT_CONVERSION: "YES"
    GCC_WARN_ABOUT_RETURN_TYPE: YES_ERROR
    GCC_WARN_UNDECLARED_SELECTOR: "YES"
    GCC_WARN_UNINITIALIZED_AUTOS: YES_AGGRESSIVE
    GCC_WARN_UNUSED_FUNCTION: "YES"
    GCC_WARN_UNUSED_VARIABLE: "YES"
    HEADER_SEARCH_PATHS: "$(inherited)"
    IPHONEOS_DEPLOYMENT_TARGET: "17.2"
    OTHER_CFLAGS: "$(inherited)"
    OTHER_CPLUSPLUSFLAGS: "$(inherited)"
    REACT_NATIVE_PATH: "${PODS_ROOT}/../../node_modules/react-native"
    SDKROOT: iphoneos
    SWIFT_VERSION: "5.0"
    VERSIONING_SYSTEM: "apple-generic"
  configs:
    Debug:
      COPY_PHASE_STRIP: "NO"
      ENABLE_TESTABILITY: "YES"
      GCC_DYNAMIC_NO_PIC: "NO"
      GCC_OPTIMIZATION_LEVEL: "0"
      GCC_PREPROCESSOR_DEFINITIONS:
        - "DEBUG=1"
        - "$(inherited)"
      GCC_SYMBOLS_PRIVATE_EXTERN: "NO"
      MTL_ENABLE_DEBUG_INFO: "YES"
      ONLY_ACTIVE_ARCH: "YES"
      SWIFT_OPTIMIZATION_LEVEL: "-Onone"
    Release:
      COPY_PHASE_STRIP: "YES"
      ENABLE_NS_ASSERTIONS: "NO"
      MTL_ENABLE_DEBUG_INFO: "NO"
      SWIFT_COMPILATION_MODE: wholemodule
      SWIFT_OPTIMIZATION_LEVEL: "-O"
      VALIDATE_PRODUCT: "YES"

targets:
  AllAboutOlaf:
    type: application
    platform: iOS
    productName: AllAboutOlaf
    configFiles:
      Debug: Pods/Target Support Files/Pods-AllAboutOlaf/Pods-AllAboutOlaf.debug.xcconfig
      Release: Pods/Target Support Files/Pods-AllAboutOlaf/Pods-AllAboutOlaf.release.xcconfig
    sources:
      - path: AllAboutOlaf
        excludes:
          - Info.plist
          - "*.entitlements"
    resources:
      - path: AllAboutOlaf/Images.xcassets
      - path: AllAboutOlaf/LaunchScreen.storyboard
      - path: PrivacyInfo.xcprivacy
      - path: ../images/icons/windmill@2x.png
      - path: ../images/icons/windmill@3x.png
      - path: ../images/icons/windmill@2x~iPad.png
      - path: ../images/icons/windmill@3x~iPad.png
    settings:
      base:
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
        CLANG_ENABLE_MODULES: "YES"
        CODE_SIGN_IDENTITY: "Apple Development"
        CODE_SIGN_IDENTITY[sdk=iphoneos*]: "iPhone Developer"
        CODE_SIGN_STYLE: Manual
        DEAD_CODE_STRIPPING: "YES"
        DEPLOYMENT_POSTPROCESSING: "YES"
        DEVELOPMENT_TEAM: ""
        DEVELOPMENT_TEAM[sdk=iphoneos*]: TMK6S7TPX2
        HEADER_SEARCH_PATHS: "$(inherited)"
        INFOPLIST_FILE: AllAboutOlaf/Info.plist
        LD_RUNPATH_SEARCH_PATHS:
          - "$(inherited)"
          - "@executable_path/Frameworks"
        OTHER_LDFLAGS:
          - "$(inherited)"
          - "-ObjC"
          - "-lc++"
        PRODUCT_BUNDLE_IDENTIFIER: NFMTHAZVS9.com.drewvolz.stolaf
        PROVISIONING_PROFILE_SPECIFIER: ""
        STRIPFLAGS: "-rSTx"
        SWIFT_OBJC_BRIDGING_HEADER: AllAboutOlafUITests/AllAboutOlaf-Bridging-Header.h
        TARGETED_DEVICE_FAMILY: "1,2"
      configs:
        Debug:
          CODE_SIGN_IDENTITY: "Apple Development"
          CODE_SIGN_IDENTITY[sdk=iphoneos*]: "iPhone Developer"
          ENABLE_TESTABILITY: "YES"
          PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]: "match Development NFMTHAZVS9.com.drewvolz.stolaf"
        Release:
          CODE_SIGN_IDENTITY: "Apple Development"
          CODE_SIGN_IDENTITY[sdk=iphoneos*]: "iPhone Distribution"
          PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]: "match AppStore NFMTHAZVS9.com.drewvolz.stolaf"
    entitlements:
      path: AllAboutOlaf/AllAboutOlaf.entitlements
    preBuildScripts: []
    postBuildScripts:
      - name: "Bundle React Native code and images"
        script: |
          export NODE_BINARY=node
          ../node_modules/react-native/scripts/react-native-xcode.sh
        basedOnDependencyAnalysis: false
    attributes:
      LastSwiftMigration: "0810"
      SystemCapabilities:
        com.apple.ApplicationGroups.iOS:
          enabled: false
        com.apple.BackgroundModes:
          enabled: true
        com.apple.Push:
          enabled: false

  AllAboutOlafUITests:
    type: bundle.ui-testing
    platform: iOS
    sources:
      - path: AllAboutOlafUITests
        excludes:
          - Info.plist
      - path: fastlane/SnapshotHelper.swift
    settings:
      base:
        CLANG_ANALYZER_NONNULL: "YES"
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES"
        CLANG_WARN_SUSPICIOUS_MOVES: "YES"
        INFOPLIST_FILE: AllAboutOlafUITests/Info.plist
        LD_RUNPATH_SEARCH_PATHS:
          - "$(inherited)"
          - "@executable_path/Frameworks"
          - "@loader_path/Frameworks"
        LIBRARY_SEARCH_PATHS: "$(SDKROOT)/usr/lib/swift$(inherited)"
        PRODUCT_BUNDLE_IDENTIFIER: "hawkrives.All-About-Olaf-UI-Tests"
        PRODUCT_NAME: "$(TARGET_NAME)"
        TEST_TARGET_NAME: AllAboutOlaf
      configs:
        Debug:
          DEBUG_INFORMATION_FORMAT: dwarf
          SWIFT_ACTIVE_COMPILATION_CONDITIONS: DEBUG
        Release:
          COPY_PHASE_STRIP: "NO"
          DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym"
    configFiles:
      Debug: Pods/Target Support Files/Pods-AllAboutOlaf-AllAboutOlafUITests/Pods-AllAboutOlaf-AllAboutOlafUITests.debug.xcconfig
      Release: Pods/Target Support Files/Pods-AllAboutOlaf-AllAboutOlafUITests/Pods-AllAboutOlaf-AllAboutOlafUITests.release.xcconfig
    dependencies:
      - target: AllAboutOlaf
    attributes:
      CreatedOnToolsVersion: "8.1"
      ProvisioningStyle: Automatic
      TestTargetID: AllAboutOlaf

schemes:
  AllAboutOlaf:
    build:
      parallelizeBuild: false
      targets:
        AllAboutOlaf:
          testing: true
          running: true
          profiling: true
          archiving: true
          analyzing: true
    run:
      config: Debug
    test:
      config: Debug
      targets:
        - AllAboutOlafUITests
    profile:
      config: Release
    analyze:
      config: Debug
    archive:
      config: Release
      revealArchiveInOrganizer: true
```

- [ ] **Step 2: Verify the YAML is valid**

Run:
```bash
cd /home/user/AAO-React-Native/ios && cat project.yml | python3 -c "import sys, yaml; yaml.safe_load(sys.stdin); print('Valid YAML')"
```

If python3 yaml module isn't available, just visually inspect indentation — XcodeGen will report parse errors in the next task anyway.

- [ ] **Step 3: Commit**

```bash
git add ios/project.yml
git commit -m "Add XcodeGen project.yml as new Xcode project source of truth"
```

---

## Task 2: Update `scripts/pods.sh` to run XcodeGen

**Files:**
- Modify: `scripts/pods.sh`

- [ ] **Step 1: Add `xcodegen generate` before `pod install`**

The current file is:

```bash
#!/bin/bash

set -e -o pipefail

USE_PODS=${FP_PODS:-yes}

if [[ $USE_PODS = 'yes' ]]; then
	if [[ $(uname) = 'Darwin' ]]; then
		bundle install
		cd ios || exit 1

		if ! bundle exec pod install --deployment; then
			echo 'try running "bundle exec pod install --repo-update"' 1>&2
		fi
	else
		echo 'not on macos; not installing cocoapods'
	fi
else
	echo 'FP_PODS=no; not installing cocoapods'
fi
```

Change the Darwin branch to run xcodegen first. Replace the block after `cd ios || exit 1` so the file becomes:

```bash
#!/bin/bash

set -e -o pipefail

USE_PODS=${FP_PODS:-yes}

if [[ $USE_PODS = 'yes' ]]; then
	if [[ $(uname) = 'Darwin' ]]; then
		bundle install
		cd ios || exit 1

		xcodegen generate
		if ! bundle exec pod install --deployment; then
			echo 'try running "bundle exec pod install --repo-update"' 1>&2
		fi
	else
		echo 'not on macos; not installing cocoapods'
	fi
else
	echo 'FP_PODS=no; not installing cocoapods'
fi
```

The only change is adding `xcodegen generate` on the line after `cd ios || exit 1`.

- [ ] **Step 2: Commit**

```bash
git add scripts/pods.sh
git commit -m "Run xcodegen generate before pod install in pods.sh"
```

---

## Task 3: Add XcodeGen to mise tools

**Files:**
- Modify: `.mise.toml`

- [ ] **Step 1: Add xcodegen to `[tools]` section**

In `.mise.toml`, add `xcodegen = "latest"` to the `[tools]` section. The section should become:

```toml
[tools]
node = "22.20.0"
hk = "latest"
xcodegen = "latest"
```

- [ ] **Step 2: Commit**

```bash
git add .mise.toml
git commit -m "Add xcodegen as a mise tool dependency"
```

---

## Task 4: Gitignore generated xcodeproj contents and remove from tracking

**Files:**
- Modify: `.gitignore`
- Remove from git: `ios/AllAboutOlaf.xcodeproj/project.pbxproj`
- Remove from git: `ios/AllAboutOlaf.xcodeproj/project.xcworkspace/`
- Remove from git: `ios/AllAboutOlaf.xcodeproj/xcshareddata/`

- [ ] **Step 1: Add gitignore entries**

In `.gitignore`, add the following lines after the existing `# Xcode` section (after line 25, `/ios/.xcode.env.local`):

```
# XcodeGen — generated project files
/ios/AllAboutOlaf.xcodeproj/project.pbxproj
/ios/AllAboutOlaf.xcodeproj/project.xcworkspace/
/ios/AllAboutOlaf.xcodeproj/xcshareddata/
```

- [ ] **Step 2: Remove generated files from git tracking**

Run these commands to stop tracking the files without deleting them locally:

```bash
git rm --cached ios/AllAboutOlaf.xcodeproj/project.pbxproj
git rm --cached -r ios/AllAboutOlaf.xcodeproj/project.xcworkspace/
git rm --cached -r ios/AllAboutOlaf.xcodeproj/xcshareddata/
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "Gitignore generated xcodeproj contents and remove from tracking

The project.pbxproj, workspace, and schemes are now generated by
XcodeGen from ios/project.yml. They no longer need to be tracked."
```

---

## Task 5: Validate the migration

This task verifies that XcodeGen produces a working project.

- [ ] **Step 1: Install xcodegen if not already present**

Run:
```bash
which xcodegen || brew install xcodegen
```

(On this Linux environment, xcodegen may not be available. If so, validate the YAML structure manually and note that full validation requires macOS.)

- [ ] **Step 2: Attempt to generate the project**

Run:
```bash
cd /home/user/AAO-React-Native/ios && xcodegen generate 2>&1
```

Expected output: `Generating project...` followed by `Project generated` (or similar success message).

If xcodegen is not available on this platform, verify the YAML is well-formed:
```bash
cd /home/user/AAO-React-Native && python3 -c "
import yaml, json, sys
with open('ios/project.yml') as f:
    data = yaml.safe_load(f)
# Check required top-level keys exist
assert 'name' in data, 'Missing project name'
assert 'targets' in data, 'Missing targets'
assert 'AllAboutOlaf' in data['targets'], 'Missing AllAboutOlaf target'
assert 'AllAboutOlafUITests' in data['targets'], 'Missing UITests target'
assert 'schemes' in data, 'Missing schemes'
assert 'settings' in data, 'Missing settings'
print('YAML structure valid')
print(f'Targets: {list(data[\"targets\"].keys())}')
print(f'Schemes: {list(data[\"schemes\"].keys())}')
print(f'Configs: {list(data[\"configs\"].keys())}')
"
```

Expected output:
```
YAML structure valid
Targets: ['AllAboutOlaf', 'AllAboutOlafUITests']
Schemes: ['AllAboutOlaf']
Configs: ['Debug', 'Release']
```

- [ ] **Step 3: Verify all source files referenced in project.yml exist**

Run:
```bash
cd /home/user/AAO-React-Native/ios && \
  test -f AllAboutOlaf/AppDelegate.mm && echo "OK: AppDelegate.mm" && \
  test -f AllAboutOlaf/AppDelegate.h && echo "OK: AppDelegate.h" && \
  test -f AllAboutOlaf/main.m && echo "OK: main.m" && \
  test -d AllAboutOlaf/Images.xcassets && echo "OK: Images.xcassets" && \
  test -f AllAboutOlaf/LaunchScreen.storyboard && echo "OK: LaunchScreen.storyboard" && \
  test -f AllAboutOlaf/Info.plist && echo "OK: Info.plist" && \
  test -f AllAboutOlaf/AllAboutOlaf.entitlements && echo "OK: entitlements" && \
  test -f PrivacyInfo.xcprivacy && echo "OK: PrivacyInfo.xcprivacy" && \
  test -f ../images/icons/windmill@2x.png && echo "OK: windmill@2x.png" && \
  test -f ../images/icons/windmill@3x.png && echo "OK: windmill@3x.png" && \
  test -f AllAboutOlafUITests/AllAboutOlafUITests.swift && echo "OK: UITests.swift" && \
  test -f AllAboutOlafUITests/AllAboutOlaf-Bridging-Header.h && echo "OK: Bridging header" && \
  test -f fastlane/SnapshotHelper.swift && echo "OK: SnapshotHelper.swift" && \
  echo "All source files verified"
```

All lines should print "OK" and finish with "All source files verified".

- [ ] **Step 4: Push the branch**

```bash
git push -u origin claude/migrate-xcodegen-H3ISd
```
