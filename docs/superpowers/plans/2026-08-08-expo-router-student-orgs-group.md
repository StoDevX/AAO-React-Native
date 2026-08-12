# expo-router checkpoint 2, group PR 3: Student Orgs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Student Orgs" home-grid tile (list + detail). Third
group PR in checkpoint 2's stack, following the exact list-detail template
Contacts established (PR #7663): real URL params, a `select`-based React
Query lookup sharing the list's cache, error/loading/not-found states,
detail component decoupled from routing.

**Architecture:** Same shape as Contacts, with one addition: `list.tsx`
here uses `useNavigation()` for **two** different things — `.setOptions()`
(a native search bar) and `.navigate()` (to the detail screen). Those need
different replacements: `.setOptions()` still needs expo-router's own
`useNavigation()` (mirrors `@react-navigation/native`'s exactly, per the
More PR's precedent), while `.navigate()` becomes `router.push()` via
`useRouter()`. Both hooks are used in the same component — that's normal,
not a conflict.

`source/views/student-orgs/list.tsx` and `detail.tsx` stay the permanent
implementations. `StudentOrgsDetailView` changes from reading
`route.params.org` via `useRoute()` to accepting `org: StudentOrgType` as a
plain prop, same as `ContactsDetailView`. `source/navigation/routes.tsx`'s
Student Orgs registration (the only other consumer, confirmed by grep) is
removed in the same commit, since it's incompatible with the new prop
signature.

**Key field:** the list's `keyExtractor` is `item.name + item.category`
(category disambiguates in principle), but using the plain `name` alone as
the URL key is the pragmatic choice here — org names collide in practice
essentially never, and a compound URL segment adds real complexity for a
theoretical edge case. Noting this per the design doc's guidance (each
group should actually check its key field, not just copy Contacts) rather
than skipping the check.

## Global Constraints

- Branch `expo-router-home-student-orgs`, stacked on
  `expo-router-home-contacts` (PR #7663).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.

---

### Task 1: Wire the Student Orgs list and detail screens into expo-router

**Files:**
- Modify: `source/views/student-orgs/list.tsx`
- Modify: `source/views/student-orgs/detail.tsx`
- Modify: `source/views/student-orgs/index.ts`
- Modify: `source/views/student-orgs/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/views/views.ts`
- Create: `app/(home)/StudentOrgs/index.tsx`
- Create: `app/(home)/StudentOrgs/[name].tsx`

**Interfaces:**
- Consumes: `StudentOrgsView`, `NavigationOptions` from
  `source/views/student-orgs/list.tsx`; `StudentOrgsDetailView` (new prop
  shape: `{org: StudentOrgType}`) from `detail.tsx`; `studentOrgsOptions`,
  `orgByNameOptions` from `query.ts`; `StudentOrgType` from `types.ts`.
- Produces: the `/StudentOrgs` and `/StudentOrgs/[name]` routes.

- [ ] **Step 1: Swap the list screen's navigation**

In `source/views/student-orgs/list.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {NavigationProp, useNavigation} from '@react-navigation/native'
import memoize from 'lodash/memoize'
import {ChangeTextEvent, LegacyRootParamList} from '../../navigation/types'
```

with:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation, useRouter} from 'expo-router'
import memoize from 'lodash/memoize'
import {ChangeTextEvent} from '../../navigation/types'
```

(`NativeStackNavigationOptions` stays from `@react-navigation/native-stack`
— type-only, erased at compile time, same reasoning as every prior group.
`useNavigation` now comes from `expo-router` — still needed for
`.setOptions()`. `useRouter` is new, for the actual navigation call.
`NavigationProp`/`LegacyRootParamList` are dropped — nothing needs a typed
navigation prop anymore once `.navigate()` is gone from this file.)

Replace:

```typescript
function StudentOrgsView(): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```typescript
function StudentOrgsView(): React.ReactNode {
	let navigation = useNavigation()
	let router = useRouter()
```

Replace:

```typescript
	let onPressOrg = React.useCallback(
		(org: StudentOrgType) => navigation.navigate('StudentOrgsDetail', {org}),
		[navigation],
	)
```

with:

```typescript
	let onPressOrg = React.useCallback(
		(org: StudentOrgType) =>
			router.push({
				pathname: '/StudentOrgs/[name]',
				params: {name: org.name},
			}),
		[router],
	)
```

Everything else in the file — the search/filter logic, `React.useLayoutEffect`
calling `navigation.setOptions(...)`, the `SectionList` render — is
unchanged.

- [ ] **Step 2: Change the detail screen to accept `org` as a prop**

In `source/views/student-orgs/detail.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'
```

with nothing (delete these three lines).

Delete these two exports entirely (dead code once `routes.tsx` no longer
references them, Step 4):

```typescript
export const NavigationKey = 'StudentOrgsDetail' as const

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {name} = props.route.params.org
	return {
		title: name,
	}
}
```

Replace:

```typescript
let StudentOrgsDetailView = (): React.ReactNode => {
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()

	let {
		name: orgName,
		category,
		meetings,
		website,
		contacts,
		advisors,
		description,
		lastUpdated: orgLastUpdated,
	} = route.params.org
```

with:

```typescript
import type {StudentOrgType} from './types'

type Props = {
	org: StudentOrgType
}

let StudentOrgsDetailView = ({org}: Props): React.ReactNode => {
	let {
		name: orgName,
		category,
		meetings,
		website,
		contacts,
		advisors,
		description,
		lastUpdated: orgLastUpdated,
	} = org
```

(add the `import type {StudentOrgType} from './types'` alongside the
file's other imports, near the top — it wasn't needed before). Everything
else in the file (all the `Section`/`Cell` JSX) is unchanged.

- [ ] **Step 3: Update the barrel export**

In `source/views/student-orgs/index.ts`, replace:

```typescript
export {View as StudentOrgsView, NavigationOptions} from './list'
export {
	View as StudentOrgsDetailView,
	NavigationOptions as DetailNavigationOptions,
} from './detail'
```

with:

```typescript
export {View as StudentOrgsView, NavigationOptions} from './list'
export {View as StudentOrgsDetailView} from './detail'
```

- [ ] **Step 4: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as orgs from '../views/student-orgs'
```

and remove the Student Orgs `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={orgs.StudentOrgsView}
					name="StudentOrgs"
					options={orgs.NavigationOptions}
				/>
				<Stack.Screen
					component={orgs.StudentOrgsDetailView}
					name="StudentOrgsDetail"
					options={orgs.DetailNavigationOptions}
				/>
			</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 5: Add a `select`-based single-org query**

In `source/views/student-orgs/query.ts`, replace:

```typescript
import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {StudentOrgType} from './types'

export const keys = {
	all: ['orgs'] as const,
}

export const studentOrgsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('orgs', {signal}).json()
		return response as StudentOrgType[]
	},
})
```

with:

```typescript
import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {StudentOrgType} from './types'

export const keys = {
	all: ['orgs'] as const,
}

// Student org data changes rarely (org listings are updated a handful of
// times per year) -- matches the 5-minute staleTime precedent set by
// Contacts' query.ts, avoiding a redundant background refetch every time
// someone opens an org's detail screen right after the list.
const staleTime = 1000 * 60 * 5

async function fetchStudentOrgs({signal}: {signal: AbortSignal}) {
	let response = await client.get('orgs', {signal}).json()
	return response as StudentOrgType[]
}

export const studentOrgsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchStudentOrgs,
	staleTime,
})

export const orgByNameOptions = (name: string) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchStudentOrgs,
		staleTime,
		select: (orgs) => orgs.find((org) => org.name === name),
	})
```

(unlike Contacts, `studentOrgsOptions` doesn't already have a `select` — it
returns the flat list directly, which is what `list.tsx`'s own grouping
`useMemo` already operates on. Adding `staleTime` here doesn't change that
return shape, only caching behavior.)

- [ ] **Step 6: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`studentOrgs` entry.

- [ ] **Step 7: Create the list route wrapper**

Create `app/(home)/StudentOrgs/index.tsx` (capitalized, matching
`RootViewsParamList`'s `'StudentOrgs'` key — the string
`app/(home)/index.tsx`'s `router.push(\`/${view.view}\`)` call uses):

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	StudentOrgsView,
	NavigationOptions,
} from '../../../source/views/student-orgs'

export default function StudentOrgsPage(): React.ReactNode {
	return (
		<>
			{/* NavigationOptions is still typed against
			    @react-navigation/native-stack's NativeStackNavigationOptions,
			    which source/navigation/routes.tsx no longer references (Step 4)
			    but source/views/student-orgs/list.tsx still exports it with that
			    type for now. expo-router's own Stack.Screen forks a structurally
			    different options type, so this cast bridges the two -- see the
			    design doc's "Findings from PR 1 (More)" section. Goes away once
			    every group has migrated and this type can move to expo-router's
			    own. */}
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<typeof Stack.Screen>['options']
				}
			/>
			<StudentOrgsView />
		</>
	)
}
```

- [ ] **Step 8: Create the detail route**

Create `app/(home)/StudentOrgs/[name].tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {StudentOrgsDetailView} from '../../../source/views/student-orgs'
import {orgByNameOptions} from '../../../source/views/student-orgs/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function StudentOrgsDetailPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {
		data: org,
		isLoading,
		error,
		refetch,
	} = useQuery(orgByNameOptions(name))

	let screen = <Stack.Screen options={{title: org?.name ?? name}} />

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

	if (!org) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find student org "${name}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<StudentOrgsDetailView org={org} />
		</>
	)
}
```

This follows the fully-hardened Contacts pattern directly (error state,
loading state, not-found state, title shown in all four) — no need to
discover these requirements again, they're already known from the last
group PR's review.

- [ ] **Step 9: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake — this repo's suite has
shown occasional transient worker crashes and one pre-existing flaky
test unrelated to this migration; confirm via a clean rerun before
treating a failure as real).

- [ ] **Step 10: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant).
Expected: home screen shows four tiles now (Campus Map, More, Important
Contacts, Student Orgs). Tapping "Student Orgs" shows the searchable,
grouped org list. Tapping an org navigates to its detail screen (name,
category, meetings, website, contacts, advisors, description). No crash.

Screenshot: home screen (four tiles, no others), Student Orgs list, and
Student Orgs detail screen — look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 11: Commit**

```bash
git add source/views/student-orgs/list.tsx source/views/student-orgs/detail.tsx source/views/student-orgs/index.ts source/views/student-orgs/query.ts source/navigation/routes.tsx source/views/views.ts app/\(home\)/StudentOrgs/index.tsx app/\(home\)/StudentOrgs/\[name\].tsx
git commit -m "Restore the Student Orgs home-grid tile

Third group PR in checkpoint 2's stack, following the list-detail
template Contacts (PR #7663) established: orgByNameOptions(name)
shares studentOrgsOptions's exact queryKey and fetch function but
supplies a different select, so the detail screen resolves from the
same cache the list already populated. StudentOrgsDetailView now
takes org as a plain prop instead of reading route.params via
useRoute(), so source/navigation/routes.tsx's Student Orgs
registration (dead code, still type-checked) is removed in the same
commit -- it was the only other consumer.

list.tsx uses both expo-router's useNavigation() (for the native
search bar's setOptions()) and useRouter() (for navigating to the
detail screen) -- two different hooks for two different jobs, not a
conflict."
```

- [ ] **Step 12: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
