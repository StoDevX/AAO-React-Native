# Calendar Category Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add category filtering to the St. Olaf calendar via a toolbar button that opens a multi-select sheet.

**Architecture:** Extend EventType and WireEvent with a `categories` field. Parse categories from TEC API responses; other sources return empty arrays. Store selected categories in a persisted Zustand store. Filter events client-side in the Calendar screen.

**Tech Stack:** TypeScript, Zod, Zustand, React Native, @expo/ui SwiftUI components, @frogpond/filter

---

## File Structure

| File | Responsibility |
|------|----------------|
| `modules/event-type/index.ts` | Add `categories` to EventType |
| `modules/ccc-calendar/parsers/events.ts` | Add `categories` to WireEvent schema |
| `modules/ccc-calendar/parsers/tec-events.ts` | Parse categories from TEC response |
| `modules/ccc-calendar/parsers/ical.ts` | Return empty categories |
| `modules/ccc-calendar/__tests__/tec-events.test.ts` | Test category parsing |
| `source/features/calendar/store.ts` | Zustand store for filter state (new) |
| `source/features/calendar/__tests__/store.test.ts` | Store tests (new) |
| `app/(home)/Calendar.tsx` | Filter button, sheet, filtering logic |

---

### Task 1: Add categories to EventType

**Files:**
- Modify: `modules/event-type/index.ts:4-20`

- [ ] **Step 1: Add categories field to EventType**

```typescript
export type EventType = {
	readonly title: string
	readonly description: string
	readonly location: string
	readonly startTime: Moment
	readonly endTime: Moment
	readonly isAllDay: boolean
	readonly isMultiDay: boolean
	readonly isSameInstant: boolean
	readonly isOngoing: boolean
	readonly links: Array<string>
	readonly categories: readonly string[]
	readonly config: {
		readonly startTime: boolean
		readonly endTime: boolean
		readonly subtitle: 'location' | 'description'
	}
}
```

- [ ] **Step 2: Run type check to verify change**

Run: `mise run tsc`
Expected: Type errors in parsers/query.ts (they don't provide categories yet)

- [ ] **Step 3: Commit**

```bash
git add modules/event-type/index.ts
git commit -m "Add categories field to EventType"
```

---

### Task 2: Add categories to WireEvent schema

**Files:**
- Modify: `modules/ccc-calendar/parsers/events.ts:10-27`

- [ ] **Step 1: Add categories to WireEventSchema**

```typescript
const WireEventSchema = z.object({
	dataSource: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	isAllDay: z.boolean(),
	isMultiDay: z.boolean(),
	isSameInstant: z.boolean(),
	title: z.string(),
	description: z.string(),
	location: z.string().default(''),
	isOngoing: z.boolean(),
	links: z.array(z.string()),
	categories: z.array(z.string()).default([]),
	config: z.object({
		startTime: z.boolean(),
		endTime: z.boolean(),
		subtitle: z.union([z.literal('location'), z.literal('description')]),
	}),
})
```

- [ ] **Step 2: Run type check**

Run: `mise run tsc`
Expected: Type errors remain in tec-events.ts and ical.ts (they don't return categories yet)

- [ ] **Step 3: Commit**

```bash
git add modules/ccc-calendar/parsers/events.ts
git commit -m "Add categories to WireEvent schema"
```

---

### Task 3: Parse categories from TEC API

**Files:**
- Modify: `modules/ccc-calendar/parsers/tec-events.ts`
- Test: `modules/ccc-calendar/__tests__/tec-events.test.ts`

- [ ] **Step 1: Write failing test for category parsing**

Add to `modules/ccc-calendar/__tests__/tec-events.test.ts`:

```typescript
test('extracts category names from the event', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'Concert',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/concert/',
				all_day: false,
				utc_start_date: '2026-08-17 19:00:00',
				utc_end_date: '2026-08-17 21:00:00',
				categories: [
					{name: 'Music Events', slug: 'music-events', id: 54},
					{name: 'Academic Year', slug: 'academic-year', id: 29},
				],
			},
		],
	})
	expect(event.categories).toStrictEqual(['Music Events', 'Academic Year'])
})

test('returns empty categories when none are present', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-17 14:00:00',
			},
		],
	})
	expect(event.categories).toStrictEqual([])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mise run test -- modules/ccc-calendar/__tests__/tec-events.test.ts -t "category"`
Expected: FAIL - categories property doesn't exist

- [ ] **Step 3: Add category schema and parsing**

In `modules/ccc-calendar/parsers/tec-events.ts`, add after line 8:

```typescript
const TecCategorySchema = z.object({
	name: z.string(),
})
```

Modify `TecEventSchema` to include categories:

```typescript
const TecEventSchema = z.object({
	title: z.string(),
	description: z.string(),
	url: z.string(),
	all_day: z.boolean(),
	utc_start_date: z.string(),
	utc_end_date: z.string(),
	venue: VenueSchema,
	categories: z.array(TecCategorySchema).default([]),
})
```

In `toWireEvent` function, add categories to the return object (after `links`):

```typescript
categories: event.categories.map((c) => c.name),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mise run test -- modules/ccc-calendar/__tests__/tec-events.test.ts -t "category"`
Expected: PASS

- [ ] **Step 5: Run full parser test suite**

Run: `mise run test -- modules/ccc-calendar/__tests__/tec-events.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add modules/ccc-calendar/parsers/tec-events.ts modules/ccc-calendar/__tests__/tec-events.test.ts
git commit -m "Parse categories from TEC calendar events"
```

---

### Task 4: Add empty categories to iCal parser

**Files:**
- Modify: `modules/ccc-calendar/parsers/ical.ts:114-131`

- [ ] **Step 1: Add categories to iCal toWireEvent return**

In `toWireEvent` function, add `categories: [],` after the `links` line:

```typescript
return {
	dataSource: 'ical',
	startTime: startIso,
	endTime: endIso,
	isAllDay,
	isMultiDay,
	isSameInstant,
	title: item.summary ?? '',
	description: plainTextDescription(descriptionHtml),
	location: item.location ?? '',
	isOngoing: isBefore(new Date(startIso), startOfDay(now)),
	links: linksIn(descriptionHtml),
	categories: [],
	config: {
		startTime: !(startTime.isDate && endTime.isDate),
		endTime: !(startTime.isDate && endTime.isDate),
		subtitle: 'location',
	},
}
```

- [ ] **Step 2: Run type check**

Run: `mise run tsc`
Expected: PASS (no type errors)

- [ ] **Step 3: Run iCal tests**

Run: `mise run test -- modules/ccc-calendar/__tests__/ical.test.ts`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add modules/ccc-calendar/parsers/ical.ts
git commit -m "Add empty categories to iCal parser"
```

---

### Task 5: Update query.ts to pass categories through

**Files:**
- Modify: `modules/ccc-calendar/query.ts:21-33`

- [ ] **Step 1: Verify convertEvents passes categories**

The `convertEvents` function spreads `...event` and adds moment fields. Since WireEvent now has categories and EventType expects it, this should work. Verify with type check:

Run: `mise run tsc`
Expected: PASS

- [ ] **Step 2: Run all calendar tests**

Run: `mise run test -- modules/ccc-calendar/`
Expected: All tests pass

- [ ] **Step 3: Commit (if any changes needed)**

If no changes needed, skip this commit.

---

### Task 6: Create Zustand store for filter state

**Files:**
- Create: `source/features/calendar/store.ts`
- Create: `source/features/calendar/__tests__/store.test.ts`

- [ ] **Step 1: Write failing test for store**

Create `source/features/calendar/__tests__/store.test.ts`:

```typescript
import {useCalendarFilterStore} from '../store'

beforeEach(() => {
	useCalendarFilterStore.setState({selectedCategories: []})
})

test('starts with no categories selected', () => {
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual([])
})

test('setSelectedCategories replaces the selection', () => {
	let {setSelectedCategories} = useCalendarFilterStore.getState()
	setSelectedCategories(['Music Events', 'Academic Year'])
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual(['Music Events', 'Academic Year'])
})

test('setSelectedCategories can update to a different set', () => {
	useCalendarFilterStore.setState({selectedCategories: ['Music Events', 'Academic Year']})
	let {setSelectedCategories} = useCalendarFilterStore.getState()
	setSelectedCategories(['Lectures'])
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual(['Lectures'])
})

test('clearCategories resets to empty', () => {
	useCalendarFilterStore.setState({selectedCategories: ['Music Events']})
	let {clearCategories} = useCalendarFilterStore.getState()
	clearCategories()
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual([])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mise run test -- source/features/calendar/__tests__/store.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Create the store**

Create `source/features/calendar/store.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

type CalendarFilterStore = {
	selectedCategories: string[]
	setSelectedCategories: (categories: string[]) => void
	clearCategories: () => void
}

export const useCalendarFilterStore = create<CalendarFilterStore>()(
	persist(
		(set) => ({
			selectedCategories: [],
			setSelectedCategories: (categories) => set({selectedCategories: categories}),
			clearCategories: () => set({selectedCategories: []}),
		}),
		{
			name: 'calendar-filter-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mise run test -- source/features/calendar/__tests__/store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add source/features/calendar/store.ts source/features/calendar/__tests__/store.test.ts
git commit -m "Add Zustand store for calendar category filter"
```

---

### Task 7: Add filter UI to Calendar screen

**Files:**
- Modify: `app/(home)/Calendar.tsx`

- [ ] **Step 1: Add imports**

Add to imports:

```typescript
import {useMemo, useState} from 'react'
import {Stack} from 'expo-router'
import {useCalendarFilterStore} from '../../source/features/calendar/store'
import {FilterToolbarButton} from '@frogpond/filter'
import type {ListType} from '@frogpond/filter/types'
```

- [ ] **Step 2: Add filter state and derived values**

Inside `CalendarPage` function, after the existing hooks:

```typescript
let {selectedCategories, setSelectedCategories} = useCalendarFilterStore()

let availableCategories = useMemo(() => {
	let cats = new Set(events.flatMap((e) => e.event.categories))
	return [...cats].sort()
}, [events])

let filteredEvents = useMemo(() => {
	if (selectedCategories.length === 0) return events
	return events.filter(
		(e) =>
			e.event.categories.length === 0 ||
			e.event.categories.some((cat) => selectedCategories.includes(cat)),
	)
}, [events, selectedCategories])

let isFilterActive = selectedCategories.length > 0
```

- [ ] **Step 3: Create filter configuration**

Add after the derived values:

```typescript
let categoryFilter: ListType<SourcedEvent> = {
	type: 'list',
	key: 'categories',
	enabled: isFilterActive,
	spec: {
		title: 'Categories',
		options: availableCategories.map((cat) => ({title: cat, label: cat})),
		selected: selectedCategories.map((cat) => ({title: cat, label: cat})),
		mode: 'OR',
		displayTitle: true,
		presentation: 'sheet',
	},
	apply: {key: 'event'},
}

let handleFilterChange = (filter: ListType<SourcedEvent>) => {
	let newSelected = filter.spec.selected.map((opt) => opt.title)
	setSelectedCategories(newSelected)
}
```

- [ ] **Step 4: Add toolbar button**

Add before the `<EventList.EventList>` component:

```typescript
<Stack.Toolbar placement="right">
	<FilterToolbarButton
		filter={categoryFilter}
		isActive={isFilterActive}
		onChange={handleFilterChange}
		title="Categories"
	/>
</Stack.Toolbar>
```

- [ ] **Step 5: Update EventList to use filtered events**

Change the `events` prop from `events` to `filteredEvents`:

```typescript
<EventList.EventList
	ref={eventListRef}
	events={filteredEvents}
	// ... rest of props
/>
```

- [ ] **Step 6: Run type check**

Run: `mise run tsc`
Expected: PASS

- [ ] **Step 7: Run pre-commit checks**

Run: `mise run agent:pre-commit`
Expected: All checks pass

- [ ] **Step 8: Commit**

```bash
git add app/(home)/Calendar.tsx
git commit -m "Add category filter to Calendar screen"
```

---

### Task 8: Manual verification

- [ ] **Step 1: Start dev server and test on simulator**

Run: `mise run ios`

- [ ] **Step 2: Verify filter button appears**

Navigate to Calendar. Confirm filter button (funnel icon) appears in top right.

- [ ] **Step 3: Verify filter sheet opens**

Tap filter button. Confirm sheet opens with category list.

- [ ] **Step 4: Verify filtering works**

Select a category. Confirm only events with that category show. Select multiple. Confirm OR logic (events matching any selected category show).

- [ ] **Step 5: Verify "All" behavior**

Clear all selections. Confirm all events show.

- [ ] **Step 6: Verify persistence**

Select categories, close app, reopen. Confirm selections persist.

- [ ] **Step 7: Verify device calendar events pass through**

If device calendar is enabled, confirm those events still show regardless of filter.
