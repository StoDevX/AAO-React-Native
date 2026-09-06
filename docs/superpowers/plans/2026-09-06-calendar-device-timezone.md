# Calendar Device Time Zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The calendar reads its clock and its events in the device's time zone, and an all-day event lands on the day it actually covers.

**Architecture:** Two changes. All-day events are re-anchored from UTC midnight to local midnight at one boundary, `convertEvents` in `modules/ccc-calendar/query.ts`, so every consumer downstream needs no special case. Separately, `now` stops being pinned to `America/Chicago` on the two calendar screens that build it. The UI tests then read days in the simulator's zone rather than campus's.

**Tech Stack:** TypeScript, React Native 0.86.2, moment / moment-timezone, Jest + React Native Testing Library, XCUITest (Swift).

## Global Constraints

- The invariant, from the spec: **every moment in the calendar lives in the device's zone, and an all-day event's `startTime` is local midnight on the day the event covers.**
- Only the calendar changes. `timezone()` and `setTimezone` stay, and building hours, bus, menus, streaming and stoprint keep reading campus time. Do not touch them.
- `modules/ccc-calendar/device-calendar.ts` is **not** modified. EventKit already emits local midnight; running it through the re-anchoring would be a no-op today and a silent double-shift if EventKit ever changed.
- No zone-override seam is added to the app. If a UI test cannot shift the zone, the coverage moves to Jest and that fact gets written down — see Task 4.
- Run `mise run agent:pre-commit` before every commit. It must pass; do not commit if it does not.
- Commit messages: imperative, capitalised, no conventional-commit prefix, no trailing full stop.
- Every new test must be seen failing, against the code without its fix, before it is trusted.

## Background an implementer needs

`moment` and `moment-timezone` resolve to the **same instance** in this repo, verified. So `moment.tz.setDefault('Asia/Tokyo')` changes what a bare `moment(iso)` in production code resolves to, and `moment.tz.setDefault()` with no argument restores the real device zone. That is how the Jest zone matrix works. Setting `process.env.TZ` in a test body would not work — the zone is read before the body runs.

Both web sources anchor an all-day event at UTC midnight:
- `modules/ccc-calendar/parsers/ical.ts:78` — `new Date(Date.UTC(time.year, time.month - 1, time.day))`
- `modules/ccc-calendar/parsers/tec-events.ts:42` — TEC's `utc_start_date`, `00:00:00` when `all_day` is true

All three web parsers funnel through `convertEvents`, which is the single change point.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `modules/ccc-calendar/query.ts` | Re-anchor all-day events at the wire→`EventType` boundary | 1 |
| `modules/ccc-calendar/__tests__/query-select.test.ts` | Unit + integration coverage for that boundary | 1 |
| `app/(home)/Calendar.tsx` | Build `now` without forcing a zone | 2 |
| `modules/ccc-calendar/schedule-view.tsx` | Same | 2 |
| `modules/event-list/day-picker-strip.tsx` | Comment only — the campus/device split it describes is gone | 2 |
| `uitests/TestIdentifiers.swift` | Name days in the device's zone; drop the now-dead `campusTimeZone` | 3 |
| `uitests/Screens/CalendarScreen.swift` | Measure the strip's week in the device's zone | 3 |
| `uitests/ModuleCalendarTests.swift` | Zone-shift coverage | 4 |
| `uitests/UITestCase.swift` | Allow a test to launch the app under a chosen zone | 4 |

---

### Task 1: All-day events re-anchor to local midnight

An all-day event is a calendar date, not an instant. Read back device-local, a UTC-midnight anchor lands a day early anywhere west of UTC — including on campus. This is the visible bug.

**Files:**
- Modify: `modules/ccc-calendar/query.ts:1-35`
- Test: `modules/ccc-calendar/__tests__/query-select.test.ts`

**Interfaces:**
- Consumes: `WireEvent` (`modules/ccc-calendar/parsers/events.ts`), `EventType` (`modules/event-type`), the existing `selectNamed(calendar)` and `makeWireEvent(overrides)` helpers already in `query-select.test.ts`.
- Produces: no new exports. `convertEvents` stays module-private; its behaviour is reached through `namedCalendarOptions(...).select`.

- [ ] **Step 1: Switch the test file's moment import so `moment.tz` is typed**

In `modules/ccc-calendar/__tests__/query-select.test.ts`, change the existing import:

```ts
import moment from 'moment-timezone'
```

It was `from 'moment'`. Same instance at runtime; this only makes `moment.tz` visible to TypeScript. Every existing use of `moment(...)` in the file keeps working unchanged.

- [ ] **Step 2: Write the failing tests**

Append to `modules/ccc-calendar/__tests__/query-select.test.ts`:

```ts
/**
 * An all-day event is a calendar date, not an instant, and both web sources
 * anchor one at UTC midnight. Read back in the device's zone that lands a day
 * early west of UTC and at the wrong time east of it, so the boundary
 * re-anchors it to local midnight on its own date.
 */
describe('all-day events', () => {
	afterEach(() => {
		moment.tz.setDefault()
	})

	function allDayEvent() {
		return makeWireEvent({
			startTime: '2030-01-15T00:00:00.000Z',
			endTime: '2030-01-16T00:00:00.000Z',
			isAllDay: true,
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})
	}

	test('sits at local midnight on its own date, west of UTC', () => {
		moment.tz.setDefault('America/Chicago')

		let [selected] = selectNamed('stolaf')([allDayEvent()])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	test('sits at local midnight on its own date, east of UTC', () => {
		moment.tz.setDefault('Asia/Tokyo')

		let [selected] = selectNamed('stolaf')([allDayEvent()])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	test('a timed event keeps the instant it names', () => {
		moment.tz.setDefault('Asia/Tokyo')
		let event = makeWireEvent({
			startTime: '2030-01-15T18:00:00.000Z',
			endTime: '2030-01-15T20:00:00.000Z',
		})

		let [selected] = selectNamed('stolaf')([event])

		expect(selected?.event.startTime.toISOString()).toBe('2030-01-15T18:00:00.000Z')
	})
})
```

The dates are in 2030 deliberately: `namedCalendarOptions`' `select` drops events whose `endTime` is already past, against the real clock.

- [ ] **Step 3: Write the failing integration test**

An all-day event has to reach the list under its own section header, which is the thing a user sees. Add to the same file, above the `describe('all-day events')` block:

```ts
import {groupEvents} from '@frogpond/event-list/sections'
```

and inside `describe('all-day events')`:

```ts
	test('reaches the list under its own day, not the day before', () => {
		moment.tz.setDefault('America/Chicago')
		let selected = selectNamed('stolaf')([allDayEvent()])

		let sections = groupEvents(selected, moment('2030-01-10T12:00:00Z'))

		expect(sections.map((section) => section.key)).toEqual(['2030-01-15'])
	})
```

- [ ] **Step 4: Run the tests and watch them fail**

Run: `npx jest modules/ccc-calendar/__tests__/query-select.test.ts --reporters=default`

Expected: the three zone tests and the integration test fail. On a Central device the section key comes back `'2030-01-14'` and the start time `'2030-01-14 18:00'`; under Tokyo the start time comes back `'2030-01-15 09:00'`. The timed-event test passes already — it is a guard against over-reaching, not a red test.

Read the failure messages. If the dates named above are not what you see, stop and work out why before writing any implementation.

- [ ] **Step 5: Implement the re-anchoring**

In `modules/ccc-calendar/query.ts`, add the type import to the existing moment import line:

```ts
import moment, {type Moment} from 'moment'
```

Add this function directly above `convertEvents`:

```ts
/**
 * An all-day event names a calendar date, not an instant, and both web sources
 * anchor one at UTC midnight. Everything downstream -- the section keys, the
 * day-picker strip, every `Intl` format -- reads a moment in the device's zone,
 * so a UTC-midnight anchor lands on the day before anywhere west of UTC. This
 * reads the date back out in UTC and rebuilds it as local midnight, which is
 * where a day sits for every other part of the calendar.
 */
function localMidnightOf(instant: string): Moment {
	return moment(moment.utc(instant).format('YYYY-MM-DD'), 'YYYY-MM-DD')
}
```

Then change `convertEvents` (currently at line 23) so its two moment constructions read:

```ts
function convertEvents(data: WireEvent[], options: {eventMapper?: EventMapper}): EventType[] {
	let events: EventType[] = data.map((event) => ({
		...event,
		startTime: event.isAllDay ? localMidnightOf(event.startTime) : moment(event.startTime),
		endTime: event.isAllDay ? localMidnightOf(event.endTime) : moment(event.endTime),
	}))

	if (options.eventMapper) {
		events = events.map(options.eventMapper)
	}

	return events
}
```

Do not touch `modules/ccc-calendar/device-calendar.ts`.

- [ ] **Step 6: Run the tests and verify they pass**

Run: `npx jest modules/ccc-calendar --reporters=default`
Expected: PASS, including the pre-existing `query-select` tests.

- [ ] **Step 7: Run the whole suite**

Run: `mise run agent:pre-commit`
Expected: format, lint, tsc and all Jest suites pass.

- [ ] **Step 8: Commit**

```bash
git add modules/ccc-calendar/query.ts modules/ccc-calendar/__tests__/query-select.test.ts
git commit -m "Put all-day events on the day they cover"
```

---

### Task 2: `now` follows the device

**Files:**
- Modify: `app/(home)/Calendar.tsx:11,20`
- Modify: `modules/ccc-calendar/schedule-view.tsx:3,24`
- Modify: `modules/event-list/day-picker-strip.tsx` — the comment inside `deriveDays`

**Interfaces:**
- Consumes: `useMomentTimer(props: {intervalMs: number; timezone?: string; startOf?: unitOfTime.StartOf})` from `@frogpond/timer`. `timezone` is already optional; omitting it leaves the moment in the device's zone.
- Produces: nothing new.

**On testing this task honestly.** There is no Jest test worth writing here. The change is the deletion of one argument in two route-level components; a test asserting "the component passed a moment without a zone" would be asserting our own input, which `CLAUDE.md` names as the failure mode to avoid. Its behavioural proof is the zone-shift XCUITest in Task 4. Do not invent a mock-heavy component test to fill the gap.

- [ ] **Step 1: Drop the forced zone in the calendar route**

In `app/(home)/Calendar.tsx`, change line 20 from

```ts
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
```

to

```ts
	let {now} = useMomentTimer({intervalMs: 60000})
```

Then delete the now-unused import on line 11:

```ts
import {timezone} from '@frogpond/constants'
```

- [ ] **Step 2: Drop the forced zone in the schedule view**

In `modules/ccc-calendar/schedule-view.tsx`, change line 24 from

```ts
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
```

to

```ts
	let {now} = useMomentTimer({intervalMs: 60000})
```

Then delete the now-unused import on line 3:

```ts
import {timezone} from '@frogpond/constants'
```

Leave `@frogpond/constants` in `modules/ccc-calendar/package.json` — `query.ts` and other files in the package still use it. Run `mise run validate-deps` if unsure.

- [ ] **Step 3: Rewrite the stale comment in `deriveDays`**

In `modules/event-list/day-picker-strip.tsx`, the comment above `let lastDate = lastDay.format('YYYY-MM-DD')` currently reads:

```
	// `now` is campus time while an event's `startTime` is device-local, so the
	// last day is compared as a calendar date rather than as an instant.
	// Comparing the two as instants runs the range a day long or a day short
	// depending on which side of campus the device sits, and whole weeks is the
	// contract the strip's snapping is built on.
```

Replace it with:

```
	// Compared as a calendar date rather than as an instant. `now` and an
	// event's `startTime` are both device-local now, but nothing in this
	// function's signature says so, and comparing two moments in different
	// zones as instants runs the range a day long or a day short. Whole weeks
	// is the contract the strip's snapping is built on.
```

The loop itself does not change. It is what guarantees `days.length` is a multiple of seven.

- [ ] **Step 4: Verify nothing regressed**

Run: `mise run agent:pre-commit`
Expected: format, lint, tsc and all 1123 Jest tests pass. `tsc` is what catches a missed unused import.

- [ ] **Step 5: Commit**

```bash
git add "app/(home)/Calendar.tsx" modules/ccc-calendar/schedule-view.tsx modules/event-list/day-picker-strip.tsx
git commit -m "Read the calendar's clock from the device"
```

---

### Task 3: UI tests name days in the device's zone

With the app following the device, a test that names days in campus time is asserting against a zone the app no longer uses. On a CI runner in UTC that silently changes which day is "today".

**Files:**
- Modify: `uitests/TestIdentifiers.swift:168-192`
- Modify: `uitests/Screens/CalendarScreen.swift:261`

**Interfaces:**
- Consumes: `TestIdentifiers.Calendar.frozenNow: Date`, `TestIdentifiers.Calendar.dayCellPrefix: String`.
- Produces: `TestIdentifiers.Calendar.dayCell(_ date: Date) -> String`, unchanged signature, now formatting in `TimeZone.current`.

- [ ] **Step 1: Format day cells in the device's zone**

In `uitests/TestIdentifiers.swift`, replace the `dayCell` function and its doc comment:

```swift
		/// The identifier of the cell for a given day, formatted in the device's
		/// own zone. The calendar reads its clock and its events from the device,
		/// so a test naming days any other way is asserting against a zone the
		/// app does not use.
		static func dayCell(_ date: Date) -> String {
			let formatter = DateFormatter()
			formatter.calendar = Foundation.Calendar(identifier: .gregorian)
			formatter.locale = Locale(identifier: "en_US_POSIX")
			formatter.timeZone = TimeZone.current
			formatter.dateFormat = "yyyy-MM-dd"
			return dayCellPrefix + formatter.string(from: date)
		}
```

- [ ] **Step 2: Delete `campusTimeZone`**

It has exactly two readers, `dayCell` above and `sundayCell` in the next step, and both stop using it. Delete these lines from `uitests/TestIdentifiers.swift`:

```swift
		/// Campus time. The app anchors every day to it (`setTimezone`
		/// in `source/init/constants.ts`) so a student in another zone still sees
		/// campus dates; a test reasoning about "today" or a week boundary works
		/// in the same zone.
		static let campusTimeZone = TimeZone(identifier: "America/Chicago")!
```

Leave `frozenNow` exactly as it is. It is a fixed instant, and it stays correct in any zone.

Fix the `frozenNow` doc comment, which names the deleted constant. Its last paragraph currently reads "…would agree only while that date sits in daylight time"; change the phrase `a wall time in `campusTimeZone`` to `a wall time in campus's zone` so the comment no longer points at a symbol that is gone.

- [ ] **Step 3: Measure the strip's week in the device's zone**

In `uitests/Screens/CalendarScreen.swift`, inside `sundayCell(weeksOn:)`, change line 261 from

```swift
		calendar.timeZone = TestIdentifiers.Calendar.campusTimeZone
```

to

```swift
		calendar.timeZone = TimeZone.current
```

This one matters: `sundayCell` computes a week boundary and then hands the result to `dayCell`. If the two disagree about the zone, the expected identifier is built from two different days and the assertion fails against a correct strip.

- [ ] **Step 4: Build the test bundle**

```bash
SKIP_BUNDLING=true CODE_SIGNING_DISABLED=true xcodebuild build-for-testing \
  -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf \
  -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build \
  -only-testing:AllAboutOlafUITests \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```

Expected: `** TEST BUILD SUCCEEDED **`. A reference to the deleted `campusTimeZone` is what fails here.

- [ ] **Step 5: Run the calendar UI tests**

Boot a simulator and serve JavaScript first — see `.claude/skills/run-uitests/SKILL.md` for the four commands. Then:

```bash
rm -rf /tmp/results.xcresult /tmp/results
xcodebuild test-without-building \
  -xctestrun $(find ios/build/Build/Products -name '*.xctestrun' -print -quit) \
  -destination "platform=iOS Simulator,id=<UDID>" \
  -only-testing:AllAboutOlafUITests/ModuleCalendarTests \
  -resultBundlePath /tmp/results 2>&1 | grep -E "^Test Case.*(passed|failed)|XCTAssert|Executed .* test"
```

Expected: all 12 `ModuleCalendarTests` pass. On a machine in `America/Chicago` this is unchanged behaviour; the point of the run is that it stays green.

- [ ] **Step 6: Commit**

```bash
git add uitests/TestIdentifiers.swift uitests/Screens/CalendarScreen.swift
git commit -m "Name UI test days in the device's zone"
```

---

### Task 4: Zone-shift coverage

The whole point of the change is that the calendar is correct in a zone other than campus's. Nothing so far proves that on a running app.

**Files:**
- Modify: `uitests/UITestCase.swift`
- Modify: `uitests/ModuleCalendarTests.swift`
- Possibly modify: `modules/ccc-calendar/__tests__/query-select.test.ts` (fallback only)

**Interfaces:**
- Consumes: `UITestCase.app: XCUIApplication`, `CalendarScreen.verifySundayLeadsTheStrip(weeksOn:atEdge:)`, `TestIdentifiers.Calendar.dayCell(_:)`.
- Produces: `UITestCase.relaunch(inTimeZone zone: String)` — terminates and relaunches the app with `TZ` set in its launch environment.

**Why `Asia/Tokyo`.** The frozen clock is `2026-09-05T12:00:00-05:00`, which is `17:00Z`. In Tokyo that instant is `2026-09-06 02:00` — a *different calendar day*, and a Sunday rather than a Saturday. So under Tokyo the strip should lead with `2026-09-06` where under Central it leads with `2026-08-30`. A zone that only shifted the hour would not prove anything.

- [ ] **Step 1: Settle whether `TZ` moves the app's clock — before building anything on it**

Add to `uitests/UITestCase.swift`:

```swift
	/// Relaunch the app with its clock in a chosen zone. The calendar reads its
	/// days from the device, so this is what lets a test check it somewhere
	/// other than wherever this machine happens to be.
	func relaunch(inTimeZone zone: String) {
		app.terminate()
		app.launchArguments = [
			TestIdentifiers.LaunchArguments.uiTesting,
			TestIdentifiers.LaunchArguments.resetState,
		]
		app.launchEnvironment["TZ"] = zone
		app.launch()
	}
```

Add a throwaway probe to `uitests/ModuleCalendarTests.swift`:

```swift
	func testProbeTimeZoneEnvironment() throws {
		let screen = CalendarScreen(app: app)
		relaunch(inTimeZone: "Asia/Tokyo")
		screen.navigate().verifyStripIsPresent()

		let leading = screen.leadingDayCellIdentifier()
		XCTContext.runActivity(named: "Leading cell under Asia/Tokyo: \(leading ?? "none")") { _ in }
		XCTFail("probe only -- read the activity above, then delete this test")
	}
```

`leadingDayCellIdentifier()` does not exist yet. Add it to `CalendarScreen.swift` next to `leadingDayCellEdge()`:

```swift
	/// The identifier of the strip's leading visible cell, for a test that needs
	/// to read which day it is rather than assert one.
	func leadingDayCellIdentifier() -> String? {
		leadingVisibleDayCell()?.cell.identifier
	}
```

Build and run just this test. Read the reported identifier.

- **If it reads `day-cell-2026-09-06`:** `TZ` works. Delete the probe test and continue to Step 2.
- **If it reads `day-cell-2026-08-30`:** Hermes ignores `TZ`. Delete the probe test, `relaunch(inTimeZone:)` and `leadingDayCellIdentifier()`, and go to Step 5 instead. **Do not** add a zone-override launch argument to the app — that rebuilds the forced-zone machinery this change exists to remove, and a test driving it would prove only that the seam works.

- [ ] **Step 2: Write the failing zone-shift test**

Only if Step 1 showed `TZ` works. Add to `uitests/ModuleCalendarTests.swift`:

```swift
	/// The calendar follows the device, so the same frozen instant is a
	/// different day in a different zone. `2026-09-05T12:00:00-05:00` is
	/// Saturday on campus and already Sunday in Tokyo, so the strip's leading
	/// Sunday moves a week -- from 2026-08-30 to 2026-09-06.
	///
	/// This is the one test that proves the app is not still pinned to campus
	/// time. Nothing in Jest can see it: `now` is built inside a route
	/// component, and a test asserting the argument it was passed would be
	/// asserting our own input.
	func testTheStripFollowsTheDeviceTimeZone() throws {
		let screen = CalendarScreen(app: app)
		relaunch(inTimeZone: "Asia/Tokyo")

		screen
			.navigate()
			.verifyStripIsPresent()
			.capture("27-strip-tokyo")

		XCTAssertEqual(
			screen.leadingDayCellIdentifier(),
			TestIdentifiers.Calendar.dayCellPrefix + "2026-09-06",
			"Under Asia/Tokyo the frozen instant is already Sunday, so the strip should lead there")
	}
```

The expected day is written out rather than derived: `dayCell()` reads `TimeZone.current`, which is the *test runner's* zone, not the app's shifted one, so deriving it here would name the wrong day.

- [ ] **Step 3: Run it against the un-fixed app and watch it fail**

The app is served from Metro, so reverting JavaScript needs no rebuild.

```bash
cp "app/(home)/Calendar.tsx" /tmp/Calendar.tsx.good
```

Re-add the forced zone to `app/(home)/Calendar.tsx` — the `timezone` import and `timezone: timezone()` — then run:

```bash
rm -rf /tmp/results.xcresult /tmp/results
xcodebuild test-without-building \
  -xctestrun $(find ios/build/Build/Products -name '*.xctestrun' -print -quit) \
  -destination "platform=iOS Simulator,id=<UDID>" \
  -only-testing:AllAboutOlafUITests/ModuleCalendarTests/testTheStripFollowsTheDeviceTimeZone \
  -resultBundlePath /tmp/results 2>&1 | grep -E "^Test Case|XCTAssert|Executed .* test"
```

Expected: FAIL, reporting `day-cell-2026-08-30` where `day-cell-2026-09-06` was wanted — the app still on campus time.

Restore the fix: `cp /tmp/Calendar.tsx.good "app/(home)/Calendar.tsx"`

- [ ] **Step 4: Run it green, and run the whole calendar suite**

```bash
rm -rf /tmp/results.xcresult /tmp/results
xcodebuild test-without-building \
  -xctestrun $(find ios/build/Build/Products -name '*.xctestrun' -print -quit) \
  -destination "platform=iOS Simulator,id=<UDID>" \
  -only-testing:AllAboutOlafUITests/ModuleCalendarTests \
  -resultBundlePath /tmp/results 2>&1 | grep -E "^Test Case.*(passed|failed)|XCTAssert|Executed .* test"
```

Expected: 13 tests pass. Export the `27-strip-tokyo` screenshot and look at it — the strip should read S M T W T F S starting at 6.

Then go to Step 6.

- [ ] **Step 5: Fallback — Jest zone matrix, and write down what the simulator cannot do**

Only if Step 1 showed `TZ` does not work.

Add to `modules/ccc-calendar/__tests__/query-select.test.ts`, inside `describe('all-day events')`:

```ts
	// The calendar reads `now` from the device too, so a day boundary has to
	// hold when the device is far enough east to be on tomorrow already. This
	// belongs here rather than in an XCUITest because the simulator inherits
	// the host's zone and cannot be moved -- see the design note in
	// docs/superpowers/specs/2026-09-06-calendar-device-timezone-design.md.
	test('an event groups under the device day, not campus day', () => {
		moment.tz.setDefault('Asia/Tokyo')
		let event = makeWireEvent({
			startTime: '2030-01-15T17:00:00.000Z',
			endTime: '2030-01-15T18:00:00.000Z',
		})

		let selected = selectNamed('stolaf')([event])
		let sections = groupEvents(selected, moment('2030-01-10T12:00:00Z'))

		// 17:00Z is 02:00 on the 16th in Tokyo.
		expect(sections.map((section) => section.key)).toEqual(['2030-01-16'])
	})
```

Then append a section to `docs/superpowers/specs/2026-09-06-calendar-device-timezone-design.md` under **Open risk**, recording that `launchEnvironment["TZ"]` did not move Hermes' clock, that no override seam was added, and that the zone matrix lives in Jest as a result.

- [ ] **Step 6: Full check and commit**

```bash
mise run agent:pre-commit
```

Expected: all green.

```bash
git add uitests/ modules/ccc-calendar/__tests__/query-select.test.ts docs/superpowers/specs/
git commit -m "Prove the calendar follows the device's zone"
```

---

### Task 5: Open the stacked pull request

**Files:** none.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin calendar-device-timezone
```

- [ ] **Step 2: Open the PR against the 7860 branch, not master**

```bash
gh pr create --repo StoDevX/AAO-React-Native \
  --base address-day-picker-strip-review \
  --head calendar-device-timezone \
  --title "Read the calendar in the device's time zone" \
  --body ""
```

The body is left empty deliberately. Wren writes pull request descriptions.

- [ ] **Step 3: Report what changed for a user**

Say plainly, in the handoff message and not in the PR body: a student outside Central now sees campus events on their own clock. A 10 AM Central lecture reads as midnight to a device in Tokyo and groups under the Tokyo day. That is intended, and it is a visible difference for anyone travelling.

---

## Self-Review

**Spec coverage.** `now` follows the device → Task 2. All-day re-anchoring at `convertEvents` → Task 1. Invariant asserted per source → Task 1 covers it at the boundary all three web parsers funnel through, which is where the invariant is established; the parsers' own all-day fixtures are already asserted by their existing suites. Stale `deriveDays` comment → Task 2 Step 3. `dayCell()` follows `TimeZone.current` → Task 3. Zone-shift XCUITest and Jest matrix → Task 4, with the spec's decision rule carried over verbatim. EventKit untouched → stated in Global Constraints and in Task 1 Step 5. Out-of-scope features → Global Constraints.

**Placeholders.** None. `<UDID>` appears in the xcodebuild commands and is a value the implementer reads off `xcrun simctl list devices available`, not an unresolved decision.

**Type consistency.** `localMidnightOf(instant: string): Moment` is defined once in Task 1 and referenced nowhere else. `dayCell(_ date: Date) -> String` keeps its existing signature in Task 3 and is called in Task 4. `leadingDayCellIdentifier() -> String?` is introduced in Task 4 Step 1 and used in Steps 2 and 4. `relaunch(inTimeZone zone: String)` is introduced in Task 4 Step 1 and used in Steps 2 and 4; it is deleted along with the probe if Step 1 fails. `leadingVisibleDayCell()` returns `(cell: XCUIElement, frame: CGRect)?`, which is why `leadingDayCellIdentifier` reads `?.cell.identifier`.
