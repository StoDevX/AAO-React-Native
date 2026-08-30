---
name: build-to-device
description: Use when someone asks for a build on their physical iPhone - covers the mise device task, verifying the build survives launch, and finding a crash report when it does not
---

# Build to a Physical Device

Getting a build onto someone's iPhone for the manual checks UI tests cannot make
— native rendering, menu presentation, alternate app icons, mDNS discovery.

## One command

```bash
mise run device "<DEVICE NAME>"
```

The name is what `xcrun devicectl list devices` prints, quoted. The task chains
`pnpm:install:frozen`, `prebuild` under `APP_VARIANT=development`, `build:ios`,
`bundle:ios`, `embed-jsbundle:ios` and `device:deploy`, each cached on its own
`sources`. It transfers an app to someone's phone, so **ask before running it**,
even when a plan already calls for it.

`mise run device:find-udid "<DEVICE NAME>"` exits 1 when the phone is not
paired, which tells a typo from a cable problem. Reach for `mise run --force`
when a step skips and should have run; editing `mise.toml` invalidates every
task in it.

The rest of this file is why those steps look the way they do. Read it when one
fails, not to reassemble the sequence by hand.

## The build signs itself

`APP_VARIANT=development` builds `NFMTHAZVS9.com.drewvolz.stolaf.dev`, which
installs alongside whatever the person already has from the App Store; the
production identity would replace it. `build:ios` signs against whichever Apple
ID is signed into Xcode, so a paired phone and a logged-in Xcode are the whole
prerequisite.

Confirmed 2026-08-16 on an iPhone 14 Pro. Check `CFBundleDisplayName = AAO Dev`
and `CFBundleIdentifier = NFMTHAZVS9.com.drewvolz.stolaf.dev` on the installed
app — the cheapest proof you built the variant you meant to.

**If signing fails, stop and hand it back.** Every remedy touches credentials
shared with other developers and with CI; regenerating one breaks their builds
until they re-sync, and it needs an interactive approval step you cannot
complete anyway. That call belongs to the person whose phone this is.

## The JS bundle travels inside the .app

`react-native-xcode.sh` skips bundling for Debug, so the app looks for Metro on
`localhost:8081` and shows a red screen once your machine sleeps.
`AppDelegate.bundleURL()` prefers an injected bundle, so `bundle:ios` builds one
and `embed-jsbundle:ios` copies it in, along with `ios/assets/` — images resolve
from there.

Two steps you can skip:

- **Hermes bytecode.** `bundle:ios` emits plain JavaScript and a device runs it.
  Leave that task as it is; CI feeds its output to simulator UITests.
- **Re-signing after injection.** Copying files in breaks the seal — `codesign
  -v` reports `a sealed resource is missing or invalid` — and it installs and
  runs regardless.

## Verifying it worked, without touching the phone

An install that succeeds says nothing about whether the app survives launch, so
launch it and count the process.

```bash
xcrun devicectl device process launch --device <UDID> \
  --activate --terminate-existing <BUNDLE ID>
# alive? a count of 1 means it is still up a moment later.
# Grep the executable name rather than the bundle id: the process list prints
# the path to the binary, so `grep -c stolaf.dev` returns 0 for a running app
# and reads exactly like a launch crash.
xcrun devicectl device info processes --device <UDID> | grep -ci olaf
xcrun devicectl device capture screenshot --device <UDID> --destination shot.png
```

`--activate` keeps the app foregrounded, and `capture screenshot` takes
`--destination`.

Ask for the screen to be woken before capturing, or trust the process count over
the picture: **a screenshot of a sleeping phone is black, not blank.** The status
bar and home indicator still composite, so it looks exactly like a running app
that renders nothing, and it will have you debugging a fault that does not exist.

## Where the crash log actually is

In a sysdiagnose, one report per launch attempt:

```bash
xcrun devicectl device sysdiagnose --device <UDID> --destination /tmp/sysdiag
# ~190 MB; list first, extract only what you need
tar -tzf /tmp/sysdiag/*.tar.gz | grep AllAboutOlaf
tar -xzf /tmp/sysdiag/*.tar.gz '<path>/crashes_and_spins/Retired/AllAboutOlaf-*.ips'
```

An `.ips` is JSON with a one-line header. `termination`, `exception` and the
triggered thread's frames name the fault directly — which is how the iOS 27
UIScene trap was found after several wrong guesses at signing, entitlements and
bundle format.

Two places that look authoritative and stay silent: `~/Library/Logs/
CrashReporter/`, which device reports never sync to, and `--console`, which
forwards only stdout — a process that dies before React Native starts prints
nothing and reports `exit code 0`, reading as a clean exit rather than a trap.

## Notes

- Keep derived data at `ios/build`. React Native's
  `set_RCTNewArchEnabled_in_info_plist` skips paths containing the literal
  `"build/"`; any other name makes a later `pod install` parse a built app's
  binary Info.plist and fail with an opaque UTF-8 error.
- Let a simulator build or test run finish before starting a device build. They
  share `ios/build`'s `build.db`, and the loser reports `database is locked`,
  which reads like a real build failure.
- Tell the person what to check, and be specific about what has automated
  coverage and what does not, so their time goes to the parts a test cannot
  reach.
