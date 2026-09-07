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
#    Pin -destination: see "Pin the destination" below.
SKIP_BUNDLING=true CODE_SIGNING_DISABLED=true xcodebuild build-for-testing \
  -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf \
  -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build \
  -destination "id=$UDID" \
  -only-testing:AllAboutOlafUITests \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# 2. Boot a simulator and wait for it.
xcrun simctl list devices available | grep iPhone   # pick a UDID
xcrun simctl boot $UDID; xcrun simctl bootstatus $UDID -b

# 3. Serve the JavaScript on 8081. The port is NOT negotiable here — see
#    "Metro's port is baked in" below. In a lone worktree, this is enough.
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

## Metro's port is baked in — embed the bundle instead

**A UITest build always fetches JS from `localhost:8081`, and you cannot talk it
out of that at run time.** `RCT_METRO_PORT` is a *compile-time* macro defaulting
to 8081 (`node_modules/react-native/React/Base/RCTDefines.h:112`), and
`ios/Podfile.properties.json` sets `EXPO_USE_PRECOMPILED_MODULES`, so
`RCTBundleURLProvider` arrives precompiled — passing the macro to `xcodebuild`
recompiles nothing. `UITestCase.setUp` also launches with `--reset-state`, and
`AppDelegate` answers that by wiping the persistent defaults domain, taking any
`RCT_jsLocation` override with it.

So with parallel worktrees, the run-on-simulator advice to take your own port
does **not** carry over: your tests will silently load whichever checkout owns
8081. The build succeeds, the tests run, the screenshots look plausible, and
none of it is your code.

The fix is to stop using Metro. `AppDelegate.bundleURL()` prefers an embedded
bundle even in DEBUG, precisely so UITest runs can pin their JS:

```swift
#if DEBUG
  if let bundled = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
    return bundled
  }
  return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
```

Between step 1 and step 4, put this worktree's JS inside the `.app`:

```bash
mise run bundle:ios     # writes ios/AllAboutOlaf/main.jsbundle from THIS checkout

APP=ios/build/Build/Products/Debug-iphonesimulator/AllAboutOlaf.app
cp ios/AllAboutOlaf/main.jsbundle "$APP/"
rm -rf "$APP/assets" && cp -R ios/assets "$APP/"
ls "$APP/main.jsbundle"   # confirm before trusting any run
```

(`mise run embed-jsbundle:ios` does this for `Debug-iphoneos`; the simulator
needs the `Debug-iphonesimulator` path above.) Then skip step 3 entirely — no
Metro, no port, and the JS provably came from this checkout. It is also what CI
does, so a local pass and a CI pass mean the same thing.

Two consequences:

- `bundle:ios` runs `expo export:embed --dev false`, so it is a production-mode
  bundle: no dev menu, no fast refresh, redboxes become plain crashes.
- **JS edits stop hot-reloading.** The red-green loop below still works, but each
  iteration needs a re-bundle and re-copy, not just a re-run. Nothing is talking
  to Metro any more, so a Metro reload changes nothing.

Symptom that you skipped this: the UI hierarchy in the `.xcresult` shows a
screen you do not recognise — an older layout, or elements your identifiers do
not match. Dump the hierarchy before assuming your selectors are wrong.

## Pin the destination

Both xcodebuild steps take `-destination "id=$UDID"`, and step 1 needs it as
much as step 4. Without one, xcodebuild picks for you and says so:

```
xcodebuild: WARNING: Using the first of multiple matching destinations
```

With several simulators booted — likely, since parallel worktrees each make
their own — "the first" is a coin toss, and you can build for one device and
run on another. Take the UDID once and use it everywhere. `run-on-simulator`
covers making a branch-specific device.

## Watching a build from a script

If you background a build and poll its log, match **every** terminal state:

```bash
until grep -qE '\*\* (TEST )?BUILD (SUCCEEDED|FAILED|INTERRUPTED) \*\*|^error: ' log; do
  sleep 20
done
```

`** BUILD INTERRUPTED **` is the one people forget. A build killed part-way —
by a session limit, a competing build, a signal — prints it and stops writing,
so a watcher that greps only for SUCCEEDED/FAILED waits on a dead log forever.
It also hides the real error: an interrupted run may never reach the line that
says why it was doomed.

Three things that bite on the second run:

- **`-resultBundlePath` refuses to overwrite.** You get `xcodebuild: error:
  Existing file at -resultBundlePath "/tmp/results"` and no test run at all.
  `rm -rf` it first, as above.
- **It appends `.xcresult` for you.** `-resultBundlePath /tmp/results` writes
  `/tmp/results.xcresult`, which is the path every later command wants.
- **The version in the bundle's name is the SDK, not a runtime.**
  `AllAboutOlaf_iphonesimulator27.0-arm64-x86_64.xctestrun` is built by the
  Xcode 27 SDK and runs on any installed runtime that SDK supports — iOS 26.5
  at the time of writing. Do not go hunting for a matching runtime; there is
  no iOS 27. `xcrun simctl list runtimes` shows what you have.
- **`find` picks an arbitrary bundle if there is more than one.** There is
  normally one, but pass the path explicitly if `find` returns several.

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

**Adding *or deleting* a `.swift` file needs `mise run prebuild` before it will
build.** `plugins/with-xcuitest-target.ts` walks `uitests/` at prebuild time and
writes one `PBXFileReference` per file, so the Xcode project lists them
individually. Editing an existing file needs no prebuild.

The two directions fail differently, and the deletion is the nastier one:

- **Added and not prebuilt:** the file is invisible to the build. Your new test
  simply does not run, and nothing warns you.
- **Deleted and not prebuilt:** the reference outlives the file and the build
  dies on something you never wrote:

  ```
  error: Build input file cannot be found: '.../uitests/ScratchProbeTests.swift'
  ** TEST BUILD FAILED **
  ```

  This reads like a missing dependency and sends you looking for a file you
  deliberately removed. `ios/` is generated and gitignored, so `mise run
  prebuild` is the whole fix. Grep the project if you want to confirm before
  rebuilding: `grep -c ScratchProbe ios/AllAboutOlaf.xcodeproj/project.pbxproj`.

Throwaway probe tests earn this twice over — the temptation is to delete the
file and move on, which is exactly the case that breaks the next build.

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
- **A failure message that exists in no source file means stale derived data.**
  If an assertion string cannot be found by grepping `uitests/` or the built
  test binary, stop trusting the run: `rm -rf ios/build` and rebuild. Seen once
  after a build was killed part-way through.
- **Network-backed screens really do hit the live server here — nothing is
  stubbed.** Assert on what the screen decides, not on records it was handed: a
  field's contents, which empty state appeared, whether a list got shorter.
  Naming a row that St. Olaf can rename writes a test that fails on someone
  else's schedule. When a test genuinely needs to name one, say so in a comment
  next to the constant, so whoever it breaks for knows why.
- CI sharding lives in `scripts/split-uitests.py`; `-only-testing` takes
  `Bundle/Class/method` and can be repeated.
