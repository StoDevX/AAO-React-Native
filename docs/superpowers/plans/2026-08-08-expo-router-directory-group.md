# expo-router checkpoint 2, group PR 4: Directory

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Directory" home-grid tile (list + detail). Fourth
group PR in checkpoint 2's stack. Directory is shaped differently from
Contacts and Student Orgs: there is no "fetch everything once" list query
to derive a detail item from — the list screen is a live search against
`stolaf.edu/directory/search`, and the query itself (search term + type)
is part of what identifies a result.

**Architecture:** Same `select`-based-on-the-same-queryKey pattern as
Contacts/Student Orgs, but the shared key here is
`['directory', {search params}]`, not a static `['orgs']`/`['contacts']`.
The detail route therefore carries three URL params instead of one:
`query` (the search text), `type` (the search type), and `index` (the
result's position in that search's `results` array). Given those three,
`directoryContactOptions(query, type, index)` shares the exact queryKey
`directoryEntriesOptions(query, type)` used to populate the list, and
selects `formatResults(data.results)[index]` — no second network call
once the list has been fetched, same guarantee as the prior two groups.

Index-as-key is safe here specifically because both queries share one
cache entry: the list screen fetches once for `(query, type)` and caches
it under that key; the detail screen, using the identical key, reads the
same cached array and picks by position — it never fetches its own copy
that could arrive in a different order.

**Self-referencing navigation:** `detail.tsx` has a "jump to this
person's department" action that pushes back into the *list* screen with
`{queryType: 'department', queryParam: dept.name}` — list screens
becoming their own "back-link" target. `DirectoryDetailView` stays a
plain presentational component fed by props (`contact`), but — like
`list.tsx` in the Student Orgs PR — it also calls `useRouter()` directly
for this one outbound navigation. `useRouter()` is not restricted to
`app/` files; Student Orgs already established that a `source/views/`
component can call it directly.

**Header title:** the list screen's header title used to come from
`route.params.queryParam` (via a `NavigationOptions` function passed to
`Stack.Screen`). `app/(home)/Directory/index.tsx` now reads the same
param itself via `useLocalSearchParams` and renders
`<Stack.Screen options={{title: queryParam ?? 'Directory'}} />` inline —
same pattern the Student Orgs/Contacts detail pages already use for a
data-dependent title, just applied to the list page instead.

## Global Constraints

- Branch `expo-router-home-directory`, stacked on
  `expo-router-home-student-orgs` (PR #7668).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.

---

### Task 1: Wire the Directory list and detail screens into expo-router

**Files:**
- Modify: `source/views/directory/list.tsx`
- Modify: `source/views/directory/detail.tsx`
- Modify: `source/views/directory/index.ts`
- Modify: `source/views/directory/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/views/views.ts`
- Create: `app/(home)/Directory/index.tsx`
- Create: `app/(home)/Directory/[index].tsx`

**Interfaces:**
- Consumes: `DirectoryView` from `source/views/directory/list.tsx`;
  `DirectoryDetailView` (new prop shape: `{contact: DirectoryItem}`) from
  `detail.tsx`; `directoryEntriesOptions`, `directoryContactOptions` from
  `query.ts`; `DirectoryItem`, `DirectorySearchTypeEnum` from `types.ts`.
- Produces: the `/Directory` and `/Directory/[index]` routes.

- [ ] **Step 1: Factor the fetch out of `directoryEntriesOptions` and add
  `directoryContactOptions`**

In `source/views/directory/query.ts`, replace the whole file with:

```typescript
import ky from 'ky'
import {queryOptions} from '@tanstack/react-query'
import {DirectorySearchTypeEnum, SearchResults} from './types'
import {formatResults} from './helpers'

let directory = ky.create({baseUrl: 'https://www.stolaf.edu/directory/'})

type GetDirectoryQueryArgs = {
	query: string
	type: DirectorySearchTypeEnum
}

const getDirectoryQuery = ({query, type}: GetDirectoryQueryArgs) => {
	let common = {format: 'json'}
	query = query.trim()

	switch (type) {
		case 'department':
			return {...common, department: query}
		case 'firstName':
			return {...common, firstname: query}
		case 'lastName':
			return {...common, lastname: query}
		case 'major':
			return {...common, major: query}
		case 'query':
			return {...common, query: query}
		case 'title':
			return {...common, title: query}
		case 'username':
			return {...common, email: query}
		default: {
			let _neverHitMe: never = type
		}
	}
}

export const keys = {
	all: (query: ReturnType<typeof getDirectoryQuery>) =>
		['directory', query] as const,
}

const staleTime = 1000 * 60 // 1 minute

async function fetchDirectoryEntries(
	searchQuery: ReturnType<typeof getDirectoryQuery>,
	signal?: AbortSignal,
): Promise<SearchResults> {
	let response = await directory
		.get('search', {searchParams: searchQuery, signal})
		.json()
	return response as SearchResults
}

export const directoryEntriesOptions = (
	query: string,
	type: DirectorySearchTypeEnum,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all(getDirectoryQuery({query, type})),
		queryFn: ({signal}) =>
			fetchDirectoryEntries(getDirectoryQuery({query, type}), signal),
		staleTime,
	})

export const directoryContactOptions = (
	query: string,
	type: DirectorySearchTypeEnum,
	index: number,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all(getDirectoryQuery({query, type})),
		queryFn: ({signal}) =>
			fetchDirectoryEntries(getDirectoryQuery({query, type}), signal),
		staleTime,
		select: (data) => formatResults(data.results)[index],
	})
```

(`directoryEntriesOptions` is otherwise unchanged in behavior —
`getDirectoryQuery` and `keys.all` are untouched, only the inline fetch
became `fetchDirectoryEntries` so `directoryContactOptions` can share it.
`directoryContactOptions` reuses the exact same `queryKey`, so it reads
`directoryEntriesOptions`'s cached response instead of re-fetching, then
narrows to one formatted result via `select`.)

- [ ] **Step 2: Swap the list screen's navigation and route params**

In `source/views/directory/list.tsx`, replace the import block:

```typescript
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import {ChangeTextEvent, RootStackParamList} from '../../navigation/types'

export const NavigationKey = 'Directory'

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {params} = props.route
	return {
		title: params?.queryParam ?? 'Directory',
	}
}
```

with:

```typescript
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import {useLocalSearchParams, useNavigation, useRouter} from 'expo-router'
import {ChangeTextEvent} from '../../navigation/types'
```

(`NavigationKey`/`NavigationOptions` are deleted outright — the header
title moves to `app/(home)/Directory/index.tsx`, Step 6. `useNavigation`
now comes from `expo-router`, still needed for `.setOptions()` on the
search bar, same as the Student Orgs precedent.)

Replace:

```typescript
export function DirectoryView(): React.ReactNode {
	let [searchQueryType, setSearchQueryType] =
		React.useState<DirectorySearchTypeEnum>('query')
	let [typedQuery, setTypedQuery] = React.useState('')
	let searchQuery = useDebounce(typedQuery, 500)

	// typing useNavigation's props to inform typescript about `push`
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	let {params} = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
```

with:

```typescript
export function DirectoryView(): React.ReactNode {
	let [searchQueryType, setSearchQueryType] =
		React.useState<DirectorySearchTypeEnum>('query')
	let [typedQuery, setTypedQuery] = React.useState('')
	let searchQuery = useDebounce(typedQuery, 500)

	let navigation = useNavigation()
	let router = useRouter()

	let params = useLocalSearchParams<{
		queryType?: DirectorySearchTypeEnum
		queryParam?: string
	}>()
```

Replace:

```typescript
					<DirectoryItemRow
							item={item}
							onPress={() =>
								navigation.push('DirectoryDetail', {contact: item})
							}
						/>
```

with:

```typescript
					<DirectoryItemRow
							item={item}
							onPress={() =>
								router.push({
									pathname: '/Directory/[index]',
									params: {
										index: String(index),
										query: searchQuery,
										type: searchQueryType,
									},
								})
							}
						/>
```

This is inside `renderItem={({item}) => (...)}` — change it to
`renderItem={({item, index}) => (...)}` so `index` is in scope (FlatList
provides it; it was unused before).

Everything else in the file — the search-bar `useLayoutEffect`, the
`params?.queryType === 'department'` effect, the loading/error/empty
branches, `formatResults`, the row/separator components — is unchanged.
`params.queryParam`/`params.queryType` from `useLocalSearchParams` are
read the same way `route.params` was.

- [ ] **Step 3: Change the detail screen to accept `contact` as a prop**

In `source/views/directory/detail.tsx`, replace:

```typescript
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native'
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import {RootStackParamList} from '../../../source/navigation/types'

export const DetailNavigationOptions: NativeStackNavigationOptions = {
	title: 'Contact',
}

export function DirectoryDetailView(): React.ReactNode {
	// typing useNavigation's props to inform typescript about `push`
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	let route = useRoute<RouteProp<RootStackParamList, 'DirectoryDetail'>>()
	const {
		displayName,
		campusLocations,
		displayTitle,
		photo,
		officeHours,
		profileUrl,
		email,
		departments,
		pronouns,
	} = route.params.contact
```

with:

```typescript
import {useRouter} from 'expo-router'
import type {DirectoryItem} from './types'

type Props = {
	contact: DirectoryItem
}

export function DirectoryDetailView({contact}: Props): React.ReactNode {
	let router = useRouter()

	const {
		displayName,
		campusLocations,
		displayTitle,
		photo,
		officeHours,
		profileUrl,
		email,
		departments,
		pronouns,
	} = contact
```

(the file's existing `import type {Department, CampusLocation} from
'./types'` stays — add `DirectoryItem` to that same import instead of a
new line: `import type {Department, CampusLocation, DirectoryItem} from
'./types'`, then delete the standalone `import type {DirectoryItem}...`
above if you added it separately.)

Replace the department-drill-down handler:

```typescript
								onPress={() => {
									navigation.push('Directory', {
										queryType: 'department',
										queryParam: dept.name,
									})
								}}
```

with:

```typescript
								onPress={() => {
									router.push({
										pathname: '/Directory',
										params: {
											queryType: 'department',
											queryParam: dept.name,
										},
									})
								}}
```

Everything else in the file (the `ScrollView`/`TableView`/`Section`/`Cell`
JSX) is unchanged.

- [ ] **Step 4: Update the barrel export**

In `source/views/directory/index.ts`, replace:

```typescript
export {DirectoryView, NavigationOptions} from './list'
export {DirectoryDetailView, DetailNavigationOptions} from './detail'
```

with:

```typescript
export {DirectoryView} from './list'
export {DirectoryDetailView} from './detail'
```

- [ ] **Step 5: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as directory from '../views/directory'
```

and remove the Directory `Stack.Group` block:

```typescript
				<Stack.Group>
					<Stack.Screen
						component={directory.DirectoryView}
						name="Directory"
						options={directory.NavigationOptions}
					/>
					<Stack.Screen
						component={directory.DirectoryDetailView}
						name="DirectoryDetail"
						options={directory.DetailNavigationOptions}
					/>
				</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 6: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`directory` entry.

- [ ] **Step 7: Create the list route wrapper**

Create `app/(home)/Directory/index.tsx` (capitalized, matching
`RootViewsParamList`'s `'Directory'` key):

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'

import {DirectoryView} from '../../../source/views/directory'

export default function DirectoryPage(): React.ReactNode {
	let {queryParam} = useLocalSearchParams<{queryParam?: string}>()

	return (
		<>
			<Stack.Screen options={{title: queryParam ?? 'Directory'}} />
			<DirectoryView />
		</>
	)
}
```

- [ ] **Step 8: Create the detail route**

Create `app/(home)/Directory/[index].tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {DirectoryDetailView} from '../../../source/views/directory'
import {directoryContactOptions} from '../../../source/views/directory/query'
import type {DirectorySearchTypeEnum} from '../../../source/views/directory/types'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function DirectoryDetailPage(): React.ReactNode {
	let {index, query, type} = useLocalSearchParams<{
		index: string
		query: string
		type: string
	}>()

	let {
		data: contact,
		isLoading,
		error,
		refetch,
	} = useQuery(
		directoryContactOptions(
			query,
			type as DirectorySearchTypeEnum,
			Number(index),
		),
	)

	let screen = <Stack.Screen options={{title: contact?.displayName ?? 'Contact'}} />

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

	if (!contact) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this directory entry." />
			</>
		)
	}

	return (
		<>
			{screen}
			<DirectoryDetailView contact={contact} />
		</>
	)
}
```

(`type` arrives from the URL as a plain string; casting it to
`DirectorySearchTypeEnum` is the same trust boundary the rest of this
migration already accepts for string route params — the app itself is
the only thing that ever constructs this URL, via Step 2's `router.push`,
so the value is always one of the enum's members in practice.)

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
Expected: home screen shows five tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory). Tapping "Directory" shows the empty
search state, then typing a name in the search bar returns results.
Tapping a result navigates to its detail screen (name, title, photo,
office hours, email, profile link, campus location(s), departments if
any). Tapping a department navigates back into the Directory list
pre-filled with that department's members. No crash.

Screenshot: home screen (five tiles, no others), Directory search results
for some query, and a Directory detail screen — look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 11: Commit**

```bash
git add source/views/directory/list.tsx source/views/directory/detail.tsx source/views/directory/index.ts source/views/directory/query.ts source/navigation/routes.tsx source/views/views.ts app/\(home\)/Directory/index.tsx app/\(home\)/Directory/\[index\].tsx
git commit -m "Restore the Directory home-grid tile

Fourth group PR in checkpoint 2's stack. Directory's list is a live
search rather than a fetch-everything-once list, so the shared cache
key that makes the select-based detail lookup work is the search
itself: directoryContactOptions(query, type, index) uses the same
queryKey as directoryEntriesOptions(query, type) and selects
formatResults(data.results)[index] -- the detail screen reads the
list's already-cached response instead of re-fetching.

DirectoryDetailView is now a plain contact prop, but keeps one
useRouter() call of its own for the department drill-down, which
pushes back into the Directory list screen with new search params --
the same 'a source/views component can call useRouter() directly'
precedent Student Orgs' list.tsx established.

source/navigation/routes.tsx's Directory registration (dead code,
still type-checked) is removed in the same commit."
```

- [ ] **Step 12: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
