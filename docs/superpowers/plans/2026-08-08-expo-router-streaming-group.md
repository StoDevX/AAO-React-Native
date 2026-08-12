# expo-router checkpoint 2, group PR 8: Streaming Media

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Streaming Media" home-grid tile: a 4-tab screen
(Streaming, Webcams, KSTO, KRLX) plus 2 shared radio-schedule screens.
Eighth group PR in checkpoint 2's stack, and the second tab-bar group —
apply the Menus group's now-proven pattern directly, no rediscovery
needed.

**Same shape as Menus, smaller.** `source/views/streaming/index.tsx` uses
`createNativeBottomTabNavigator` from `@react-navigation/bottom-tabs/unstable`
for its 4 tabs, same SDK56-tripping dependency Menus hit — convert to
expo-router's file-based `NativeTabs`, flat structure confirmed correct by
Menus (no wrapping Stack around the tab group). Unlike Menus, there is no
shared list-rendering component to decouple within this group's own
files — `RadioControllerView`'s only navigation is one button ("Open the
schedule"), directly converted to `router.push()`.

**The 2 schedule screens are deliberately deferred, not wired in this
PR (decided by Wren).** `KSTOScheduleView`/`KRLXScheduleView` render
`CccCalendarView` from `@frogpond/ccc-calendar`, which depends on
`modules/event-list/` (`event-list.tsx`, `event-detail-view.tsx`) — both
of which have their own real, runtime `@react-navigation/native`
imports, unrelated to anything in the `streaming` group itself. Wiring
`app/(home)/KSTOSchedule.tsx`/`KRLXSchedule.tsx` into the route tree
would make that import chain statically reachable from `app/`, tripping
Metro's SDK56 check for the *entire app* (the same all-or-nothing
failure mode stoPrint and Menus already hit) — not a bug confined to
these two screens. Rather than patch `event-list`'s navigation with a
quick import swap here, this dependency is real shared infrastructure
that belongs with Calendar's own migration (already the last group in
this whole 15-PR stack, specifically because Calendar's screens live in
a shared package). This plan does **not** create
`app/(home)/KSTOSchedule.tsx`/`KRLXSchedule.tsx`. `RadioControllerView`'s
`scheduleHref` prop and `router.push()` call are still added (harmless,
forward-looking, and required for the file to compile without a
react-navigation import) — tapping "Open the schedule" will show
expo-router's built-in "Unmatched Route" screen until Calendar's group
PR adds the missing routes, the same "keep it broken as-is, don't
silently patch around unrelated shared infrastructure" precedent
already used for stoPrint's Settings button.

**Route name has a space, by design — keep it.** `views.ts`'s existing
identifier for this tile is the literal string `'Streaming Media'` (with
a space), used both as `RootViewsParamList`'s key and as
`source/views/streaming/index.tsx`'s `NavigationKey` export. This predates
the migration and isn't touched by this plan — the tab group's route
directory is literally named `app/(home)/Streaming Media/` (a space in a
directory name is valid on this filesystem and expo-router handles it,
same as any other path segment). The home screen's existing
`router.push(\`/${view.view}\`)` call already handles this without
changes, since `view.view` for this tile evaluates to the string
`'Streaming Media'`.

**Header title (learned from Menus' two live corrections, applied
correctly on the first attempt here):** `app/(home)/_layout.tsx` needs
one added `<Stack.Screen name="Streaming Media" options={{title:
'Streaming Media'}}/>` entry — **not** `headerShown: false`. The original
app showed a real header with a back button to Home when landing on this
tile (from `streaming.NavigationOptions = {title: 'Streaming Media'}` in
the old `routes.tsx` registration); the inner `Tab.Navigator`'s own
`screenOptions={{headerShown: false}}` only ever suppressed a header
*inside* the tab navigator for each tab's own content, not the outer
entry. Since `Streaming Media/_layout.tsx` is (per this plan) just
`<NativeTabs>` with no inner Stack of its own, giving the outer entry a
title is sufficient on its own — nothing for it to double up with.

## Global Constraints

- Branch `expo-router-home-streaming`, stacked on `expo-router-home-menus`
  (PR #7678).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- `source/views/streaming/movie.tsx` is dead code — not registered
  anywhere in `routes.tsx` or `source/views/streaming/index.tsx`'s tab
  set. Out of scope; do not touch it.

---

### Task 1: Wire the Streaming tab bar and 2 radio-schedule screens into expo-router

**Files:**
- Modify: `source/views/streaming/index.tsx`
- Modify: `source/views/streaming/radio/controller.tsx`
- Modify: `source/views/streaming/radio/station-ksto.tsx`
- Modify: `source/views/streaming/radio/station-krlx.tsx`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Modify: `source/views/views.ts`
- Modify: `app/(home)/_layout.tsx`
- Create: `app/(home)/Streaming Media/_layout.tsx`
- Create: `app/(home)/Streaming Media/index.tsx`
- Create: `app/(home)/Streaming Media/webcams.tsx`
- Create: `app/(home)/Streaming Media/ksto.tsx`
- Create: `app/(home)/Streaming Media/krlx.tsx`

**Not created in this task (deferred to Calendar's own group PR):**
`app/(home)/KSTOSchedule.tsx`, `app/(home)/KRLXSchedule.tsx` — see this
plan's "2 schedule screens are deliberately deferred" section above.

**Interfaces:**
- Consumes: `StreamListView` from `source/views/streaming/streams`;
  `WebcamsView` from `source/views/streaming/webcams`; `KstoStationView`,
  `KrlxStationView` from `source/views/streaming/radio/station-ksto.tsx`/
  `station-krlx.tsx`; `RadioControllerView` from
  `source/views/streaming/radio`.
- Produces: `/Streaming Media` (tab group, default tab Streaming),
  `/Streaming Media/webcams`, `/Streaming Media/ksto`,
  `/Streaming Media/krlx` (all within the tab bar, no per-tab header).
  `/KSTOSchedule`/`/KRLXSchedule` are NOT produced by this task —
  `RadioControllerView`'s schedule button pushes to these paths, but no
  matching route exists yet, so tapping it shows expo-router's built-in
  "Unmatched Route" screen until a later Calendar-group PR adds them.

- [ ] **Step 1: Swap `RadioControllerView`'s schedule button to `router.push()`**

In `source/views/streaming/radio/controller.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {
	LegacyRootParamList,
	RadioScheduleParamList,
} from '../../../navigation/types'
```

with:

```typescript
import {useRouter} from 'expo-router'
```

Replace:

```typescript
type Props = {
	image: ImageResolvedAssetSource
	playerUrl: string
	stationNumber: string
	title: string
	scheduleViewName: keyof RadioScheduleParamList
	stationName: string
	source: {
		useEmbeddedPlayer: boolean
		embeddedPlayerUrl: string
		streamSourceUrl: string
	}
}

export function RadioControllerView(props: Props): React.ReactNode {
	const theme = theming.useTheme()
	const {
		source,
		title,
		stationName,
		image,
		scheduleViewName,
		stationNumber,
		playerUrl,
	} = props

	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```typescript
type Props = {
	image: ImageResolvedAssetSource
	playerUrl: string
	stationNumber: string
	title: string
	scheduleHref: '/KSTOSchedule' | '/KRLXSchedule'
	stationName: string
	source: {
		useEmbeddedPlayer: boolean
		embeddedPlayerUrl: string
		streamSourceUrl: string
	}
}

export function RadioControllerView(props: Props): React.ReactNode {
	const theme = theming.useTheme()
	const {
		source,
		title,
		stationName,
		image,
		scheduleHref,
		stationNumber,
		playerUrl,
	} = props

	let router = useRouter()
```

Replace:

```typescript
	let openSchedule = useCallback(() => {
		navigation.navigate(scheduleViewName)
	}, [navigation, scheduleViewName])
```

with:

```typescript
	let openSchedule = useCallback(() => {
		router.push(scheduleHref)
	}, [router, scheduleHref])
```

Everything else in the file (the player state machine, `PlayButton`,
`controlsBlock`, the responsive layout logic) is unchanged.

- [ ] **Step 2: Update the two station screens' prop name**

In `source/views/streaming/radio/station-ksto.tsx`, replace:

```typescript
				scheduleViewName="KSTOSchedule"
```

with:

```typescript
				scheduleHref="/KSTOSchedule"
```

In `source/views/streaming/radio/station-krlx.tsx`, replace:

```typescript
				scheduleViewName="KRLXSchedule"
```

with:

```typescript
				scheduleHref="/KRLXSchedule"
```

Nothing else in either file changes.

- [ ] **Step 3: Turn `source/views/streaming/index.tsx` into a plain re-export**

Replace the whole file with:

```typescript
export {StreamListView} from './streams'
export {WebcamsView} from './webcams'
export {KstoStationView} from './radio/station-ksto'
export {KrlxStationView} from './radio/station-krlx'
export {KSTOScheduleView, KRLXScheduleView} from './radio'
```

(`createNativeBottomTabNavigator`, `Params`, `Tab`, `View`,
`NavigationParams`, `NavigationKey`, `NavigationOptions`,
`KSTOScheduleNavigationOptions`, `KRLXScheduleNavigationOptions` are all
deleted — dead once `routes.tsx` no longer references them, Step 4, and
once expo-router's file-based `NativeTabs` layout owns tab routing, Steps
6-7. The two schedule screens' titles move to their own `app/` wrapper
files, Step 9, the same self-registration pattern every prior group's
detail screens already use.)

- [ ] **Step 4: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as streaming from '../views/streaming'
```

and remove the Streaming `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={streaming.View}
					name={streaming.NavigationKey}
					options={streaming.NavigationOptions}
				/>
				<Stack.Screen
					component={streaming.KSTOScheduleView}
					name="KSTOSchedule"
					options={streaming.KSTOScheduleNavigationOptions}
				/>
				<Stack.Screen
					component={streaming.KRLXScheduleView}
					name="KRLXSchedule"
					options={streaming.KRLXScheduleNavigationOptions}
				/>
			</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 5: Update `source/navigation/types.tsx`**

Replace:

```typescript
import * as streaming from '../views/streaming'
```

with nothing (delete the line — `streaming.NavigationKey` no longer
exists after Step 3).

Replace:

```typescript
	[streaming.NavigationKey]: undefined
```

with:

```typescript
	'Streaming Media': undefined
```

(same pattern already used for `Menus: undefined` on the line above it —
a literal string replacing what used to be a computed key derived from
the now-deleted export.)

- [ ] **Step 6: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`streaming` entry.

- [ ] **Step 7: Give the outer "Streaming Media" entry its title**

In `app/(home)/_layout.tsx`, add one entry to the existing `<Stack>`
(alongside the `Menus` entry Menus' plan already added):

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
		</Stack>
	)
}
```

- [ ] **Step 8: Create the native tab bar layout**

Create `app/(home)/Streaming Media/_layout.tsx` — this is the *entire*
file, not a wrapper around anything else, exactly like Menus'
`_layout.tsx`:

```typescript
import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function StreamingMediaLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="recordingtape" />
				<NativeTabs.Trigger.Label>Streaming</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="webcams">
				<NativeTabs.Trigger.Icon sf="web.camera.fill" />
				<NativeTabs.Trigger.Label>Webcams</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="ksto">
				<NativeTabs.Trigger.Icon sf="radio.fill" />
				<NativeTabs.Trigger.Label>KSTO</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="krlx">
				<NativeTabs.Trigger.Icon sf="mic.fill" />
				<NativeTabs.Trigger.Label>KRLX</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

- [ ] **Step 9: Create the 4 tab route files**

Create `app/(home)/Streaming Media/index.tsx`:

```typescript
import * as React from 'react'
import {StreamListView} from '../../../source/views/streaming'

export default function StreamingPage(): React.ReactNode {
	return <StreamListView />
}
```

Create `app/(home)/Streaming Media/webcams.tsx`:

```typescript
import * as React from 'react'
import {WebcamsView} from '../../../source/views/streaming'

export default function WebcamsPage(): React.ReactNode {
	return <WebcamsView />
}
```

Create `app/(home)/Streaming Media/ksto.tsx`:

```typescript
import * as React from 'react'
import {KstoStationView} from '../../../source/views/streaming'

export default function KstoPage(): React.ReactNode {
	return <KstoStationView />
}
```

Create `app/(home)/Streaming Media/krlx.tsx`:

```typescript
import * as React from 'react'
import {KrlxStationView} from '../../../source/views/streaming'

export default function KrlxPage(): React.ReactNode {
	return <KrlxStationView />
}
```

(none of these 4 need their own `<Stack.Screen options={...}>` —
`NativeTabs` draws the tab bar and each leaf screen renders full-bleed
below it with no per-tab header, matching the original
`Tab.Navigator screenOptions={{headerShown: false}}` behavior exactly.)

- [ ] **Step 10: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 11: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant), in
the FOREGROUND, genuinely waited on to completion.

Expected: home screen shows nine tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory, Campus Dictionary, stoPrint, Menus,
Streaming Media). Tapping "Streaming Media" shows a header reading "‹ All
About Olaf | Streaming Media" with a working back button, and below it a
native tab bar with 4 tabs (Streaming, Webcams, KSTO, KRLX), each with
the correct SF Symbol icon, Streaming selected by default. Tapping
between tabs switches content without losing the tab bar or the header.
Tapping "Open" (or whichever control triggers `openSchedule`) on the KSTO
or KRLX tab shows expo-router's built-in "Unmatched Route" screen — this
is expected and correct for this task (see this plan's "2 schedule
screens are deliberately deferred" section); it is not a bug to
investigate or fix. No crash anywhere in this flow — an unmatched route
is a normal, graceful screen, not an error state.

The streams list and webcams hit live network endpoints — note in the
report whether real data was reachable in this sandboxed environment,
and if not, confirm the loading/error states at minimum render correctly
and non-crashing.

Screenshot: home screen (nine tiles, no others), the Streaming Media tab
bar (Streaming selected, showing the header with back button), and at
least one other tab — look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 12: Commit**

```bash
git add source/views/streaming/index.tsx source/views/streaming/radio/controller.tsx source/views/streaming/radio/station-ksto.tsx source/views/streaming/radio/station-krlx.tsx source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/Streaming\ Media/
git commit -m "Restore the Streaming Media home-grid tile

Eighth group PR in checkpoint 2's stack, and the second tab-bar
group -- applies the exact flat-structure pattern Menus established
after two live corrections: the tab group's own _layout.tsx is bare
NativeTabs with no wrapping Stack. app/(home)/_layout.tsx gets one
added entry with a real title (not headerShown: false), the same
lesson Menus' second correction round already paid for.

RadioControllerView's scheduleViewName prop (a React Navigation
route-name string requiring a navigate() lookup) becomes scheduleHref
(a literal href string passed straight to router.push()) -- simpler
than reintroducing a name-to-route mapping layer.

The two schedule screens (KSTOSchedule/KRLXSchedule) are deliberately
NOT wired into expo-router in this commit -- their shared
CccCalendarView/@frogpond/ccc-calendar dependency chain (modules/event-list)
has its own, unrelated runtime @react-navigation/native imports that
would trip Metro's SDK56 check for the whole app if these routes
existed. That's real shared infrastructure belonging with Calendar's
own group PR (already last in this stack for the same reason), not a
quick patch here. Tapping \"Open the schedule\" shows expo-router's
built-in Unmatched Route screen until that PR lands.

The route directory is literally named \"Streaming Media\" (with a
space) to match views.ts's pre-existing RootViewsParamList key,
which this migration doesn't rename.

source/navigation/routes.tsx's Streaming registration (all 3
screens, dead code, still type-checked) is removed in the same
commit. source/views/streaming/movie.tsx (dead code, not registered
anywhere before this change either) is untouched."
```

- [ ] **Step 13: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
