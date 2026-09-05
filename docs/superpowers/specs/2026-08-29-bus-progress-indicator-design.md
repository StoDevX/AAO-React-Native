# Bus Progress Indicator

A moving bus icon on the Transportation route display that shows real-time position between stops.

## Problem

The current progress bar uses dot styling (hollow, bordered, filled) to indicate stop status, but it's not immediately obvious where the bus currently is or that it's actively moving between stops.

## Solution

Add a bus icon that appears on the vertical progress bar and animates along it as the bus travels between stops. The icon's position reflects estimated progress based on departure times.

## Behavior

### When the bus is running

The bus icon appears on the bar segment *above* its destination stop, positioned by progress percentage:

- **Progress 0%** — icon at top of segment (just departed previous stop)
- **Progress 50%** — icon at midpoint of segment
- **Progress 100%** — icon at bottom of segment (arriving at stop)

When the current time matches a stop's arrival time exactly, the bus icon replaces the dot for that stop.

### When the bus is not running

No bus icon is shown. This includes:

- Before the first departure of the day (`before-start`)
- After the last run of the day (`after-end`)
- Between route iterations (`between-rounds`)
- Days when the route doesn't operate (`none`)

The header text ("Starts in 20 min", "Over for today") provides status context.

### Circular routes

Routes like Express Bus start and end at the same location (e.g., St. Olaf College appears at both top and bottom of the list). When the bus is on its final leg returning to the origin, the bus icon appears on the bottom row's incoming bar segment — the list order is literal.

### Skipped stops

If a stop has no departure time for the current iteration (status `skip`), the bus icon skips over it. Progress calculation uses the previous valid stop and next valid stop.

## Animation

When the bus position changes (on each render tick, currently every minute), the icon animates smoothly to its new position using React Native's `Animated.spring` with moderate damping.

Users who prefer reduced motion skip the animation — the icon jumps directly to the new position.

## Visual Design

- **Icon:** SF Symbol `bus.fill`
- **Size:** 18pt, matching the "at stop" dot size
- **Color:** Route's accent color (the `currentStopColor` prop)
- **Shadow:** Subtle drop shadow for depth against the bar

The icon centers horizontally on the bar's axis.

## Data Flow

### Progress calculation

```
progress = (now - previousStopDeparture) / (nextStopArrival - previousStopDeparture)
```

Clamped to 0–1.

### Determining the target stop

1. Find the first stop with status `before` (bus is heading there)
2. If none, check for a stop with status `at` (bus just arrived)
3. The previous stop in the timetable provides the departure time

### Props flow

`BusLine` calculates `busProgress` and `busTargetStopIndex`, passes them to the matching `BusStopRow`, which passes them to `ProgressChunk` for rendering.

## Component Changes

### `ProgressChunk`

New props:

| Prop | Type | Description |
|------|------|-------------|
| `busProgress` | `number \| null` | 0–1 when bus is on the incoming bar segment |
| `busAtStop` | `boolean` | True when bus icon should overlay the dot |

Rendering logic:

- If `busProgress` is set: render `Animated.View` with `SymbolView` (`bus.fill`), positioned via `translateY` on the top bar
- If `busAtStop` is true: render bus icon centered on the dot, hide the dot
- Otherwise: render as before (no bus icon)

### `BusStopRow`

New props (passed through to `ProgressChunk`):

| Prop | Type | Description |
|------|------|-------------|
| `busProgress` | `number \| null` | Progress on incoming segment |
| `busAtStop` | `boolean` | Bus is at this stop |

### `BusLine`

After deriving `status` and `currentBusIteration`:

1. If `status !== 'running'`, pass no bus props
2. Find target stop index (first `before` or `at` stop)
3. Look up departure times from `schedule.times[currentBusIteration]`
4. Calculate progress
5. Pass `busProgress` and `busAtStop` to the matching row

## Edge Cases

| Case | Behavior |
|------|----------|
| First stop | No incoming bar segment; if `at`, show bus on dot |
| Last stop | Normal handling — bus appears on bottom row's top segment |
| Progress > 1 | Clamp to 1; next tick flips to `at` status |
| Skipped stop | Jump over it in progress calculation |
| Between rounds | No bus icon |

## Files to Modify

- `source/features/transportation/bus/components/progress-chunk.tsx` — add bus icon rendering
- `source/features/transportation/bus/components/bus-stop-row.tsx` — pass bus props
- `source/features/transportation/bus/line.tsx` — calculate and distribute bus progress
- `source/features/transportation/bus/lib/index.ts` — export new calculation function

New file:

- `source/features/transportation/bus/lib/calculate-bus-progress.ts` — progress calculation logic

## Testing

Unit tests for `calculateBusProgress`:

- Returns 0 when `now` equals `previousStopDeparture`
- Returns 1 when `now` equals `nextStopArrival`
- Returns 0.5 when `now` is midpoint
- Clamps to 0 when `now` is before departure
- Clamps to 1 when `now` is after arrival
- Handles null/missing times gracefully

Component behavior is visual and best verified on device — the position calculation logic is the testable unit.
