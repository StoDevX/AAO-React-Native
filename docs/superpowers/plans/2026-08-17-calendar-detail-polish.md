# Calendar list and detail polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the calendar list and event detail closer to Calendar.app, and add a mini timeline showing where an event falls among its neighbours.

**Architecture:** The list row and the detail masthead are metric fixes to existing SwiftUI components. The detail screen becomes a page sheet with its title in the body and its Add-to-Calendar action in the bottom bar. The timeline splits into a pure geometry module, covered by Jest, and a thin SwiftUI renderer that is not.

**Tech Stack:** React Native 0.86.2, TypeScript, expo-router 57 (`Stack.Toolbar`, `Stack.Screen`), `@expo/ui/swift-ui`, React Query 5, moment-timezone, Jest + React Native Testing Library.

## Global Constraints

- Design doc: `docs/superpowers/specs/2026-08-17-calendar-detail-polish-design.md`. Read it before starting.
- Commit messages: no conventional-commit prefixes, imperative mood, capitalised, no trailing full stop. `Move the Calendars button to the trailing end`, not `feat: move calendars button`.
- Run `mise run agent:pre-commit` before every commit. Do not commit if any step fails.
- TypeScript everywhere, no `any`. Functional components with hooks.
- `StyleSheet.create()` for styles; no inline style objects.
- Colours from `@frogpond/colors`.
- iOS is the only supported platform.
- oxfmt: tabs, single quotes, no semicolons. Let `mise run format` do it rather than hand-formatting.
- **Appearance is not assertable in Jest here.** `modules/event-list/__tests__/expo-ui-mock.tsx` reduces every modifier to `{$type, value}` and no surviving test reads those values back. Do not add tests that assert font sizes, colours, or glyph names — that is the pattern the `audit-mocked-tests` merge removed. Verify appearance on the simulator instead.
- The SwiftUI mock exports only what the module under test imports. Adding a new `@expo/ui` import to a component means adding it to the mock, or the suite fails at load.

## Measured targets

From screenshots of Calendar.app and our app on the same 1179x2556 device. Cap height ÷ 0.72 recovers the point size.

| Thing | Target |
| --- | --- |
| List row subtitle | `subheadline` (15pt), was `footnote` (13pt) |
| List row location glyph | `location.circle`, tracking the text's font |
| Detail title | `title` bold (28pt) — SwiftUI's `.title` is title1; there is no `'title1'` in `@expo/ui`'s `textStyle` union |
| Detail date lines | `body` (17pt) — unchanged |
| Timeline hour spacing | 40pt |
| Timeline hour labels | `caption` (12pt) |
| Timeline window | 4 hourly gridlines from the top of the hour containing the start |

---

### Task 1: Confirm a bottom toolbar renders inside a page sheet

This is a spike, not a feature. Tasks 6 depends on the answer, and the fallback changes that task's shape. It produces no production code.

**Why it is in doubt:** `node_modules/expo-router/ios/Toolbar/RouterToolbarHostView.swift:116` mounts the bottom bar with `controller.navigationController?.setToolbarHidden(false, animated: true)`. That is a `UINavigationController` toolbar. If a screen presented as a page sheet has no `navigationController`, the optional chain no-ops and **nothing renders, with no error**. The whole branch is also inside `if #available(iOS 18.0, *)` with no `else`.

**Files:**
- Modify (temporarily): `app/(home)/_layout.tsx`, `app/(home)/EventDetail.tsx`

- [ ] **Step 1: Make the detail route a page sheet**

In `app/(home)/_layout.tsx`, add a screen entry beside the existing ones:

```tsx
<Stack.Screen name="EventDetail" options={{presentation: 'pageSheet'}} />
```

- [ ] **Step 2: Add a throwaway bottom toolbar to the detail screen**

In `app/(home)/EventDetail.tsx`, beside the existing `Stack.Toolbar placement="right"`:

```tsx
<Stack.Toolbar placement="bottom">
	<Stack.Toolbar.Spacer />
	<Stack.Toolbar.Button onPress={() => {}}>Spike</Stack.Toolbar.Button>
	<Stack.Toolbar.Spacer />
</Stack.Toolbar>
```

- [ ] **Step 3: Build to the simulator and look**

```bash
mise run prebuild
```

Then run the app, open Calendar from the home grid, and tap an event.

Expected: the detail arrives as an inset card with rounded top corners, and a bar across its bottom holds a centred `Spike` button.

- [ ] **Step 4: Record the answer**

Write the result into the design doc under `## Risks`, replacing the paragraph beginning "A bottom toolbar inside a pageSheet is not a shape this codebase has used". State plainly whether it rendered.

If it did **not** render, stop and raise it with Wren before continuing. Task 6 then needs its fallback — a `Button` with `buttonStyle('borderedProminent')` pinned in a final `Section` of the form — and that is a design change, not an implementation detail.

- [ ] **Step 5: Revert the spike**

```bash
git checkout -- app/(home)/_layout.tsx app/(home)/EventDetail.tsx
```

Task 4 adds the presentation properly. Nothing from this task is committed except the design-doc note.

- [ ] **Step 6: Commit the note**

```bash
mise run agent:pre-commit
git add docs/superpowers/specs/2026-08-17-calendar-detail-polish-design.md
git commit -m "Record whether a bottom toolbar renders in a page sheet"
```

---

### Task 2: Move the Calendars button to the trailing end

**Files:**
- Modify: `modules/ccc-calendar/calendar-picker.tsx:52-88`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks rely on.

- [ ] **Step 1: Move the spacer ahead of the menu**

In the returned `Stack.Toolbar`, the `Stack.Toolbar.Spacer` currently sits after `Stack.Toolbar.Menu`. Swap them so the spacer comes first:

```tsx
return (
	<Stack.Toolbar placement="bottom">
		<Stack.Toolbar.Spacer />
		<Stack.Toolbar.Menu accessibilityLabel="Calendars" icon="calendar">
```

and remove the trailing `<Stack.Toolbar.Spacer />` from just before `</Stack.Toolbar>`.

- [ ] **Step 2: Correct the doc comment**

The block comment above `CalendarPicker` contains this paragraph, which is factually wrong — Calendar.app puts `Today` at the leading end and its calendars pill at the trailing end:

```
 * The button sits in the bottom bar, at the left, where Calendar.app keeps its
 * own calendar picker. A flexible `Spacer` after it takes the rest of the bar,
 * which is what leaves the button at that end.
```

Replace it with:

```
 * The button sits at the trailing end of the bottom bar, where Calendar.app
 * keeps its own calendar picker -- `Today` holds the leading end there. A
 * flexible `Spacer` before it takes the rest of the bar, which is what pushes
 * the button to that end.
```

- [ ] **Step 3: Run the tests**

```bash
mise run test -- calendar-picker
```

Expected: PASS. `modules/ccc-calendar/__tests__/calendar-picker.test.tsx` queries the button by its accessibility label, which does not change, so it should be unaffected. If it asserts child order, update it to match — order is behaviour here, not appearance.

- [ ] **Step 4: Commit**

```bash
mise run agent:pre-commit
git add modules/ccc-calendar/calendar-picker.tsx modules/ccc-calendar/__tests__/calendar-picker.test.tsx
git commit -m "Move the Calendars button to the trailing end of the bar"
```

---

### Task 3: Match Apple's metrics on the list row's location line

**Files:**
- Modify: `modules/event-list/event-list-row.tsx:1-18` (imports), `:179-196` (the subtitle line)
- Modify: `modules/event-list/__tests__/expo-ui-mock.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks rely on.

- [ ] **Step 1: Teach the mock about `Label` and `labelStyle`**

`expo-ui-mock.tsx` exports only what the module imports, so `Label` must be added before the component can import it.

Beside the other component stand-ins, add:

```tsx
export function Label({
	title,
	systemImage,
	children,
}: {
	title?: string
	systemImage?: string
	children?: React.ReactNode
}): React.ReactNode {
	return (
		<View>
			{children ?? <RNText>{title}</RNText>}
		</View>
	)
}
```

`systemImage` is accepted and ignored deliberately: the glyph is appearance, and appearance is not assertable here.

Beside the other modifier stand-ins, add:

```tsx
export const labelStyle = modifier('labelStyle')
```

- [ ] **Step 2: Run the existing tests to confirm the mock still loads**

```bash
mise run test -- event-list
```

Expected: PASS, unchanged. This step only proves the mock edit broke nothing.

- [ ] **Step 3: Replace the hand-rolled icon-and-text with a `Label`**

In `event-list-row.tsx`, change the imports — `Label` comes from `@expo/ui/swift-ui`, `labelStyle` from the modifiers path, and `Image` is no longer used:

```tsx
import {Button, HStack, Label, Spacer, Text, VStack} from '@expo/ui/swift-ui'
```

Add `labelStyle` to the modifier import list, and remove `Image`.

Then replace the subtitle branch (currently an `HStack spacing={4}` wrapping an `Image` and a `Text`) with:

```tsx
{subtitle ? (
	<Label
		modifiers={[
			labelStyle('titleAndIcon'),
			font({textStyle: 'subheadline'}),
			foregroundStyle(c.secondaryLabel),
			...SINGLE_LINE,
		]}
		systemImage="location.circle"
		title={subtitle}
	/>
) : null}
```

- [ ] **Step 4: Explain the sizing in a comment**

Above the `Label`, add:

```tsx
{/* A `Label` rather than an `HStack` of `Image` and `Text`: SwiftUI sizes the
    glyph from the label's own font and sits it on the text's baseline, which
    is what `Image`'s `size` prop cannot do. `@expo/ui` documents `size` as
    not scaling with Dynamic Type and as ignored once a `font` modifier is
    supplied, so a fixed 12pt pin was both oversized against `subheadline`
    and off its baseline.

    `subheadline` is measured, not chosen: Calendar.app's location line has a
    32px cap height on a 3x screen against our 28px, which is 15pt to our
    13pt. */}
```

- [ ] **Step 5: Run the tests**

```bash
mise run test -- event-list
```

Expected: PASS. `shows an all-day row’s location too` finds the location by its text, which `Label`'s `title` still renders through the mock.

- [ ] **Step 6: Verify on the simulator**

```bash
mise run prebuild
```

Open Calendar and compare a row carrying a location against the Calendar.app screenshot. The glyph should sit on the text's baseline and be no taller than the capital letters beside it.

- [ ] **Step 7: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/event-list-row.tsx modules/event-list/__tests__/expo-ui-mock.tsx
git commit -m "Size the row's location glyph from its own font"
```

---

### Task 4: Present the event detail as a page sheet

**Files:**
- Modify: `app/(home)/_layout.tsx`
- Modify: `app/(home)/EventDetail.tsx:37-51` (delete `CLEAR_LARGE_TITLE`), `:140-153` (the returned chrome)

**Interfaces:**
- Consumes: the Task 1 answer.
- Produces: a detail screen with no large title, which Task 5 relies on — Task 5 moves the title into the body, and the two together must not leave the name shown twice.

- [ ] **Step 1: Declare the presentation**

In `app/(home)/_layout.tsx`, beside the other `Stack.Screen` entries:

```tsx
{/* `pageSheet` rather than the `modal` the rest of this layout uses.
    `RNSScreen.mm` maps `modal` to `UIModalPresentationAutomatic` and only
    `pageSheet` to `UIModalPresentationPageSheet`. UIKit resolves automatic to
    a page sheet on iPhone today, so the two look alike -- but the inset card
    Calendar.app uses is worth stating outright rather than inheriting. */}
<Stack.Screen name="EventDetail" options={{presentation: 'pageSheet'}} />
```

- [ ] **Step 2: Delete the large-title configuration**

In `app/(home)/EventDetail.tsx`, delete the whole `CLEAR_LARGE_TITLE` constant and its block comment (lines 37-51). With the name moving into the body in Task 5, there is no large title left to clear.

- [ ] **Step 3: Replace the chrome on the success branch**

The final `return` currently opens with `<Stack.Title large={true}>` and `<Stack.Header largeStyle={CLEAR_LARGE_TITLE} />`. Replace both, and add a close button:

```tsx
return (
	<>
		{/* Calendar.app's sheet has no bar: the close and share controls float
		    over content that scrolls under them, each in its own glass pill.
		    `separateBackground` is what gives them a pill apiece rather than
		    one shared bar background. */}
		<Stack.Toolbar placement="left">
			<Stack.Toolbar.Button
				accessibilityLabel="Close"
				icon="xmark"
				onPress={() => router.back()}
				separateBackground={true}
			/>
		</Stack.Toolbar>
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Button
				accessibilityLabel="Share Event"
				icon="square.and.arrow.up"
				onPress={() => shareEvent(event)}
				separateBackground={true}
			/>
		</Stack.Toolbar>
		<EventDetail.EventDetail color={color} event={event} poweredBy={poweredBy} />
	</>
)
```

- [ ] **Step 4: Import the router**

`router.back()` needs it. Change the expo-router import at the top of the file:

```tsx
import {router, Stack, useLocalSearchParams} from 'expo-router'
```

`Stack` is still used by the error and loading branches, which keep their `Stack.Title`.

- [ ] **Step 5: Type-check**

```bash
mise run tsc
```

Expected: PASS. If `separateBackground` is rejected, check `StackHeaderItemSharedProps` in `node_modules/expo-router/build/layouts/stack-utils/toolbar/shared.d.ts` — it is declared there, so a failure means the prop name changed.

- [ ] **Step 6: Run the tests**

```bash
mise run test
```

Expected: PASS. No test renders the route file.

- [ ] **Step 7: Verify on the simulator**

```bash
mise run prebuild
```

Tap an event. It should rise as an inset card. Both the close and share controls should be circular glass pills with no bar behind them. Swipe down and confirm it dismisses to the list.

- [ ] **Step 8: Commit**

```bash
mise run agent:pre-commit
git add app/\(home\)/_layout.tsx app/\(home\)/EventDetail.tsx
git commit -m "Present the event detail as a page sheet"
```

---

### Task 5: Give the masthead the event's title

**Files:**
- Modify: `modules/event-list/event-detail-header.tsx`
- Modify: `modules/event-list/event-detail-view.tsx:37-59`
- Modify: `modules/event-list/__tests__/event-detail-header.test.tsx`

**Interfaces:**
- Consumes: Task 4's screen, which no longer shows the name in a large title.
- Produces: `EventDetailHeader` now takes `{lines, color, title}` where `title: string`. Task 8 does not use it.

- [ ] **Step 1: Write the failing test**

In `modules/event-list/__tests__/event-detail-header.test.tsx`, add:

```tsx
test('it shows the event’s title above the dates', async () => {
	await render(
		<EventDetailHeader
			color="#ff0000"
			lines={[{prefix: 'From', time: '7:45 AM', date: 'Monday, August 17, 2026'}]}
			title="New Faculty Orientation"
		/>,
	)

	expect(screen.getByText('New Faculty Orientation')).toBeOnTheScreen()
})
```

Match the existing file's import list and its `render`/`screen` usage rather than introducing a different style.

- [ ] **Step 2: Run it to watch it fail**

```bash
mise run test -- event-detail-header
```

Expected: FAIL — `title` is not a prop yet, so nothing renders that text.

- [ ] **Step 3: Add the title to the header**

In `event-detail-header.tsx`, add `title: string` to `Props`, destructure it, and render it as the first child of the text `VStack`, above the `lines.map(...)`:

```tsx
<Text
	modifiers={[
		font({textStyle: 'title', weight: 'bold'}),
		foregroundStyle(c.label),
	]}
>
	{title}
</Text>
```

- [ ] **Step 4: Update the doc comment**

The comment above `EventDetailHeader` currently says the event's name "is not here: it is the screen's native large title". That is no longer true. Replace that paragraph with:

```
 * The event's name leads the masthead, with the date range beneath it and an
 * accent bar flanking both -- Calendar.app's sheet shape. The name sat in the
 * screen's native large title until the screen became a sheet, which has no
 * bar to carry one.
 *
 * `title` is measured from Calendar.app: a 59px cap height on a 3x screen is
 * 28pt, which is SwiftUI's `.title`.
```

- [ ] **Step 5: Guard the empty-lines early return**

The component returns `null` when `lines.length === 0`. That would now swallow the title too. Change the guard so it only skips the dates:

```tsx
{lines.map((line, index) => (
	<TimeLine key={`${line.prefix}-${index}`} line={line} />
))}
```

renders nothing on its own when `lines` is empty, so delete the `if (lines.length === 0) return null` block entirely.

The existing test `it renders nothing without any lines` must change with it — an event with no parseable dates still has a name worth showing. Rewrite it:

```tsx
test('it shows the title even when there are no dates', async () => {
	await render(<EventDetailHeader color="#ff0000" lines={[]} title="Laundry Day" />)

	expect(screen.getByText('Laundry Day')).toBeOnTheScreen()
})
```

- [ ] **Step 6: Pass the title through the view**

In `event-detail-view.tsx`, the `EventDetailHeader` call becomes:

```tsx
<EventDetailHeader color={color} lines={lines} title={event.title} />
```

- [ ] **Step 7: Run the tests**

```bash
mise run test -- event-detail
```

Expected: PASS, including `event-detail-view.test.tsx`.

- [ ] **Step 8: Verify on the simulator**

```bash
mise run prebuild
```

The sheet should lead with the event's name in large bold type, the dates beneath it, and one accent bar spanning both. The name must appear exactly once — if it also shows in a bar, Task 4's deletion was incomplete.

- [ ] **Step 9: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/event-detail-header.tsx modules/event-list/event-detail-view.tsx modules/event-list/__tests__/event-detail-header.test.tsx
git commit -m "Lead the event masthead with the event's name"
```

---

### Task 6: Move Add to Calendar into the bottom bar

Do not start this until Task 1 has confirmed a bottom toolbar renders in a page sheet.

**Files:**
- Modify: `modules/event-list/event-detail-view.tsx:72-89` (remove the section)
- Modify: `app/(home)/EventDetail.tsx` (add the toolbar)
- Modify: `modules/event-list/__tests__/event-detail-view.test.tsx`

**Interfaces:**
- Consumes: Task 4's `color` binding, already computed at `EventDetail.tsx:90`.
- Produces: nothing later tasks rely on.

- [ ] **Step 1: Delete the add-to-calendar section from the view**

In `event-detail-view.tsx`, remove the whole `<AddToCalendar ... />` block and its `render` prop, and drop the now-unused imports: `AddToCalendar`, `Button`, `accessibilityLabel`, `buttonStyle`, and `disabled as disabledModifier`.

Leave `Section`, `Text`, `Link`, `Form`, `Host`, `VStack` — the other sections still use them.

- [ ] **Step 2: Update the view's test**

`event-detail-view.test.tsx` has `it offers an add-to-calendar button`. The button no longer lives in this component, so the test belongs with it. Delete that test from this file. Do not replace it with an assertion that the button is absent — that asserts nothing about where it went.

- [ ] **Step 3: Run the view's tests**

```bash
mise run test -- event-detail-view
```

Expected: PASS with one fewer test.

- [ ] **Step 4: Add the bottom toolbar to the route**

In `app/(home)/EventDetail.tsx`, import the module:

```tsx
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
```

and add this inside the success branch's fragment, after the two existing toolbars:

```tsx
{/* `AddToCalendar` is headless -- its render prop returns whatever chrome we
    want, so the toolbar goes here rather than the module changing.

    `compactMessages` is what keeps the label short enough for a bar item:
    the button carries its own state as its title, `Add to Calendar` ->
    `Saving…` -> `Saved`, and then disables. That is why losing the section
    footer the message used to sit in costs nothing.

    Label-only and per-item tint are both real on iOS: `RouterToolbarItemView`
    sets `item.title` with `item.image = nil` when no icon is given, and
    applies `customTintColor` per item. */}
<AddToCalendar
	compactMessages={true}
	event={event}
	render={({message, disabled, onPress}) => (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.Button
				accessibilityLabel="Add to calendar"
				disabled={disabled}
				onPress={onPress}
				tintColor={color}
			>
				{message || 'Add to Calendar'}
			</Stack.Toolbar.Button>
			<Stack.Toolbar.Spacer />
		</Stack.Toolbar>
	)}
/>
```

- [ ] **Step 5: Type-check**

```bash
mise run tsc
```

Expected: PASS. `color` is `ColorValue`, which `tintColor` accepts.

- [ ] **Step 6: Run the whole suite**

```bash
mise run test
```

Expected: PASS.

- [ ] **Step 7: Verify on the simulator**

```bash
mise run prebuild
```

Open an event. The bar should hold one centred, text-only button tinted the same colour as the masthead's accent bar. Tap it: the label should pass through `Saving…` and settle on `Saved`, disabled. Open an event from a different calendar and confirm the tint differs.

- [ ] **Step 8: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/event-detail-view.tsx modules/event-list/__tests__/event-detail-view.test.tsx app/\(home\)/EventDetail.tsx
git commit -m "Put Add to Calendar in the sheet's bottom bar"
```

---

### Task 7: The timeline's geometry

Pure functions only. This is the half of the timeline that Jest can cover, so it is written test-first and covered properly.

**Files:**
- Create: `modules/event-list/timeline.ts`
- Create: `modules/event-list/__tests__/timeline.test.ts`
- Modify: `modules/event-list/times.ts` (export `isAllDay`)

**Interfaces:**
- Consumes: `SourcedEvent` from `./types`, `EventType` from `@frogpond/event-type`.
- Produces, all used by Task 8:
  - `HOUR_HEIGHT: number` (40), `WINDOW_HOURS: number` (4), `WINDOW_HEIGHT: number` (160), `MIN_BLOCK_HEIGHT: number` (20)
  - `interface TimelineWindow {start: Moment; end: Moment; hours: Moment[]}`
  - `timelineWindow(event: EventType): TimelineWindow | null`
  - `interface TimelineBlock {key: string; sourceId: string; event: EventType; top: number; height: number; column: number; columnCount: number}`
  - `timelineEntries(current: SourcedEvent, neighbours: readonly SourcedEvent[]): SourcedEvent[]`
  - `timelineBlocks(window: TimelineWindow, entries: readonly SourcedEvent[]): TimelineBlock[]`

- [ ] **Step 1: Export an all-day test from `times.ts`**

`times.ts` decides all-day inside a private `classify`. The timeline needs the same rule, and two copies would drift. Add above `classify`:

```ts
/**
 * All-day is the source's own statement rather than a duration -- see
 * `classify` below for why a duration test cannot serve both EventKit and the
 * web sources. Exported because the timeline needs the same answer.
 */
export function isAllDay(event: EventType): boolean {
	return !event.config.startTime && !event.config.endTime
}
```

and change `classify` to use it:

```ts
	return {
		allDay: isAllDay(event),
```

- [ ] **Step 2: Confirm nothing broke**

```bash
mise run test -- times
```

Expected: PASS, unchanged.

- [ ] **Step 3: Write the failing tests**

Create `modules/event-list/__tests__/timeline.test.ts`:

```ts
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import type {EventType} from '@frogpond/event-type'

import {
	HOUR_HEIGHT,
	timelineBlocks,
	timelineEntries,
	timelineWindow,
	WINDOW_HEIGHT,
} from '../timeline'

/**
 * Local-time strings, deliberately without a `Z`: the window is computed with
 * `startOf('hour')` in local time, so a UTC literal would make these
 * assertions depend on the machine's timezone.
 */
function makeEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: moment('2026-08-17T07:45:00'),
		endTime: moment('2026-08-17T08:45:00'),
		isOngoing: false,
		links: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

function entry(sourceId: string, key: string, overrides: Partial<EventType> = {}) {
	return {sourceId, key, event: makeEvent(overrides)}
}

describe('timelineWindow', () => {
	test('it begins at the top of the hour holding the start', () => {
		let window = timelineWindow(makeEvent())

		expect(window?.start.format('HH:mm')).toBe('07:00')
	})

	test('it spans four hourly gridlines', () => {
		let window = timelineWindow(makeEvent())

		expect(window?.hours.map((hour) => hour.format('HH:mm'))).toEqual([
			'07:00',
			'08:00',
			'09:00',
			'10:00',
		])
	})

	test('an all-day event has no window, having no position', () => {
		let allDay = makeEvent({config: {startTime: false, endTime: false, subtitle: 'location'}})

		expect(timelineWindow(allDay)).toBeNull()
	})
})

describe('timelineBlocks', () => {
	test('a block sits proportionally below the window top', () => {
		let window = timelineWindow(makeEvent())
		let [block] = timelineBlocks(window!, [entry('stolaf', 'a')])

		// 07:45 is three quarters of an hour past the 07:00 window top.
		expect(block.top).toBe(0.75 * HOUR_HEIGHT)
		expect(block.height).toBe(HOUR_HEIGHT)
	})

	test('an event running past the window is clipped at its foot', () => {
		let window = timelineWindow(makeEvent())
		let long = entry('stolaf', 'a', {endTime: moment('2026-08-20T18:00:00')})
		let [block] = timelineBlocks(window!, [long])

		expect(block.top + block.height).toBe(WINDOW_HEIGHT)
	})

	test('an event starting before the window is clipped at its head', () => {
		let window = timelineWindow(makeEvent())
		let early = entry('stolaf', 'a', {
			startTime: moment('2026-08-17T05:00:00'),
			endTime: moment('2026-08-17T07:30:00'),
		})
		let [block] = timelineBlocks(window!, [early])

		expect(block.top).toBe(0)
		expect(block.height).toBe(0.5 * HOUR_HEIGHT)
	})

	test('an event outside the window is dropped', () => {
		let window = timelineWindow(makeEvent())
		let later = entry('stolaf', 'b', {
			startTime: moment('2026-08-17T14:00:00'),
			endTime: moment('2026-08-17T15:00:00'),
		})

		expect(timelineBlocks(window!, [later])).toEqual([])
	})

	test('an all-day event is dropped, having no position', () => {
		let window = timelineWindow(makeEvent())
		let allDay = entry('stolaf', 'b', {
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		expect(timelineBlocks(window!, [allDay])).toEqual([])
	})

	test('a very short event keeps a legible height', () => {
		let window = timelineWindow(makeEvent())
		let brief = entry('stolaf', 'a', {endTime: moment('2026-08-17T07:50:00')})
		let [block] = timelineBlocks(window!, [brief])

		// Five minutes is 3.3pt at 40pt/hour, too short to read.
		expect(block.height).toBe(20)
	})

	test('overlapping events split into side-by-side columns', () => {
		let window = timelineWindow(makeEvent())
		let blocks = timelineBlocks(window!, [
			entry('stolaf', 'a'),
			entry('northfield', 'b', {
				startTime: moment('2026-08-17T08:00:00'),
				endTime: moment('2026-08-17T09:00:00'),
			}),
		])

		expect(blocks.map((block) => block.column)).toEqual([0, 1])
		expect(blocks.every((block) => block.columnCount === 2)).toBe(true)
	})

	test('events that do not overlap share one column', () => {
		let window = timelineWindow(makeEvent())
		let blocks = timelineBlocks(window!, [
			entry('stolaf', 'a'),
			entry('northfield', 'b', {
				startTime: moment('2026-08-17T09:00:00'),
				endTime: moment('2026-08-17T10:00:00'),
			}),
		])

		expect(blocks.map((block) => block.column)).toEqual([0, 0])
		expect(blocks.every((block) => block.columnCount === 1)).toBe(true)
	})

	test('a block is keyed by source and event together', () => {
		let window = timelineWindow(makeEvent())
		let [block] = timelineBlocks(window!, [entry('stolaf', 'a')])

		// The same event can reach the list from two merged calendars, so the
		// event key alone collides -- as it does in the list's rows.
		expect(block.key).toBe('stolaf|a')
	})
})

describe('timelineEntries', () => {
	test('it puts the current event among its neighbours', () => {
		let current = entry('stolaf', 'a')
		let neighbour = entry('northfield', 'b')

		expect(timelineEntries(current, [neighbour])).toEqual([current, neighbour])
	})

	test('it does not draw the current event twice', () => {
		let current = entry('stolaf', 'a')

		// The merged list holds the current event already whenever its calendar
		// is switched on, which is the usual case.
		expect(timelineEntries(current, [entry('stolaf', 'a'), entry('northfield', 'b')])).toHaveLength(
			2,
		)
	})
})
```

- [ ] **Step 4: Run them to watch them fail**

```bash
mise run test -- timeline
```

Expected: FAIL — `Cannot find module '../timeline'`.

- [ ] **Step 5: Write the implementation**

Create `modules/event-list/timeline.ts`:

```ts
import type {Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {isAllDay} from './times'
import type {SourcedEvent} from './types'

/**
 * Measured from Calendar.app: hour labels fall 120px apart on a 3x screen.
 */
export const HOUR_HEIGHT = 40

/**
 * Calendar.app draws four hourly gridlines, the first at the top of the hour
 * holding the event's start -- so an event never shows the hour before it.
 */
export const WINDOW_HOURS = 4

export const WINDOW_HEIGHT = WINDOW_HOURS * HOUR_HEIGHT

/**
 * Below this a block cannot carry its own title, so a fifteen-minute event
 * would draw as an unreadable sliver.
 */
export const MIN_BLOCK_HEIGHT = 20

export interface TimelineWindow {
	start: Moment
	end: Moment
	hours: Moment[]
}

export interface TimelineBlock {
	key: string
	sourceId: string
	event: EventType
	top: number
	height: number
	column: number
	columnCount: number
}

/**
 * The four-hour span an event's timeline covers, or `null` for an all-day
 * event -- which has no position to draw.
 */
export function timelineWindow(event: EventType): TimelineWindow | null {
	if (isAllDay(event)) {
		return null
	}

	let start = event.startTime.clone().startOf('hour')
	let hours = Array.from({length: WINDOW_HOURS}, (_, index) =>
		start.clone().add(index, 'hours'),
	)

	return {start, end: start.clone().add(WINDOW_HOURS, 'hours'), hours}
}

function offsetIn(window: TimelineWindow, time: Moment): number {
	return (time.diff(window.start, 'minutes') / 60) * HOUR_HEIGHT
}

function clamp(value: number, low: number, high: number): number {
	return Math.min(Math.max(value, low), high)
}

/**
 * The current event alongside its neighbours, without drawing it twice.
 *
 * The merged list already holds it whenever its calendar is switched on, which
 * is the usual case -- but not the only one, so it leads the list rather than
 * being assumed present.
 */
export function timelineEntries(
	current: SourcedEvent,
	neighbours: readonly SourcedEvent[],
): SourcedEvent[] {
	let isCurrent = (entry: SourcedEvent) =>
		entry.sourceId === current.sourceId && entry.key === current.key

	return [current, ...neighbours.filter((entry) => !isCurrent(entry))]
}

/**
 * Every entry that shows in the window, positioned and assigned a column.
 *
 * Columns come from a greedy sweep in start order: each block takes the first
 * column free at its top edge. `columnCount` is the widest the window ever
 * gets rather than per-cluster, so every block in one timeline is the same
 * width -- simpler, and indistinguishable over a span this short.
 */
export function timelineBlocks(
	window: TimelineWindow,
	entries: readonly SourcedEvent[],
): TimelineBlock[] {
	let positioned = entries
		.filter((entry) => !isAllDay(entry.event))
		.filter(
			(entry) =>
				entry.event.startTime.isBefore(window.end) && entry.event.endTime.isAfter(window.start),
		)
		.map((entry) => {
			let top = clamp(offsetIn(window, entry.event.startTime), 0, WINDOW_HEIGHT)
			let foot = clamp(offsetIn(window, entry.event.endTime), 0, WINDOW_HEIGHT)

			return {
				key: `${entry.sourceId}|${entry.key}`,
				sourceId: entry.sourceId,
				event: entry.event,
				top,
				height: Math.max(foot - top, MIN_BLOCK_HEIGHT),
			}
		})
		.sort((one, two) => one.top - two.top)

	let columnFeet: number[] = []
	let assigned = positioned.map((block) => {
		let column = columnFeet.findIndex((foot) => foot <= block.top)
		if (column === -1) {
			column = columnFeet.length
		}
		columnFeet[column] = block.top + block.height
		return {...block, column}
	})

	let columnCount = Math.max(columnFeet.length, 1)
	return assigned.map((block) => ({...block, columnCount}))
}
```

- [ ] **Step 6: Run them to watch them pass**

```bash
mise run test -- timeline
```

Expected: PASS, all fourteen.

- [ ] **Step 7: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/timeline.ts modules/event-list/__tests__/timeline.test.ts modules/event-list/times.ts
git commit -m "Compute where an event falls among its neighbours"
```

---

### Task 8: Draw the timeline

**Files:**
- Create: `modules/event-list/event-timeline.tsx`
- Modify: `modules/event-list/event-detail-view.tsx`
- Modify: `modules/event-list/__tests__/expo-ui-mock.tsx`
- Modify: `app/(home)/EventDetail.tsx`

**Interfaces:**
- Consumes: everything Task 7 produces.
- Produces: `EventTimeline`, taking `{window, blocks, colorFor}` where `colorFor: (sourceId: string) => ColorValue`.

- [ ] **Step 1: Add `ZStack` to the mock**

`expo-ui-mock.tsx` needs it before the component can import it:

```tsx
export function ZStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
```

Add `offset` beside the other modifier stand-ins:

```tsx
export const offset = modifier('offset')
```

- [ ] **Step 2: Write the component**

Create `modules/event-list/event-timeline.tsx`:

```tsx
import * as React from 'react'
import type {ColorValue} from 'react-native'
import {HStack, Label, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	background,
	clipShape,
	font,
	foregroundStyle,
	frame,
	offset,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {
	HOUR_HEIGHT,
	type TimelineBlock,
	type TimelineWindow,
	WINDOW_HEIGHT,
} from './timeline'
import {listTimeLines} from './times'

/**
 * The width the hour labels take, leaving the rest for blocks. Fixed, because
 * `@expo/ui` exposes no `GeometryReader` -- there is nothing to measure
 * against, so every position here is computed rather than laid out.
 */
const LABEL_COLUMN = 56

const BLOCK_GAP = 2

/**
 * The width the blocks share, beside the label column.
 *
 * A constant because there is nothing to measure against: `@expo/ui` exposes
 * no `GeometryReader`, so the card's usable width cannot be read at runtime.
 * Tuned on the simulator against a grouped `Form`'s content width.
 */
const BLOCK_AREA_WIDTH = 200

type Props = {
	window: TimelineWindow
	blocks: TimelineBlock[]
	/**
	 * The tint for a block, by the calendar it came from -- the same mapping
	 * the list's rows use, passed in rather than derived: this component knows
	 * events, not which calendars are switched on.
	 */
	colorFor: (sourceId: string) => ColorValue
}

function HourLabel({hour, index}: {hour: string; index: number}): React.ReactNode {
	return (
		<Text
			modifiers={[
				font({textStyle: 'caption'}),
				foregroundStyle(c.secondaryLabel),
				offset({y: index * HOUR_HEIGHT}),
			]}
		>
			{hour}
		</Text>
	)
}

function Block({
	block,
	color,
	width,
}: {
	block: TimelineBlock
	color: ColorValue
	width: number
}): React.ReactNode {
	let {start} = listTimeLines(block.event)
	let location = block.event[block.event.config.subtitle]?.trim()

	return (
		<VStack
			alignment="leading"
			modifiers={[
				frame({minWidth: width, maxWidth: width, minHeight: block.height, maxHeight: block.height}),
				padding({all: 4}),
				background(color),
				clipShape('roundedRectangle'),
				offset({x: block.column * (width + BLOCK_GAP), y: block.top}),
			]}
		>
			<Text modifiers={[font({textStyle: 'caption', weight: 'semibold'})]}>
				{block.event.title}
			</Text>
			{location ? (
				<Label
					modifiers={[font({textStyle: 'caption2'})]}
					systemImage="location.circle"
					title={location}
				/>
			) : null}
			<Text modifiers={[font({textStyle: 'caption2'})]}>{start}</Text>
		</VStack>
	)
}

/**
 * Where the event falls in its own morning or afternoon, with whatever else is
 * on at the time -- the scheduling context Calendar.app's detail sheet gives.
 *
 * Everything is positioned by `offset` against a fixed 40pt hour rather than
 * laid out, because `@expo/ui` has no `GeometryReader` to measure with. The
 * geometry itself lives in `timeline.ts`, where Jest can reach it: appearance
 * here is verified on the simulator.
 */
export function EventTimeline({window, blocks, colorFor}: Props): React.ReactNode {
	let columnCount = Math.max(blocks[0]?.columnCount ?? 1, 1)
	let blockWidth = (BLOCK_AREA_WIDTH - BLOCK_GAP * (columnCount - 1)) / columnCount

	return (
		<HStack alignment="top" spacing={8}>
			<ZStack modifiers={[frame({minWidth: LABEL_COLUMN, maxWidth: LABEL_COLUMN})]}>
				{window.hours.map((hour, index) => (
					<HourLabel hour={hour.format('HH:mm')} index={index} key={hour.toISOString()} />
				))}
			</ZStack>

			<ZStack modifiers={[frame({minHeight: WINDOW_HEIGHT, maxHeight: WINDOW_HEIGHT})]}>
				{blocks.map((block) => (
					<Block
						block={block}
						color={colorFor(block.sourceId)}
						key={block.key}
						width={blockWidth}
					/>
				))}
			</ZStack>
		</HStack>
	)
}
```

- [ ] **Step 3: Slot it into the detail view**

In `event-detail-view.tsx`, add two optional props to `Props`:

```tsx
	/**
	 * The event's neighbours, already positioned. Absent for a source with no
	 * surrounding-events query behind it -- the radio schedules -- and for an
	 * all-day event, which has no position to draw.
	 */
	timeline?: {window: TimelineWindow; blocks: TimelineBlock[]}
	colorFor?: (sourceId: string) => ColorValue
```

and render it after the Description section, before Links:

```tsx
{props.timeline && props.colorFor ? (
	<Section>
		<EventTimeline
			blocks={props.timeline.blocks}
			colorFor={props.colorFor}
			window={props.timeline.window}
		/>
	</Section>
) : null}
```

Import `EventTimeline`, and the two types from `./timeline`.

- [ ] **Step 4: Compute the timeline in the route**

In `app/(home)/EventDetail.tsx`, add to the imports:

```tsx
import {useCalendarSources, useMergedEvents} from '@frogpond/ccc-calendar'
import {timelineBlocks, timelineEntries, timelineWindow} from '@frogpond/event-list'
```

and, after the `color` binding and before the early returns — hooks must not sit behind a conditional:

```tsx
// The same cached month the list reads, under the same query keys, so
// arriving from the list costs no fetch.
let {enabled} = useCalendarSources()
let {events: neighbours} = useMergedEvents(enabled)

let colorFor = React.useMemo(() => {
	let table = new Map(enabled.map((source) => [source.id, source.color]))
	return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
}, [enabled])

// The radio schedules route here too, and their events never enter
// `useCalendarSources` -- so there are no neighbours to draw and no timeline.
// `timelineWindow` rules out all-day events on its own, by returning null.
let isCalendarSource = deviceSource || REMOTE_SOURCE_IDS.has(source)
let window = event && isCalendarSource ? timelineWindow(event) : null
let timeline =
	window && event
		? {
				window,
				blocks: timelineBlocks(
					window,
					// `eventKey` here is the route param destructured at the top of
					// the component, not the `eventKey` helper event-list exports.
					timelineEntries({sourceId: source, key: eventKey, event}, neighbours),
				),
			}
		: undefined
```

and add near the other constants at the top of the file:

```tsx
/**
 * The sources that contribute to the merged calendar, and so have neighbours
 * to show. KSTO's and KRLX's broadcast schedules do not.
 */
const REMOTE_SOURCE_IDS = new Set(['stolaf', 'northfield'])
```

- [ ] **Step 5: Pass it down**

```tsx
<EventDetail.EventDetail
	color={color}
	colorFor={colorFor}
	event={event}
	poweredBy={poweredBy}
	timeline={timeline}
/>
```

- [ ] **Step 6: Export the new module**

In `modules/event-list/index.ts`:

```ts
export {timelineBlocks, timelineEntries, timelineWindow} from './timeline'
export type {TimelineBlock, TimelineWindow} from './timeline'
```

- [ ] **Step 7: Type-check and test**

```bash
mise run tsc
mise run test
```

Expected: PASS. If `event-detail-view.test.tsx` fails to load, the mock is missing `ZStack` or `offset` — Step 1.

- [ ] **Step 8: Verify on the simulator**

```bash
mise run prebuild
```

Check all four cases against the screenshots:

1. A timed St. Olaf event shows four hour labels from the top of its own hour, and its block sits proportionally below the first.
2. A multi-day event's block runs to the foot of the card and stops.
3. An all-day event shows no timeline at all.
4. A KSTO or KRLX schedule entry shows no timeline at all.

Then switch on a second calendar in the picker and open an event that overlaps one on the other calendar. Both blocks should show side by side, each in its own calendar's colour.

- [ ] **Step 9: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/event-timeline.tsx modules/event-list/event-detail-view.tsx modules/event-list/index.ts modules/event-list/__tests__/expo-ui-mock.tsx app/\(home\)/EventDetail.tsx
git commit -m "Show where an event falls among its neighbours"
```

---

## Notes for the implementer

**`BLOCK_AREA_WIDTH` in Task 8 is tuned, not derived.** 200 is a starting value for the card's usable width, which cannot be measured without a `GeometryReader`. Check it on the simulator in Task 8 Step 8 and adjust; if two columns overflow the card, that is the number to change. Say so in the commit message if you change it.

**Do not add tests that assert appearance.** Several steps above are verified only on the simulator. That is deliberate, and matches what the `audit-mocked-tests` merge established. If you find yourself writing `expect(...modifiers...)`, stop.

**Task 1 gates Task 6.** If the bottom toolbar does not render in a page sheet, Task 6 needs a different shape and Wren needs to decide it.
