# expo-router checkpoint 2, group PR 5: Dictionary

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Campus Dictionary" home-grid tile (list + detail +
editor). Fifth group PR in checkpoint 2's stack, and the first three-screen
group: List → Detail → "Suggest an Edit" editor.

**Architecture:** Same shape as Contacts/Student Orgs — `dictionaryOptions`
fetches the whole word list once, cached under `keys.all`. Both the detail
screen and the editor screen need the same full `WordType` (`{word,
definition}`), so both derive it via one shared `select`-based
`wordByTermOptions(word)` query sharing `dictionaryOptions`'s exact
`queryKey` — no separate fetch for either screen, and no duplicated
"find the word" logic between them.

**Key field:** `list.tsx`'s `keyExtractor` is `item.word + index` (index
appended defensively for React's list-key uniqueness), but the pragmatic
choice here — consistent with Contacts/Student Orgs — is the plain `word`
string as the URL segment. Dictionary words colliding in practice is not a
real concern for this app's actual data.

**Nested routes:** `/Dictionary/[word]` is the detail screen;
`/Dictionary/[word]/edit` is the editor, one level deeper. The editor is
only ever reached by tapping "Suggest an Edit" on an already-loaded detail
screen, so its own `wordByTermOptions(word)` read resolves instantly from
the same cache — but it still needs its own loading/error/not-found
handling for type-safety and consistency with every other converted
screen, even though a user is very unlikely to observe the loading state
in practice.

`DictionaryDetailView` becomes a plain `{word: WordType}` prop component,
same as Contacts/Student Orgs' detail views, but keeps one `useRouter()`
call of its own for the "Suggest an Edit" button — the same "a
`source/views` component can call `useRouter()` directly" precedent
Student Orgs' `list.tsx` and Directory's `detail.tsx` already established.
`DictionaryEditorView` becomes a plain `{word: WordType}` prop component
too — it has no navigation of its own (its `submit` button calls
`submitReport`, an email composer, not a route change).

## Global Constraints

- Branch `expo-router-home-dictionary`, stacked on `expo-router-home-directory`
  (PR #7672).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.

---

### Task 1: Wire the Dictionary list, detail, and editor screens into expo-router

**Files:**
- Modify: `source/views/dictionary/list.tsx`
- Modify: `source/views/dictionary/detail.tsx`
- Modify: `source/views/dictionary/index.ts`
- Modify: `source/views/dictionary/query.ts`
- Modify: `source/views/dictionary/report/editor.tsx`
- Modify: `source/views/dictionary/report/index.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/views/views.ts`
- Create: `app/(home)/Dictionary/index.tsx`
- Create: `app/(home)/Dictionary/[word]/index.tsx`
- Create: `app/(home)/Dictionary/[word]/edit.tsx`

**Interfaces:**
- Consumes: `DictionaryView` from `source/views/dictionary/list.tsx`;
  `DictionaryDetailView` (new prop shape: `{word: WordType}`) from
  `detail.tsx`; `DictionaryEditorView` (new prop shape: `{word: WordType}`)
  from `report/editor.tsx`; `dictionaryOptions`, `wordByTermOptions` from
  `query.ts`; `WordType` from `types.ts`.
- Produces: the `/Dictionary`, `/Dictionary/[word]`, and
  `/Dictionary/[word]/edit` routes.

- [ ] **Step 1: Add the shared `select`-based single-word query**

In `source/views/dictionary/query.ts`, replace the whole file with:

```typescript
import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {WordType} from './types'

export const keys = {
	all: ['dictionary'] as const,
}

// Dictionary entries change rarely -- matches the 5-minute staleTime
// precedent set by Contacts'/Student Orgs' query.ts, avoiding a redundant
// background refetch every time someone opens a word's detail or editor
// screen right after the list.
const staleTime = 1000 * 60 * 5

async function fetchDictionary({signal}: {signal: AbortSignal}) {
	let response = await client.get('dictionary', {signal}).json()
	return (response as {data: WordType[]}).data
}

export const dictionaryOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchDictionary,
	staleTime,
})

export const wordByTermOptions = (word: string) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchDictionary,
		staleTime,
		select: (words) => words.find((w) => w.word === word),
	})
```

- [ ] **Step 2: Swap the list screen's navigation**

In `source/views/dictionary/list.tsx`, replace:

```typescript
import {ChangeTextEvent, LegacyRootParamList} from '../../navigation/types'
```

with:

```typescript
import {ChangeTextEvent} from '../../navigation/types'
```

Replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
```

with:

```typescript
import {useNavigation, useRouter} from 'expo-router'
```

(`NativeStackNavigationOptions` and the exported `NavigationOptions`
constant are deleted too — Step 8 sets a static title directly in the
`app/` wrapper, so this file no longer needs the type or the export.)

Delete the trailing export:

```typescript
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Campus Dictionary',
}
```

Replace:

```typescript
function DictionaryView(): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```typescript
function DictionaryView(): React.ReactNode {
	let navigation = useNavigation()
	let router = useRouter()
```

Replace:

```typescript
					<ListRow
						arrowPosition="top"
						onPress={() => navigation.navigate('DictionaryDetail', {item})}
					>
```

with:

```typescript
					<ListRow
						arrowPosition="top"
						onPress={() =>
							router.push({
								pathname: '/Dictionary/[word]',
								params: {word: item.word},
							})
						}
					>
```

Everything else in the file — the search-bar `useLayoutEffect`, the
grouping/filtering logic, the `SectionList` render — is unchanged.

- [ ] **Step 3: Change the detail screen to accept `word` as a prop**

In `source/views/dictionary/detail.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {
	NavigationProp,
	RouteProp,
	useNavigation,
	useRoute,
} from '@react-navigation/native'
import {LegacyRootParamList, RootStackParamList} from '../../navigation/types'
```

with:

```typescript
import {useRouter} from 'expo-router'
import type {WordType} from './types'
```

Delete these two exports entirely (dead code once `routes.tsx` no longer
references them, Step 6):

```typescript
export const NavigationKey = 'DictionaryDetail' as const

export const DetailNavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {word} = props.route.params.item
	return {
		title: word,
	}
}
```

Replace:

```typescript
export let DictionaryDetailView = (): React.ReactNode => {
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {item} = route.params

	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let handleEditButtonPress = React.useCallback(
		() => navigation.navigate('DictionaryEditor', {item}),
		[item, navigation],
	)
```

with:

```typescript
type Props = {
	word: WordType
}

export let DictionaryDetailView = ({word: item}: Props): React.ReactNode => {
	let router = useRouter()

	let handleEditButtonPress = React.useCallback(
		() =>
			router.push({
				pathname: '/Dictionary/[word]/edit',
				params: {word: item.word},
			}),
		[item.word, router],
	)
```

Everything else in the file (`Term`, `Container`, the `Markdown`/`Button`/
`ListFooter` JSX) is unchanged. (`item` stays as the local name inside the
component — only its source changed, from `route.params.item` to the
`word` prop, renamed via destructuring so the JSX below it, which already
reads `item.word`/`item.definition`, needs no further edits.)

- [ ] **Step 4: Change the editor screen to accept `word` as a prop**

In `source/views/dictionary/report/editor.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'
import noop from 'lodash/noop'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Suggest an edit',
}

let DictionaryEditorView = (): React.ReactNode => {
	let route = useRoute<RouteProp<RootStackParamList, 'DictionaryEditor'>>()
	let {item} = route.params
```

with:

```typescript
import type {WordType} from '../types'
import noop from 'lodash/noop'

type Props = {
	word: WordType
}

let DictionaryEditorView = ({word: item}: Props): React.ReactNode => {
```

(the static title `'Suggest an edit'` moves to the `app/` wrapper, Step 9
— it never depended on route data, so this is a straight relocation, not a
behavior change.) Everything else in the file (`term`/`definition` state,
`submit`, the `TableView`/`Section`/`ButtonCell` JSX, `TitleCell`/
`DefinitionCell`) is unchanged — `item.word`/`item.definition` still refer
to the same values, now sourced from the `word` prop instead of route
params.

- [ ] **Step 5: Update the barrel exports**

In `source/views/dictionary/report/index.ts`, replace:

```typescript
export {
	View as DictionaryEditorView,
	NavigationOptions as EditorNavigationOptions,
} from './editor'
```

with:

```typescript
export {View as DictionaryEditorView} from './editor'
```

In `source/views/dictionary/index.ts`, replace:

```typescript
export {View as DictionaryView, NavigationOptions} from './list'
export {DictionaryDetailView, DetailNavigationOptions} from './detail'
export {DictionaryEditorView, EditorNavigationOptions} from './report'
```

with:

```typescript
export {View as DictionaryView} from './list'
export {DictionaryDetailView} from './detail'
export {DictionaryEditorView} from './report'
```

- [ ] **Step 6: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as dictionary from '../views/dictionary'
```

and remove the Dictionary `Stack.Group` block (all three screens —
`Dictionary`, `DictionaryDetail`, `DictionaryEditor`):

```typescript
				<Stack.Group>
					<Stack.Screen
						component={dictionary.DictionaryView}
						name="Dictionary"
						options={dictionary.NavigationOptions}
					/>
					<Stack.Screen
						component={dictionary.DictionaryDetailView}
						name="DictionaryDetail"
						options={dictionary.DetailNavigationOptions}
					/>
					<Stack.Screen
						component={dictionary.DictionaryEditorView}
						name="DictionaryEditor"
						options={dictionary.EditorNavigationOptions}
					/>
				</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 7: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`dictionary` entry.

- [ ] **Step 8: Create the list route wrapper**

Create `app/(home)/Dictionary/index.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {DictionaryView} from '../../../source/views/dictionary'

export default function DictionaryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Campus Dictionary'}} />
			<DictionaryView />
		</>
	)
}
```

- [ ] **Step 9: Create the detail route**

Create `app/(home)/Dictionary/[word]/index.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {DictionaryDetailView} from '../../../../source/views/dictionary'
import {wordByTermOptions} from '../../../../source/views/dictionary/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function DictionaryDetailPage(): React.ReactNode {
	let {word} = useLocalSearchParams<{word: string}>()
	let {
		data: entry,
		isLoading,
		error,
		refetch,
	} = useQuery(wordByTermOptions(word))

	let screen = <Stack.Screen options={{title: entry?.word ?? word}} />

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

	if (!entry) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the word "${word}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<DictionaryDetailView word={entry} />
		</>
	)
}
```

- [ ] **Step 10: Create the editor route**

Create `app/(home)/Dictionary/[word]/edit.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {DictionaryEditorView} from '../../../../source/views/dictionary'
import {wordByTermOptions} from '../../../../source/views/dictionary/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function DictionaryEditorPage(): React.ReactNode {
	let {word} = useLocalSearchParams<{word: string}>()
	let {
		data: entry,
		isLoading,
		error,
		refetch,
	} = useQuery(wordByTermOptions(word))

	let screen = <Stack.Screen options={{title: 'Suggest an edit'}} />

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

	if (!entry) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the word "${word}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<DictionaryEditorView word={entry} />
		</>
	)
}
```

(the editor's title is always `'Suggest an edit'`, unlike the detail
page's data-dependent title — the query is still needed here, to resolve
the full `WordType` the editor's initial `term`/`definition` state reads
from.)

- [ ] **Step 11: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake — this repo's suite has
shown occasional transient worker crashes and one pre-existing flaky
test unrelated to this migration; confirm via a clean rerun before
treating a failure as real).

- [ ] **Step 12: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant).
Expected: home screen shows six tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory, Campus Dictionary). Tapping "Campus
Dictionary" shows the searchable, alphabetically-grouped word list.
Tapping a word navigates to its detail screen (term + markdown
definition). Tapping "Suggest an Edit" navigates to the editor screen,
pre-filled with the word's current text/definition; tapping "Submit
Report" opens the email composer (don't actually send). No crash.

Screenshot: home screen (six tiles, no others), Dictionary list, Dictionary
detail screen, and the Dictionary editor screen — look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 13: Commit**

```bash
git add source/views/dictionary/list.tsx source/views/dictionary/detail.tsx source/views/dictionary/index.ts source/views/dictionary/query.ts source/views/dictionary/report/editor.tsx source/views/dictionary/report/index.ts source/navigation/routes.tsx source/views/views.ts app/\(home\)/Dictionary/index.tsx app/\(home\)/Dictionary/\[word\]/index.tsx app/\(home\)/Dictionary/\[word\]/edit.tsx
git commit -m "Restore the Campus Dictionary home-grid tile

Fifth group PR in checkpoint 2's stack, and the first three-screen
group: List -> Detail -> \"Suggest an Edit\" editor. wordByTermOptions
shares dictionaryOptions's exact queryKey and fetch function, so
both the detail and editor screens resolve the same WordType from
one cached list fetch instead of re-fetching -- same select-based
pattern Contacts/Student Orgs/Directory established, now shared by
two consumers of one query.

DictionaryDetailView keeps a useRouter() call of its own for the
\"Suggest an Edit\" button, per the source/views-can-navigate-directly
precedent Student Orgs and Directory already established.

source/navigation/routes.tsx's Dictionary registration (all three
screens, dead code, still type-checked) is removed in the same
commit."
```

- [ ] **Step 14: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
