# expo-router checkpoint 2, group PR 11: Building Hours

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Building Hours" home-grid tile: list → detail →
"Report a Problem" → "Edit Schedule". Eleventh group PR in checkpoint 2's
stack. List and Detail follow the now-routine list-detail pattern
(Contacts, Student Orgs, Directory). The report/editor pair is genuinely
new territory in this migration and is split into its own task.

**List → Detail (routine).** `BuildingHoursView` navigates to
`BuildingHoursDetail` with a full `{building: BuildingType}` payload —
same shape as every prior list-detail group. A `select`-based
`buildingByNameOptions(name)` shares `buildingsOptions`'s exact
`queryKey`/fetch and selects one building by name, same pattern as
Contacts/Student Orgs/Directory. `BuildingHoursDetailView` becomes a
plain `{building: BuildingType}` prop component.

**Report → Editor: architecturally new, decided by Wren.** The original
`BuildingHoursProblemReportView` holds an in-progress edit as local
`useReducer` state and passes **live callback closures**
(`onEditSet`, `onDeleteSet`) to `BuildingHoursScheduleEditorView` via
navigation params — a pattern with no expo-router equivalent, since a
function cannot cross a URL-based route boundary. Wren's decision: do the
real redesign now rather than defer it. **The in-progress draft moves
from component-local `useReducer` state into a new Redux Toolkit slice**
(`source/redux/parts/building-hours-report.ts`) that both screens read
and write directly — this project already uses Redux Toolkit for global
app state (see `source/redux/parts/buildings.ts`'s favorites slice,
already used by this exact feature for `BuildingFavoriteButton`), so this
extends an established pattern rather than introducing a new one
(Zustand, Context, etc.).

The existing `buildingReducer` pure function (`report/building-reducer.ts`)
is reused unchanged inside the new slice's `applyBuildingAction` reducer —
its `BuildingAction` union and all 7 action cases are untouched, only
*where* the reducing happens moves (from a component's `useReducer` call
to a Redux slice reducer). This means the editor screen no longer needs
`onEditSet`/`onDeleteSet` callbacks *at all*: it can dispatch
`applyBuildingAction({type: 'SET_HOURS', ...})` directly against the
shared draft, using only `scheduleIndex`/`setIndex` (plain numbers,
stringified for the URL) to identify which schedule/hours-set it's
editing — both always point at an already-existing entry in the draft
(confirmed by reading `report/overview.tsx`: the editor is only opened
from an existing `TimesCell` row, never for a brand-new blank entry —
"Add More Hours" dispatches `ADD_HOURS` directly and stays on the report
screen; the user then taps the newly-added blank row to open the editor
on it). The editor reads the *current* set value straight from the shared
draft via `scheduleIndex`/`setIndex` — no need to also pass the set's
data through the URL.

**Persistence:** the draft must **not** survive an app restart — a
half-finished bug report resurrecting itself days later would be
surprising, not helpful. `source/redux/store.ts`'s `persistConfig`
currently has no blacklist (every slice persists) — this plan adds
`blacklist: ['buildingHoursReport']`.

**Discard-confirmation stays.** The original report screen's
`beforeRemove` listener + `gestureEnabled: false` (prevents a swipe
dismissing unsaved edits without confirmation) is preserved — it's a
`@react-navigation/native` navigator-level event that still fires under
expo-router's Stack (expo-router's Stack *is* a `@react-navigation`
native-stack navigator under the hood), so the mechanism itself doesn't
need to change, only which hook supplies the `navigation` object
(expo-router's own `useNavigation()`, matching every prior group's
"two hooks, two jobs" precedent — `useNavigation()` for the
listener/`goBack()`-adjacent APIs, `useRouter()` for actual pushes).

**Modal presentation stays.** Both `NavigationOptions` objects specify
`presentation: 'modal'` — expo-router's `<Stack.Screen
options={{presentation: 'modal'}}>` supports this directly; both `app/`
wrappers set it.

## Global Constraints

- Branch `expo-router-home-building-hours`, stacked on
  `expo-router-home-transportation` (PR #7681).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- This plan has two tasks. Task 1 (List/Detail) can ship on its own; Task
  2 (Report/Editor redesign) depends on Task 1's `buildingByNameOptions`
  and route conventions but is otherwise self-contained. Do not start
  Task 2 before Task 1 is reviewed and complete.

---

### Task 1: Wire the Building Hours list and detail screens into expo-router

**Files:**
- Modify: `source/views/building-hours/list.tsx`
- Modify: `source/views/building-hours/detail/index.tsx`
- Modify: `source/views/building-hours/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Modify: `source/views/views.ts`
- Modify: `app/(home)/_layout.tsx`
- Create: `app/(home)/BuildingHours/index.tsx`
- Create: `app/(home)/BuildingHours/[name].tsx`

**Interfaces:**
- Consumes: `BuildingHoursView` from `source/views/building-hours/list.tsx`;
  `BuildingHoursDetailView` (new prop shape: `{building: BuildingType}`)
  from `source/views/building-hours/detail`; `buildingByNameOptions`
  from `source/views/building-hours/query.ts`.
- Produces: `/BuildingHours` and `/BuildingHours/[name]` routes.

- [ ] **Step 1: Add the shared `select`-based single-building query**

In `source/views/building-hours/query.ts`, replace the whole file with:

```typescript
import {client} from '@frogpond/api'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'
import {groupBy} from 'lodash'
import {selectFavoriteBuildings, useAppSelector} from '../../redux'
import {BuildingType} from './types'

export const keys = {
	all: ['buildings'] as const,
}

async function fetchBuildings({
	signal,
}: {
	signal: AbortSignal
}): Promise<BuildingType[]> {
	let response = await client.get('spaces/hours', {signal}).json()
	return (response as {data: BuildingType[]}).data
}

export const buildingsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchBuildings,
})

export const buildingByNameOptions = (
	name: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchBuildings,
		select: (buildings) => buildings.find((b) => b.name === name),
	})

export function useGroupedBuildings(): UseQueryResult<
	Array<{title: string; data: BuildingType[]}>,
	unknown
> {
	let favoriteBuildings = useAppSelector(selectFavoriteBuildings)

	return useQuery({
		...buildingsOptions,
		select: (buildings) => {
			let favoritesGroup = {
				title: 'Favorites',
				data: buildings.filter((b) => favoriteBuildings.includes(b.name)),
			}

			let grouped = groupBy(buildings, (b) => b.category || 'Other')
			let groupedBuildings = Object.entries(grouped).map(([key, value]) => ({
				title: key,
				data: value,
			}))

			if (favoritesGroup.data.length > 0) {
				groupedBuildings = [favoritesGroup, ...groupedBuildings]
			}

			return groupedBuildings
		},
	})
}
```

(`buildingsOptions`/`useGroupedBuildings` are otherwise unchanged in
behavior — only the inline fetch became `fetchBuildings` so
`buildingByNameOptions` can share it.)

- [ ] **Step 2: Swap the list screen's navigation**

In `source/views/building-hours/list.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {useMomentTimer} from '@frogpond/timer'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import type {LegacyRootParamList} from '../../navigation/types'
```

with:

```typescript
import {useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'
```

(the `NativeStackNavigationOptions`-typed `export const NavigationOptions`
also goes away — its static title moves to the `app/` wrapper, Step 8.)

Replace:

```typescript
export function BuildingHoursView(): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute'})
```

with:

```typescript
export function BuildingHoursView(): React.ReactNode {
	let router = useRouter()

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute'})
```

Replace:

```typescript
	let onPressRow = React.useCallback(
		(building: BuildingType) =>
			navigation.navigate('BuildingHoursDetail', {building}),
		[navigation],
	)
```

with:

```typescript
	let onPressRow = React.useCallback(
		(building: BuildingType) =>
			router.push({
				pathname: '/BuildingHours/[name]',
				params: {name: building.name},
			}),
		[router],
	)
```

Delete the trailing export:

```typescript
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Building Hours',
	headerBackTitle: 'Back',
}
```

Everything else in the file (the `useGroupedBuildings` call, loading/error
states, the `SectionList` render) is unchanged.

- [ ] **Step 3: Change the detail screen to accept `building` as a prop**

In `source/views/building-hours/detail/index.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {
	NavigationProp,
	RouteProp,
	useNavigation,
	useRoute,
} from '@react-navigation/native'
import {
	LegacyRootParamList,
	RootStackParamList,
} from '../../../navigation/types'
```

with:

```typescript
import {useRouter} from 'expo-router'
import type {BuildingType} from '../types'
```

Replace:

```typescript
export function BuildingHoursDetailView(): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {building: info} = route.params

	let reportProblem = React.useCallback(
		() =>
			navigation.navigate('BuildingHoursProblemReport', {
				initialBuilding: info,
			}),
		[info, navigation],
	)
```

with:

```typescript
type Props = {
	building: BuildingType
}

export function BuildingHoursDetailView({
	building: info,
}: Props): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})

	let reportProblem = React.useCallback(
		() =>
			router.push({
				pathname: '/BuildingHoursProblemReport',
				params: {name: info.name},
			}),
		[info.name, router],
	)
```

Delete these two exports entirely (dead code once `routes.tsx` no longer
references them, Task 1 Step 4, and once `app/(home)/BuildingHours/[name].tsx`
supplies the header dynamically, Step 9):

```typescript
export const NavigationKey = 'BuildingHoursDetail'

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {name} = props.route.params.building
	return {
		title: name,
		headerRight: (p) => <BuildingFavoriteButton {...p} buildingName={name} />,
	}
}
```

Everything else in the file (the `BuildingDetail` render) is unchanged.
(`reportProblem` now pushes to `/BuildingHoursProblemReport` with just
`{name: info.name}` — Task 2 resolves the full `initialBuilding` from
this same `buildingByNameOptions` cache, the same select-based pattern
Task 1 already established, rather than carrying a whole `BuildingType`
object through the URL.)

- [ ] **Step 4: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as buildingHours from '../views/building-hours'
```

and remove ONLY the `BuildingHours`/`BuildingHoursDetail` screens from
the Building Hours `Stack.Group` (leave the Report/Editor screens'
registration in place for now — Task 2 removes those, since Task 2 is
what actually decouples them):

```typescript
				<Stack.Screen
					component={buildingHours.BuildingHoursDetailView}
					name="BuildingHoursDetail"
					options={buildingHours.DetailNavigationOptions}
				/>
				<Stack.Screen
					component={buildingHours.BuildingHoursView}
					name="BuildingHours"
					options={buildingHours.NavigationOptions}
				/>
```

This leaves the `Stack.Group` containing only the Report/Editor screens
until Task 2 removes those too and deletes the group entirely. This will
cause a `tsc` error on `buildingHours.BuildingHoursProblemReportView`'s
neighboring lines if the import is fully removed — instead, replace the
import with a scoped one that keeps only what those two remaining lines
need:

```typescript
import {BuildingHoursProblemReportView, BuildingHoursScheduleEditorView, ReportNavigationKey, ReportNavigationOptions, EditorNavigationOptions} from '../views/building-hours/report'
```

and update the two remaining `Stack.Screen` entries to reference these
directly (`BuildingHoursProblemReportView` instead of
`buildingHours.BuildingHoursProblemReportView`, etc.) instead of via the
`buildingHours` namespace, since that namespace import is gone.

- [ ] **Step 5: Update the barrel export**

In `source/views/building-hours/index.ts`, replace:

```typescript
export {BuildingHoursView, NavigationOptions} from './list'

export {
	BuildingHoursDetailView,
	NavigationOptions as DetailNavigationOptions,
} from './detail'

export {
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
	ReportNavigationOptions,
	EditorNavigationOptions,
	ReportNavigationKey,
} from './report'
```

with:

```typescript
export {BuildingHoursView} from './list'

export {BuildingHoursDetailView} from './detail'

export {
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
	ReportNavigationOptions,
	EditorNavigationOptions,
	ReportNavigationKey,
} from './report'
```

(the Report/Editor exports stay untouched here — Task 2 changes them.)

- [ ] **Step 6: Update `source/navigation/types.tsx`**

Replace:

```typescript
	BuildingHoursDetail: {building: BuildingType}
```

with:

```typescript
	BuildingHours: undefined
	BuildingHoursDetail: {building: BuildingType}
```

(adds the literal `BuildingHours` key that `buildingHours.NavigationKey`
used to provide — check first whether `[buildingHours.NavigationKey]`
already exists elsewhere in this file from the original registration; if
so, replace that computed key with this literal instead of adding a new
line. `BuildingType` stays imported — still used by this line and by
`BuildingHoursDetail`.)

- [ ] **Step 7: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`hours` entry.

- [ ] **Step 8: Give the outer "BuildingHours" entry its title**

In `app/(home)/_layout.tsx`, add a fifth entry to the existing `<Stack>`
(alongside the `Menus`, `Streaming Media`, `News`, and `Transportation`
entries prior groups' plans already added):

```typescript
<Stack.Screen name="BuildingHours" options={{title: 'Building Hours'}} />
```

- [ ] **Step 9: Create the list route wrapper**

Create `app/(home)/BuildingHours/index.tsx`:

```typescript
import * as React from 'react'
import {BuildingHoursView} from '../../../source/views/building-hours'

export default function BuildingHoursPage(): React.ReactNode {
	return <BuildingHoursView />
}
```

(no `<Stack.Screen>` needed — `(home)/_layout.tsx`'s Step 8 entry already
supplies a static "Building Hours" title for this whole route, the same
approach every prior tab-bar/list group used for its outer entry.)

- [ ] **Step 10: Create the detail route**

Create `app/(home)/BuildingHours/[name].tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {BuildingHoursDetailView} from '../../../source/views/building-hours'
import {buildingByNameOptions} from '../../../source/views/building-hours/query'
import {BuildingFavoriteButton} from '../../../source/views/building-hours/detail/toolbar-button'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function BuildingHoursDetailPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {
		data: building,
		isLoading,
		error,
		refetch,
	} = useQuery(buildingByNameOptions(name))

	let screen = (
		<Stack.Screen
			options={{
				title: building?.name ?? name,
				headerRight: building
					? () => <BuildingFavoriteButton buildingName={building.name} />
					: undefined,
			}}
		/>
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

	if (!building) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the "${name}" building.`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<BuildingHoursDetailView building={building} />
		</>
	)
}
```

(`headerRight` here takes no `HeaderButtonProps` argument, unlike the
original — `BuildingFavoriteButton` never actually used the props it
received (`{...p}`) for anything besides forwarding them nowhere useful;
confirmed by reading `toolbar-button.tsx`, whose own `Props` type is just
`{buildingName: string}`. Dropping the unused pass-through is a
no-behavior-change simplification, not a functional change.)

- [ ] **Step 11: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 12: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant), in
the FOREGROUND, genuinely waited on to completion.

Expected: home screen shows twelve tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory, Campus Dictionary, stoPrint, Menus,
Streaming Media, News, Transportation, Building Hours). Tapping "Building
Hours" shows a header reading "‹ All About Olaf | Building Hours" with a
working back button, and a grouped list (Favorites first if any, then by
category). Tapping a building navigates to its detail screen (name,
hours, favorite-star button in the header). Tapping the favorite star
toggles it (confirm this still works — it goes through the pre-existing,
unmodified `buildings` Redux slice). Tapping "Report a Problem" — the
button's target route doesn't exist yet at the end of this task (Task 2
creates it) — showing expo-router's built-in "Unmatched Route" screen is
expected and correct for Task 1's scope; do not treat it as a bug. No
crash anywhere in this flow.

Screenshot: home screen (twelve tiles, no others), the Building Hours
list (showing Favorites if you've starred one), and a building detail
screen — look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 13: Commit**

```bash
git add source/views/building-hours/list.tsx source/views/building-hours/detail/index.tsx source/views/building-hours/query.ts source/views/building-hours/index.ts source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/BuildingHours/
git commit -m "Restore the Building Hours list and detail screens

Eleventh group PR in checkpoint 2's stack. List and detail follow
this stack's now-routine list-detail pattern (buildingByNameOptions
shares buildingsOptions's queryKey/fetch, select-based lookup by
name). Report/editor (the group's genuinely new architectural
problem -- live callback closures crossing what would need to be a
URL boundary) is intentionally left on the old registration and
split into its own task; tapping \"Report a Problem\" shows
expo-router's Unmatched Route screen until that task lands, same as
this stack's established defer-and-flag precedent for scope that
needs its own dedicated design pass.

source/navigation/routes.tsx keeps its Report/Editor registration
for now, trimmed only of the two screens this task actually
migrates."
```

---

### Task 2: Redesign Report/Editor around shared Redux state and wire into expo-router

**Files:**
- Create: `source/redux/parts/building-hours-report.ts`
- Modify: `source/redux/store.ts`
- Modify: `source/redux/index.ts`
- Modify: `source/views/building-hours/report/overview.tsx`
- Modify: `source/views/building-hours/report/editor.tsx`
- Modify: `source/views/building-hours/report/index.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Create: `app/(home)/BuildingHoursProblemReport.tsx`
- Create: `app/(home)/BuildingHoursScheduleEditor.tsx`

**Interfaces:**
- Consumes: `buildingByNameOptions` from
  `source/views/building-hours/query.ts` (Task 1); `buildingReducer`,
  `BuildingAction` from `report/building-reducer.ts`;
  `BuildingHoursProblemReportView` (new prop shape: `{initialBuilding:
  BuildingType}`), `BuildingHoursScheduleEditorView` (new prop shape:
  `{scheduleIndex: number; setIndex: number}`) from `report/overview.tsx`
  and `report/editor.tsx`.
- Produces: `/BuildingHoursProblemReport` and
  `/BuildingHoursScheduleEditor` routes, both flat siblings of
  `BuildingHours/` at the `(home)/` level, both modal-presented.

- [ ] **Step 1: Create the Redux slice**

Create `source/redux/parts/building-hours-report.ts`:

```typescript
import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import type {BuildingType} from '../../views/building-hours/types'
import {
	buildingReducer,
	type BuildingAction,
} from '../../views/building-hours/report/building-reducer'

export type State = {
	building: BuildingType | null
	initialBuilding: BuildingType | null
}

const initialState: State = {
	building: null,
	initialBuilding: null,
}

const slice = createSlice({
	name: 'buildingHoursReport',
	initialState,
	reducers: {
		startReport(state, action: PayloadAction<BuildingType>) {
			state.building = action.payload
			state.initialBuilding = action.payload
		},
		clearReport(state) {
			state.building = null
			state.initialBuilding = null
		},
		applyBuildingAction(state, action: PayloadAction<BuildingAction>) {
			if (!state.building) {
				return
			}
			state.building = buildingReducer(state.building, action.payload)
		},
	},
})

export const {startReport, clearReport, applyBuildingAction} = slice.actions
export const reducer = slice.reducer

export const selectReportDraft = (state: RootState): State['building'] =>
	state.buildingHoursReport.building

export const selectReportHasUnsavedChanges = (state: RootState): boolean => {
	let {building, initialBuilding} = state.buildingHoursReport
	if (!building || !initialBuilding) {
		return false
	}
	return JSON.stringify(building) !== JSON.stringify(initialBuilding)
}
```

(`applyBuildingAction` delegates to the existing, unmodified
`buildingReducer` — every one of its 7 action cases (`SET_BUILDING_NAME`,
`ADD_SCHEDULE`, `UPDATE_SCHEDULE`, `DELETE_SCHEDULE`, `ADD_HOURS`,
`SET_HOURS`, `DELETE_HOURS`) works exactly as before; only the *caller*
changes, from a component's local `dispatch` to this slice's dispatch.)

- [ ] **Step 2: Register the slice and blacklist it from persistence**

In `source/redux/store.ts`, replace:

```typescript
import {reducer as settings} from './parts/settings'
import {reducer as buildings} from './parts/buildings'
import {reducer as courses} from './parts/courses'
```

with:

```typescript
import {reducer as settings} from './parts/settings'
import {reducer as buildings} from './parts/buildings'
import {reducer as buildingHoursReport} from './parts/building-hours-report'
import {reducer as courses} from './parts/courses'
```

Replace:

```typescript
const rootReducer = combineReducers({
	settings,
	buildings,
	courses,
})
```

with:

```typescript
const rootReducer = combineReducers({
	settings,
	buildings,
	buildingHoursReport,
	courses,
})
```

Replace:

```typescript
const persistConfig = {
	key: 'root',
	version: 1,
	storage: AsyncStorage,
}
```

with:

```typescript
const persistConfig = {
	key: 'root',
	version: 1,
	storage: AsyncStorage,
	// A report draft is a mid-edit scratch buffer, not durable app state --
	// resurrecting a half-finished bug report days after the app was closed
	// would be surprising, not helpful.
	blacklist: ['buildingHoursReport'],
}
```

- [ ] **Step 3: Export the new slice's public API**

In `source/redux/index.ts`, add:

```typescript
export {
	startReport,
	clearReport,
	applyBuildingAction,
	selectReportDraft,
	selectReportHasUnsavedChanges,
} from './parts/building-hours-report'
```

(alongside the existing exports — add this as a new line, don't remove
anything.)

- [ ] **Step 4: Redesign the report screen around shared state**

In `source/views/building-hours/report/overview.tsx`, replace:

```typescript
import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../types'
import {summarizeDays, formatBuildingTimes} from '../lib'
import {submitReport} from './submit'
import {buildingReducer, type BuildingAction} from './building-reducer'
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {RootStackParamList} from '../../../navigation/types'
```

with:

```typescript
import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../types'
import {summarizeDays, formatBuildingTimes} from '../lib'
import {submitReport} from './submit'
import {
	applyBuildingAction,
	clearReport,
	selectReportDraft,
	selectReportHasUnsavedChanges,
	startReport,
	useAppDispatch,
	useAppSelector,
} from '../../../redux'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation, useRouter} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
```

Replace the entire `useBuildingEditor` function:

```typescript
function useBuildingEditor(
	initialBuilding: BuildingType,
	navigation: NativeStackNavigationProp<RootStackParamList>,
) {
	let [building, dispatch] = React.useReducer(buildingReducer, initialBuilding)
	let [submitted, setSubmitted] = React.useState(false)

	let initialBuildingJson = React.useMemo(
		() => JSON.stringify(initialBuilding),
		[initialBuilding],
	)

	let hasDiff = React.useMemo(
		() => JSON.stringify(building) !== initialBuildingJson,
		[building, initialBuildingJson],
	)

	let hasUnsavedChanges = hasDiff && !submitted

	/**
	 * checking for unsaved edits
	 *
	 * noting that we also have `gestureEnabled` set to false in the navigation options
	 * (ios only) to prevent dismissing the modal without prompting.
	 * https://reactnavigation.org/docs/preventing-going-back
	 */
	React.useEffect(
		() =>
			navigation.addListener('beforeRemove', (event) => {
				if (!hasUnsavedChanges) {
					return
				}

				event.preventDefault()

				Alert.alert(
					'Discard changes?',
					'You have made unsaved changes. Are you sure you want to discard them?',
					[
						{text: 'Edit', style: 'cancel', onPress: noop},
						{
							text: 'Discard',
							style: 'destructive',
							onPress: () => navigation.dispatch(event.data.action),
						},
					],
				)
			}),
		[navigation, hasUnsavedChanges],
	)

	let openEditor = React.useCallback(
		(scheduleIdx: number, setIdx: number, set?: SingleBuildingScheduleType) =>
			navigation.navigate('BuildingHoursScheduleEditor', {
				set: set,
				onEditSet: (editedData: SingleBuildingScheduleType) =>
					dispatch({
						type: 'SET_HOURS',
						scheduleIndex: scheduleIdx,
						setIndex: setIdx,
						data: editedData,
					}),
				onDeleteSet: () =>
					dispatch({
						type: 'DELETE_HOURS',
						scheduleIndex: scheduleIdx,
						setIndex: setIdx,
					}),
			}),
		[navigation],
	)

	let submit = React.useCallback((): void => {
		console.log(JSON.stringify(building))
		setSubmitted(true)
		submitReport(initialBuilding, building)
	}, [building, initialBuilding])

	return {building, dispatch, openEditor, submit}
}
```

with:

```typescript
function useBuildingEditor(initialBuilding: BuildingType) {
	let dispatch = useAppDispatch()
	let router = useRouter()
	let navigation = useNavigation()

	let building = useAppSelector(selectReportDraft) ?? initialBuilding
	let hasUnsavedChanges = useAppSelector(selectReportHasUnsavedChanges)

	let [submitted, setSubmitted] = React.useState(false)

	/**
	 * checking for unsaved edits
	 *
	 * noting that we also have `gestureEnabled` set to false in the navigation options
	 * (ios only) to prevent dismissing the modal without prompting.
	 * https://reactnavigation.org/docs/preventing-going-back
	 */
	React.useEffect(
		() =>
			navigation.addListener('beforeRemove', (event) => {
				if (!hasUnsavedChanges || submitted) {
					return
				}

				event.preventDefault()

				Alert.alert(
					'Discard changes?',
					'You have made unsaved changes. Are you sure you want to discard them?',
					[
						{text: 'Edit', style: 'cancel', onPress: noop},
						{
							text: 'Discard',
							style: 'destructive',
							onPress: () => navigation.dispatch(event.data.action),
						},
					],
				)
			}),
		[navigation, hasUnsavedChanges, submitted],
	)

	let dispatchAction = React.useCallback(
		(action: BuildingAction) => dispatch(applyBuildingAction(action)),
		[dispatch],
	)

	let openEditor = React.useCallback(
		(scheduleIdx: number, setIdx: number) =>
			router.push({
				pathname: '/BuildingHoursScheduleEditor',
				params: {
					scheduleIndex: String(scheduleIdx),
					setIndex: String(setIdx),
				},
			}),
		[router],
	)

	let submit = React.useCallback((): void => {
		setSubmitted(true)
		submitReport(initialBuilding, building)
	}, [building, initialBuilding])

	return {building, dispatch: dispatchAction, openEditor, submit}
}
```

(add `import type {BuildingAction} from './building-reducer'` alongside
the file's other imports — `BuildingAction` is still needed for
`dispatchAction`'s parameter type, even though `buildingReducer` itself
is no longer called directly from this file.)

Replace:

```typescript
export let BuildingHoursProblemReportView = (): React.ReactNode => {
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {initialBuilding} = route.params

	let {building, dispatch, openEditor, submit} = useBuildingEditor(
		initialBuilding,
		navigation,
	)
```

with:

```typescript
type Props = {
	initialBuilding: BuildingType
}

export let BuildingHoursProblemReportView = ({
	initialBuilding,
}: Props): React.ReactNode => {
	let appDispatch = useAppDispatch()

	React.useEffect(() => {
		appDispatch(startReport(initialBuilding))
		return () => {
			appDispatch(clearReport())
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	let {building, dispatch, openEditor, submit} = useBuildingEditor(
		initialBuilding,
	)
```

(the effect runs once per mount — `startReport` seeds the shared draft
from whatever `initialBuilding` this screen instance was opened with,
and the cleanup clears it on unmount so a stale draft can't leak into
the next time this screen opens. The `exhaustive-deps` disable is
deliberate: this must run exactly once per screen instance, not
re-run if `initialBuilding` happens to be a new object reference on
a re-render — the effect intentionally captures its closure's
`initialBuilding` value once, at mount.)

Everything else in `BuildingHoursProblemReportView`'s JSX body (the
`ScrollView`/`TableView`/`Section`/`Cell` rendering,
`EditableSchedule`/`TitleCell`/`TimesCell`) is unchanged — `dispatch` is
still called the same way at each call site (`dispatch({type: 'SET_BUILDING_NAME', ...})` etc.), it's just backed by `dispatchAction` now
instead of the deleted local `useReducer`.

Delete these two exports entirely (dead code once `routes.tsx` no longer
references them, Step 6, and once `app/(home)/BuildingHoursProblemReport.tsx`
supplies the header, Step 9):

```typescript
export const NavigationKey = 'BuildingHoursProblemReport'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Report a Problem',
	presentation: 'modal',
	headerRight: () => <CloseScreenButton title="Discard" />,
	/**
	 * Explicility setting `gestureEnabled` to false otherwise we can end up with a
	 * a screen that gets removed natively but did not get removed from JS state.
	 *
	 * This happens if the action was prevented in a `beforeRemove` listener which:
	 * (1) we are currently doing, and
	 * (2) is not fully supported in native-stack.
	 */
	gestureEnabled: false,
}
```

- [ ] **Step 5: Redesign the editor screen around shared state**

In `source/views/building-hours/report/editor.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'

export type RouteParams = {
	set: SingleBuildingScheduleType | undefined
	onEditSet: (set: SingleBuildingScheduleType) => unknown
	onDeleteSet: () => unknown
}

export function BuildingHoursScheduleEditorView(): React.ReactNode {
	let navigation = useNavigation()

	let route =
		useRoute<RouteProp<RootStackParamList, 'BuildingHoursScheduleEditor'>>()
	let {params} = route

	let [set, setSet] = useState<SingleBuildingScheduleType>(
		params.set ?? blankSchedule(),
	)

	let deleteSet = () => {
		params.onDeleteSet()
		navigation.goBack()
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		let newSet = {...set, days: newDays}
		setSet(newSet)
		params.onEditSet(newSet)
	}

	let onChangeOpen = (newDate: Moment) => {
		let newSet = {...set, from: newDate.format('h:mma')}
		setSet(newSet)
		params.onEditSet(newSet)
	}

	let onChangeClose = (newDate: Moment) => {
		let newSet = {...set, to: newDate.format('h:mma')}
		setSet(newSet)
		params.onEditSet(newSet)
	}
```

with:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {useRouter} from 'expo-router'
import {
	applyBuildingAction,
	selectReportDraft,
	useAppDispatch,
	useAppSelector,
} from '../../../redux'

type Props = {
	scheduleIndex: number
	setIndex: number
}

export function BuildingHoursScheduleEditorView({
	scheduleIndex,
	setIndex,
}: Props): React.ReactNode {
	let router = useRouter()
	let dispatch = useAppDispatch()

	let draft = useAppSelector(selectReportDraft)
	let set =
		draft?.schedule[scheduleIndex]?.hours[setIndex] ?? blankSchedule()

	let deleteSet = () => {
		dispatch(
			applyBuildingAction({type: 'DELETE_HOURS', scheduleIndex, setIndex}),
		)
		router.back()
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		let newSet = {...set, days: newDays}
		dispatch(
			applyBuildingAction({
				type: 'SET_HOURS',
				scheduleIndex,
				setIndex,
				data: newSet,
			}),
		)
	}

	let onChangeOpen = (newDate: Moment) => {
		let newSet = {...set, from: newDate.format('h:mma')}
		dispatch(
			applyBuildingAction({
				type: 'SET_HOURS',
				scheduleIndex,
				setIndex,
				data: newSet,
			}),
		)
	}

	let onChangeClose = (newDate: Moment) => {
		let newSet = {...set, to: newDate.format('h:mma')}
		dispatch(
			applyBuildingAction({
				type: 'SET_HOURS',
				scheduleIndex,
				setIndex,
				data: newSet,
			}),
		)
	}
```

(remove the now-unused `useState` import from `react` if nothing else in
this file uses it — check `summary`'s `React.useMemo`, which still needs
`React`, just not `useState` specifically. `set` is now derived directly
from the shared draft on every render — dispatching `SET_HOURS`
immediately updates the draft, which flows back into this same `set`
value on the next render, so the editor stays in sync with what it just
wrote without needing its own local mirror of the value.)

Delete the trailing export:

```typescript
export const NavigationKey = 'BuildingHoursProblemReportEditor'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Edit Schedule',
	presentation: 'modal',
	headerRight: () => <CloseScreenButton />,
}
```

Everything else in the file (`WeekToggles`, `ToggleButton`,
`DatePickerAccessory`, styles) is unchanged.

- [ ] **Step 6: Update the barrel export**

In `source/views/building-hours/report/index.ts`, replace:

```typescript
export {
	BuildingHoursScheduleEditorView,
	NavigationOptions as EditorNavigationOptions,
} from './editor'
export {
	BuildingHoursProblemReportView,
	NavigationOptions as ReportNavigationOptions,
	NavigationKey as ReportNavigationKey,
} from './overview'
```

with:

```typescript
export {BuildingHoursScheduleEditorView} from './editor'
export {BuildingHoursProblemReportView} from './overview'
```

In `source/views/building-hours/index.ts`, replace:

```typescript
export {
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
	ReportNavigationOptions,
	EditorNavigationOptions,
	ReportNavigationKey,
} from './report'
```

with:

```typescript
export {
	BuildingHoursProblemReportView,
	BuildingHoursScheduleEditorView,
} from './report'
```

- [ ] **Step 7: Remove the now-fully-dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import added in Task 1's
Step 4:

```typescript
import {BuildingHoursProblemReportView, BuildingHoursScheduleEditorView, ReportNavigationKey, ReportNavigationOptions, EditorNavigationOptions} from '../views/building-hours/report'
```

and remove the now-empty Building Hours `Stack.Group` entirely:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={BuildingHoursProblemReportView}
					name={ReportNavigationKey}
					options={ReportNavigationOptions}
				/>
				<Stack.Screen
					component={BuildingHoursScheduleEditorView}
					name="BuildingHoursScheduleEditor"
					options={EditorNavigationOptions}
				/>
			</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 8: Update `source/navigation/types.tsx`**

Replace:

```typescript
import * as buildingHours from '../views/building-hours'
```

with nothing (delete the line — no longer used once
`buildingHours.ReportNavigationKey` is replaced below).

Replace:

```typescript
import {RouteParams as HoursEditorType} from '../views/building-hours/report/editor'
```

with nothing (delete the line — `RouteParams` no longer exists after
Step 5).

Replace:

```typescript
	[buildingHours.ReportNavigationKey]: {initialBuilding: BuildingType}
	BuildingHoursScheduleEditor: HoursEditorType
```

with:

```typescript
	BuildingHoursProblemReport: {initialBuilding: BuildingType}
	BuildingHoursScheduleEditor: undefined
```

(`BuildingHoursProblemReport` keeps its old, still-accurate shape as a
dead-but-documented type, same as `BuildingHoursDetail` and every other
group's leftover detail-param types in this file.
`BuildingHoursScheduleEditor` becomes `undefined` since the callback-based
shape it used to describe no longer represents anything real — the
route now only takes `scheduleIndex`/`setIndex` strings, handled directly
by `useLocalSearchParams` in the `app/` wrapper, not through this typed
system at all.)

- [ ] **Step 9: Create the report route**

Create `app/(home)/BuildingHoursProblemReport.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {CloseScreenButton} from '@frogpond/navigation-buttons'

import {BuildingHoursProblemReportView} from '../../source/views/building-hours'
import {buildingByNameOptions} from '../../source/views/building-hours/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function BuildingHoursProblemReportPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {
		data: building,
		isLoading,
		error,
		refetch,
	} = useQuery(buildingByNameOptions(name))

	let screen = (
		<Stack.Screen
			options={{
				title: 'Report a Problem',
				presentation: 'modal',
				headerRight: () => <CloseScreenButton title="Discard" />,
				gestureEnabled: false,
			}}
		/>
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

	if (!building) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the "${name}" building.`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<BuildingHoursProblemReportView initialBuilding={building} />
		</>
	)
}
```

- [ ] **Step 10: Create the editor route**

Create `app/(home)/BuildingHoursScheduleEditor.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'

import {BuildingHoursScheduleEditorView} from '../../source/views/building-hours'

export default function BuildingHoursScheduleEditorPage(): React.ReactNode {
	let {scheduleIndex, setIndex} = useLocalSearchParams<{
		scheduleIndex: string
		setIndex: string
	}>()

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Edit Schedule',
					presentation: 'modal',
					headerRight: () => <CloseScreenButton />,
				}}
			/>
			<BuildingHoursScheduleEditorView
				scheduleIndex={Number(scheduleIndex)}
				setIndex={Number(setIndex)}
			/>
		</>
	)
}
```

- [ ] **Step 11: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 12: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant), in
the FOREGROUND, genuinely waited on to completion.

Expected: from a building's detail screen, tapping "Report a Problem"
opens a modal sheet ("Report a Problem", with a "Discard" close button)
showing the building's current name/schedules, pre-filled from the real
data. Editing the building name field updates the draft. Tapping an
existing hours row opens a second modal ("Edit Schedule") pre-filled with
that row's actual days/times; changing the day toggles or the time
pickers and going back returns to the report screen showing the updated
summary for that row (confirming the shared-state round-trip actually
works, not just that the editor opens). Tapping "Add More Hours" adds a
blank row without leaving the report screen; tapping that new blank row
opens the editor on it. Attempting to swipe-dismiss the report screen
after making a change should NOT be possible (gesture disabled); tapping
"Discard" with unsaved changes should prompt "Discard changes?" before
closing. Submitting the report (don't actually send a real report if
possible — verify the confirmation/submit flow renders without crashing,
noting in the report if a real email composer would have opened). No
crash anywhere in this flow.

Screenshot: the report screen with real building data pre-filled, the
schedule editor screen for one existing row, and the report screen after
returning from the editor (showing the edited row's new summary text) —
look at each yourself, specifically confirming the edited value is
visible (not just that no crash occurred).

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 13: Commit**

```bash
git add source/redux/parts/building-hours-report.ts source/redux/store.ts source/redux/index.ts source/views/building-hours/report/overview.tsx source/views/building-hours/report/editor.tsx source/views/building-hours/report/index.ts source/views/building-hours/index.ts source/navigation/routes.tsx source/navigation/types.tsx app/\(home\)/BuildingHoursProblemReport.tsx app/\(home\)/BuildingHoursScheduleEditor.tsx
git commit -m "Redesign Building Hours' report/editor around shared Redux state

The original BuildingHoursProblemReportView held its in-progress
edit as local useReducer state and passed live onEditSet/onDeleteSet
callback closures to BuildingHoursScheduleEditorView through
navigation params -- a pattern with no expo-router equivalent, since
a function cannot cross a URL-based route boundary. Decided with
Wren: do the real redesign rather than defer it.

The draft moves into a new Redux Toolkit slice
(buildingHoursReport), extending this app's existing global-state
pattern (see the buildings favorites slice, already used by this
same feature) rather than introducing a new one. The existing
buildingReducer pure function is reused unchanged inside the slice's
applyBuildingAction reducer -- all 7 action cases are untouched, only
where the reducing happens moves. The editor screen no longer needs
callbacks at all: it dispatches applyBuildingAction directly using
only scheduleIndex/setIndex (both always point at an
already-existing draft entry) and reads the current set value
straight from the shared draft.

The draft is blacklisted from redux-persist -- a half-finished bug
report should not resurrect itself after an app restart.

The discard-confirmation beforeRemove listener and gestureEnabled:
false are preserved unchanged; they're @react-navigation
navigator-level mechanisms that still work under expo-router's
Stack, just sourced from expo-router's own useNavigation() now.

source/navigation/routes.tsx's now-fully-empty Building Hours
Stack.Group is removed in this commit."
```

- [ ] **Step 14: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
