# expo-router checkpoint 2, group PR 14: Calendar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Calendar" home-grid tile (a 2-tab screen: St. Olaf,
Northfield) and, in the same PR, finally wire up the two KSTO/KRLX radio
schedule routes that the already-shipped Streaming Media group PR
deliberately deferred — both depend on the exact same shared package,
`@frogpond/event-list`, so untangling its one react-navigation dependency
has to happen once, for all four call sites, together. Fourteenth group
PR in checkpoint 2's stack, and the last one with genuinely new design
work — Faq (the only group left after this) is a smaller, more
mechanical conversion.

**`EventType` has no id, so the usual "select an item out of the cached
list by id" pattern needs a synthetic key.** Every other id-based detail
screen in this migration (`jobByIdOptions`, `busLineOptions`,
`redditPostByUrlOptions`, `courseByIdOptions`) selects by a real id
already on the item. `EventType` (`modules/event-type/index.ts`) has no
id field at all — just `title`, `description`, `location`, `startTime`/
`endTime` (`Moment` objects once past `convertEvents`'s `select`),
`isOngoing`, `links`, `config`. This plan adds one small, exported helper,
`eventKey(event): string`, to `@frogpond/event-list` —
`` `${event.startTime.toISOString()}|${event.title}` `` — stable enough
to survive a refetch (unlike an array index) without inventing a real id
field on a type several other things may already depend on structurally.

**One shared `EventDetail` route, fed by four independent list queries.**
`modules/event-list`'s `EventList`/`EventDetail` components are consumed
by four call sites across two different app groups: Calendar's own St.
Olaf and Northfield tabs (`source/views/calendar/index.tsx`), and
Streaming Media's KSTO/KRLX schedule screens
(`source/views/streaming/radio/schedule.tsx`) — each with its own
`namedCalendarOptions` query key, its own `poweredBy` object, and (for
the two radio schedules) the same shared `eventMapper`. Rather than four
separate detail screens or one screen that somehow serializes an entire
event through the URL, this plan adds a single `source` URL param
(`'stolaf' | 'northfield' | 'ksto-schedule' | 'krlx-schedule'` — the
exact same string each call site already passes as `namedCalendarOptions`'s
first argument) alongside `eventKey`. A new
`namedCalendarEventOptions(calendar, key, options)` query factory in
`@frogpond/ccc-calendar/query.ts` shares its list sibling's exact
`queryKey` (`keys.named(calendar)`) and adds one `.find()` by `eventKey`
to the same `select` pipeline — so opening an event costs no extra
network round-trip beyond whatever the list screen already fetched,
matching this migration's established precedent everywhere else. The
`poweredBy` objects and the schedule `eventMapper` are small, static,
per-source constants — duplicating them once more into
`app/(home)/EventDetail.tsx` (rather than building a shared registry
module for four known, fixed values) matches how each of the four
existing call sites already independently declares its own `poweredBy`
inline; a registry would be premature abstraction for four call sites
that will never grow.

**`EventList`/`EventDetail` lose their react-navigation dependency
entirely, becoming pure, reusable components.** `EventList.tsx`'s
`onPressEvent` becomes a required prop (the caller decides where to
navigate), matching Menus' `FancyMenu`'s `onItemPress` conversion.
`EventDetail`'s `NavigationOptions` (a function reading `route.params.event.title`
for the header, building a `ShareButton` from the full event) moves into
the `app/(home)/EventDetail.tsx` wrapper's own `<Stack.Screen>`, set once
the query resolves — matching stoPrint's `PrinterListPage`/SIS's
`JobDetailPage` pattern, not Reddit's self-managing-header pattern
(there's no interactive menu here, just a static title + share button,
so the simpler wrapper-owns-the-header shape fits). A genuinely nice
side effect: `@frogpond/event-list` no longer imports
`@react-navigation/native` at all once this lands, so it stops being a
workspace package with a hidden framework dependency its own `package.json`
doesn't reflect.

**The KSTO/KRLX deferred-route obligation gets closed out as part of this
same task**, not a follow-up commit, since the plan/task boundary here is
naturally "make `@frogpond/event-list` navigation-agnostic and every
consumer works" — that necessarily includes both of Streaming Media's
call sites. `app/(home)/KSTOSchedule.tsx`/`KRLXSchedule.tsx` (flat
top-level routes, matching `RadioScheduleParamList`'s existing flat
`KSTOSchedule: undefined`/`KRLXSchedule: undefined` shape and the
`scheduleHref: '/KSTOSchedule' | '/KRLXSchedule'` prop already wired
into `RadioControllerView`) are new; `controller.tsx`'s `Href` cast and
its explanatory comment (added when the route didn't exist yet) come out
in the same task, exactly the way the equivalent cast came out of
`source/views/building-hours/detail/index.tsx` once its own deferred
route was created.

## Global Constraints

- Branch `expo-router-home-calendar`, stacked on `expo-router-home-sis`
  (PR #7688).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- The `calendar` entry in `source/views/views.ts` loses `disabled: true`
  (no other flags to preserve on that entry).

---

### Task 1: Make `@frogpond/event-list` navigation-agnostic, wire up Calendar and the deferred KSTO/KRLX routes

**Files:**
- Modify: `modules/event-list/event-list.tsx`
- Modify: `modules/event-list/event-detail-view.tsx`
- Modify: `modules/event-list/event-detail.tsx`
- Modify: `modules/event-list/calendar-util.ts`
- Modify: `modules/event-list/index.ts`
- Modify: `modules/ccc-calendar/index.tsx`
- Modify: `modules/ccc-calendar/query.ts`
- Modify: `source/views/calendar/index.tsx`
- Modify: `source/views/streaming/radio/schedule.tsx`
- Modify: `source/views/streaming/radio/controller.tsx`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Modify: `source/views/views.ts`
- Modify: `app/(home)/_layout.tsx`
- Create: `app/(home)/Calendar/_layout.tsx`
- Create: `app/(home)/Calendar/index.tsx`
- Create: `app/(home)/Calendar/northfield.tsx`
- Create: `app/(home)/EventDetail.tsx`
- Create: `app/(home)/KSTOSchedule.tsx`
- Create: `app/(home)/KRLXSchedule.tsx`

**Interfaces:**
- Consumes: `EventList.EventList` (new `onPressEvent: (event: EventType) => void` prop), `EventDetail.EventDetail` (new `{event: EventType; poweredBy: PoweredBy}` prop shape), `eventKey`, `shareEvent` — all from `@frogpond/event-list`; `CccCalendarView` (new `onPressEvent` prop), `namedCalendarOptions`, `namedCalendarEventOptions` — all from `@frogpond/ccc-calendar`.
- Produces: `/Calendar` (tab group, default tab St. Olaf), `/Calendar/northfield` (both within the tab bar, no per-tab header); `/EventDetail` (flat sibling of `Calendar/` at the `(home)/` level, shared by all four sources); `/KSTOSchedule`, `/KRLXSchedule` (flat top-level siblings, matching `RadioScheduleParamList`'s existing shape).

- [ ] **Step 1: Add `eventKey` and export `shareEvent` from the package barrel**

In `modules/event-list/calendar-util.ts`, add below the existing
imports:

```typescript
export function eventKey(event: EventType): string {
	return `${event.startTime.toISOString()}|${event.title}`
}
```

In `modules/event-list/index.ts`, replace the whole file with:

```typescript
export type {PoweredBy} from './types'

export * as EventList from './event-list'
export * as EventDetail from './event-detail'
export {shareEvent, eventKey} from './calendar-util'
```

- [ ] **Step 2: Add the shared, cache-key-matching detail query**

In `modules/ccc-calendar/query.ts`, add an import at the top:

```typescript
import {eventKey} from '@frogpond/event-list'
```

and add, below the existing `namedCalendarOptions`:

```typescript
export const namedCalendarEventOptions = (
	calendar: NamedCalendar,
	key: string,
	options: {eventMapper?: EventMapper} = {},
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get(`calendar/named/${queryKey[2]}`, {signal})
				.json()
			return response as EventType[]
		},
		select: (events) =>
			convertEvents(events, options).find(
				(event) => eventKey(event) === key,
			),
	})
```

(same `queryKey: keys.named(calendar)` as `namedCalendarOptions` above
it — a detail-screen mount reuses the exact same cached raw fetch as the
list screen, no extra network call, matching every other derived-detail
query in this migration.)

In `modules/ccc-calendar/index.tsx`, add `namedCalendarEventOptions` to
the existing re-export:

```typescript
export {
	namedCalendarOptions,
	namedCalendarEventOptions,
	googleCalendarOptions,
	reasonCalendarOptions,
	icsCalendarOptions,
} from './query'
```

- [ ] **Step 3: Turn `EventList` into a plain, prop-driven component**

In `modules/event-list/event-list.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import type {LegacyRootParamList} from '../../source/navigation/types'
import {PoweredBy} from './types'

type Props = {
	detailView?: string
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: () => unknown
	now: Moment
	poweredBy: PoweredBy
}
```

with:

```typescript
import {PoweredBy} from './types'

type Props = {
	detailView?: string
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: () => unknown
	now: Moment
	poweredBy: PoweredBy
	onPressEvent: (event: EventType) => void
}
```

Replace:

```typescript
export function EventList(props: Props): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			navigation.navigate('EventDetail', {
				event,
				poweredBy: props.poweredBy,
			})
		},
		[navigation, props.poweredBy],
	)

	if (props.message) {
```

with:

```typescript
export function EventList(props: Props): React.ReactNode {
	if (props.message) {
```

Replace the one usage of the removed local `onPressEvent`:

```typescript
				renderItem={({item}) => <EventRow event={item} onPress={onPressEvent} />}
```

with:

```typescript
				renderItem={({item}) => (
					<EventRow event={item} onPress={props.onPressEvent} />
				)}
```

- [ ] **Step 4: Turn `EventDetail` into a plain, prop-driven component**

In `modules/event-list/event-detail-view.tsx`, replace:

```typescript
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../source/navigation/types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {NavigationKey} from './event-detail-base'
```

with:

```typescript
import type {EventType} from '@frogpond/event-type'
import type {PoweredBy} from './types'
```

Delete:

```typescript
export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {event} = props.route.params
	return {
		title: event.title,
		headerRight: (p) => (
			<ShareButton {...p} onPress={() => shareEvent(event)} />
		),
	}
}
```

(this becomes the `app/` wrapper's job in Step 8 — the title and share
button both depend only on `event`, which the wrapper already has once
its query resolves.)

Replace:

```typescript
export function EventDetail(): React.ReactNode {
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {event, poweredBy} = route.params

	return (
```

with:

```typescript
type Props = {
	event: EventType
	poweredBy: PoweredBy
}

export function EventDetail({event, poweredBy}: Props): React.ReactNode {
	return (
```

Everything else in the file (`MaybeSection`, the `ScrollView`/`TableView`
body, `AddToCalendar`) is unchanged. The `ShareButton`/`shareEvent`
imports are no longer used in this file (only the deleted
`NavigationOptions` used them) — remove:

```typescript
import {ShareButton} from '@frogpond/navigation-buttons'
```

and remove `shareEvent` from the existing `./calendar-util` import,
leaving only `getTimes`:

```typescript
import {getTimes} from './calendar-util'
```

- [ ] **Step 5: Update the barrel that re-exports `EventDetail`**

In `modules/event-list/event-detail.tsx`, replace:

```typescript
export {
	EventDetail,
	NavigationOptions as EventDetailNavigationOptions,
} from './event-detail-view'
```

with:

```typescript
export {EventDetail} from './event-detail-view'
```

Leave `NavigationKey`/`ParamList` untouched — `source/navigation/types.tsx`'s
`[eventList.EventDetail.NavigationKey]: eventList.EventDetail.ParamList`
entry (Step 12) stays valid and becomes a dead-but-documented leftover,
matching every other migrated group's detail param types.

- [ ] **Step 6: Wire `onPressEvent` through `CccCalendarView`**

In `modules/ccc-calendar/index.tsx`, replace:

```typescript
type Props = {
	detailView?: string
	poweredBy: PoweredBy
	query: UseQueryResult<EventType[]>
}
```

with:

```typescript
type Props = {
	detailView?: string
	poweredBy: PoweredBy
	query: UseQueryResult<EventType[]>
	onPressEvent: (event: EventType) => void
}
```

Replace:

```typescript
	return (
		<EventList.EventList
			detailView={props.detailView}
			events={data}
			now={now}
			onRefresh={refetch}
			poweredBy={props.poweredBy}
			refreshing={isRefetching}
		/>
	)
```

with:

```typescript
	return (
		<EventList.EventList
			detailView={props.detailView}
			events={data}
			now={now}
			onPressEvent={props.onPressEvent}
			onRefresh={refetch}
			poweredBy={props.poweredBy}
			refreshing={isRefetching}
		/>
	)
```

- [ ] **Step 7: Convert `source/views/calendar/index.tsx` to plain exports**

Replace the whole file with:

```typescript
import * as React from 'react'
import {useRouter} from 'expo-router'

import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {useQuery} from '@tanstack/react-query'

export function StOlafCalendarView(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'stolaf', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={{
				title: 'Powered by the St. Olaf calendar',
				href: 'https://wp.stolaf.edu/calendar/',
			}}
			query={useQuery(namedCalendarOptions('stolaf'))}
		/>
	)
}

export function NorthfieldCalendarView(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'northfield', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={{
				title: 'Powered by VisitingNorthfield.com',
				href: 'https://visitingnorthfield.com/events/calendar/',
			}}
			query={useQuery(namedCalendarOptions('northfield'))}
		/>
	)
}
```

(`createNativeBottomTabNavigator`, `Tab`, `Params`, `View`,
`NavigationParams`, `NavigationKey`, `NavigationOptions` are all
deleted — dead once `routes.tsx` no longer references them, Step 11,
and once expo-router's file-based `NativeTabs` layout owns tab routing,
Step 13.)

- [ ] **Step 8: Convert the KSTO/KRLX schedule views the same way**

In `source/views/streaming/radio/schedule.tsx`, replace:

```typescript
import * as React from 'react'
import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {useQuery} from '@tanstack/react-query'
import {EventType} from '@frogpond/event-type'

function eventMapper(event: EventType): EventType {
	return {
		...event,
		config: {
			...event.config,
			subtitle: 'description',
		},
	}
}

export function KSTOScheduleView(): React.ReactNode {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
			query={useQuery(namedCalendarOptions('ksto-schedule', {eventMapper}))}
		/>
	)
}

export function KRLXScheduleView(): React.ReactNode {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
			query={useQuery(namedCalendarOptions('krlx-schedule', {eventMapper}))}
		/>
	)
}
```

with:

```typescript
import * as React from 'react'
import {useRouter} from 'expo-router'
import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {useQuery} from '@tanstack/react-query'
import {EventType} from '@frogpond/event-type'

function eventMapper(event: EventType): EventType {
	return {
		...event,
		config: {
			...event.config,
			subtitle: 'description',
		},
	}
}

export function KSTOScheduleView(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'ksto-schedule', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
			query={useQuery(namedCalendarOptions('ksto-schedule', {eventMapper}))}
		/>
	)
}

export function KRLXScheduleView(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'krlx-schedule', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
			query={useQuery(namedCalendarOptions('krlx-schedule', {eventMapper}))}
		/>
	)
}
```

(this file's `eventMapper` is byte-for-byte the same function passed
into `namedCalendarEventOptions` for these two sources in the
`EventDetail` wrapper, Step 9 — same shape, so the detail screen's
`select` produces the identical event object the list screen already
rendered.)

- [ ] **Step 9: Create the shared EventDetail route**

Create `app/(home)/EventDetail.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import type {EventType} from '@frogpond/event-type'

import {EventDetail, shareEvent} from '@frogpond/event-list'
// `EventDetail` here is the namespace `export * as EventDetail from
// './event-detail'` produces (matching `EventList.EventList`'s shape
// elsewhere in this package) -- the component itself is
// `EventDetail.EventDetail`, used below.
import {namedCalendarEventOptions} from '@frogpond/ccc-calendar'
import {ShareButton} from '@frogpond/navigation-buttons'
import {LoadingView, NoticeView} from '@frogpond/notice'

type EventSource = 'stolaf' | 'northfield' | 'ksto-schedule' | 'krlx-schedule'

function scheduleEventMapper(event: EventType): EventType {
	return {
		...event,
		config: {
			...event.config,
			subtitle: 'description',
		},
	}
}

const POWERED_BY: Record<EventSource, {title: string; href: string}> = {
	stolaf: {
		title: 'Powered by the St. Olaf calendar',
		href: 'https://wp.stolaf.edu/calendar/',
	},
	northfield: {
		title: 'Powered by VisitingNorthfield.com',
		href: 'https://visitingnorthfield.com/events/calendar/',
	},
	'ksto-schedule': {
		title: 'Powered by the KSTO team',
		href: 'https://pages.stolaf.edu/ksto/',
	},
	'krlx-schedule': {
		title: 'Powered by the KRLX team',
		href: 'https://www.krlx.org/schedule/',
	},
}

const EVENT_MAPPERS: Partial<
	Record<EventSource, (event: EventType) => EventType>
> = {
	'ksto-schedule': scheduleEventMapper,
	'krlx-schedule': scheduleEventMapper,
}

export default function EventDetailPage(): React.ReactNode {
	let {source, eventKey} = useLocalSearchParams<{
		source: EventSource
		eventKey: string
	}>()

	let {
		data: event,
		isLoading,
		error,
		refetch,
	} = useQuery(
		namedCalendarEventOptions(source, eventKey, {
			eventMapper: EVENT_MAPPERS[source],
		}),
	)

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!event) {
		return <NoticeView text="Could not find this event." />
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: event.title,
					headerRight: () => (
						<ShareButton onPress={() => shareEvent(event)} />
					),
				}}
			/>
			<EventDetail.EventDetail event={event} poweredBy={POWERED_BY[source]} />
		</>
	)
}
```

- [ ] **Step 10: Remove the deferred-route `Href` cast from the radio controller**

In `source/views/streaming/radio/controller.tsx`, replace:

```typescript
	let openSchedule = useCallback(() => {
		// KSTOSchedule/KRLXSchedule aren't wired into expo-router yet (deferred
		// to Calendar's own group PR), so they're absent from the generated
		// route union and router.push() needs a cast to accept them. Tapping
		// this shows expo-router's built-in "Unmatched Route" screen until
		// Calendar's group PR adds the real routes.
		router.push(scheduleHref as Href)
	}, [router, scheduleHref])
```

with:

```typescript
	let openSchedule = useCallback(() => {
		router.push(scheduleHref)
	}, [router, scheduleHref])
```

Check whether `type Href` is still imported/used elsewhere in this file
(`import {useRouter, type Href} from 'expo-router'`) — it is not used
anywhere else in `controller.tsx`, so change that import to:

```typescript
import {useRouter} from 'expo-router'
```

Leave `Props['scheduleHref']`'s type (`'/KSTOSchedule' | '/KRLXSchedule'`)
as-is — once `app/(home)/KSTOSchedule.tsx`/`KRLXSchedule.tsx` exist
(Step 11), expo-router's typed-routes codegen recognizes both string
literals as valid `Href`s on its own, no cast needed.

- [ ] **Step 11: Create the KSTO/KRLX schedule routes**

Create `app/(home)/KSTOSchedule.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {KSTOScheduleView} from '../../source/views/streaming/radio/schedule'

export default function KSTOSchedulePage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'KSTO Schedule'}} />
			<KSTOScheduleView />
		</>
	)
}
```

Create `app/(home)/KRLXSchedule.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {KRLXScheduleView} from '../../source/views/streaming/radio/schedule'

export default function KRLXSchedulePage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'KRLX Schedule'}} />
			<KRLXScheduleView />
		</>
	)
}
```

(both flat top-level siblings, matching `scheduleHref`'s
`'/KSTOSchedule' | '/KRLXSchedule'` shape and `RadioScheduleParamList`'s
existing flat `KSTOSchedule: undefined`/`KRLXSchedule: undefined`
entries in `source/navigation/types.tsx` — no change needed to that type
itself, it was already shaped correctly, just never had a route behind
it.)

- [ ] **Step 12: Remove the dead registration from routes.tsx and types.tsx**

In `source/navigation/routes.tsx`, remove the imports:

```typescript
import * as calendar from '../views/calendar'
import {EventDetail as eventDetail} from '@frogpond/event-list'
```

and remove the Calendar `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={calendar.View}
					name={calendar.NavigationKey}
					options={calendar.NavigationOptions}
				/>
				<Stack.Screen
					component={eventDetail.EventDetail}
					name={eventDetail.NavigationKey}
					options={eventDetail.EventDetailNavigationOptions}
				/>
			</Stack.Group>
```

In `source/navigation/types.tsx`, remove the line:

```typescript
import * as calendar from '../views/calendar'
```

Replace:

```typescript
	[calendar.NavigationKey]: calendar.NavigationParams
```

with:

```typescript
	Calendar: undefined
```

(same pattern already used for `Menus`/`Communities`/`SIS`/every other
migrated group on the surrounding lines.) Leave `import * as eventList
from '@frogpond/event-list'` and
`[eventList.EventDetail.NavigationKey]: eventList.EventDetail.ParamList`
completely untouched — both stay valid (Step 5 keeps `NavigationKey`/
`ParamList` exported), becoming a dead-but-documented leftover like
every other migrated group's own detail param type. Also leave
`RadioScheduleParamList`'s `KSTOSchedule`/`KRLXSchedule: undefined`
entries untouched — they were already correctly shaped, just previously
unregistered.

- [ ] **Step 13: Restore the home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`calendar` entry.

- [ ] **Step 14: Give the outer "Calendar" entry its title**

In `app/(home)/_layout.tsx`, add a new entry to the existing `<Stack>`:

```typescript
<Stack.Screen name="Calendar" options={{title: 'Calendar'}} />
```

(`EventDetail`/`KSTOSchedule`/`KRLXSchedule` don't need entries here —
each sets its own title dynamically/statically from within its own
wrapper, matching `BusRouteDetail`/`RedditPostDetail`/`JobDetail`'s
precedent of not needing a parent-level registration.)

- [ ] **Step 15: Create the native tab bar layout**

Create `app/(home)/Calendar/_layout.tsx`:

```typescript
import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function CalendarLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="graduationcap.fill" />
				<NativeTabs.Trigger.Label>St. Olaf</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="northfield">
				<NativeTabs.Trigger.Icon sf="face.smiling.fill" />
				<NativeTabs.Trigger.Label>Northfield</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

- [ ] **Step 16: Create the 2 tab route files**

Create `app/(home)/Calendar/index.tsx`:

```typescript
import * as React from 'react'
import {StOlafCalendarView} from '../../../source/views/calendar'

export default function StOlafCalendarPage(): React.ReactNode {
	return <StOlafCalendarView />
}
```

Create `app/(home)/Calendar/northfield.tsx`:

```typescript
import * as React from 'react'
import {NorthfieldCalendarView} from '../../../source/views/calendar'

export default function NorthfieldCalendarPage(): React.ReactNode {
	return <NorthfieldCalendarView />
}
```

(neither needs its own `<Stack.Screen options={...}>` — `NativeTabs`
draws the tab bar and each leaf screen renders full-bleed below it with
no per-tab header, matching the original
`Tab.Navigator screenOptions={{headerShown: false}}` behavior exactly.)

- [ ] **Step 17: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake — see this project's
known `source/views/faqs/__tests__/banner.test.tsx` flake — before
treating it as real). `modules/event-list/__tests__/times.test.ts`
doesn't touch navigation and should be unaffected by this task, but
confirm it still passes.

- [ ] **Step 18: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Expected, via real taps through the running app (not deep links, unless
a specific screen is genuinely unreachable without seed data — say so
explicitly if you fall back to one):

- Home screen shows the "Calendar" tile. Tapping it shows a header
  reading "‹ All About Olaf | Calendar" with a working back button, and
  below the header a native tab bar with 2 tabs (St. Olaf, Northfield),
  each with the correct SF Symbol icon, St. Olaf selected by default.
  Tapping between tabs switches content without losing the tab bar or
  header.
- Tapping an event row on either calendar tab hides the tab bar and
  pushes to the event detail screen, showing the real event's title (in
  both the header and the EVENT section), time, location, description,
  an "Add to calendar" button, and the correct "Powered by..." footer
  for whichever tab it came from. Back button returns to the correct
  calendar tab.
- From Streaming Media's KSTO or KRLX station screen, tapping the
  schedule/calendar button now navigates to a real schedule screen
  (title "KSTO Schedule"/"KRLX Schedule") instead of expo-router's
  "Unmatched Route" screen — confirm this for at least one of the two
  stations. Tapping an event row there also reaches the shared
  `EventDetail` screen, showing the "Powered by the KSTO/KRLX team"
  footer.
- Both calendars and both schedules hit a live network endpoint — note
  in the report whether real data was reachable in this sandboxed
  environment, and if not, confirm the loading/error states at minimum
  render correctly and non-crashing for all four sources.

Screenshot: home screen showing the Calendar tile, the Calendar tab bar
(St. Olaf tab), the Northfield tab, an event detail screen reached from
one of the calendar tabs, the KSTO or KRLX station screen showing its
schedule button now working, the resulting schedule screen, and an event
detail screen reached from that schedule (confirming the shared route
correctly shows the KSTO/KRLX "Powered by" footer, not the calendar
one) — look at each yourself before trusting a report that claims they
show what they claim, the same way you would for any other screenshot in
this process.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 19: Commit**

```bash
git add modules/event-list/ modules/ccc-calendar/ source/views/calendar/ source/views/streaming/radio/schedule.tsx source/views/streaming/radio/controller.tsx source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/Calendar/ app/\(home\)/EventDetail.tsx app/\(home\)/KSTOSchedule.tsx app/\(home\)/KRLXSchedule.tsx
git commit -m "Restore the Calendar home-grid tile

Fourteenth group PR in checkpoint 2's stack, and the seventh
NativeTabs conversion. Closes out an obligation from the
already-shipped Streaming Media group PR: KSTO/KRLX's schedule
routes were deliberately deferred until this group's own migration
could fix their shared dependency, @frogpond/event-list's one
remaining react-navigation import.

EventType has no id field, so the usual select-by-id pattern needed
a synthetic key first: eventKey(event) combines startTime.toISOString()
and title, stable enough to survive a refetch without inventing a
real id on a shared type. EventList/EventDetail both lose their
react-navigation dependency entirely (onPressEvent becomes a prop,
matching Menus' FancyMenu conversion; EventDetail's header moves
into its app/ wrapper, matching stoPrint/SIS's JobDetail pattern) --
@frogpond/event-list no longer has a hidden framework dependency
its own package.json doesn't declare.

One shared EventDetail route now serves four independent list
queries (Calendar's St. Olaf/Northfield tabs, Streaming Media's
KSTO/KRLX schedules) via a `source` URL param plus eventKey.
namedCalendarEventOptions shares its list sibling's exact queryKey,
so opening an event costs no extra network call beyond what the
list screen already fetched.

source/navigation/routes.tsx's Calendar Stack.Group (both screens)
is removed in the same commit."
```

- [ ] **Step 20: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
