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

## Verifying it worked, without touching the phone

`devicectl` can install, launch, screenshot and report processes, which is
enough to confirm a build runs before handing it over. Do that -- an install
that succeeds says nothing about whether the app survives launch.

```bash
xcrun devicectl device process launch --device <UDID> \
  --activate --terminate-existing <BUNDLE ID>
# alive? a count of 1 means it is still up a moment later
xcrun devicectl device info processes --device <UDID> | grep -c AllAboutOlaf
xcrun devicectl device capture screenshot --device <UDID> --destination shot.png
```

**A screenshot of a sleeping phone is black, not blank.** The status bar and
home indicator still composite, so the result looks exactly like a running app
that renders nothing -- and it will have you debugging a rendering fault that
does not exist. Ask for the screen to be woken, or trust the process count over
the picture.

Note `--destination` on `capture screenshot`; `--output` is not a flag, and
`--activate` matters because a launch without it can leave the app backgrounded.

## Where the crash log actually is

Device crash reports do **not** sync to `~/Library/Logs/CrashReporter/`. Looking
there and finding nothing means nothing.

`--console` is no better for an early crash: it only forwards stdout, so a
process that dies before React Native starts prints not one line and reports
`exit code 0`, which reads as a clean exit rather than a trap.

The reports are in a sysdiagnose, one per launch attempt:

```bash
xcrun devicectl device sysdiagnose --device <UDID> --destination /tmp/sysdiag
# ~190 MB; list first, extract only what you need
tar -tzf /tmp/sysdiag/*.tar.gz | grep AllAboutOlaf
tar -xzf /tmp/sysdiag/*.tar.gz '<path>/crashes_and_spins/Retired/AllAboutOlaf-*.ips'
```

An `.ips` is JSON with a one-line header. `termination`, `exception` and the
triggered thread's frames name the fault directly -- which is how the iOS 27
UIScene trap was found after several wrong guesses at signing, entitlements and
bundle format.

## Two things that are not the problem

Both look plausible when a device build misbehaves, and both were measured not
to matter here:

- **The JS bundle does not need Hermes bytecode.** `mise run bundle:ios` emits
  plain JavaScript and a device runs it. Do not "fix" that task: CI feeds its
  output to simulator UITests and is correct as it stands.
- **The app does not need re-signing after injection.** Copying files in breaks
  the seal -- `codesign -v` says `a sealed resource is missing or invalid` --
  and it installs and runs anyway.

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
