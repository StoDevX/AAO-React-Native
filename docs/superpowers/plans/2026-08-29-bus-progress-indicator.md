# Bus Progress Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a moving bus icon to the Transportation route display that shows real-time position between stops.

**Architecture:** Extend `ProgressChunk` to render an animated bus icon when provided with progress data. `BusLine` calculates which stop the bus is traveling toward and the progress percentage, passing this down through `BusStopRow`. Animation uses React Native's `Animated` API with spring physics.

**Tech Stack:** React Native, Animated API, expo-symbols (SF Symbols), moment-timezone

---

## File Structure

| File | Responsibility |
|------|----------------|
| `source/features/transportation/bus/lib/calculate-bus-progress.ts` | Pure function: compute progress 0–1 from departure times |
| `source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts` | Unit tests for progress calculation |
| `source/features/transportation/bus/lib/index.ts` | Export the new function |
| `source/features/transportation/bus/components/progress-chunk.tsx` | Render bus icon on bar segment or at dot |
| `source/features/transportation/bus/components/bus-stop-row.tsx` | Pass bus props through to ProgressChunk |
| `source/features/transportation/bus/line.tsx` | Calculate bus target stop and progress, pass to rows |

---

### Task 1: Create calculateBusProgress with tests

**Files:**
- Create: `source/features/transportation/bus/lib/calculate-bus-progress.ts`
- Create: `source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

- [ ] **Step 1: Create the test file with first failing test**

```typescript
// source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts
import {describe, expect, test} from '@jest/globals'
import {calculateBusProgress} from '../calculate-bus-progress'
import {time} from './moment.helper'

describe('calculateBusProgress', () => {
	test('returns 0 when now equals previousStopDeparture', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:00pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(0)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: FAIL with "Cannot find module '../calculate-bus-progress'"

- [ ] **Step 3: Create minimal implementation**

```typescript
// source/features/transportation/bus/lib/calculate-bus-progress.ts
import type {Moment} from 'moment-timezone'

export function calculateBusProgress(
	previousStopDeparture: Moment,
	nextStopArrival: Moment,
	now: Moment,
): number {
	return 0
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: PASS

- [ ] **Step 5: Add test for progress = 1**

```typescript
// Add to the describe block in calculate-bus-progress.test.ts
	test('returns 1 when now equals nextStopArrival', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:10pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(1)
	})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: FAIL - "expected 1, received 0"

- [ ] **Step 7: Implement the calculation**

```typescript
// source/features/transportation/bus/lib/calculate-bus-progress.ts
import type {Moment} from 'moment-timezone'

export function calculateBusProgress(
	previousStopDeparture: Moment,
	nextStopArrival: Moment,
	now: Moment,
): number {
	let totalDuration = nextStopArrival.diff(previousStopDeparture)
	let elapsed = now.diff(previousStopDeparture)

	if (totalDuration === 0) {
		return 0
	}

	return elapsed / totalDuration
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: PASS (both tests)

- [ ] **Step 9: Add test for midpoint**

```typescript
// Add to the describe block
	test('returns 0.5 when now is at midpoint', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:05pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(0.5)
	})
```

- [ ] **Step 10: Run test to verify it passes**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: PASS

- [ ] **Step 11: Add test for clamping below 0**

```typescript
// Add to the describe block
	test('clamps to 0 when now is before departure', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('12:55pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(0)
	})
```

- [ ] **Step 12: Run test to verify it fails**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: FAIL - negative value

- [ ] **Step 13: Add clamping to implementation**

```typescript
// source/features/transportation/bus/lib/calculate-bus-progress.ts
import type {Moment} from 'moment-timezone'

export function calculateBusProgress(
	previousStopDeparture: Moment,
	nextStopArrival: Moment,
	now: Moment,
): number {
	let totalDuration = nextStopArrival.diff(previousStopDeparture)
	let elapsed = now.diff(previousStopDeparture)

	if (totalDuration === 0) {
		return 0
	}

	let progress = elapsed / totalDuration

	return Math.max(0, Math.min(1, progress))
}
```

- [ ] **Step 14: Run tests to verify they pass**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: PASS

- [ ] **Step 15: Add test for clamping above 1**

```typescript
// Add to the describe block
	test('clamps to 1 when now is after arrival', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:15pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(1)
	})
```

- [ ] **Step 16: Run test to verify it passes**

Run: `pnpm test source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts`

Expected: PASS (clamping already handles this)

- [ ] **Step 17: Commit**

```bash
git add source/features/transportation/bus/lib/calculate-bus-progress.ts source/features/transportation/bus/lib/__tests__/calculate-bus-progress.test.ts
git commit -m "Add calculateBusProgress function with tests"
```

---

### Task 2: Export calculateBusProgress from lib index

**Files:**
- Modify: `source/features/transportation/bus/lib/index.ts`

- [ ] **Step 1: Add export**

Add to `source/features/transportation/bus/lib/index.ts`:

```typescript
export {calculateBusProgress} from './calculate-bus-progress'
```

- [ ] **Step 2: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add source/features/transportation/bus/lib/index.ts
git commit -m "Export calculateBusProgress from bus lib"
```

---

### Task 3: Add bus icon props to ProgressChunk

**Files:**
- Modify: `source/features/transportation/bus/components/progress-chunk.tsx`

- [ ] **Step 1: Add new props to type definition**

In `source/features/transportation/bus/components/progress-chunk.tsx`, update the Props type:

```typescript
type Props = {
	barColor: ColorValue
	currentStopColor: ColorValue
	isFirstChunk: boolean
	isLastChunk: boolean
	stopStatus: BusStopStatusEnum
	busProgress?: number | null
	busAtStop?: boolean
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors (new props are optional)

- [ ] **Step 3: Commit**

```bash
git add source/features/transportation/bus/components/progress-chunk.tsx
git commit -m "Add busProgress and busAtStop props to ProgressChunk"
```

---

### Task 4: Add bus icon styles to ProgressChunk

**Files:**
- Modify: `source/features/transportation/bus/components/progress-chunk.tsx`

- [ ] **Step 1: Add bus icon styles**

Add to the `styles` StyleSheet in `progress-chunk.tsx`:

```typescript
const styles = StyleSheet.create({
	barContainer: {
		paddingRight: 5,
		width: 45,
		flexDirection: 'column',
		alignItems: 'center',
	},
	bar: {
		flex: 1,
		width: 5,
	},
	topBarWrapper: {
		flex: 1,
		width: 5,
		position: 'relative',
	},
	topBar: {
		flex: 1,
		width: 5,
	},
	busIcon: {
		position: 'absolute',
		left: -6.5,
		width: 18,
		height: 18,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
	},
	busIconAtStop: {
		zIndex: 2,
	},
	dot: {
		height: 15,
		width: 15,
		marginVertical: -10,
		borderRadius: 20,
		zIndex: 1,
	},
	skippingStop: {
		backgroundColor: c.clear,
		borderColor: c.transparent,
	},
	passedStop: {
		height: 12,
		width: 12,
	},
	beforeStop: {
		borderWidth: 3,
		backgroundColor: c.systemFill,
		height: 18,
		width: 18,
	},
	atStop: {
		height: 20,
		width: 20,
		borderColor: c.systemFill,
		borderWidth: 3,
		backgroundColor: c.systemFill,
	},
})
```

- [ ] **Step 2: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add source/features/transportation/bus/components/progress-chunk.tsx
git commit -m "Add bus icon styles to ProgressChunk"
```

---

### Task 5: Render bus icon in ProgressChunk

**Files:**
- Modify: `source/features/transportation/bus/components/progress-chunk.tsx`

- [ ] **Step 1: Add imports**

Update imports at top of `progress-chunk.tsx`:

```typescript
import * as React from 'react'
import {useEffect, useRef} from 'react'
import * as c from '@frogpond/colors'
import {AccessibilityInfo, Animated, ColorValue, StyleSheet, View} from 'react-native'
import {SymbolView} from 'expo-symbols'
import type {BusStopStatusEnum} from '../lib'
```

- [ ] **Step 2: Add constants for bar height**

Add after the imports:

```typescript
const TOP_BAR_HEIGHT = 20
```

- [ ] **Step 3: Rewrite the component with bus icon rendering**

Replace the `ProgressChunk` function:

```typescript
export function ProgressChunk(props: Props): React.ReactNode {
	let {stopStatus, barColor, currentStopColor, busProgress, busAtStop} = props

	let startBarColor = barColor
	let endBarColor = barColor

	let animatedPosition = useRef(new Animated.Value(0)).current
	let reducedMotion = useRef(false)

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			reducedMotion.current = enabled
		})
	}, [])

	useEffect(() => {
		if (busProgress == null) {
			return
		}

		let targetPosition = busProgress * TOP_BAR_HEIGHT

		if (reducedMotion.current) {
			animatedPosition.setValue(targetPosition)
		} else {
			Animated.spring(animatedPosition, {
				toValue: targetPosition,
				useNativeDriver: true,
				damping: 15,
				stiffness: 100,
			}).start()
		}
	}, [busProgress, animatedPosition])

	let showBusOnBar = busProgress != null && !busAtStop
	let showBusAtDot = busAtStop === true

	return (
		<View style={styles.barContainer}>
			<View style={styles.topBarWrapper}>
				<View style={[styles.topBar, {backgroundColor: startBarColor}]} />
				{showBusOnBar && (
					<Animated.View
						style={[
							styles.busIcon,
							{
								transform: [{translateY: animatedPosition}],
							},
						]}
					>
						<SymbolView
							name="bus.fill"
							size={18}
							style={{shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2}}
							tintColor={currentStopColor as string}
						/>
					</Animated.View>
				)}
			</View>
			<View
				style={[
					styles.dot,
					stopStatus === 'after' && [
						styles.passedStop,
						{borderColor: barColor, backgroundColor: barColor},
					],
					stopStatus === 'before' && [styles.beforeStop, {borderColor: barColor}],
					stopStatus === 'at' && [styles.atStop, {borderColor: currentStopColor}],
					stopStatus === 'skip' && styles.skippingStop,
					showBusAtDot && {opacity: 0},
				]}
			/>
			{showBusAtDot && (
				<View style={[styles.busIcon, styles.busIconAtStop, {position: 'absolute'}]}>
					<SymbolView
						name="bus.fill"
						size={18}
						style={{shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2}}
						tintColor={currentStopColor as string}
					/>
				</View>
			)}
			<View style={[styles.bar, {backgroundColor: endBarColor}]} />
		</View>
	)
}
```

- [ ] **Step 4: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add source/features/transportation/bus/components/progress-chunk.tsx
git commit -m "Render animated bus icon in ProgressChunk"
```

---

### Task 6: Add bus props to BusStopRow

**Files:**
- Modify: `source/features/transportation/bus/components/bus-stop-row.tsx`

- [ ] **Step 1: Update Props type**

In `bus-stop-row.tsx`, update the Props type:

```typescript
type Props = {
	stop: BusTimetableEntry
	departureIndex: null | number
	now: Moment
	barColor: ColorValue
	currentStopColor: ColorValue
	isFirstRow: boolean
	isLastRow: boolean
	status: BusStateEnum
	busProgress?: number | null
	busAtStop?: boolean
}
```

- [ ] **Step 2: Destructure and pass new props**

Update the function to destructure and pass the new props:

```typescript
export function BusStopRow(props: Props): React.ReactNode {
	let {
		barColor,
		currentStopColor,
		departureIndex,
		isFirstRow,
		isLastRow,
		now,
		stop,
		status: busStatus,
		busProgress,
		busAtStop,
	} = props

	let stopStatus = findStopStatus({stop, busStatus, departureIndex, now})
	let times = findRemainingDepartures({stop, busStatus, departureIndex})

	let rowTextStyle = [
		stopStatus === 'skip' && styles.skippingStopTitle,
		stopStatus === 'after' && styles.passedStopTitle,
		stopStatus === 'at' && styles.atStopTitle,
	]

	return (
		<ListRow arrowPosition="center" fullHeight={true} fullWidth={true} style={styles.row}>
			<ProgressChunk
				barColor={barColor}
				busAtStop={busAtStop}
				busProgress={busProgress}
				currentStopColor={currentStopColor}
				isFirstChunk={isFirstRow}
				isLastChunk={isLastRow}
				stopStatus={stopStatus}
			/>

			<Column flex={1} style={styles.internalPadding}>
				<Title bold={false} style={rowTextStyle}>
					{stop.name}
				</Title>
				<Detail lines={1}>
					<ScheduleTimes style={stopStatus === 'skip' && styles.skippingStopDetail} times={times} />
				</Detail>
			</Column>
		</ListRow>
	)
}
```

- [ ] **Step 3: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add source/features/transportation/bus/components/bus-stop-row.tsx
git commit -m "Pass busProgress and busAtStop through BusStopRow"
```

---

### Task 7: Calculate bus position in BusLine

**Files:**
- Modify: `source/features/transportation/bus/line.tsx`

- [ ] **Step 1: Add import for calculateBusProgress**

Add to imports in `line.tsx`:

```typescript
import {BusStateEnum, calculateBusProgress, getCurrentBusIteration, getScheduleForNow, processBusLine} from './lib'
```

- [ ] **Step 2: Add helper function to find bus target**

Add after the `startsIn` function:

```typescript
function findBusTarget(
	schedule: BusSchedule,
	currentBusIteration: number | null,
	now: Moment,
): {targetIndex: number; progress: number; atStop: boolean} | null {
	if (currentBusIteration === null) {
		return null
	}

	let times = schedule.times[currentBusIteration]
	if (!times) {
		return null
	}

	let targetIndex: number | null = null
	let previousIndex: number | null = null

	for (let i = 0; i < times.length; i++) {
		let time = times[i]
		if (time === null) {
			continue
		}

		if (now.isSame(time, 'minute')) {
			return {targetIndex: i, progress: 1, atStop: true}
		}

		if (now.isBefore(time, 'minute')) {
			targetIndex = i
			break
		}

		previousIndex = i
	}

	if (targetIndex === null || previousIndex === null) {
		return null
	}

	let previousTime = times[previousIndex]
	let nextTime = times[targetIndex]

	if (!previousTime || !nextTime) {
		return null
	}

	let progress = calculateBusProgress(previousTime, nextTime, now)

	return {targetIndex, progress, atStop: false}
}
```

- [ ] **Step 3: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add source/features/transportation/bus/line.tsx
git commit -m "Add findBusTarget helper function"
```

---

### Task 8: Pass bus position to BusStopRow

**Files:**
- Modify: `source/features/transportation/bus/line.tsx`

- [ ] **Step 1: Calculate bus target in useEffect**

In the `BusLine` function, add state for bus target and calculate it. Update the second `useEffect`:

```typescript
let [busTarget, setBusTarget] = useState<{
	targetIndex: number
	progress: number
	atStop: boolean
} | null>(null)

useEffect(() => {
	const momentForSelectedDay = createMomentForDay(now, selectedDay)

	let {
		schedule: scheduleForToday,
		subtitle: scheduleSubtitle,
		currentBusIteration: busIteration,
		status: currentStatus,
	} = deriveFromProps({
		line,
		now: momentForSelectedDay,
	})
	setSchedule(scheduleForToday)
	setSubtitle(scheduleSubtitle)
	setStatus(currentStatus)
	setCurrentBusIteration(busIteration)

	if (currentStatus === 'running') {
		setBusTarget(findBusTarget(scheduleForToday, busIteration, momentForSelectedDay))
	} else {
		setBusTarget(null)
	}
}, [line, now, selectedDay])
```

- [ ] **Step 2: Update renderItem to pass bus props**

Update the `renderItem` in the FlatList:

```typescript
renderItem={({item, index}) => {
	let isBusTarget = busTarget?.targetIndex === index
	return (
		<TouchableOpacity
			onPress={() => {
				router.push({
					pathname: '/BusRouteDetail',
					params: {line: line.line, day: selectedDay, stopName: item.name},
				})
			}}
		>
			<BusStopRow
				barColor={line.colors.bar}
				busAtStop={isBusTarget ? busTarget.atStop : undefined}
				busProgress={isBusTarget ? busTarget.progress : undefined}
				currentStopColor={line.colors.dot}
				departureIndex={currentBusIteration}
				isFirstRow={index === 0}
				isLastRow={timetable.length === 0 || index === timetable.length - 1}
				now={momentForSelectedDay}
				status={status}
				stop={item}
			/>
		</TouchableOpacity>
	)
}}
```

- [ ] **Step 3: Add useState import if not present**

Ensure `useState` is imported at the top of the file (it already should be).

- [ ] **Step 4: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add source/features/transportation/bus/line.tsx
git commit -m "Calculate and pass bus position to BusStopRow"
```

---

### Task 9: Fix bus icon positioning for at-stop state

**Files:**
- Modify: `source/features/transportation/bus/components/progress-chunk.tsx`

- [ ] **Step 1: Adjust at-stop bus icon positioning**

The bus icon at stop needs to be centered on the dot position. Update the `busIconAtStop` style and rendering:

```typescript
busIconAtStop: {
	marginVertical: -10,
	zIndex: 2,
},
```

And update the rendering to position it correctly relative to the dot:

```typescript
{showBusAtDot && (
	<View style={[styles.busIconAtStop]}>
		<SymbolView
			name="bus.fill"
			size={18}
			style={{shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2}}
			tintColor={currentStopColor as string}
		/>
	</View>
)}
```

Remove the `{showBusAtDot && {opacity: 0}}` from the dot style since we now render the bus in place of the dot flow.

- [ ] **Step 2: Run type check**

Run: `pnpm tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add source/features/transportation/bus/components/progress-chunk.tsx
git commit -m "Fix bus icon positioning for at-stop state"
```

---

### Task 10: Run full test suite and verify

**Files:** None (verification only)

- [ ] **Step 1: Run agent pre-commit checks**

Run: `mise run agent:pre-commit`

Expected: All checks pass (format, lint, tsc, test)

- [ ] **Step 2: Run the app on device**

Run: `mise run device "Drew's iPhone"` (or your device name)

Navigate to Transportation > Express Bus and verify:
- Bus icon appears on the progress bar when route is running
- Icon position reflects estimated progress between stops
- Icon animates smoothly when position changes
- Icon replaces the dot when bus is at a stop
- No icon shown when route is not running

- [ ] **Step 3: Final commit if any adjustments were made**

```bash
git add -A
git commit -m "Polish bus progress indicator"
```

---

## Summary

After completing all tasks:
- `calculateBusProgress` is unit tested and handles edge cases
- `ProgressChunk` renders an animated bus icon when provided progress data
- `BusStopRow` passes bus props through
- `BusLine` calculates bus target and distributes props to the correct row
- Animation respects reduced motion preference
