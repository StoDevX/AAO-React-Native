# expo-router checkpoint 4, PR 6: Debug

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Debug" screen (a recursive Redux-state browser) into
`app/(settings)/Debug/`, using expo-router's native catch-all dynamic
segment support so each drill-down level gets a real URL segment. Sixth
PR of checkpoint 4's 8-PR stack. Fixes two pre-existing bugs discovered
during investigation (human-approved scope, not incidental drift):

1. **`keyPath` was tracked but never used to slice state.** The legacy
   screen re-navigated to the same route on every drill-down and always
   re-rendered the *entire* top-level Redux state; it only appeared to
   drill down because the tapped item's value was captured via JS
   closure on the very first push, not because `keyPath` selected a
   nested slice. A route-per-keyPath architecture makes this
   impossible to fake, so it has to be done correctly this time.
2. **API Test's "Parse as JSON" toggle drilled into the wrong data.**
   `source/views/settings/screens/api-test/detail.tsx` renders
   `<DebugView state={apiResponseJson} />` (an arbitrary API response,
   not Redux state) but `DebugView`'s internal array/object renderers
   hardcoded `navigation.navigate('DebugView', ...)` -- the *Redux*
   debug route -- so tapping into a nested field showed unrelated Redux
   state instead of the JSON being viewed.

**Architecture:** `DebugView`/`DebugArrayItem`/`DebugObjectItem`/
`DebugRow` lose their `useNavigation`/`useRoute` coupling entirely and
become fully navigation-agnostic, taking an optional
`onDrillDown?: (key: string | number) => void` prop instead (same
"push navigation up to the caller" pattern already used by
`source/views/student-orgs/detail.tsx` elsewhere in this migration).
Two callers now exist:
- The new Redux-backed route (`app/(settings)/Debug/index.tsx` +
  `app/(settings)/Debug/[...keyPath].tsx`) passes `onDrillDown`, wired
  to `router.push` with an appended keyPath segment.
- `api-test/detail.tsx`'s standalone `<DebugView state={...} />` passes
  no `onDrillDown` at all -- rows for nested objects/arrays simply
  render without a disclosure arrow and aren't tappable, an honest
  "not interactive here" state instead of navigating to wrong data.
  This is the minimal correct fix: no new route, no route-param
  plumbing for arbitrary JSON blobs, just removing a false affordance.

expo-router's catch-all needs two files, not one, because `[...keyPath]`
alone never matches a bare `/Debug` with zero segments (verified against
expo-router's own route-matching source, `getStateFromPath-forks.js`) --
`Debug/index.tsx` covers the root (`keyPath: []`), `Debug/[...keyPath].tsx`
covers one-or-more segments.

## Global Constraints

- Branch `expo-router-settings-debug`, stacked on
  `expo-router-settings-banner-builder` (PR #7701).
- iOS only. Never bypass the pre-commit hook. No `any`.
- `source/navigation/routes.tsx`/`source/navigation/types.tsx` are NOT
  touched -- `DebugRootView`'s existing (buggy, keyPath-ignoring)
  behavior stays exactly as-is there; that's dead, unreachable legacy
  code until checkpoint 7 deletes the whole file, not this PR's job to
  fix.
- `source/views/settings/screens/overview/developer.tsx` is NOT touched
  -- it's part of `SettingsRoot`, PR 8's scope.
- `source/views/settings/index.ts` (the barrel) is NOT touched -- it
  already exports only `DebugRootView`, unchanged by this PR.
- This route remains unreachable after this PR -- no entry point exists
  yet (PR 8's job).

---

### Task 1: Make DebugView navigation-agnostic and fix API Test's drill-down

**Files:**
- Modify: `source/views/settings/screens/debug/list.tsx`
- Modify: `source/views/settings/screens/debug/row.tsx`

**Interfaces:**
- Produces: `DebugView(props: {state?: unknown; onDrillDown?: (key: string | number) => void})`
  -- consumed by Task 2's new route files AND by the already-existing
  `api-test/detail.tsx` (unchanged call site, since `onDrillDown` is
  optional).

- [ ] **Step 1: Rewrite `list.tsx` to drop all navigation coupling**

Replace the full contents of
`source/views/settings/screens/debug/list.tsx` with:

```tsx
import * as React from 'react'
import {FlatList, ScrollView, StyleSheet, Text} from 'react-native'
import {DebugRow} from './row'
import {NoticeView} from '@frogpond/notice'
import {ListSeparator} from '@frogpond/lists'
import {useAppSelector} from '../../../../redux'
import {Section, TableView} from 'react-native-tableview-simple'

export const NavigationKey = 'DebugView' as const

type Props = {
	state?: unknown
	onDrillDown?: (key: string | number) => void
}

export const DebugRootView = (): React.ReactNode => {
	let reduxState = useAppSelector((state) => {
		return state
	})

	return <DebugView state={reduxState} />
}

export const DebugView = (props: Props = {}): React.ReactNode => {
	let {state, onDrillDown} = props

	if (state === null) {
		return <DebugSimpleItem item={state} />
	}

	switch (typeof state) {
		case 'object': {
			if (Array.isArray(state)) {
				return <DebugArrayItem item={state} onDrillDown={onDrillDown} />
			} else {
				return (
					<DebugObjectItem
						item={state as Record<string, unknown>}
						onDrillDown={onDrillDown}
					/>
				)
			}
		}
		case 'function':
		case 'symbol':
			return <DebugToStringItem item={state} />
		case 'bigint':
		case 'number':
		case 'boolean':
		case 'string':
		case 'undefined':
			return <DebugSimpleItem item={state} />
		default: {
			return <Text>unknown type: {typeof state}</Text>
		}
	}
}

export const DebugSimpleItem = ({item}: {item: unknown}): React.ReactNode => {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<TableView style={styles.table}>
				<Section
					header={typeof item}
					hideSurroundingSeparators={true}
					roundedCorners={true}
				>
					<Text>{String(item)}</Text>
				</Section>
			</TableView>
		</ScrollView>
	)
}

export const DebugToStringItem = ({item}: {item: unknown}): React.ReactNode => {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<TableView style={styles.table}>
				<Section
					header={typeof item}
					hideSurroundingSeparators={true}
					roundedCorners={true}
				>
					<Text>{String(item)}</Text>
				</Section>
			</TableView>
		</ScrollView>
	)
}

export const DebugArrayItem = ({
	item,
	onDrillDown,
}: {
	item: unknown[]
	onDrillDown?: (key: string | number) => void
}): React.ReactNode => {
	let keyed = item.map((value, key) => ({key, value}))

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="Nothing found." />}
			contentInsetAdjustmentBehavior="automatic"
			data={keyed}
			renderItem={({item: debugItem}) => (
				<DebugRow data={debugItem} onPress={onDrillDown} />
			)}
		/>
	)
}

export const DebugObjectItem = ({
	item,
	onDrillDown,
}: {
	item: Record<string, unknown>
	onDrillDown?: (key: string | number) => void
}): React.ReactNode => {
	let keyed = Object.entries(item).map(([key, value]) => ({key, value}))

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="Nothing found." />}
			contentInsetAdjustmentBehavior="automatic"
			data={keyed}
			renderItem={({item: debugItem}) => (
				<DebugRow data={debugItem} onPress={onDrillDown} />
			)}
		/>
	)
}

let styles = StyleSheet.create({
	table: {marginHorizontal: 15},
})
```

(`NavigationKey` and `DebugRootView` are unchanged, preserving
`source/navigation/routes.tsx`/`types.tsx`'s existing, untouched
compile-time contract. `useNavigation`/`useRoute`/`useKeyPath` and
their `@react-navigation/core`/`../../../../navigation/types` imports
are gone entirely -- `DebugArrayItem`/`DebugObjectItem` no longer read
route params for `keyPath`, since keyPath-tracking now lives in the
caller, which is Task 2's job.)

- [ ] **Step 2: Make `DebugRow`'s `onPress` optional, gated on both drillability and presence**

Replace the full contents of
`source/views/settings/screens/debug/row.tsx` with:

```tsx
import * as React from 'react'
import {Cell} from '@frogpond/tableview'

type Props = {
	data: {key: string | number; value: unknown}
	onPress?: (key: string | number) => void
}

export const DebugRow = (props: Props): React.ReactNode => {
	let {data, onPress} = props

	let rowDetail = '<unknown>'
	let isDrillable = false

	if (Array.isArray(data.value)) {
		// Array(0), Array(100), etc
		rowDetail = `Array(${data.value.length})`
		isDrillable = true
	} else if (typeof data.value === 'object' && data.value !== null) {
		// [object Object], [object Symbol], etc
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		rowDetail = data.value.toString()
		isDrillable = true
	} else if (typeof data.value === 'string') {
		if (data.value.length > 20) {
			rowDetail = `"${data.value.substring(0, 20)}…"`
		} else {
			rowDetail = JSON.stringify(data.value)
		}
	} else {
		rowDetail = JSON.stringify(data.value)
	}

	let showArrow = isDrillable && onPress != null

	return (
		<Cell
			accessory={showArrow ? 'DisclosureIndicator' : false}
			cellStyle="RightDetail"
			detail={rowDetail}
			onPress={showArrow ? () => onPress?.(data.key) : undefined}
			title={data.key}
		/>
	)
}
```

(Previously `arrowPosition` was computed purely from the value's type,
independent of whether a caller could actually handle the tap --
that's exactly the gap that let API Test's standalone `DebugView` show
a disclosure arrow that navigated to the wrong screen. Now the arrow
only appears when both the value is drillable AND a real `onPress`
handler exists.)

- [ ] **Step 3: Verify**

Run: `mise run tsc` -- expect 0 errors.
Run: `mise run lint` -- expect clean.
Run: `mise run test` -- expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake -- e.g.
`source/views/faqs/__tests__/banner.test.tsx`'s dismiss-banner test is a
known, previously-documented flake in this repo -- before treating it
as real).

- [ ] **Step 4: Commit**

```bash
git add source/views/settings/screens/debug/list.tsx source/views/settings/screens/debug/row.tsx
git commit -m "Make DebugView navigation-agnostic

Sixth PR of checkpoint 4's 8-PR stack, Task 1 of 2. DebugView and its
DebugArrayItem/DebugObjectItem/DebugRow subcomponents drop
useNavigation/useRoute entirely in favor of an optional onDrillDown
callback prop, pushed up to whichever caller owns navigation --
matching the pattern already used by source/views/student-orgs's
detail view elsewhere in this migration.

This also fixes a pre-existing bug: DebugRow computed its disclosure
arrow purely from the tapped value's type, independent of whether the
caller could actually handle a tap. api-test/detail.tsx's standalone
<DebugView state={apiResponseJson} /> inherited that arrow and tapped
through to a hardcoded Redux debug route showing unrelated data. Now
the arrow only renders when a real onDrillDown handler is present --
api-test/detail.tsx passes none, so its rows are correctly inert.

DebugRootView and the NavigationKey export are unchanged, preserving
source/navigation/routes.tsx/types.tsx's existing compile-time
contract untouched.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Wire the Redux-backed Debug route with real keyPath slicing

**Files:**
- Create: `source/views/settings/screens/debug/get-at-key-path.ts`
- Create: `app/(settings)/Debug/index.tsx`
- Create: `app/(settings)/Debug/[...keyPath].tsx`

**Interfaces:**
- Consumes: `DebugView` (with its new `onDrillDown` prop from Task 1),
  `useAppSelector` from `source/redux`, `toLaxTitleCase` from
  `@frogpond/titlecase` (matching `routes.tsx`'s existing title logic).
- Produces: `getAtKeyPath(state: unknown, keyPath: string[]): unknown`
  -- a pure function, no React/navigation dependency, usable
  independently of any route.

- [ ] **Step 1: Write the slicing utility**

Create `source/views/settings/screens/debug/get-at-key-path.ts`:

```ts
export function getAtKeyPath(state: unknown, keyPath: string[]): unknown {
	let current = state

	for (let key of keyPath) {
		if (current === null || current === undefined) {
			return undefined
		}

		if (Array.isArray(current)) {
			let index = Number(key)
			current = Number.isNaN(index) ? undefined : current[index]
		} else if (typeof current === 'object') {
			current = (current as Record<string, unknown>)[key]
		} else {
			return undefined
		}
	}

	return current
}
```

- [ ] **Step 2: Create the Debug root route**

Create `app/(settings)/Debug/index.tsx`:

```tsx
import * as React from 'react'
import {Stack, useRouter} from 'expo-router'

import {DebugView} from '../../../source/views/settings/screens/debug'
import {useAppSelector} from '../../../source/redux'

export default function DebugPage(): React.ReactNode {
	let router = useRouter()
	let reduxState = useAppSelector((state) => state)

	let onDrillDown = (key: string | number) => {
		router.push(`/Debug/${encodeURIComponent(String(key))}`)
	}

	return (
		<>
			<Stack.Screen options={{title: 'Debug'}} />
			<DebugView onDrillDown={onDrillDown} state={reduxState} />
		</>
	)
}
```

- [ ] **Step 3: Create the Debug drill-down route**

Create `app/(settings)/Debug/[...keyPath].tsx`:

```tsx
import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {toLaxTitleCase} from '@frogpond/titlecase'

import {DebugView} from '../../../source/views/settings/screens/debug'
import {getAtKeyPath} from '../../../source/views/settings/screens/debug/get-at-key-path'
import {useAppSelector} from '../../../source/redux'

export default function DebugKeyPathPage(): React.ReactNode {
	let router = useRouter()
	let {keyPath = []} = useLocalSearchParams<{keyPath?: string[]}>()
	let reduxState = useAppSelector((state) => state)
	let slice = getAtKeyPath(reduxState, keyPath)

	let onDrillDown = (key: string | number) => {
		let nextPath = [...keyPath, String(key)]
			.map(encodeURIComponent)
			.join('/')
		router.push(`/Debug/${nextPath}`)
	}

	return (
		<>
			<Stack.Screen
				options={{title: toLaxTitleCase(keyPath[keyPath.length - 1])}}
			/>
			<DebugView onDrillDown={onDrillDown} state={slice} />
		</>
	)
}
```

(`source/views/settings/screens/debug` is imported directly here
rather than via the settings barrel, matching the barrel's existing
scope -- it only re-exports `DebugRootView`, not `DebugView`, and
adding it there is unrelated restructuring the migration doesn't need,
same reasoning already applied to `BonAppPickerView` in PR 4.)

- [ ] **Step 4: Verify**

Run: `mise run tsc` -- expect 0 errors.
Run: `mise run lint` -- expect clean.
Run: `mise run test` -- expect the same pass/fail counts as Task 1's
verification.

- [ ] **Step 5: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then boot the app in
the FOREGROUND, genuinely waited on to completion.

Since nothing links to `/Debug` yet, verify via a direct deep link:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://Debug"
```

Expected: title "Debug", a list of top-level Redux state slice names
(e.g. `settings`, `courses`, whatever the store's actual top-level keys
are) with disclosure arrows. Tap into one nested object/array-valued
key at least two levels deep -- expect the title to update to the
tapped key's name each time, AND (this is the actual bug fix) expect
the displayed content to genuinely be that nested slice's data, not a
repeat of the top-level state. Use `xcrun simctl io booted screenshot`
only -- do NOT use unscoped `screencapture` or any desktop-level GUI
automation tooling on this machine (see project memory on this).

Also verify via direct deep link that a multi-segment keyPath resolves
correctly without needing to tap through each level:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://Debug/someTopLevelKey"
```

(substitute an actual top-level Redux state key you observed in the
previous step).

Screenshot the root Debug list and one drilled-down level -- look at
them yourself before trusting a report that claims what they show.

- [ ] **Step 6: Commit**

```bash
git add source/views/settings/screens/debug/get-at-key-path.ts app/\(settings\)/Debug/index.tsx app/\(settings\)/Debug/\[...keyPath\].tsx
git commit -m "Wire the Debug screen with real keyPath-based state slicing

Sixth PR of checkpoint 4's 8-PR stack, Task 2 of 2. Two route files --
app/(settings)/Debug/index.tsx (root, keyPath: []) and
app/(settings)/Debug/[...keyPath].tsx (one-or-more segments) -- since
expo-router's catch-all segment never matches a bare parent path on
its own (verified against expo-router's own route-matching source).

Fixes the underlying bug this PR set out to fix: keyPath now genuinely
slices into Redux state via the new getAtKeyPath() utility, so drilling
down shows the actual nested data rather than re-rendering the entire
top-level state on every push. Each drill-down level gets a real,
independently-linkable URL, e.g. deep-linking straight to
/Debug/someKey works without tapping through intermediate screens.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets`
to upload both screenshots and post them as a PR comment. Do this
BEFORE deleting the SDD workspace that holds them.

---

## Self-Review

**Spec coverage:** the design doc's PR-6 slot ("Debug catch-all route")
is covered, plus the two human-approved bug fixes discovered during
investigation (keyPath slicing, API Test's wrong-data drill-down) are
both addressed with dedicated tasks/steps rather than silently folded
in.

**Placeholder scan:** none found.

**Type consistency:** `onDrillDown?: (key: string | number) => void`
is the exact same signature across `DebugView`, `DebugArrayItem`,
`DebugObjectItem`, `DebugRow`, and both new route files' local
`onDrillDown` functions. `getAtKeyPath`'s `keyPath: string[]` parameter
matches `useLocalSearchParams<{keyPath?: string[]}>()`'s shape exactly
(confirmed against expo-router's own source: catch-all params are
always string arrays, never joined strings).

## Followup (not this PR's scope)

`api-test/detail.tsx`'s "Parse as JSON" toggle can no longer drill into
nested objects/arrays at all -- Task 1's fix correctly stopped it from
navigating to the wrong (Redux) data, but `DebugView` was left with no
`onDrillDown` at that call site, so nested rows now render with no
disclosure arrow and no way to expand them either. Worth a proper fix
later: local in-place expand state inside `api-test/detail.tsx`, now
trivial given `DebugView`'s new `onDrillDown` prop shape. Doesn't block
this PR -- the wrong-data bug was worse than no expansion at all.
