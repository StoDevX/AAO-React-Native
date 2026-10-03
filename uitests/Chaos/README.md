# Chaos Engine

The chaos engine drives the real app at random on a simulator while it breaks
the app's network requests, and stops at the first sign of a bug. It exists to
find the crashes and dead ends that no one thought to write a test for.

## Quick Start

Boot a simulator and start Metro for this checkout, then:

```bash
TEST_RUNNER_AAO_JS_LOCATION=localhost:8081 mise run chaos
```

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

A run refuses to record into a `logs/chaos/<seed>/` that already exists, so
re-running a seed never deletes the evidence of the last one; pass
`--overwrite` to replace it. A replay's `<seed>-replay/` is replaced freely.

**The `TEST_RUNNER_` prefix is required.** `xcodebuild` passes the test only
variables with that prefix, and strips it on the way in, so a bare
`AAO_JS_LOCATION` never arrives. With no Metro named and no bundle embedded in
the built app, the run stops before building and says so. Name a simulator
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
2. **`attachments/`** holds the evidence:
   - the `chaos stop screen` screenshot, taken as the monkey stopped and named
     for its orientation. XCTest's own failure screenshot is taken after the
     device turns back to portrait, so trust this one;
   - the `chaos trapped screen` screenshot, when the monkey found a screen with
     nothing to press;
   - `chaos-steps.jsonl`, every action with its target and orientation;
   - `chaos-warnings.txt`, things worth a look that didn't stop the run.
3. **`chaos-findings.jsonl`** is what the app's probe saw: fatal errors,
   unhandled rejections, `console.error` calls, and attempts to leave the app.
4. **`chaos-tape-<launch>.jsonl`** is every response the app received, faults
   included: one file per launch, since opening a route relaunches the app.

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
- `system alert`: a permission prompt appeared and the monkey dismissed it.

## Replaying a Run

```bash
TEST_RUNNER_AAO_JS_LOCATION=localhost:8081 mise run chaos -- --replay logs/chaos/1234
```

A replay takes the seed from the directory's name and answers every request
from the recorded tapes, so the app sees the same data and the same faults.
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

Replay is best-effort. Timing, and anything that doesn't go through JS `fetch`
(images, WebViews, map tiles), can still differ.

## What It Can't Do

- **Logged-in screens** are only ever seen logged out. The run never signs in
  to OleCard, and never reaches PaperCut.
- **Native loads** (images, WebViews, map tiles) are never faulted.
- **Sheets in landscape** fill the screen on iPhone and ignore a drag down, so
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
  error from the monkey; the chaos error boundary shows it instead.

## How It Works

Two halves talk through one hidden view.

**In the app** (`source/chaos/`), active only under `--chaos`:

| File | Job |
| --- | --- |
| `install.ts` | Wires everything up at launch; imported first in `app/_layout.tsx` |
| `fetch.ts` | Wraps `fetch`: breaks some requests, and records or replays each answer |
| `faults.ts` | Picks a fault per request: latency, a 404 or 500, a network failure, or an empty, malformed or truncated body |
| `tape.ts` | Names each launch's tape, and keys responses by launch, method and URL |
| `probe.ts` | Catches fatal errors, unhandled rejections and `console.error` |
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
| Add awkward text to type | `chaosStrings` in `ChaosAction.swift` |
| Add a fault | `Fault` and `pickFault` in `source/chaos/faults.ts` |

Run `mise run chaos-routes` after adding a route; a test fails until you do.
Keep every action's random draws fixed whatever is on screen, or a seed stops
repeating. Each action draws its values before it touches the UI.

## Canaries

Chaos runs happen on your own machine; nothing runs them in CI. The
`ChaosCanaryTests` do run in the ordinary UI test shards on every pull
request. They plant a crash and a missing probe and check that the oracles
notice, so a change can't quietly blind the engine.
