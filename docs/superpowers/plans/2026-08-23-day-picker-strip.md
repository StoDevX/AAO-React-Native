# Day Picker Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a horizontal day picker strip to the event list that scrolls the list to the selected day.

**Architecture:** React Native `ScrollView` for the horizontal strip (simpler than SwiftUI for this use case), SwiftUI `scrollPosition` + `id` modifiers on the `List` for programmatic scrolling. The strip derives visible days from the event data, always starting from today.

**Tech Stack:** React Native (ScrollView, Pressable, View, Text), SwiftUI modifiers via @expo/ui, moment-timezone for date handling.

---

## File Structure

| File | Purpose |
|------|---------|
| `modules/event-list/day-picker-strip.tsx` | New component: horizontal day strip |
| `modules/event-list/event-list.tsx` | Integrate strip + scroll binding |
| `modules/event-list/__tests__/day-picker-strip.test.tsx` | Unit tests for day derivation and callbacks |
| `modules/event-list/__tests__/expo-ui-mock.tsx` | Add `scrollPosition`, `id`, `useNativeState` mocks |

---

### Task 1: Add scroll modifier mocks

**Files:**
- Modify: `modules/event-list/__tests__/expo-ui-mock.tsx`

- [ ] **Step 1: Add scrollPosition and id modifier mocks**

Add these exports to the mock file, after the existing modifier definitions around line 40:

```tsx
export const scrollPosition = modifier('scrollPosition')
export const id = modifier('id')
```

- [ ] **Step 2: Add useNativeState mock**

Add this mock after the modifier definitions:

```tsx
export function useNativeState<T>(initial: T): {value: T} {
	let ref = React.useRef({value: initial})
	return ref.current
}
```

- [ ] **Step 3: Verify the mock file still compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add modules/event-list/__tests__/expo-ui-mock.tsx
git commit -m "$(cat <<'EOF'
Add scrollPosition, id, and useNativeState mocks for event-list tests
EOF
)"
```

---

### Task 2: Create deriveDays helper function with tests

**Files:**
- Create: `modules/event-list/day-picker-strip.tsx`
- Create: `modules/event-list/__tests__/day-picker-strip.test.tsx`

- [ ] **Step 1: Write the test file with deriveDays tests**

```tsx
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'

import {deriveDays} from '../day-picker-strip'

const NOW = moment('2026-08-23T12:00:00Z')

describe('deriveDays', () => {
	test('returns empty array when events is empty', () => {
		let result = deriveDays([], NOW)
		expect(result).toEqual([])
	})

	test('returns today when only today has events', () => {
		let events = [
			{
				sourceId: 'a',
				key: 'k',
				event: {startTime: moment('2026-08-23T14:00:00Z'), isOngoing: false},
			},
		]
		let result = deriveDays(events as any, NOW)
		expect(result).toHaveLength(1)
		expect(result[0].isSame(NOW, 'day')).toBe(true)
	})

	test('returns days in order starting from today', () => {
		let events = [
			{sourceId: 'a', key: '1', event: {startTime: moment('2026-08-25T10:00:00Z'), isOngoing: false}},
			{sourceId: 'a', key: '2', event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false}},
			{sourceId: 'a', key: '3', event: {startTime: moment('2026-08-24T10:00:00Z'), isOngoing: false}},
		]
		let result = deriveDays(events as any, NOW)
		expect(result).toHaveLength(3)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
		expect(result[1].format('YYYY-MM-DD')).toBe('2026-08-24')
		expect(result[2].format('YYYY-MM-DD')).toBe('2026-08-25')
	})

	test('excludes days before today', () => {
		let events = [
			{sourceId: 'a', key: '1', event: {startTime: moment('2026-08-22T10:00:00Z'), isOngoing: false}},
			{sourceId: 'a', key: '2', event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false}},
		]
		let result = deriveDays(events as any, NOW)
		expect(result).toHaveLength(1)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
	})

	test('excludes ongoing events from day derivation', () => {
		let events = [
			{sourceId: 'a', key: '1', event: {startTime: moment('2026-08-20T10:00:00Z'), isOngoing: true}},
			{sourceId: 'a', key: '2', event: {startTime: moment('2026-08-23T10:00:00Z'), isOngoing: false}},
		]
		let result = deriveDays(events as any, NOW)
		expect(result).toHaveLength(1)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-23')
	})

	test('deduplicates days with multiple events', () => {
		let events = [
			{sourceId: 'a', key: '1', event: {startTime: moment('2026-08-23T09:00:00Z'), isOngoing: false}},
			{sourceId: 'a', key: '2', event: {startTime: moment('2026-08-23T14:00:00Z'), isOngoing: false}},
		]
		let result = deriveDays(events as any, NOW)
		expect(result).toHaveLength(1)
	})
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm jest modules/event-list/__tests__/day-picker-strip.test.tsx`
Expected: FAIL - module not found

- [ ] **Step 3: Create day-picker-strip.tsx with deriveDays function**

```tsx
import type {Moment} from 'moment-timezone'

import type {SourcedEvent} from './types'

/**
 * Extracts unique days from events, starting from today, sorted chronologically.
 * Excludes ongoing events (they appear in their own section, not a date).
 */
export function deriveDays(events: readonly SourcedEvent[], now: Moment): Moment[] {
	let seen = new Set<string>()
	let days: Moment[] = []

	for (let entry of events) {
		if (entry.event.isOngoing) {
			continue
		}

		let day = entry.event.startTime.clone().startOf('day')
		let key = day.format('YYYY-MM-DD')

		if (day.isBefore(now, 'day')) {
			continue
		}

		if (!seen.has(key)) {
			seen.add(key)
			days.push(day)
		}
	}

	return days.sort((a, b) => a.valueOf() - b.valueOf())
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm jest modules/event-list/__tests__/day-picker-strip.test.tsx`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add modules/event-list/day-picker-strip.tsx modules/event-list/__tests__/day-picker-strip.test.tsx
git commit -m "$(cat <<'EOF'
Add deriveDays helper for day picker strip
EOF
)"
```

---

### Task 3: Create DayPickerStrip component

**Files:**
- Modify: `modules/event-list/day-picker-strip.tsx`
- Modify: `modules/event-list/__tests__/day-picker-strip.test.tsx`

- [ ] **Step 1: Add component render tests**

Add these tests to the existing test file:

```tsx
import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react-native'

import {DayPickerStrip, deriveDays} from '../day-picker-strip'

// ... existing deriveDays tests ...

describe('DayPickerStrip', () => {
	test('renders a cell for each day', () => {
		let days = [
			moment('2026-08-23T00:00:00Z'),
			moment('2026-08-24T00:00:00Z'),
			moment('2026-08-25T00:00:00Z'),
		]

		render(
			<DayPickerStrip
				days={days}
				now={NOW}
				onSelectDay={() => {}}
				selectedDay={days[0]}
			/>,
		)

		expect(screen.getByText('23')).toBeTruthy()
		expect(screen.getByText('24')).toBeTruthy()
		expect(screen.getByText('25')).toBeTruthy()
	})

	test('renders single-letter weekday above date', () => {
		let days = [moment('2026-08-23T00:00:00Z')] // Sunday

		render(
			<DayPickerStrip
				days={days}
				now={NOW}
				onSelectDay={() => {}}
				selectedDay={days[0]}
			/>,
		)

		expect(screen.getByText('S')).toBeTruthy()
		expect(screen.getByText('23')).toBeTruthy()
	})

	test('calls onSelectDay when a day is tapped', () => {
		let days = [moment('2026-08-23T00:00:00Z'), moment('2026-08-24T00:00:00Z')]
		let onSelectDay = jest.fn()

		render(
			<DayPickerStrip
				days={days}
				now={NOW}
				onSelectDay={onSelectDay}
				selectedDay={days[0]}
			/>,
		)

		fireEvent.press(screen.getByText('24'))

		expect(onSelectDay).toHaveBeenCalledTimes(1)
		expect(onSelectDay.mock.calls[0][0].format('YYYY-MM-DD')).toBe('2026-08-24')
	})

	test('renders nothing when days is empty', () => {
		let {toJSON} = render(
			<DayPickerStrip days={[]} now={NOW} onSelectDay={() => {}} selectedDay={null} />,
		)

		expect(toJSON()).toBeNull()
	})
})
```

Also add `jest` to the imports at the top:

```tsx
import {describe, expect, jest, test} from '@jest/globals'
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm jest modules/event-list/__tests__/day-picker-strip.test.tsx`
Expected: FAIL - DayPickerStrip not exported

- [ ] **Step 3: Implement DayPickerStrip component**

Update `modules/event-list/day-picker-strip.tsx`:

```tsx
import * as React from 'react'
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native'
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'

import type {SourcedEvent} from './types'

/**
 * Extracts unique days from events, starting from today, sorted chronologically.
 * Excludes ongoing events (they appear in their own section, not a date).
 */
export function deriveDays(events: readonly SourcedEvent[], now: Moment): Moment[] {
	let seen = new Set<string>()
	let days: Moment[] = []

	for (let entry of events) {
		if (entry.event.isOngoing) {
			continue
		}

		let day = entry.event.startTime.clone().startOf('day')
		let key = day.format('YYYY-MM-DD')

		if (day.isBefore(now, 'day')) {
			continue
		}

		if (!seen.has(key)) {
			seen.add(key)
			days.push(day)
		}
	}

	return days.sort((a, b) => a.valueOf() - b.valueOf())
}

type Props = {
	days: Moment[]
	selectedDay: Moment | null
	onSelectDay: (day: Moment) => void
	now: Moment
}

function DayCell({
	day,
	isToday,
	isSelected,
	onPress,
}: {
	day: Moment
	isToday: boolean
	isSelected: boolean
	onPress: () => void
}): React.ReactNode {
	let weekdayLetter = day.format('dd').charAt(0).toUpperCase()
	let dateNumber = day.format('D')

	let circleColor = isToday ? c.systemRed : c.systemBlue
	let showCircle = isSelected
	let textColor = isSelected ? '#FFFFFF' : c.label
	let weekdayColor = isToday ? c.systemRed : c.secondaryLabel

	return (
		<Pressable
			accessibilityLabel={day.format('dddd, MMMM D')}
			accessibilityRole="button"
			hitSlop={4}
			onPress={onPress}
			style={styles.cell}
		>
			<Text style={[styles.weekday, {color: weekdayColor}]}>{weekdayLetter}</Text>
			<View style={styles.dateContainer}>
				{showCircle ? <View style={[styles.circle, {backgroundColor: circleColor}]} /> : null}
				<Text style={[styles.date, {color: textColor}]}>{dateNumber}</Text>
			</View>
		</Pressable>
	)
}

export function DayPickerStrip({days, selectedDay, onSelectDay, now}: Props): React.ReactNode {
	if (days.length === 0) {
		return null
	}

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				{days.map((day) => {
					let isToday = day.isSame(now, 'day')
					let isSelected = selectedDay ? day.isSame(selectedDay, 'day') : false

					return (
						<DayCell
							day={day}
							isSelected={isSelected}
							isToday={isToday}
							key={day.format('YYYY-MM-DD')}
							onPress={() => onSelectDay(day)}
						/>
					)
				})}
			</ScrollView>
		</View>
	)
}

const CELL_SIZE = 44

const styles = StyleSheet.create({
	container: {
		borderBottomColor: c.separator,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	scrollContent: {
		paddingHorizontal: 8,
		paddingVertical: 8,
	},
	cell: {
		width: CELL_SIZE,
		alignItems: 'center',
		marginHorizontal: 4,
	},
	weekday: {
		fontSize: 11,
		fontWeight: '600',
		marginBottom: 4,
	},
	dateContainer: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circle: {
		position: 'absolute',
		width: 32,
		height: 32,
		borderRadius: 16,
	},
	date: {
		fontSize: 17,
		fontWeight: '400',
	},
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm jest modules/event-list/__tests__/day-picker-strip.test.tsx`
Expected: All tests pass

- [ ] **Step 5: Run full test suite**

Run: `pnpm jest`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add modules/event-list/day-picker-strip.tsx modules/event-list/__tests__/day-picker-strip.test.tsx
git commit -m "$(cat <<'EOF'
Add DayPickerStrip component
EOF
)"
```

---

### Task 4: Integrate DayPickerStrip into EventList

**Files:**
- Modify: `modules/event-list/event-list.tsx`

- [ ] **Step 1: Add imports for scroll modifiers and day picker**

Add these imports at the top of `event-list.tsx`:

```tsx
import {useNativeState} from '@expo/ui/swift-ui'
import {id, scrollPosition} from '@expo/ui/swift-ui/modifiers'
import {DayPickerStrip, deriveDays} from './day-picker-strip'
```

Update the existing `@expo/ui/swift-ui/modifiers` import to include `id` and `scrollPosition`:

```tsx
import {
	background,
	font,
	foregroundStyle,
	id,
	listStyle,
	refreshable,
	scrollContentBackground,
	scrollPosition,
} from '@expo/ui/swift-ui/modifiers'
```

And add `useNativeState` to the swift-ui import:

```tsx
import {Host, List, Section, Text, useNativeState} from '@expo/ui/swift-ui'
```

- [ ] **Step 2: Add scroll state and day derivation inside EventList**

Inside the `EventList` function, after the `colorFor` memo, add:

```tsx
let scrollTarget = useNativeState<string | null>(null)

let days = React.useMemo(() => deriveDays(props.events, props.now), [props.events, props.now])

let [selectedDay, setSelectedDay] = React.useState<Moment | null>(() => {
	return days.length > 0 ? days[0] : null
})

let handleSelectDay = React.useCallback(
	(day: Moment) => {
		setSelectedDay(day)
		// The section key for today is 'Today', otherwise it's the ISO date
		let sectionKey = day.isSame(props.now, 'day') ? 'Today' : day.format('YYYY-MM-DD')
		scrollTarget.value = sectionKey
	},
	[props.now, scrollTarget],
)
```

Add `Moment` to the imports from moment-timezone (it's already a type import).

- [ ] **Step 3: Render DayPickerStrip above the List**

Update the return statement that currently returns `<Host style={styles.host}>`. Change it to:

```tsx
return (
	<Host style={styles.host}>
		<DayPickerStrip
			days={days}
			now={props.now}
			onSelectDay={handleSelectDay}
			selectedDay={selectedDay}
		/>
		<List
			modifiers={[
				listStyle('plain'),
				scrollContentBackground('hidden'),
				background(c.systemBackground),
				refreshable(async () => {
					await props.onRefresh()
				}),
				scrollPosition(scrollTarget, {
					onChange: (sectionKey) => {
						if (!sectionKey) return
						// Find the day matching this section key
						let matchingDay = days.find((d) => {
							let key = d.isSame(props.now, 'day') ? 'Today' : d.format('YYYY-MM-DD')
							return key === sectionKey
						})
						if (matchingDay && (!selectedDay || !matchingDay.isSame(selectedDay, 'day'))) {
							setSelectedDay(matchingDay)
						}
					},
				}),
			]}
		>
			{props.failed.length > 0 ? (
				<Section>
					<Text modifiers={[foregroundStyle(c.secondaryLabel), font({textStyle: 'footnote'})]}>
						{`Could not load ${props.failed.map((source) => source.title).join(', ')}.`}
					</Text>
				</Section>
			) : null}
			{sections.map((section) => (
				<Section
					header={<SectionHeader isToday={section.isToday} title={section.title} />}
					key={section.key}
					modifiers={[id(section.key)]}
				>
					{section.data.map((entry, index) => (
						<EventListRow
							color={colorFor(entry.sourceId)}
							event={entry.event}
							isLastInSection={index === section.data.length - 1}
							key={`${entry.sourceId}|${entry.key}`}
							onPress={() => props.onPressEvent(entry)}
						/>
					))}
				</Section>
			))}
		</List>
	</Host>
)
```

- [ ] **Step 4: Type check**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Run tests**

Run: `pnpm jest modules/event-list`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add modules/event-list/event-list.tsx
git commit -m "$(cat <<'EOF'
Integrate DayPickerStrip into EventList with scroll binding
EOF
)"
```

---

### Task 5: Run pre-commit checks and test on device

**Files:**
- None (verification only)

- [ ] **Step 1: Run agent:pre-commit**

Run: `mise run agent:pre-commit`
Expected: All checks pass (format, lint, tsc, test)

- [ ] **Step 2: Build to simulator and verify**

Run: `mise run ios`
Expected: App launches, navigate to Calendar

- [ ] **Step 3: Verify day picker appears**

Manual check:
- Day picker strip appears above the event list
- Today is highlighted with a red circle
- Days are displayed with single-letter weekday + date number
- Strip scrolls horizontally if many days

- [ ] **Step 4: Verify tapping a day scrolls the list**

Manual check:
- Tap a future day in the strip
- List should animate scroll to that day's section
- Selected day in strip updates (blue circle)

If scrollPosition does NOT work with List (no scroll happens), note this for the fallback plan and proceed to Task 6.

- [ ] **Step 5: Verify manual scroll syncs the strip**

Manual check:
- Manually scroll the event list up/down
- The selected day in the strip should update to match the visible section

- [ ] **Step 6: Commit if any formatting changes**

```bash
git status
# If any changes from formatting:
git add -A && git commit -m "Format after integration"
```

---

### Task 6 (Fallback): Convert to ScrollView if scrollPosition fails

**Files:**
- Modify: `modules/event-list/event-list.tsx`

> **Skip this task if Task 5 Step 4 confirms scrollPosition works with List.**

If scrollPosition does not work with List, replace the List with ScrollView + VStack:

- [ ] **Step 1: Update imports**

Replace `List` with `ScrollView` and add `VStack`:

```tsx
import {Host, ScrollView, Section, Text, VStack, useNativeState} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	id,
	refreshable,
	scrollPosition,
	scrollTargetLayout,
} from '@expo/ui/swift-ui/modifiers'
```

- [ ] **Step 2: Replace List with ScrollView + VStack**

Replace the `<List>` element with:

```tsx
<ScrollView
	modifiers={[
		background(c.systemBackground),
		refreshable(async () => {
			await props.onRefresh()
		}),
		scrollPosition(scrollTarget, {
			onChange: (sectionKey) => {
				if (!sectionKey) return
				let matchingDay = days.find((d) => {
					let key = d.isSame(props.now, 'day') ? 'Today' : d.format('YYYY-MM-DD')
					return key === sectionKey
				})
				if (matchingDay && (!selectedDay || !matchingDay.isSame(selectedDay, 'day'))) {
					setSelectedDay(matchingDay)
				}
			},
		}),
	]}
>
	<VStack modifiers={[scrollTargetLayout()]}>
		{/* ... same Section content ... */}
	</VStack>
</ScrollView>
```

- [ ] **Step 3: Re-verify on device**

Run: `mise run ios`
Expected: Tapping a day now scrolls the list

- [ ] **Step 4: Commit**

```bash
git add modules/event-list/event-list.tsx
git commit -m "$(cat <<'EOF'
Use ScrollView instead of List for scroll position support
EOF
)"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add test mocks for scroll modifiers |
| 2 | Create deriveDays helper with TDD |
| 3 | Create DayPickerStrip component with TDD |
| 4 | Integrate into EventList with scroll binding |
| 5 | Verify on device, run pre-commit |
| 6 | Fallback: Convert to ScrollView if needed |
