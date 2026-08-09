# expo-router checkpoint 4, PR 3: API Test

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "API Tester" list + detail screens (a developer tool
that lists/searches server routes and shows their raw response) into
`app/(settings)/`. Third PR of checkpoint 4's 8-PR stack.

**Architecture:** Both screens are flat, non-modal pushes inside the
`(settings)` group's own stack -- neither needs registering in
`app/(settings)/_layout.tsx` (matching the already-migrated Student Orgs
group's precedent: expo-router discovers file-based routes automatically,
and static per-screen options are set inline via each wrapper's own
`<Stack.Screen options={...}>`, not the parent layout, whenever the
screen itself already has that data). `APITestDetail` takes its one
parameter (`displayName`, a free-text server-route path) as a flat query
param rather than a `[bracket]` path segment, since API paths can contain
slashes -- matching this same session's Faq screen precedent
(`router.push({pathname: '/Faq', params: {faqId}})`,
`useLocalSearchParams<{faqId?: string}>()`), not Student Orgs' path-segment
approach (`[name].tsx`), which only works because org names never contain
slashes.

## Global Constraints

- Branch `expo-router-settings-api-test`, stacked on
  `expo-router-settings-report-problem` (PR #7698).
- iOS only. Never bypass the pre-commit hook. No `any`.
- `NetworkLoggerButton` (`modules/navigation-buttons/network-logger.tsx`)
  is used unmodified as a header-right button on both screens. It already
  imports `useNavigation` from `expo-router` (only its TYPE annotation
  still references `@react-navigation/native`'s `NavigationProp`) and
  calls `navigation.navigate('NetworkLogger')` -- that target screen
  doesn't exist under `app/` yet (it's PR 4's job: "BonAppPicker +
  NetworkLogger"). Don't tap "Log" during manual verification; this is a
  pre-existing gap, not something this PR introduces or must fix.
- `source/views/settings/screens/overview/developer.tsx` (the entry point
  that will eventually link to API Test) is NOT touched by this PR --
  it's part of `SettingsRoot`, PR 8's scope.
- This route remains unreachable after this PR -- no entry point exists
  yet (PR 8's job).

---

### Task 1: Wire the API Test list + detail screens

**Files:**
- Modify: `source/views/settings/screens/api-test/list.tsx`
- Modify: `source/views/settings/screens/api-test/detail.tsx`
- Create: `app/(settings)/APITest.tsx`
- Create: `app/(settings)/APITestDetail.tsx`

**Interfaces:**
- Consumes: `APITestView`, `APITestNavigationOptions`, `APITestDetailView`,
  `APITestDetailNavigationOptions` (unchanged barrel export names) from
  `source/views/settings`.
- Produces: `/APITest` and `/APITestDetail?displayName=...` -- two flat
  screens inside the `(settings)` group's own stack.

- [ ] **Step 1: Swap `list.tsx`'s navigation imports and push calls**

In `source/views/settings/screens/api-test/list.tsx`, replace:

```tsx
import {
	ChangeTextEvent,
	LegacyRootParamList,
} from '../../../../navigation/types'
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
```

with:

```tsx
import {ChangeTextEvent} from '../../../../navigation/types'
import {useNavigation, useRouter} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
```

Replace the hook setup:

```tsx
export const APITestView = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```tsx
export const APITestView = (): React.ReactNode => {
	let navigation = useNavigation()
	let router = useRouter()
```

Replace the search-result push (inside `showSearchResult`):

```tsx
	let showSearchResult = React.useCallback(() => {
		navigation.navigate('APITestDetail', {
			query: {
				displayName: filterPath,
				path: filterPath,
				params: [],
			},
		})
	}, [filterPath, navigation])
```

with:

```tsx
	let showSearchResult = React.useCallback(() => {
		router.push({
			pathname: '/APITestDetail',
			params: {displayName: filterPath},
		})
	}, [filterPath, router])
```

Replace the row-press push (inside `renderItem`):

```tsx
	const renderItem = React.useCallback(
		(item: ServerRoute) => (
			<ListRow
				fullWidth={false}
				onPress={() => navigation.navigate('APITestDetail', {query: item})}
				style={styles.serverRouteRow}
			>
```

with:

```tsx
	const renderItem = React.useCallback(
		(item: ServerRoute) => (
			<ListRow
				fullWidth={false}
				onPress={() =>
					router.push({
						pathname: '/APITestDetail',
						params: {displayName: item.displayName},
					})
				}
				style={styles.serverRouteRow}
			>
```

and its `useCallback` dependency array:

```tsx
		[navigation],
	)
```

becomes:

```tsx
		[router],
	)
```

(`item.path`/`item.params` were already unused by the detail screen --
confirmed by reading `detail.tsx`, which only reads
`route.params.query.displayName` -- so `displayName` is the only field
that needs to cross the navigation boundary. `navigation.setOptions(...)`
in the existing `useLayoutEffect` for the search bar / `NetworkLoggerButton`
header-right stays exactly as-is; only its import source changed.)

- [ ] **Step 2: Swap `detail.tsx`'s param-reading from `useRoute` to `useLocalSearchParams`**

In `source/views/settings/screens/api-test/detail.tsx`, replace:

```tsx
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {SettingsStackParamList} from '../../../../navigation/types'
```

with:

```tsx
import {useLocalSearchParams, useNavigation} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
```

Replace:

```tsx
export const APITestDetailView = (): React.ReactNode => {
	let navigation = useNavigation()
	let route = useRoute<RouteProp<SettingsStackParamList, 'APITestDetail'>>()

	const {displayName} = route.params.query
	const cleanedName = displayName.trim().toLowerCase()
```

with:

```tsx
export const APITestDetailView = (): React.ReactNode => {
	let navigation = useNavigation()
	let {displayName = ''} = useLocalSearchParams<{displayName: string}>()

	const cleanedName = displayName.trim().toLowerCase()
```

(everything else in the file -- the `useQuery` call, the
`useLayoutEffect`/`navigation.setOptions({title: cleanedName, headerRight:
rightButton})` block, `jsonViewContent`, `APIResponse`, the `CellToggle`,
`DebugView`, and the final `export const NavigationOptions:
NativeStackNavigationOptions = {}` -- is unchanged. `displayName`
defaults to `''` since `useLocalSearchParams` can return `undefined` for
an unset param, whereas `route.params.query.displayName` was always a
defined string; `cleanedName`'s existing `!cleanedName` check in
`APIResponse` already handles the empty-string case correctly, same as
it always did for a blank search.)

- [ ] **Step 3: Create the API Test list route**

Create `app/(settings)/APITest.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {APITestNavigationOptions, APITestView} from '../../source/views/settings'

export default function APITestPage(): React.ReactNode {
	return (
		<>
			{/* APITestNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					APITestNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<APITestView />
		</>
	)
}
```

- [ ] **Step 4: Create the API Test detail route**

Create `app/(settings)/APITestDetail.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	APITestDetailNavigationOptions,
	APITestDetailView,
} from '../../source/views/settings'

export default function APITestDetailPage(): React.ReactNode {
	return (
		<>
			{/* APITestDetailNavigationOptions is {} -- title and headerRight are
			    set dynamically at runtime via useNavigation().setOptions() inside
			    APITestDetailView itself, once the displayName param is known. */}
			<Stack.Screen
				options={
					APITestDetailNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<APITestDetailView />
		</>
	)
}
```

- [ ] **Step 5: Verify**

Run: `mise run tsc` -- expect 0 errors.
Run: `mise run lint` -- expect clean.
Run: `mise run test` -- expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake -- e.g.
`source/views/faqs/__tests__/banner.test.tsx`'s dismiss-banner test is a
known, previously-documented flake in this repo -- before treating it as
real).

- [ ] **Step 6: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then boot the app in the
FOREGROUND, genuinely waited on to completion.

Since nothing links to `/APITest` yet, verify via a direct deep link:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://APITest"
```

Expected: title "API Tester", a section list of server routes grouped by
their first path segment, a search bar in the header, and a "Log"
header-right button (do not tap it -- see Global Constraints). Tap any
row; expect it to push to a detail screen titled with that route's
lowercased path, showing its raw JSON response (or a loading spinner,
or an error notice -- any of those confirms the screen mounted and the
param round-tripped correctly). Toggle "Parse as JSON" and confirm the
view swaps to the parsed/tree view without crashing. Also verify via
direct deep link that the detail screen alone handles a query param
correctly:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://APITestDetail?displayName=some%2Fpath"
```

Screenshot both the list and one detail view -- look at them yourself
before trusting a report that claims what they show.

- [ ] **Step 7: Commit**

```bash
git add source/views/settings/screens/api-test/list.tsx source/views/settings/screens/api-test/detail.tsx app/\(settings\)/APITest.tsx app/\(settings\)/APITestDetail.tsx
git commit -m "Restore the API Test list + detail screens

Third PR of checkpoint 4's 8-PR stack. Neither screen needs
registering in app/(settings)/_layout.tsx -- both set their own
static options inline via their wrapper's <Stack.Screen>, matching
the already-migrated Student Orgs group's precedent for non-modal
screens with self-contained NavigationOptions.

list.tsx's two navigate() calls become router.push() with a single
displayName param -- the detail screen never read ServerRoute's path
or params fields, only displayName, so that's the only value that
needs to cross the navigation boundary. detail.tsx's useRoute() swaps
to useLocalSearchParams(), matching this session's Faq screen
precedent (flat query param, not a [bracket] path segment, since API
paths can contain slashes). Both screens' navigation.setOptions()
calls for dynamic title/header-right buttons are otherwise unchanged,
same as the established swap-import-keep-pattern convention used
throughout this migration.

NetworkLoggerButton is untouched -- it already imports useNavigation
from expo-router, and its 'NetworkLogger' target screen is PR 4's job.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload both screenshots and post them as a PR comment.

---

## Self-Review

**Spec coverage:** the design doc's PR-3 slot ("API Test + APITestDetail")
is covered by both screens; `NetworkLoggerButton`'s dangling target and
`developer.tsx`'s entry point are both explicitly called out as later
PRs' scope, not silently ignored.

**Placeholder scan:** none found.

**Type consistency:** `APITestView`/`APITestNavigationOptions`/
`APITestDetailView`/`APITestDetailNavigationOptions` used with their
existing barrel-export names throughout, matching
`source/views/settings/index.ts`. `displayName` is the single param name
used consistently across the `router.push()` call sites, the
`useLocalSearchParams<{displayName: string}>()` type, and the deep-link
verification command.
