# The calendar follows the device's time zone

## The problem

The calendar reads its clock in one zone and its events in another.

`now` is pinned to campus time. Two screens build it that way:

- `app/(home)/Calendar.tsx:20` — `useMomentTimer({intervalMs: 60000, timezone: timezone()})`
- `modules/ccc-calendar/schedule-view.tsx:24` — the same call

`timezone()` returns `America/Chicago`, set once in `source/init/constants.ts`.

Events do not. Every parser emits an ISO instant string, and `convertEvents`
(`modules/ccc-calendar/query.ts:23`) turns each one into a plain
`moment(iso)` — which resolves in the device's zone. So does every piece of
display formatting: `times.ts` runs `Intl` over `moment.toDate()`, and
`groupEvents` keys its sections on `startTime.format('YYYY-MM-DD')`.

The two only agree for a user sitting in Central. Everywhere else the strip's
day cells and the list's section keys are computed against different days, and
the mismatch shows up as a day-picker cell that scrolls the list nowhere.

There is a second, larger bug beside it. An all-day event has no instant — it
is a calendar date — and both web sources anchor it at **UTC midnight**:

- `modules/ccc-calendar/parsers/ical.ts:78` builds `VALUE=DATE` times as
  `new Date(Date.UTC(year, month - 1, day))`, deliberately, to keep them off
  the host's clock.
- `modules/ccc-calendar/parsers/tec-events.ts:42` reads TEC's
  `utc_start_date`, which for `all_day: true` is `00:00:00`.

Read back in the device's zone, that lands a day early for every user west of
UTC — including on campus. Verified against `groupEvents` at a Central device
zone:

```
all-day event for 2026-08-20  →  section key '2026-08-19'
```

EventKit does not have this problem. `device-calendar.ts:46` reads
`event.startDate`, which EventKit already floats to local midnight.

## The invariant

> Every moment in the calendar lives in the device's zone. An all-day event's
> `startTime` is local midnight on the day the event covers.

Stating it once is the point. Each source is then responsible for meeting it,
and a test per source says whether it does.

## Design

### `now` follows the device

Drop `timezone: timezone()` from both `useMomentTimer` calls. `now` becomes a
plain device-local moment, in the same zone as every event beside it.

Nothing else changes at those call sites — `intervalMs` and `startOf` are
unaffected, and `useMomentTimer` already treats `timezone` as optional.

### All-day events re-anchor at the boundary

In `convertEvents`, an all-day event's UTC midnight becomes local midnight on
the same calendar date. Read the date in UTC, rebuild it locally:

```ts
startTime: event.isAllDay ? localMidnightOf(event.startTime) : moment(event.startTime)
```

where `localMidnightOf` reads `YYYY-MM-DD` from the UTC instant and parses it
back as a local date. `endTime` gets the same treatment, so an exclusive end
at the following midnight stays the following midnight.

This is the only change point: all three web parsers (`parseEvents`,
`parseIcalEvents`, `parseTecEvents`) funnel through `convertEvents`.

`device-calendar.ts` is left alone. Passing an already-local midnight through
the same conversion would be a no-op today and a silent double-shift the day
EventKit's behaviour changes, so it is better not to reach for it at all.

**Why the boundary and not the use sites.** The alternative — keep the true
instant and teach every consumer to read an all-day event in UTC — needs the
rule remembered in `sections.ts`, `deriveDays`, `times.ts` and `timeline.ts`.
Four places to drift apart instead of one to get right.

### The stale comment in `deriveDays`

`modules/event-list/day-picker-strip.tsx` carries a comment explaining that
`now` is campus time while an event's `startTime` is device-local. That stops
being true here, and a comment describing a split that no longer exists is
worse than none.

The whole-weeks loop itself stays. It is what guarantees `days.length` is a
multiple of seven, which the strip's snapping depends on, and nothing about
`deriveDays`' signature guarantees its two arguments share a zone. The comment
gets rewritten to say that — the loop defends the contract, rather than
patching a zone mismatch that has been removed upstream.

### UI tests

`TestIdentifiers.Calendar.dayCell()` formats in `campusTimeZone`. It changes
to `TimeZone.current`, so the tests read days the way the app under test does.

`campusTimeZone` itself stays: `frozenNow` is a fixed instant and some
assertions are about campus's calendar, not the device's. Its doc comment
gains a note saying which is which, so the next reader does not reach for the
wrong one.

Two pieces of new coverage:

1. **A zone-shift XCUITest** — run the calendar under a deliberately
   non-Central zone and assert that "today" and an all-day event still land on
   the right day.
2. **A Jest zone matrix** — `deriveDays`, `groupEvents` and `convertEvents`
   exercised with the device zone set east and west of campus, including the
   midnight-crossing case. These are pure functions, so this is where the
   matrix belongs.

   Jest moves the device zone with `moment.tz.setDefault(zone)`, which is what
   a bare `moment(iso)` resolves against, restored in `afterEach`. Setting
   `process.env.TZ` per suite would not do it — the zone is read once, before
   a test body runs.

## Testing

Per `CLAUDE.md`, Jest gets what JavaScript decides and XCUITest gets what the
screen does.

**Jest.** `convertEvents` puts an all-day event at local midnight on its
stated date, under at least one zone east and one west of UTC. `groupEvents`
keys that event under its own date rather than the day before. `deriveDays`
keeps whole weeks and keeps the last event's day in range. Each parser's
all-day fixture still produces the UTC-midnight wire form the boundary
expects, so a parser change that broke the assumption would fail loudly rather
than shift days silently.

**XCUITest.** That the strip and the list agree about today under a shifted
zone, and that an all-day event appears under its own section header. Both are
statements about the rendered screen, and both are invisible to Jest.

Every new test is to be seen failing before it is trusted, against the code
without the fix.

## Open risk

The zone-shift XCUITest needs the app to run under a zone other than the
host's. The intended mechanism is `app.launchEnvironment["TZ"]`: no production
code, and it exercises the same path a real device takes.

Whether Hermes honours `TZ` on the simulator is unverified. **This is the
first thing to settle in implementation**, before anything is built on it.

If it does not work, the fallback is *not* a zone-override seam in the app.
Adding one would re-introduce the forced-zone machinery this change exists to
delete, and a test driving that seam would prove only that the seam works. The
fallback is to cover the zone matrix in Jest alone and record here, plainly,
that the simulator cannot express the case.

**Resolved.** `app.launchEnvironment["TZ"]` was tried against the running
simulator and did not move Hermes' clock: relaunching under `Asia/Tokyo` still
left the strip leading with `day-cell-2026-08-30`, the same cell as an
unmodified launch. No zone-override seam was added to the app to work around
this — doing so would rebuild the forced-zone machinery this change exists to
remove, and a test driving such a seam would prove only that the seam works.
This does not prove Hermes can never have its clock moved, only that this
mechanism did not work here. The zone matrix therefore lives in Jest, in
`modules/ccc-calendar/__tests__/query-select.test.ts`, and the simulator's
inability to shift zones is an accepted gap: no XCUITest proves the strip and
list agree about "today" under a non-host zone.

## Consequences

A student outside Central now sees campus events on their own clock. A 10 AM
Central lecture reads as midnight to a device in Tokyo, and groups under the
Tokyo day. That is the intended behaviour and the reason for the change; it is
also a visible difference for anyone travelling, and worth saying out loud in
the pull request.

## Out of scope

`timezone()` and `setTimezone` stay. Building hours, bus schedules, dining
menus, streaming and stoprint all read campus time deliberately — a bus leaves
St. Olaf on St. Olaf's clock no matter where the phone is. Only the calendar
changes here.
