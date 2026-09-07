---
name: run-on-simulator
description: Use when you need to look at the app itself on a simulator - checking a change by eye, screenshotting a screen, or reproducing something by hand, rather than running the XCUITests or building to a phone
---

# Run the App on a Simulator

For seeing a change with your own eyes. To *assert* something about a screen,
write an XCUITest instead — see `run-uitests`. For a physical iPhone, see
`build-to-device`.

## You can look, but you cannot touch

`simctl` reads the framebuffer and it launches apps. **It has no tap, no swipe
and no typing.** There is no `simctl tap`, and unless `idb` is installed there
is nothing else to reach for either.

So this skill gets you to whatever screen the app opens on, and no further. Any
check that needs a row tapped, a field typed into, or a sheet dragged is an
XCUITest — `run-uitests`. XCUITest drives the UI through the test harness
rather than the GUI, so its taps work where `simctl` has nothing to offer.

Deep-linking your way past a tap does not work either. `simctl openurl` with an
app scheme raises an **"Open in 'All About Olaf'?"** confirmation sheet, and
dismissing that needs the tap you were trying to avoid. The launch URL in step 4
below is the exception that survives, because it is what the dev client itself
registers.

Decide this before you build, not after: if the screen you care about is more
than one launch away, skip straight to `run-uitests`.

## Whose Metro are you talking to?

Agents work in `.claude/worktrees/`, and every worktree is a whole checkout of
this repo. Several can be live at once, each with its own Metro. **The
simulator does not know or care which checkout served its bundle**, so a
screenshot of the wrong one looks exactly like a screenshot of yours.

Never assume port 8081. Take a free port, and prove the server on it is yours:

```bash
PORT=8097   # anything free; 8081 is just the default, not your reservation
npx expo start --port "$PORT" > /tmp/metro-$PORT.log 2>&1 &

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -1)
lsof -a -p "$pid" -d cwd -Fn | grep '^n'      # must print YOUR worktree path
```

### Surveying what is already running

Before taking a port, see who holds what. Metro reports nothing about its
checkout, so go port → pid → working directory:

```bash
for port in $(lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null |
              awk '$1 ~ /node/ {print $9}' | sed 's/.*://' | sort -un); do
  pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -1)
  [ -n "$pid" ] || continue
  root=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-)
  case "$root" in */aao-react-native*) echo "$port  $root";; esac
done
```

```
8081  .../worktrees/bridge-cse_01RdHW3MttwTt1zeg1qDuF7P
8090  .../worktrees/bridge-cse_01Dxj64qXvkXvaaF73QskPYZ
8097  .../worktrees/bridge-cse_017UtKLo1TKiCxZE5t8uWLL4
```

A line whose path is not your worktree is someone else's server. Leave it
alone.

**Go port-first, not process-first.** Asking `lsof -p <metro-pid>` which ports
it holds gives a wrong answer: node inherits descriptors, so every Metro on the
machine reports every other Metro's port — and a pile of unrelated system
listeners besides. Only the port → pid direction attributes correctly.

### Picking a port that will not collide

Derive it from the worktree so two agents cannot land on the same number by
chance, and so the number is the same every time you come back to this branch:

```bash
PORT=$(( 8100 + $(basename "$(git rev-parse --show-toplevel)" | cksum |
                  cut -d' ' -f1) % 400 ))
until ! lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
```

Deliberately above 8081 and 8090, which are where the default and the
first-collision retry land.

### The build has to agree with the port

A Debug build resolves Metro at launch, so the port has to reach it — starting
a server is only half the job:

| How you launch | How the port gets in |
| --- | --- |
| `npx expo run:ios --port $PORT` | baked in at build time; the log then reads `Waiting on http://localhost:$PORT` |
| `simctl openurl …expo-development-client/?url=…` | carried in the URL, percent-encoded (step 4 below) |
| XCUITest (`run-uitests`) | the app resolves it the same way; the port must be serving before the run |

If the app comes up on a red `No script URL provided` screen, or shows a screen
that does not match your edits, suspect the port before you suspect your code.

### Shutting down without collateral damage

**Never `pkill -f "expo start"` or `killall node`.** That kills every agent's
server, including ones mid-build. Kill the one you own, by port:

```bash
kill "$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t)"
```

Same discipline for simulators: `xcrun simctl shutdown <your UDID>`, never
`shutdown all`.

Give the device the same treatment — `xcrun simctl list devices booted` may
show three, none of them yours. Make one named for the branch and pin every
command to its UDID:

```bash
UDID=$(xcrun simctl create "aao-<branch>" \
  com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro \
  com.apple.CoreSimulator.SimRuntime.iOS-26-5)
```

This is not hypothetical tidiness. A branch once spent an hour reading
screenshots of another worktree's build, concluded its own rewrite was working,
and reported a rendering verdict that was about someone else's code entirely.
The screenshots were real; the attribution was not.

## The whole thing, headless

```bash
# 1. Build and install. Slow the first time (30+ min), incremental after.
mise run ios          # expect it to fail at the last step; see below

# 2. Boot a simulator.
xcrun simctl list devices available | grep iPhone
xcrun simctl boot <UDID>; xcrun simctl bootstatus <UDID> -b

# 3. Serve the JavaScript, and wait until it answers. Check the port is yours
#    first — see "Whose Metro are you talking to?" above.
npx expo start --port $PORT > /tmp/metro-$PORT.log 2>&1 &
until curl -sf http://localhost:$PORT/status | grep -q running; do sleep 1; done

# 4. Launch it pointed at Metro, and look.
xcrun simctl openurl $UDID \
  "NFMTHAZVS9.com.drewvolz.stolaf://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$PORT"
xcrun simctl io $UDID screenshot /tmp/shot.png    # then Read the png
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
