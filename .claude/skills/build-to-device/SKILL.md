---
name: build-to-device
description: Use when someone asks for a build on their physical iPhone - covers signing overrides that avoid rotating the shared match certificate, and injecting the JS bundle so a Debug build runs without Metro
---

# Build to a Physical Device

How to get a build of the app onto a physical iPhone for manual verification,
without touching shared signing infrastructure.

## When to Use This Skill

Use this when someone asks you to put a build on their phone — usually to check
something the UI tests cannot, such as native rendering, menu presentation,
alternate app icons, or mDNS discovery.

## The two problems you will hit

Both have caught previous sessions out. Neither is obvious from the error.

### 1. The provisioning profile is expired or unavailable

`expo prebuild` does not reproduce `CODE_SIGN_STYLE`, `DEVELOPMENT_TEAM` or
`PROVISIONING_PROFILE_SPECIFIER`, so a generated project usually signs cleanly
under automatic provisioning and this problem does not arise. It still can when
Xcode picks up a stale `match`-managed profile, and it did every time before the
project was generated. The failure looks like:

```
error: Provisioning profile "match Development NFMTHAZVS9.com.drewvolz.stolaf"
       expired on <date>
error: ...doesn't include signing certificate "Apple Development: <name>"
```

**Do not reach for `match` first.** `fastlane match development --force` rotates
a *shared* certificate in `https://github.com/hawkrives/aao-keys` and on the
Apple Developer Portal. That invalidates it for every other developer and for CI
until they re-run `match`, and it usually needs an interactive 2FA code, so it
will not complete unattended.

Instead, override the signing style on the command line. This leaves the
committed configuration and the match repo untouched, and lets Xcode mint a
development profile for whichever Apple ID is signed into Xcode:

```bash
xcodebuild build \
  -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf \
  -configuration Debug -destination 'platform=iOS,name=<DEVICE NAME>' \
  -derivedDataPath ios/build -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM=TMK6S7TPX2 \
  PROVISIONING_PROFILE_SPECIFIER=""
```

Only escalate to rotating the shared certificate if this fails *and* the person
explicitly approves that specific action — "you can regenerate certs" in general
is not the same as agreeing to rotate a credential their colleagues share.

### 2. A Debug build contains no JavaScript

`react-native-xcode.sh` skips bundling for Debug, so the app it produces expects
Metro on `localhost:8081`. Handed over as-is, it shows a red screen the moment
your machine sleeps or the terminal closes.

`AppDelegate.bundleURL()` prefers an injected bundle and only falls back to
Metro, so inject one and the build runs standalone:

```bash
mise run bundle:ios
APP=$(find ios/build/Build/Products -name 'AllAboutOlaf.app' -path '*iphoneos*' -print -quit)
cp ios/AllAboutOlaf/main.jsbundle "$APP/"
rm -rf "$APP/assets" && cp -R ios/assets "$APP/"
```

Copy `ios/assets/` too, not just the bundle — images resolve from it.

## Full sequence

```bash
# 0. Generate ios/ if it is absent -- it is not tracked.
#    Use the development variant so this build installs alongside whatever the
#    person already has from the App Store rather than replacing it.
APP_VARIANT=development mise run prebuild

# 1. Confirm the device is paired, and note its identifier
xcrun devicectl list devices

# 2. Build (see the signing override above)

# 3. Bundle the JS and inject it into the .app

# 4. Install
xcrun devicectl device install app --device <DEVICE UDID> "$APP"
```

## Notes

- Keep derived data at `ios/build`. React Native's
  `set_RCTNewArchEnabled_in_info_plist` skips paths containing the literal
  `"build/"`; any other name makes a later `pod install` parse a built app's
  binary Info.plist and fail with an opaque UTF-8 error.
- Do not run a device build while a simulator build or test run is using
  `ios/build` — they contend for the same `build.db` and the loser reports
  `database is locked`, which reads like a real build failure.
- Tell the person what to check, and be specific about what has automated
  coverage and what does not, so their time goes to the parts a test cannot
  reach.
