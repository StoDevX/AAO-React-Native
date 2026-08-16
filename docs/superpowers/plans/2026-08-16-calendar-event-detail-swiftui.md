# Calendar Event Detail in SwiftUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the calendar event detail screen on `@expo/ui/swift-ui`, leading with a title-and-date header instead of `EVENT` and `TIME` rows.

**Architecture:** `EventDetail` keeps its `{event, poweredBy}` props and stays the only presentational component the route knows about, so the four event sources reach it unchanged. A `Host` wraps a `Form`; the header splits into its own component taking two plain strings. `AddToCalendar` is already a render-prop component, so a SwiftUI `Button` substitutes for the current `ButtonCell` with no change to that module.

**Tech Stack:** React Native 0.86.2, TypeScript, `@expo/ui` 57.0.9 (`swift-ui`), Jest + React Native Testing Library, expo-router.

## Global Constraints

- Formatting is oxfmt: tabs, single quotes, no semicolons. Run `mise run format` rather than hand-aligning.
- TypeScript for all new code — no `any`.
- Files are kebab-case; components are PascalCase; constants are UPPER_SNAKE_CASE.
- Colours come from `@frogpond/colors`, imported as `import * as c from '@frogpond/colors'`.
- **Never pass a bare string to an `@expo/ui` slot prop** (`Section`'s `footer` and `header`, and any other `SwiftUIContent`). A raw string in a slot crashes the app at mount, and neither `tsc` nor Jest catches it. Always wrap in `<Text>`.
- `@expo/ui/swift-ui` cannot load under Jest — importing it reaches expo-modules-core's native bindings. Every test touching these components must `jest.mock` both `@expo/ui/swift-ui` and `@expo/ui/swift-ui/modifiers`.
- Run `mise run agent:pre-commit` before every commit. Do not commit if any step fails.
- Do not modify `modules/tableview/cells/selectable.tsx`. CourseDetail, JobDetail and StudentOrgs still use it.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `modules/event-list/__tests__/expo-ui-mock.tsx` | Create. Narrow Jest stand-in for the `@expo/ui` views this screen uses. |
| `modules/event-list/event-detail-header.tsx` | Create. Accent bar, title, date range. Takes two strings. |
| `modules/event-list/__tests__/event-detail-header.test.tsx` | Create. |
| `modules/event-list/event-detail-view.tsx` | Rewrite. The `Host`/`Form` composition. |
| `modules/event-list/__tests__/event-detail-view.test.tsx` | Create. |
| `app/(home)/EventDetail.tsx` | Modify. Nav title becomes the short calendar name. |

---

### Task 1: A narrow `@expo/ui` mock for this module

The map feature has its own mock at `source/features/map/__tests__/expo-ui-mock.tsx`, deliberately exporting only what that feature imports. Follow the same convention with a separate, equally narrow one rather than widening the map's.

**Files:**
- Create: `modules/event-list/__tests__/expo-ui-mock.tsx`

**Interfaces:**
- Produces: `Host`, `Form`, `Section`, `Text`, `VStack`, `HStack`, `Link` components; `font`, `foregroundColor`, `textSelection`, `frame`, `background`, `multilineTextAlignment`, `accessibilityLabel`, `buttonStyle`, `contentShape`, `shapes`, `listRowInsets` modifier factories; `Button`.

- [ ] **Step 1: Write the mock**

```tsx
import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/// `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
/// reaches expo-modules-core's native bindings, which do not exist in the test
/// runtime -- so a component that renders SwiftUI is untestable without a
/// stand-in. This one covers the views the event detail uses, rendering each as
/// the React Native view closest to what it does natively.
///
/// Deliberately narrow, matching the map feature's mock: it exports what this
/// module imports and nothing else.

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

const modifier =
	($type: string) =>
	(value?: unknown): Modifier => ({$type, value})

export const font = modifier('font')
export const foregroundColor = modifier('foregroundColor')
export const textSelection = modifier('textSelection')
export const frame = modifier('frame')
export const background = modifier('background')
export const multilineTextAlignment = modifier('multilineTextAlignment')
export const buttonStyle = modifier('buttonStyle')
export const contentShape = modifier('contentShape')
export const listRowInsets = modifier('listRowInsets')

export const accessibilityLabel = (label: string): Modifier => ({
	$type: 'accessibilityLabel',
	label,
})

export const shapes = {rectangle: (): Modifier => ({$type: 'rectangle'})}

function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifiers?.find((m) => m.$type === 'accessibilityLabel')
	return typeof found?.label === 'string' ? found.label : undefined
}

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Form({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function VStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function HStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Text({children, modifiers}: WithModifiers): React.ReactNode {
	return <RNText accessibilityLabel={labelOf(modifiers)}>{children}</RNText>
}

/// `title` renders as text so a test can assert a section is present, and
/// `footer` renders its slot content so the "Add to calendar" status message
/// is queryable.
export function Section({
	children,
	title,
	footer,
}: WithModifiers & {title?: string; footer?: React.ReactNode}): React.ReactNode {
	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{children}
			{footer}
		</View>
	)
}

export function Link({label, destination}: {label?: string; destination: string}): React.ReactNode {
	return <RNText accessibilityLabel={destination}>{label ?? destination}</RNText>
}

export function Button({
	children,
	onPress,
	modifiers,
}: WithModifiers & {onPress?: () => void}): React.ReactNode {
	return (
		<Pressable accessibilityLabel={labelOf(modifiers)} onPress={onPress}>
			{children}
		</Pressable>
	)
}
```

- [ ] **Step 2: Verify it compiles and is formatted**

Run: `mise run tsc && mise run format:check`
Expected: both pass. The mock has no test of its own; Task 2 exercises it.

- [ ] **Step 3: Commit**

```bash
git add modules/event-list/__tests__/expo-ui-mock.tsx
git commit -m "Add an @expo/ui test stand-in for the event list"
```

---

### Task 2: The header component

**Files:**
- Create: `modules/event-list/event-detail-header.tsx`
- Test: `modules/event-list/__tests__/event-detail-header.test.tsx`

**Interfaces:**
- Consumes: the mock from Task 1.
- Produces: `EventDetailHeader({title, times}: {title: string; times: string}): React.ReactNode`, exported from `modules/event-list/event-detail-header.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {EventDetailHeader} from '../event-detail-header'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

describe('EventDetailHeader', () => {
	test('it shows the title and the date range', async () => {
		await render(
			<EventDetailHeader times="Aug. 17 9:00 AM to Aug. 20 6:00 PM" title="New Faculty Orientation" />,
		)

		expect(screen.getByText('New Faculty Orientation')).toBeTruthy()
		expect(screen.getByText('Aug. 17 9:00 AM to Aug. 20 6:00 PM')).toBeTruthy()
	})

	test('it omits the date range when there is none', async () => {
		await render(<EventDetailHeader times="" title="All-Day Thing" />)

		expect(screen.getByText('All-Day Thing')).toBeTruthy()
		expect(screen.queryByTestId('event-detail-times')).toBeNull()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest modules/event-list/__tests__/event-detail-header.test.tsx --verbose --reporters=default`
Expected: FAIL — cannot find module `../event-detail-header`.

- [ ] **Step 3: Write the component**

```tsx
import * as React from 'react'
import {HStack, Text, VStack} from '@expo/ui/swift-ui'
import {background, font, foregroundColor, frame} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

type Props = {
	title: string
	times: string
}

/// The accent bar is a fixed tint rather than an event colour: `EventType`
/// carries none, and the list's own bar is a plain separator.
export function EventDetailHeader({title, times}: Props): React.ReactNode {
	return (
		<HStack modifiers={[frame({height: undefined})]}>
			<VStack modifiers={[frame({width: 4}), background(c.systemBlue)]} />
			<VStack>
				<Text modifiers={[font({size: 22, weight: 'bold'}), foregroundColor(c.label)]}>{title}</Text>
				{times ? (
					<Text
						modifiers={[font({size: 15}), foregroundColor(c.secondaryLabel)]}
						testID="event-detail-times"
					>
						{times}
					</Text>
				) : null}
			</VStack>
		</HStack>
	)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest modules/event-list/__tests__/event-detail-header.test.tsx --verbose --reporters=default`
Expected: PASS, 2 tests.

If `testID` does not survive the mock, add `testID` passthrough to the mock's `Text` (`<RNText testID={testID}>`) rather than changing the assertion to a text query — the point of the second test is that the element is absent, not that its text is empty.

- [ ] **Step 5: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/event-detail-header.tsx modules/event-list/__tests__/event-detail-header.test.tsx
git commit -m "Add the event detail header"
```

---

### Task 3: The detail view

**Files:**
- Modify: `modules/event-list/event-detail-view.tsx` (full rewrite of the render body)
- Test: `modules/event-list/__tests__/event-detail-view.test.tsx`

**Interfaces:**
- Consumes: `EventDetailHeader` from Task 2; `getTimes` from `./calendar-util`; `AddToCalendar` from `@frogpond/add-to-device-calendar`.
- Produces: `EventDetail({event, poweredBy}: {event: EventType; poweredBy: PoweredBy}): React.ReactNode` — unchanged signature.

- [ ] **Step 1: Write the failing test**

Build the fixture inline; `EventType` needs `moment` values.

```tsx
import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import type {EventType} from '@frogpond/event-type'

import {EventDetail} from '../event-detail-view'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

const POWERED_BY = {title: 'Powered by the St. Olaf calendar', href: 'https://example.com'}

function makeEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: moment('2026-08-17T09:00:00Z'),
		endTime: moment('2026-08-20T18:00:00Z'),
		isOngoing: false,
		links: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

describe('EventDetail', () => {
	test('it shows the location and description sections', async () => {
		await render(<EventDetail event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Location')).toBeTruthy()
		expect(screen.getByText('Kings Dining')).toBeTruthy()
		expect(screen.getByText('Description')).toBeTruthy()
		expect(screen.getByText('Seminars across campus.')).toBeTruthy()
	})

	test('it omits a section whose field is empty', async () => {
		await render(<EventDetail event={makeEvent({location: ''})} poweredBy={POWERED_BY} />)

		expect(screen.queryByText('Location')).toBeNull()
		expect(screen.getByText('Description')).toBeTruthy()
	})

	test('it shows the powered-by footer', async () => {
		await render(<EventDetail event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Powered by the St. Olaf calendar')).toBeTruthy()
	})

	test('it offers an add-to-calendar button', async () => {
		await render(<EventDetail event={makeEvent()} poweredBy={POWERED_BY} />)

		fireEvent.press(screen.getByLabelText('Add to calendar'))
		expect(screen.getByLabelText('Add to calendar')).toBeTruthy()
	})
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest modules/event-list/__tests__/event-detail-view.test.tsx --verbose --reporters=default`
Expected: FAIL — the current view renders `TableView`/`SelectableCell`, so `getByText('Location')` finds `LOCATION` at most, and there is no labelled button.

- [ ] **Step 3: Rewrite the view**

```tsx
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, Host, Link, Section, Text} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	font,
	foregroundColor,
	multilineTextAlignment,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import type {EventType} from '@frogpond/event-type'

import {EventDetailHeader} from './event-detail-header'
import {getTimes} from './calendar-util'
import type {PoweredBy} from './types'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

function TextSection({header, content}: {header: string; content: string}) {
	return content ? (
		<Section title={header}>
			<Text modifiers={[foregroundColor(c.label), textSelection(true)]}>{content}</Text>
		</Section>
	) : null
}

type Props = {
	event: EventType
	poweredBy: PoweredBy
}

export function EventDetail({event, poweredBy}: Props): React.ReactNode {
	let times = getTimes(event).trim()

	return (
		<Host style={styles.host}>
			<Form>
				<Section>
					<EventDetailHeader times={times} title={event.title.trim()} />
				</Section>

				<TextSection content={event.location.trim()} header="Location" />
				<TextSection content={event.description.trim()} header="Description" />

				{event.links.length > 0 ? (
					<Section title="Links">
						{event.links.map((href) => (
							<Link destination={href} key={href} label={href} />
						))}
					</Section>
				) : null}

				<AddToCalendar
					event={event}
					render={({message, disabled, onPress}) => (
						// `footer` is a SwiftUI slot: a bare string here crashes at mount.
						<Section footer={message ? <Text>{message}</Text> : undefined}>
							<Button
								disabled={disabled}
								modifiers={[buttonStyle('plain'), accessibilityLabel('Add to calendar')]}
								onPress={onPress}
							>
								<Text modifiers={[foregroundColor(c.systemBlue)]}>Add to calendar</Text>
							</Button>
						</Section>
					)}
				/>

				{poweredBy.title ? (
					<Section>
						<Text
							modifiers={[
								font({size: 10}),
								foregroundColor(c.secondaryLabel),
								multilineTextAlignment('center'),
							]}
						>
							{poweredBy.title}
						</Text>
					</Section>
				) : null}
			</Form>
		</Host>
	)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest modules/event-list/__tests__/event-detail-view.test.tsx --verbose --reporters=default`
Expected: PASS, 4 tests.

- [ ] **Step 5: Check nothing else referenced the old internals**

Run: `grep -rn "MaybeSection\|SelectableCell" modules/event-list/`
Expected: no hits. `SelectableCell` must remain imported by `app/(home)/CourseDetail.tsx`, `app/(home)/JobDetail.tsx` and `app/(home)/StudentOrgs/[name].tsx` — confirm with `grep -rn "SelectableCell" app/`.

- [ ] **Step 6: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/event-detail-view.tsx modules/event-list/__tests__/event-detail-view.test.tsx
git commit -m "Rebuild the event detail on SwiftUI"
```

---

### Task 4: A links section test, and the short navigation title

`event.links` is usually empty, so the links path needs its own test rather than relying on fixture luck. The nav title changes in the same task because both are about what the route and the data supply.

**Files:**
- Modify: `modules/event-list/__tests__/event-detail-view.test.tsx`
- Modify: `app/(home)/EventDetail.tsx`

**Interfaces:**
- Consumes: `EventDetail` from Task 3; the existing `EventSource` type and `POWERED_BY` map in the route.
- Produces: `CALENDAR_NAME: Record<EventSource, string>` in `app/(home)/EventDetail.tsx`.

- [ ] **Step 1: Write the failing links tests**

Append to `modules/event-list/__tests__/event-detail-view.test.tsx`:

```tsx
	test('it lists each event link', async () => {
		let links = ['https://example.com/one', 'https://example.com/two']
		await render(<EventDetail event={makeEvent({links})} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Links')).toBeTruthy()
		expect(screen.getByText('https://example.com/one')).toBeTruthy()
		expect(screen.getByText('https://example.com/two')).toBeTruthy()
	})

	test('it omits the links section when there are none', async () => {
		await render(<EventDetail event={makeEvent({links: []})} poweredBy={POWERED_BY} />)

		expect(screen.queryByText('Links')).toBeNull()
	})
```

- [ ] **Step 2: Run them**

Run: `npx jest modules/event-list/__tests__/event-detail-view.test.tsx --verbose --reporters=default`
Expected: PASS, 6 tests — Task 3 already implemented the links section. If they fail, fix the view rather than the test.

- [ ] **Step 3: Give the route a short title**

In `app/(home)/EventDetail.tsx`, add next to the existing `POWERED_BY` map:

```tsx
/// The body header now carries the event's title, so the bar shows which
/// calendar the event came from instead of repeating it.
const CALENDAR_NAME: Record<EventSource, string> = {
	stolaf: 'St. Olaf',
	northfield: 'Northfield',
	'ksto-schedule': 'KSTO',
	'krlx-schedule': 'KRLX',
}
```

and change the success branch's title from the event's title to the calendar name:

```tsx
		<>
			<Stack.Title>{CALENDAR_NAME[source]}</Stack.Title>
```

Leave the `Loading…`, `Error` and `Unknown Event` branches as they are.

- [ ] **Step 4: Type-check**

Run: `mise run tsc`
Expected: pass. If `source` is not narrowed to `EventSource`, index through the existing guard — the file already checks `source in POWERED_BY` before use; mirror that rather than casting.

- [ ] **Step 5: Commit**

```bash
mise run agent:pre-commit
git add modules/event-list/__tests__/event-detail-view.test.tsx "app/(home)/EventDetail.tsx"
git commit -m "Show the calendar name in the event detail's title bar"
```

---

### Task 5: Repair the UI tests and see it on a device

The accessibility tree changes shape: ported rows become buttons rather than text views, and `Form` builds rows lazily, so anything below the fold is absent from the tree rather than merely offscreen. Do not guess at the new queries.

**Files:**
- Modify: `uitests/ModuleCalendarTests.swift` and/or `uitests/Screens/CalendarScreen.swift` as the dump dictates.

- [ ] **Step 1: Start Metro before building**

```bash
npx expo start --port 8081
```

A Debug build only loads JS from Metro when Metro was running at build time; otherwise `react-native-xcode.sh` bakes a `main.jsbundle` into the `.app` and your JS edits will silently not apply. Confirm afterwards with `ls ios/../<derived>/AllAboutOlaf.app/main.jsbundle` — if that file exists, Metro is not being used.

- [ ] **Step 2: Build and dump the real tree**

Add a temporary test that navigates to an event and prints `app.debugDescription`, run it, and read the output. Do not skip this step in favour of assuming element types.

- [ ] **Step 3: Update the existing assertions**

`testIsReachableFromHomescreen` and `testCalendarTabsCanBeOpened` touch the list, not the detail, so they should still pass. Run them to confirm rather than assuming:

Run: `xcodebuild -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -only-testing:AllAboutOlafUITests/ModuleCalendarTests test`

- [ ] **Step 4: Look at the screen**

Capture a screenshot via an `XCTAttachment` and export it with `xcrun xcresulttool export attachments`. Check against the spec's risks:
- a long, multi-paragraph description wraps rather than clipping
- the layout holds at a large Dynamic Type size
- the header's accent bar aligns with the title's cap height, not the whole row

Open the image and look at it. Do not report it as verified without doing so.

- [ ] **Step 5: Remove the temporary test and commit**

```bash
git checkout uitests/ModuleCalendarTests.swift  # if only scratch changes were made
mise run agent:pre-commit
git add uitests/
git commit -m "Update the calendar UI tests for the SwiftUI detail"
```

---

## Self-Review

**Spec coverage:**

| Spec item | Task |
| --- | --- |
| Header replacing EVENT/TIME | 2, 3 |
| Location / Description sections, empty ones absent | 3 |
| Links section | 3 (implementation), 4 (tests) |
| Add to calendar button with footer message | 3 |
| Powered-by footer as plain `Text` | 3 |
| Split into header + view components | 2, 3 |
| Short navigation title from `source` | 4 |
| Narrow Jest mock extending the map's convention | 1 |
| UI test queries revisited against a real dump | 5 |
| Truncation / Dynamic Type risks | 5 |

No spec requirement is unassigned. The timeline strip and map thumbnail are explicitly out of scope in the spec and correctly absent here.

**Type consistency:** `EventDetailHeader({title, times})` is defined in Task 2 and called with exactly those props in Task 3. `EventDetail({event, poweredBy})` keeps its existing signature, so `app/(home)/EventDetail.tsx` needs no call-site change beyond the title. `CALENDAR_NAME` is keyed by `EventSource`, the type already declared in that route file.

**Open question for Wren:** `ListFooter`'s `href` was never used — it renders title text only. This plan drops it. If the footer was always meant to be tappable, say so and it becomes a `Link` instead.
