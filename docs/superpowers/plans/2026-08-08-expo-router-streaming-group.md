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
Menus (no wrapping Stack around the tab group; the 2 schedule screens are
flat siblings of the tab group, not nested under it, matching their
original registration as siblings in one `Stack.Group` in
`routes.tsx`). Unlike Menus, there is no shared list-rendering component to
decouple — `RadioControllerView`'s only navigation is one button
("Open the schedule"), directly converted to `router.push()`, and neither
`KSTOScheduleView` nor `KRLXScheduleView` take any props at all (each
calls its own `useQuery` internally) — no `select`-based single-item
lookup is needed anywhere in this group.

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
- Create: `app/(home)/KSTOSchedule.tsx`
- Create: `app/(home)/KRLXSchedule.tsx`

**Interfaces:**
- Consumes: `StreamListView` from `source/views/streaming/streams`;
  `WebcamsView` from `source/views/streaming/webcams`; `KstoStationView`,
  `KrlxStationView` from `source/views/streaming/radio/station-ksto.tsx`/
  `station-krlx.tsx`; `KSTOScheduleView`, `KRLXScheduleView`,
  `RadioControllerView` from `source/views/streaming/radio`.
- Produces: `/Streaming Media` (tab group, default tab Streaming),
  `/Streaming Media/webcams`, `/Streaming Media/ksto`,
  `/Streaming Media/krlx` (all within the tab bar, no per-tab header);
  `/KSTOSchedule`, `/KRLXSchedule` (flat siblings of `Streaming Media/` at
  the `(home)/` level, each with its own header, tab bar hidden).

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

- [ ] **Step 10: Create the 2 schedule routes**

Create `app/(home)/KSTOSchedule.tsx` — a flat sibling of
`Streaming Media/`, self-registering its own header the same way every
prior group's detail screen does:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'
import {KSTOScheduleView} from '../../source/views/streaming'

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
import {KRLXScheduleView} from '../../source/views/streaming'

export default function KRLXSchedulePage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'KRLX Schedule'}} />
			<KRLXScheduleView />
		</>
	)
}
```

(these titles were plain static strings in the original
`KSTOScheduleNavigationOptions`/`KRLXScheduleNavigationOptions` objects —
inlined directly here rather than kept as separate exports, since nothing
else needs them once `routes.tsx`'s registration is gone.)

- [ ] **Step 11: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 12: Manual boot verification**

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
or KRLX tab hides the tab bar and pushes to that station's schedule
screen (title "KSTO Schedule"/"KRLX Schedule"), with a back button
returning to the station tab. No crash anywhere in this flow.

The streams list, webcams, and both radio schedules hit live network
endpoints — note in the report whether real data was reachable in this
sandboxed environment, and if not, confirm the loading/error states at
minimum render correctly and non-crashing.

Screenshot: home screen (nine tiles, no others), the Streaming Media tab
bar (Streaming selected, showing the header with back button), at least
one other tab, and a schedule screen (KSTO or KRLX) — look at each
yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 13: Commit**

```bash
git add source/views/streaming/index.tsx source/views/streaming/radio/controller.tsx source/views/streaming/radio/station-ksto.tsx source/views/streaming/radio/station-krlx.tsx source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/Streaming\ Media/ app/\(home\)/KSTOSchedule.tsx app/\(home\)/KRLXSchedule.tsx
git commit -m "Restore the Streaming Media home-grid tile

Eighth group PR in checkpoint 2's stack, and the second tab-bar
group -- applies the exact flat-structure pattern Menus established
after two live corrections: the tab group's own _layout.tsx is bare
NativeTabs with no wrapping Stack, and the two schedule screens
(KSTOSchedule/KRLXSchedule) are flat siblings of the tab group at
the (home)/ level, not nested under it, matching their original
flat Stack.Group registration in routes.tsx. app/(home)/_layout.tsx
gets one added entry with a real title (not headerShown: false),
the same lesson Menus' second correction round already paid for.

RadioControllerView's scheduleViewName prop (a React Navigation
route-name string requiring a navigate() lookup) becomes scheduleHref
(a literal href string passed straight to router.push()) -- simpler
than reintroducing a name-to-route mapping layer.

The route directory is literally named \"Streaming Media\" (with a
space) to match views.ts's pre-existing RootViewsParamList key,
which this migration doesn't rename.

source/navigation/routes.tsx's Streaming registration (all 3
screens, dead code, still type-checked) is removed in the same
commit. source/views/streaming/movie.tsx (dead code, not registered
anywhere before this change either) is untouched."
```

- [ ] **Step 14: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
