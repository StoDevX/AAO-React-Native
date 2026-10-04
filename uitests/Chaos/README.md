# Chaos Engine

The chaos engine drives the real app at random on a simulator while it breaks
the app's network requests, and stops at the first sign of a bug. It exists to
find the crashes and dead ends that no one thought to write a test for.

## Quick Start

Boot a simulator and start Metro for this checkout, then:

```bash
mise run chaos:8081
```

For a Metro on another port, name it:
`TEST_RUNNER_AAO_JS_LOCATION=localhost:8091 mise run chaos`.

That runs a random seed for ten minutes and writes everything it saw to
`logs/chaos/<seed>/`. Useful flags:

| Flag | Effect |
| --- | --- |
| `--seed <n>` | Run a particular seed; the same seed takes the same actions |
| `--duration 90s` / `10m` / `1h` | How long to run (default `10m`) |
| `--steps <n>` | Stop after this many actions |
| `--fault-rate <0–1>` | Share of requests to break (default `0.25`) |
| `--replay logs/chaos/<seed>` | Replay a run against its recorded responses |
| `--prebuilt` | Skip the build when nothing native changed |
| `--overwrite` | Record over an earlier run of the same seed |
| `--rotate` | Let the monkey turn the device; without it, a rotate step does nothing |

A run refuses to record into a `logs/chaos/<seed>/` that already exists, so
re-running a seed never deletes the evidence of the last one; pass
`--overwrite` to replace it. A replay's `<seed>-replay/` is replaced freely.

**The `TEST_RUNNER_` prefix is required.** `xcodebuild` passes the test only
variables with that prefix, and strips it on the way in, so a bare
`AAO_JS_LOCATION` never arrives. With no Metro named and no bundle embedded in
the built app, the run stops before building and says so. It stops too when
the Metro it names serves another checkout, as 8081 may. Name a simulator
with `SIMULATOR_UDID` when more than one is booted.

The exit code says what happened:

| Code | Meaning |
| --- | --- |
| 0 | It ran and found nothing |
| 1 | It found something |
| 2 | It never started, or its result couldn't be read |

## Reading a Finding

A run that exits 1 found something. In `logs/chaos/<seed>/`:

1. **`outcome.json`** names the stop reason. `native crash`, `hang`,
   `error screen` and `js: <kind>: <message>` come from the monkey; a
   stopping line in the findings file can fail the run on its own.
2. **`attachments/`** holds the evidence, each file named for what it is:
   - the `chaos stop screen` screenshot, taken as the monkey stopped and named
     for its orientation. XCTest's own failure screenshot is taken after the
     device turns back to portrait, so trust this one;
   - the `chaos trapped screen` screenshot, when the monkey found a screen with
     nothing to press;
   - `chaos-steps.jsonl`, every action with its target, the target's type and
     frame, and orientation;
   - `chaos-warnings.txt`, things worth a look that didn't stop the run.
3. **`chaos-findings.jsonl`** is what the app's probe saw: fatal errors,
   unhandled rejections, `console.error` calls, attempts to leave the app,
   mutations, and stalls, where the JS thread was busy for more than a second.
4. **`chaos-tape-<launch>.jsonl`** is every response the app received, faults
   included: one file per launch, since opening a route relaunches the app.
5. **Mutations.** A `mutation` finding names the request, the JSON path and
   the change, e.g. `3 GET https://…/menu #0 $.items[2].label: "Lunch" → ""`.
   When a run stops, the summary lists the mutations from the launch that
   stopped. A mutation keeps the body's shape, so a stop after one is data a
   server could send; judge whether it would.

Then decide whose bug it is:

- **The app's:** a crash, a fatal error, an error screen, an unhandled
  rejection, or a screen a person can't leave. Fix it like any other bug, and
  replay the seed to confirm.
- **The monkey's:** a stop that a person using the app wouldn't hit, such as a
  hang on a screen that was still loading. Fix the monkey in this folder.
- **The simulator's:** something only an unsigned simulator build does. Chaos
  builds have no keychain entitlement, for one, so keychain calls fail.

### Warnings

`chaos-warnings.txt` lists things that didn't stop the run:

- `dead end`: Back changed nothing three times in a row.
- `no escape hatch`: the monkey found a screen with nothing to press and had
  to rotate, drag or swipe its way out. A person may be stuck there.
- `escaped the app`: something sent the app to the background.
- `system alert`: a SpringBoard alert, such as a permission prompt or the
  icon-change notice, appeared and the monkey dismissed it. The monkey taps
  through SpringBoard, so an alert that keeps the app from going quiet never
  holds a tap up.
- `unlabelled`: a button, link, switch, tab, segmented control or slider
  that VoiceOver has no name for. Cells and layout read their children, so
  they are not checked.
- `small target`: something to press narrower or shorter than 44pt, other
  than the system's own: bar items, the Back button, the sheet grabber and
  switches. XCUITest
  sees the frame, not a `hitSlop`, so a control that is bigger to the touch
  is a false alarm: give it a 44pt frame, or add its identifier to
  `TestIdentifiers.Chaos.smallTargetAllowList` with a comment saying why.

### The Summary

Under its outcome, a run prints everything it saw that did not stop it,
counted: the monkey's warnings by kind, console errors and stalls by their
first line, and mutations and attempts to leave the app as totals. The full
summary is in `outcome.json`. When a run stops, the mutations fed to the
launch that stopped are listed first.

`scripts/chaos-ignore.json` hides a warning or finding the team has decided
is not worth a look. It starts empty. Each entry names a `kind`, a `match`
the text must contain, and `why`; a run refuses an entry without a reason.
What it hides is still counted as `ignored`.

## Replaying a Run

```bash
mise run chaos:8081 -- --replay logs/chaos/1234
```

A replay takes the seed from the directory's name and answers every request
from the recorded tapes, so the app sees the same data and the same faults,
except a binary response, which it fetches live.
Each launch reads only its own tape. The runner installs the built app first,
so a simulator that has never run the app can replay too. It writes to
`logs/chaos/1234-replay/` and never touches the original. A recording from
before per-launch tapes, with a single `chaos-tape.jsonl`, can't be replayed;
record the seed again. A replay reports one of:

- `reproduced`: it stopped for the recorded reason.
- `not reproduced`: it took every recorded step without stopping, or stopped
  for another reason.
- `not reached`: its budget ran out first.
- `diverged at step K`: it did something the recording did not.

A run recorded before tap weighting and the developer routes' removal no
longer replays step for step; record the seed again.

Replay is best-effort. Timing, and anything that doesn't go through JS `fetch`
(images, WebViews, map tiles), can still differ.

## What It Can't Do

- **Logged-in screens** are only ever seen logged out. The run never signs in
  to OleCard, and never reaches PaperCut.
- **Native loads** (images, WebViews, map tiles) are never faulted.
- **Binary responses**, such as the course catalog, are never damaged and
  never taped. They can still fail, stall, or return a 404 or 500, but a
  replay fetches them live. The tape holds text, and React Native cannot
  rebuild a body with a NUL in it from a string: reading it back as bytes
  crashes the app.
- **Sheets in landscape**, with `--rotate`, fill the screen on iPhone and ignore a drag down, so
  the monkey can only leave one by rotating.
- **A fatal under a modal** can hide from the beacon until the modal closes.
  The findings file still catches it at the end of the run, but the stop
  screenshot may not show it.

## Safety

A chaos launch passes `--chaos`, not `--uitesting`, so features fetch live.
Under it, the app:

- never opens a URL, dials a number, composes an email, adds a calendar
  event, or opens the share sheet: each is recorded as an `out-of-app`
  finding instead;
- never reaches the OleCard sign-in or PaperCut;
- sends nothing to Sentry;
- has no LogBox, whose red screen would cover the app and hide a render
  error from the monkey; the chaos error boundary shows it instead. A
  screen's render error is caught sooner, by the boundary each screen of
  the root stack has. It reports the error as a `fatal` finding, and draws
  its fallback with the chaos boundary's ID, so the run stops even in a
  form sheet or modal that hides the beacon.

## How It Works

Two halves talk through one hidden view.

**In the app** (`source/chaos/`), active only under `--chaos`:

| File | Job |
| --- | --- |
| `install.ts` | Wires everything up at launch; imported first in `app/_layout.tsx` |
| `fetch.ts` | Wraps `fetch`: breaks some requests, and records or replays each answer |
| `faults.ts` | Picks a fault per request: half the time a mutation, else latency, a 404 or 500, a network failure, or an empty, malformed or truncated body |
| `mutate.ts` | Changes one value in a JSON body to another of the same type: an array emptied, cut to one or lengthened, a string made empty, long or unusual, a number made 0, negative or huge, a boolean flipped |
| `tape.ts` | Names each launch's tape, and keys responses by launch, method and URL |
| `probe.ts` | Catches fatal errors, unhandled rejections and `console.error` |
| `stall.ts` | Records a `stall` when a 250ms timer fires more than a second late, ignoring the launch and a return from the background |
| `findings.ts` | Writes findings to `chaos-findings.jsonl` and feeds the beacon |
| `guard.tsx` | An error boundary around the app, and the beacon: a 1×1 view labelled with the first stopping finding |
| `blocked.ts` | URLs a run must never reach |
| `linking-guard.ts` | Stops every `Linking.openURL` call |
| `share-guard.ts` | Stops every `Share.share` call |

The beacon is drawn at opacity 0.02, not 0, because iOS drops a fully
transparent view from the accessibility tree XCUITest reads.

**On the test side** (this folder):

| File | Job |
| --- | --- |
| `ChaosMonkey.swift` | The run loop: pick an action, perform it, check the oracles, log the step |
| `ChaosOracle.swift` | Reads the screen in one snapshot and decides whether to stop |
| `ChaosAction.swift` | The actions and how often each is picked |
| `ChaosRandom.swift` | The seeded random generator |
| `ChaosWeighting.swift` | The weighted pick that favours targets and routes used least |
| `ChaosRoutes.swift` | Every route in `app/`, generated |
| `ChaosTests.swift` | `testChaos`, and the canaries that prove the oracles can see |

**The runner** (`scripts/chaos.mjs`, with its logic in `scripts/chaos-run.mjs`)
builds, runs the test, collects the files, and decides the exit code.

## Extending It

| To… | Change |
| --- | --- |
| Keep a run away from another URL | `isBlockedUrl` in `source/chaos/blocked.ts` |
| Stop another way out of the app | Guard it with `isChaos` and `reportOutOfApp`, as `openUrl` does |
| Recognise another error screen | `TestIdentifiers.Chaos.errorScreenIdentifiers`, or `errorScreenLabels` when it has no identifier |
| Change how often an action happens | `weight` in `ChaosAction.swift`; the weights sum to 100 |
| Change how the monkey picks among targets or routes | `pickWeighted` in `ChaosWeighting.swift`: each is weighted by 1 / (1 + times used) |
| Add awkward text to type | `chaosStrings` in `ChaosAction.swift` |
| Open a route the monkey skips | `SKIPPED` or `SKIPPED_PREFIXES` in `scripts/chaos-routes.mjs` |
| Add a fault | `Fault` and `pickFault` in `source/chaos/faults.ts` |

Run `mise run chaos-routes` after adding a route; a test fails until you do.
Keep every action's random draws fixed whatever is on screen, or a seed stops
repeating. Each action draws its values before it touches the UI.

## Canaries

Chaos runs happen on your own machine; nothing runs them in CI. The
`ChaosCanaryTests` do run in the ordinary UI test shards, in the merge
queue and on master; pull requests leave them out to save shard time. They
plant a crash, a missing probe and a small unlabelled button, and check
that the oracles notice, so a change can't quietly blind the engine.
