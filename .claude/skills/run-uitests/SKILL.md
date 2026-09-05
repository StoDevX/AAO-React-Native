---
name: run-uitests
description: Use when a change needs checking against the running app on a simulator - XCUITests in uitests/, proving a UI fix red then green, or getting a screenshot of a screen out of a test run
---

# Run the UITests on a Simulator

The tests in `uitests/` are the only place this repo can answer what a screen
actually looks like and does. Jest cannot: it has no layout pass, no
compositor, and no hit testing, so a Jest assertion about a colour, a size, a
tap target or a native control is asserting the props we passed in.

## The four commands

```bash
# 1. Build the app and the test bundle. Slow the first time, incremental after.
SKIP_BUNDLING=true CODE_SIGNING_DISABLED=true xcodebuild build-for-testing \
  -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf \
  -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build \
  -only-testing:AllAboutOlafUITests \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# 2. Boot a simulator and wait for it.
xcrun simctl list devices available | grep iPhone   # pick a UDID
xcrun simctl boot <UDID>; xcrun simctl bootstatus <UDID> -b

# 3. Serve the JavaScript. Background it, then wait until it answers.
npx expo start --port 8081 &
until curl -sf http://localhost:8081/status | grep -q running; do sleep 1; done

# 4. Run one test, or a suite, or the lot.
rm -rf /tmp/results.xcresult
xcodebuild test-without-building \
  -xctestrun $(find ios/build/Build/Products -name '*.xctestrun' -print -quit) \
  -destination "platform=iOS Simulator,id=<UDID>" \
  -only-testing:AllAboutOlafUITests/ModuleDirectoryTests/testSomething \
  -resultBundlePath /tmp/results
```

Pipe step 4 through `grep -E "^Test Case|error:|XCTAssert|Executed|\*\*"`.
Unfiltered xcodebuild output is thousands of lines, most of it exported build
settings, and it will bury the one assertion message you ran the test for.

Three things that bite on the second run:

- **`-resultBundlePath` refuses to overwrite.** You get `xcodebuild: error:
  Existing file at -resultBundlePath "/tmp/results"` and no test run at all.
  `rm -rf` it first, as above.
- **It appends `.xcresult` for you.** `-resultBundlePath /tmp/results` writes
  `/tmp/results.xcresult`, which is the path every later command wants.
- **Pick a simulator on the runtime the build targeted.** The bundle is named
  for it — `AllAboutOlaf_iphonesimulator27.0-arm64-x86_64.xctestrun` — and a
  device on an older runtime will not run it.

Steps 1 and 4 are the commands CI runs (`.github/workflows/check.yml`, jobs
`ios-build` and `ios-uitest`), so a local failure and a CI failure mean the same
thing. The *destination* is not the same: CI resolves an `iPhone 17e` on a
pinned runtime, which a local machine usually does not have.

## Why step 3 is what makes this affordable

`SKIP_BUNDLING=true` leaves no `main.jsbundle` inside the `.app`, so a Debug
build fetches from Metro on every launch, and `UITestCase.setUp` cold-launches
the app for every single test.

**Editing JavaScript therefore needs no rebuild — just run step 4 again.** That
is what makes it cheap to watch a test fail before trusting it:

1. Write the test and the fix.
2. Revert *just the fix* (`git checkout <file>`, or keep a copy in `/tmp`).
3. Run step 4. **Read the failure message.** It should describe the bug you set
   out to fix, in the words a user would use.
4. Restore the fix. Run step 4 again.

A UI test you have never seen fail proves nothing. A cancelled-swipe test whose
gesture never engaged passes just as green as one that works, and so does a test
that swiped away from a field that was empty to begin with. Skipping this step
is how a broken feature ends up looking covered.

## Getting the picture out

`capture("some name")` on any `Screen` attaches a screenshot with
`.keepAlways`. Pull it out of the result bundle and actually look at it:

```bash
rm -rf /tmp/shots
xcrun xcresulttool export attachments --path /tmp/results.xcresult \
  --output-path /tmp/shots     # then Read the .png
```

**The exported files are named by UUID, not by your capture name.** The name
you passed survives only as `suggested name` in the command's own output and in
`/tmp/shots/manifest.json`, so with more than one capture, read the manifest to
work out which png is which.

Put the `capture` *before* the assertion it illustrates. `UITestCase` sets
`continueAfterFailure = false`, so anything after a failed assertion never runs
— a capture placed afterwards is missing from exactly the run you needed it for.
For a whole-screen shot with no one assertion behind it, put it after whichever
check proves the screen is up and before the one most likely to fail.

## Writing a new test

Screen objects live in `uitests/Screens/`, one struct per screen conforming to
`Screen`, with `@discardableResult` methods returning `Self` so tests read as a
chain. See `uitests/CLAUDE.md` for the conventions.

**A brand-new `.swift` file needs `mise run prebuild` before it will build.**
`plugins/with-xcuitest-target.ts` walks `uitests/` at prebuild time and writes
one `PBXFileReference` per file, so the Xcode project lists them individually —
a file added afterwards is invisible to the build, and nothing warns you.
Editing an existing file needs no prebuild.

### Gestures the simulator can actually express

A cancelled back-swipe — begin the interactive pop, then abandon it:

```swift
let edge = app.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.5))
let partway = app.coordinate(withNormalizedOffset: CGVector(dx: 0.35, dy: 0.5))
edge.press(forDuration: 0.2, thenDragTo: partway,
           withVelocity: .slow, thenHoldForDuration: 1.0)
```

UIKit decides an interactive pop on distance *and* release velocity, so the
hold is load-bearing: it drains the velocity, and a fast flick from the same
place completes the pop instead of cancelling it.

**Assert the precondition before the action.** Read a search field's text back
after typing it, confirm a row exists before tapping it. Otherwise a test that
silently did nothing is indistinguishable from one that worked.

## Notes

- **Do not commit while a build is running.** The pre-commit hook stashes
  unstaged files to test only what is staged, which reverts your working tree
  mid-compile and can bake the wrong sources into the bundle. Finish the build,
  or commit first.
- Simulator and device builds share `ios/build/build.db`. Running both at once
  gets `database is locked`, which reads like a real build failure. See
  `build-to-device`.
- `ios/build` is derived data for this checkout alone, so an existing one is
  safe to build on top of — step 1 is worth running anyway, since it is
  incremental and settles whether the bundle matches your sources.
- Network-backed screens really do hit the network here. Assert on things the
  screen decides — a field's contents, which empty state appeared — rather than
  on particular records, unless the test is about the data.
- CI sharding lives in `scripts/split-uitests.py`; `-only-testing` takes
  `Bundle/Class/method` and can be repeated.
