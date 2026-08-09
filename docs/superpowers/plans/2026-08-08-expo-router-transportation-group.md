# expo-router checkpoint 2, group PR 10: Transportation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Transportation" home-grid tile: a 5-tab screen
(Express Bus, Red Line, Blue Line, Oles Go, Other Modes) plus one shared
`BusRouteDetail` screen. Tenth group PR in checkpoint 2's stack — the
fourth tab-bar group (same proven `NativeTabs` flat-structure pattern as
Menus/Streaming Media/News), but the detail screen is architecturally new:
its data isn't a static server-cached record, it's a **live, time- and
day-of-week-dependent derivation** computed fresh every render in the
original code, not something that can be looked up by a stable ID alone.

**Tab bar:** `source/views/transportation/index.tsx` uses
`createNativeBottomTabNavigator` for its 5 tabs — convert to expo-router's
`NativeTabs`, same flat structure as every prior tab-bar group.
`app/(home)/_layout.tsx` gets a fourth `<Stack.Screen name="Transportation"
options={{title: 'Transportation'}}/>` entry, alongside the existing
`Menus`/`Streaming Media`/`News` entries.

**`BusRouteDetail`'s data shape.** The original screen received
`{stop, line, subtitle}` via navigation params: `line` is a whole
`UnprocessedBusLine` object (static per line, fetched once from
`busRoutesOptions`), but `stop` (which specific timetable entry) and
`subtitle` (a human-readable status string like "Running" or "Starts in 5
minutes") both depend on which day's schedule was selected in the
`BusLine` list screen's UI (`DayPickerHeader`) and the moment `now` at
render time — genuinely computed, not fetched. This plan splits the
problem the same way the original code already did, just relocating where
each piece happens:

- **`line` is still a `select`-based derived query.** A new
  `busLineOptions(lineName)` shares `busRoutesOptions`'s exact
  `queryKey`/fetch and selects the one matching line by name — the
  familiar pattern, extended to a static object instead of a whole list.
- **`stop`/`subtitle` are recomputed at the destination, not passed
  through the URL.** The URL carries three plain strings:
  `line` (the line name), `day` (`DayOfWeek`, a 2-character code, e.g.
  `'Mo'`), and `stopName` (`BusTimetableEntry.name`, confirmed unique per
  schedule). `BusRouteDetail`'s new `app/` wrapper re-derives the same
  `{subtitle, schedule}` the original `BusLine` screen computed for that
  day, using the exact same shared logic (`deriveFromProps`, exported
  from `line.tsx` rather than duplicated), then finds `stop` by name
  within that day's `schedule.timetable`. This is **more correct** than
  freezing a stale subtitle string at tap-time, not a compromise — a
  transit app's "is the bus running" status should reflect *now*, not the
  moment the user tapped.

**Dead code found and cleaned up while decoupling navigation, not
touched otherwise.** `BusLine`'s `openMap` prop (declared in
`bus/line.tsx`'s `Props` type, threaded through from `bus/wrapper.tsx`)
navigates to `'BusMapView'` — a screen that: (a) was never registered in
`source/navigation/routes.tsx` even before this migration (confirmed via
grep — `BusMapView` only appears in `types.tsx`'s type declaration and
the two files below, never as an actual `Stack.Screen`), and (b) renders
literal placeholder text ("Mapbox has been removed.") in
`bus/map.tsx` — the real map feature was already ripped out. Worse: `openMap`
is declared as a prop on `BusLine` but **never referenced anywhere in that
component's body** — fully dead plumbing, not merely an unreachable
route. Since `bus/wrapper.tsx` needs its `useNavigation` import removed
regardless (the SDK56 fix every tab-bar/list-screen group in this
migration has needed), and `openMap` was its only reason for importing
`useNavigation` at all, this plan deletes `openMap` outright rather than
reintroducing dead router-plumbing for a feature that doesn't exist.
`bus/map.tsx` itself is left untouched and unwired — out of scope, same
"leave genuinely dead/unreachable code alone" precedent as `movie.tsx`
(Menus group) and `dev-bonapp-picker.tsx` (Menus group). `types.tsx`'s
`BusMapView: {line: UnprocessedBusLine}` type entry is also left in
place, matching this migration's established precedent of not doing
wholesale dead-type cleanup mid-migration (e.g. `ContactsDetail`,
`PrinterList`/`PrintJobRelease` were left the same way).

## Global Constraints

- Branch `expo-router-home-transportation`, stacked on
  `expo-router-home-news` (PR #7680).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- `source/views/transportation/bus/map.tsx` is dead code (never
  registered, replaced by a placeholder after Mapbox removal) — not
  touched by this plan.

---

### Task 1: Wire the Transportation tab bar and BusRouteDetail into expo-router

**Files:**
- Modify: `source/views/transportation/index.tsx`
- Modify: `source/views/transportation/bus/line.tsx`
- Modify: `source/views/transportation/bus/wrapper.tsx`
- Modify: `source/views/transportation/bus/detail.tsx`
- Modify: `source/views/transportation/bus/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Modify: `source/views/views.ts`
- Modify: `app/(home)/_layout.tsx`
- Create: `app/(home)/Transportation/_layout.tsx`
- Create: `app/(home)/Transportation/index.tsx`
- Create: `app/(home)/Transportation/red-line.tsx`
- Create: `app/(home)/Transportation/blue-line.tsx`
- Create: `app/(home)/Transportation/oles-go.tsx`
- Create: `app/(home)/Transportation/other-modes.tsx`
- Create: `app/(home)/BusRouteDetail.tsx`

**Interfaces:**
- Consumes: `ExpressLineBusView`, `RedLineBusView`, `BlueLineBusView`,
  `OlesGoView`, `OtherModesView` from `source/views/transportation`;
  `BusRouteDetail` (new prop shape: `{stop: BusTimetableEntry; line:
  UnprocessedBusLine; subtitle: string}`) from
  `source/views/transportation/bus/detail.tsx`; `busLineOptions` from
  `source/views/transportation/bus/query.ts`; `deriveFromProps` (newly
  exported) and `createMomentForDay` from
  `source/views/transportation/bus/line.tsx` and
  `source/views/transportation/bus/components/day-picker.tsx`
  respectively.
- Produces: `/Transportation` (tab group, default tab Express Bus),
  `/Transportation/red-line`, `/Transportation/blue-line`,
  `/Transportation/oles-go`, `/Transportation/other-modes` (all within the
  tab bar, no per-tab header); `/BusRouteDetail` (flat sibling of
  `Transportation/` at the `(home)/` level, its own header, tab bar
  hidden).

- [ ] **Step 1: Add the shared `select`-based single-line query**

In `source/views/transportation/bus/query.ts`, replace the whole file
with:

```typescript
import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {UnprocessedBusLine} from './types'

export const keys = {
	all: ['transit', 'bus-routes'] as const,
}

async function fetchBusRoutes({
	signal,
}: {
	signal: AbortSignal
}): Promise<UnprocessedBusLine[]> {
	let response = await client.get('transit/bus', {signal}).json()
	return (response as {data: UnprocessedBusLine[]}).data
}

export const busRoutesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchBusRoutes,
})

export const busLineOptions = (
	lineName: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchBusRoutes,
		select: (lines) => lines.find((l) => l.line === lineName),
	})
```

(`busRoutesOptions` is otherwise unchanged in behavior — only its inline
fetch became `fetchBusRoutes` so `busLineOptions` can share it.)

- [ ] **Step 2: Export `deriveFromProps` and remove the dead `openMap` prop from `BusLine`**

In `source/views/transportation/bus/line.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import type {LegacyRootParamList} from '../../../navigation/types'
```

with:

```typescript
import {useRouter} from 'expo-router'
```

Replace:

```typescript
function deriveFromProps({line, now}: {line: UnprocessedBusLine; now: Moment}) {
```

with:

```typescript
export function deriveFromProps({
	line,
	now,
}: {
	line: UnprocessedBusLine
	now: Moment
}) {
```

Replace:

```typescript
type Props = {
	line: UnprocessedBusLine
	now: Moment
	openMap: () => unknown
}
```

with:

```typescript
type Props = {
	line: UnprocessedBusLine
	now: Moment
}
```

Replace:

```typescript
export function BusLine(props: Props): React.ReactNode {
	let {line, now} = props
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```typescript
export function BusLine(props: Props): React.ReactNode {
	let {line, now} = props
	let router = useRouter()
```

Replace:

```typescript
					onPress={() => {
							navigation.navigate('BusRouteDetail', {stop: item, line, subtitle})
						}}
```

with:

```typescript
					onPress={() => {
							router.push({
								pathname: '/BusRouteDetail',
								params: {line: line.line, day: selectedDay, stopName: item.name},
							})
						}}
```

Everything else in the file (the day-picker state, `deriveFromProps`'s
internal switch/return, the `FlatList` render) is unchanged.

- [ ] **Step 3: Remove the dead `openMap` call from `BusView`**

In `source/views/transportation/bus/wrapper.tsx`, replace:

```typescript
import {LoadingView, NoticeView} from '@frogpond/notice'
import {timezone} from '@frogpond/constants'
import {NavigationProp, useNavigation} from '@react-navigation/native'
import type {LegacyRootParamList} from '../../../navigation/types'
import {busRoutesOptions} from './query'
```

with:

```typescript
import {LoadingView, NoticeView} from '@frogpond/notice'
import {timezone} from '@frogpond/constants'
import {busRoutesOptions} from './query'
```

Replace:

```typescript
let BusView = (props: Props): React.ReactNode => {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let {
		data: busLines = [],
		error,
		refetch,
		isError,
		isLoading,
	} = useQuery(busRoutesOptions)
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```typescript
let BusView = (props: Props): React.ReactNode => {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let {
		data: busLines = [],
		error,
		refetch,
		isError,
		isLoading,
	} = useQuery(busRoutesOptions)
```

Replace:

```typescript
	return (
		<BusLine
			line={activeBusLine}
			now={now}
			openMap={() => {
				if (activeBusLine) {
					navigation.navigate('BusMapView', {line: activeBusLine})
				}
			}}
		/>
	)
```

with:

```typescript
	return <BusLine line={activeBusLine} now={now} />
```

Everything else in the file (the loading/error/not-found branches) is
unchanged.

- [ ] **Step 4: Change `BusRouteDetail` to accept props instead of route params**

In `source/views/transportation/bus/detail.tsx`, replace:

```typescript
import {RouteProp, useRoute} from '@react-navigation/native'
import type {Moment} from 'moment-timezone'
```

with:

```typescript
import type {Moment} from 'moment-timezone'
```

Replace:

```typescript
import type {BusTimetableEntry, UnprocessedBusLine, BusSchedule} from './types'
import {RootStackParamList} from '../../../navigation/types'
import {
```

with:

```typescript
import type {BusTimetableEntry, UnprocessedBusLine, BusSchedule} from './types'
import {
```

Replace:

```typescript
export function BusRouteDetail(): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let route = useRoute<RouteProp<RootStackParamList, 'BusRouteDetail'>>()
	let {stop, line, subtitle} = route.params

	return (
```

with:

```typescript
type Props = {
	stop: BusTimetableEntry
	line: UnprocessedBusLine
	subtitle: string
}

export function BusRouteDetail({stop, line, subtitle}: Props): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})

	return (
```

Everything else in the file (`BusStopDetailInternal`, all the styling and
rendering logic) is unchanged.

- [ ] **Step 5: Turn `source/views/transportation/index.tsx` into a plain re-export**

Replace the whole file with:

```typescript
import * as React from 'react'

import {OtherModesView} from './other-modes'
import {BusView} from './bus'

export {OtherModesView}

export const ExpressLineBusView = (): React.ReactNode => (
	<BusView line="Express Bus" />
)
export const RedLineBusView = (): React.ReactNode => <BusView line="Red Line" />
export const BlueLineBusView = (): React.ReactNode => (
	<BusView line="Blue Line" />
)
export const OlesGoView = (): React.ReactNode => <BusView line="Oles Go" />
```

(`createNativeBottomTabNavigator`, `Tab`, `View`, `Params`,
`NavigationParams`, `NavigationKey`, `NavigationOptions` are all deleted —
dead once `routes.tsx` no longer references them, Step 6, and once
expo-router's file-based `NativeTabs` layout owns tab routing, Steps 9-10.
The four bus-line view components were previously unexported local
consts — now exported directly, since the new `app/` route files need to
import them.)

- [ ] **Step 6: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as transportation from '../views/transportation'
import {BusRouteDetail} from '../views/transportation/bus/detail'
```

and remove the Transportation `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={transportation.View}
					name={transportation.NavigationKey}
					options={transportation.NavigationOptions}
				/>
				<Stack.Screen
					component={BusRouteDetail}
					name="BusRouteDetail"
					options={({route}) => ({
						title: `${route.params.line.line} Schedule`,
					})}
				/>
			</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 7: Update `source/navigation/types.tsx`**

Replace:

```typescript
import * as transportation from '../views/transportation'
```

with nothing (delete the line — `transportation.NavigationKey` no longer
exists after Step 5).

Replace:

```typescript
	[transportation.NavigationKey]: undefined
```

with:

```typescript
	Transportation: undefined
```

(same pattern already used for `Menus`/`'Streaming Media'`/`News` on the
surrounding lines. Leave `BusMapView`/`BusRouteDetail`'s type entries
exactly as they are — `BusMapView` per this plan's dead-code note,
`BusRouteDetail` because `app/(home)/BusRouteDetail.tsx`, Step 12, does
not use this type at all — it derives `stop`/`line`/`subtitle` itself
rather than reading them from a typed route-param object.)

- [ ] **Step 8: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`transportation` entry.

- [ ] **Step 9: Give the outer "Transportation" entry its title**

In `app/(home)/_layout.tsx`, add a fourth entry to the existing `<Stack>`
(alongside the `Menus`, `Streaming Media`, and `News` entries prior
groups' plans already added):

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack>
			<Stack.Screen name="Menus" options={{title: 'Menus'}} />
			<Stack.Screen
				name="Streaming Media"
				options={{title: 'Streaming Media'}}
			/>
			<Stack.Screen name="News" options={{title: 'News'}} />
			<Stack.Screen name="Transportation" options={{title: 'Transportation'}} />
		</Stack>
	)
}
```

- [ ] **Step 10: Create the native tab bar layout**

Create `app/(home)/Transportation/_layout.tsx` — this is the *entire*
file, not a wrapper around anything else, exactly like the three prior
tab-bar groups' `_layout.tsx`:

```typescript
import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function TransportationLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="bus.fill" />
				<NativeTabs.Trigger.Label>Express Bus</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="red-line">
				<NativeTabs.Trigger.Icon sf="bus.fill" />
				<NativeTabs.Trigger.Label>Red Line</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="blue-line">
				<NativeTabs.Trigger.Icon sf="bus.fill" />
				<NativeTabs.Trigger.Label>Blue Line</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="oles-go">
				<NativeTabs.Trigger.Icon sf="car.fill" />
				<NativeTabs.Trigger.Label>Oles Go</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="other-modes">
				<NativeTabs.Trigger.Icon sf="sailboat.fill" />
				<NativeTabs.Trigger.Label>Other Modes</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

- [ ] **Step 11: Create the 5 tab route files**

Create `app/(home)/Transportation/index.tsx`:

```typescript
import * as React from 'react'
import {ExpressLineBusView} from '../../../source/views/transportation'

export default function ExpressLineBusPage(): React.ReactNode {
	return <ExpressLineBusView />
}
```

Create `app/(home)/Transportation/red-line.tsx`:

```typescript
import * as React from 'react'
import {RedLineBusView} from '../../../source/views/transportation'

export default function RedLineBusPage(): React.ReactNode {
	return <RedLineBusView />
}
```

Create `app/(home)/Transportation/blue-line.tsx`:

```typescript
import * as React from 'react'
import {BlueLineBusView} from '../../../source/views/transportation'

export default function BlueLineBusPage(): React.ReactNode {
	return <BlueLineBusView />
}
```

Create `app/(home)/Transportation/oles-go.tsx`:

```typescript
import * as React from 'react'
import {OlesGoView} from '../../../source/views/transportation'

export default function OlesGoPage(): React.ReactNode {
	return <OlesGoView />
}
```

Create `app/(home)/Transportation/other-modes.tsx`:

```typescript
import * as React from 'react'
import {OtherModesView} from '../../../source/views/transportation'

export default function OtherModesPage(): React.ReactNode {
	return <OtherModesView />
}
```

(none of these 5 need their own `<Stack.Screen options={...}>` —
`NativeTabs` draws the tab bar and each leaf screen renders full-bleed
below it with no per-tab header, matching the original
`Tab.Navigator screenOptions={{headerShown: false}}` behavior exactly.)

- [ ] **Step 12: Create the BusRouteDetail route**

Create `app/(home)/BusRouteDetail.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {timezone} from '@frogpond/constants'
import {useMomentTimer} from '@frogpond/timer'

import {BusRouteDetail as BusRouteDetailView} from '../../source/views/transportation/bus/detail'
import {busLineOptions} from '../../source/views/transportation/bus/query'
import {deriveFromProps} from '../../source/views/transportation/bus/line'
import {createMomentForDay} from '../../source/views/transportation/bus/components/day-picker'
import type {DayOfWeek} from '../../source/views/transportation/bus/types'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function BusRouteDetailPage(): React.ReactNode {
	let {line: lineName, day, stopName} = useLocalSearchParams<{
		line: string
		day: DayOfWeek
		stopName: string
	}>()

	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})

	let {
		data: line,
		isLoading,
		error,
		refetch,
	} = useQuery(busLineOptions(lineName))

	let screen = (
		<Stack.Screen options={{title: line ? `${line.line} Schedule` : ''}} />
	)

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!line) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the "${lineName}" bus line.`} />
			</>
		)
	}

	let momentForDay = createMomentForDay(now, day)
	let {subtitle, schedule} = deriveFromProps({line, now: momentForDay})
	let stop = schedule.timetable.find((entry) => entry.name === stopName)

	if (!stop) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the stop "${stopName}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<BusRouteDetailView line={line} stop={stop} subtitle={subtitle} />
		</>
	)
}
```

- [ ] **Step 13: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 14: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant), in
the FOREGROUND, genuinely waited on to completion.

Expected: home screen shows eleven tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory, Campus Dictionary, stoPrint, Menus,
Streaming Media, News, Transportation). Tapping "Transportation" shows a
header reading "‹ All About Olaf | Transportation" with a working back
button, and below it a native tab bar with 5 tabs (Express Bus, Red Line,
Blue Line, Oles Go, Other Modes), each with the correct SF Symbol icon,
Express Bus selected by default. Tapping between tabs switches content
without losing the tab bar or the header. On a bus-line tab, use the day
picker to select a day, then tap a stop in the timetable — this hides the
tab bar and pushes to the bus route detail screen (title "<Line> Schedule"),
showing that stop's departure times, with a back button returning to the
line tab. No crash anywhere in this flow.

The bus routes and other-modes list hit live network endpoints — note in
the report whether real data was reachable in this sandboxed environment,
and if not, confirm the loading/error states at minimum render correctly
and non-crashing.

Screenshot: home screen (eleven tiles, no others), the Transportation tab
bar (Express Bus selected, showing the header with back button), the
Other Modes tab, and a bus route detail screen — look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 15: Commit**

```bash
git add source/views/transportation/index.tsx source/views/transportation/bus/line.tsx source/views/transportation/bus/wrapper.tsx source/views/transportation/bus/detail.tsx source/views/transportation/bus/query.ts source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/Transportation/ app/\(home\)/BusRouteDetail.tsx
git commit -m "Restore the Transportation home-grid tile

Tenth group PR in checkpoint 2's stack, and the fourth tab-bar
group -- applies the proven NativeTabs flat-structure pattern to 5
tabs. BusRouteDetail is architecturally new among this stack's
detail screens: its data (which timetable stop, and its live status
subtitle) is a day-of-week- and time-dependent derivation, not a
static server-cached record. busLineOptions extends this stack's
select-based single-item pattern to the one piece that IS static
(the line itself); the URL carries line/day/stopName as plain
strings, and app/(home)/BusRouteDetail.tsx re-derives subtitle and
the specific stop using the exact same deriveFromProps logic the
original BusLine screen already used, now exported and shared
rather than duplicated -- this is more correct than freezing a
stale subtitle at tap-time, not a workaround.

Found and removed dead plumbing while decoupling navigation:
BusLine's openMap prop navigated to BusMapView, a screen that was
never registered in routes.tsx even before this migration and
renders placeholder text (Mapbox was already removed) -- and the
prop itself was never read anywhere in BusLine's render, making it
inert on both ends. Deleted outright rather than reintroduced,
since bus/wrapper.tsx needed its react-navigation import removed
regardless. bus/map.tsx itself is untouched, unwired, and
out of scope, same as this migration's other confirmed-dead files.

source/navigation/routes.tsx's Transportation registration (both
screens, dead code, still type-checked) is removed in the same
commit."
```

- [ ] **Step 16: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
