---
name: run-on-simulator
description: Use when you need to look at the app itself on a simulator - checking a change by eye, screenshotting a screen, or reproducing something by hand, rather than running the XCUITests or building to a phone
---

# Run the App on a Simulator

For seeing a change with your own eyes. To *assert* something about a screen,
write an XCUITest instead — see `run-uitests`. For a physical iPhone, see
`build-to-device`.

## The whole thing, headless

```bash
# 1. Build and install. Slow the first time (30+ min), incremental after.
mise run ios          # expect it to fail at the last step; see below

# 2. Boot a simulator.
xcrun simctl list devices available | grep iPhone
xcrun simctl boot <UDID>; xcrun simctl bootstatus <UDID> -b

# 3. Serve the JavaScript, and wait until it answers.
npx expo start --port 8081 > /tmp/metro.log 2>&1 &
until curl -sf http://localhost:8081/status | grep -q running; do sleep 1; done

# 4. Launch it pointed at Metro, and look.
xcrun simctl openurl <UDID> \
  "NFMTHAZVS9.com.drewvolz.stolaf://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
xcrun simctl io <UDID> screenshot /tmp/shot.png    # then Read the png
```

No GUI is needed at any point. `simctl` drives a booted simulator whether or
not anything is on screen, and `io screenshot` reads the framebuffer directly.

## The two steps that mislead

**`mise run ios` fails at the end, after doing the useful work.** It builds,
signs and installs, then tries to raise the Simulator GUI and reports:

```
CommandError: Simulator app did not open fast enough.
Try opening Simulator first, then running your app.
```

Take its advice only once you have checked the GUI exists. Some Xcode installs
have no `$(xcode-select -p)/Applications/` directory at all, so
`open -a Simulator` answers `Unable to find application named 'Simulator'` and
no amount of retrying will help. **The app is installed either way** — the
failure is in raising a window, not in the build. Ignore it and go to step 2.

**`simctl launch` gets you a red screen.** Launching by bundle id alone:

```bash
xcrun simctl launch <UDID> NFMTHAZVS9.com.drewvolz.stolaf   # DON'T
```

starts the app with no idea where Metro is, and it renders `No script URL
provided. Make sure the packager is running…`, which reads like a broken Metro
rather than a missing argument. The `openurl` deep link in step 4 is what
passes the packager address in. Note the URL is percent-encoded — `%3A%2F%2F`
for `://`.

## Bundle identifiers

| `APP_VARIANT` | Bundle id |
| --- | --- |
| unset / `production` | `NFMTHAZVS9.com.drewvolz.stolaf` |
| `development` | `NFMTHAZVS9.com.drewvolz.stolaf.dev` |

The URL scheme matches the bundle id, so a dev-variant build wants
`…stolaf.dev://expo-development-client/?url=…`. Two builds claiming one scheme
is undefined behaviour, which is why they differ.

## Notes

- **`expo run:ios` does not use `ios/build`.** It writes to
  `~/Library/Developer/Xcode/DerivedData/AllAboutOlaf-<hash>/`, so it neither
  reuses nor contends with a UITest build — it pays its own full build the
  first time. Deleting `ios/build` will not reclaim it.
- Metro serves whatever is on disk on the next launch, so **JavaScript changes
  need no rebuild**: edit, then re-run step 4. Only native changes need
  `mise run ios` again.
- Reset to a first-launch state with
  `xcrun simctl uninstall <UDID> <BUNDLE ID>`, or wipe everything with
  `xcrun simctl erase <UDID>` on a shut-down device.
- A screenshot of a booted-but-idle simulator is a real screenshot; unlike a
  sleeping phone, there is no black-screen trap here.
