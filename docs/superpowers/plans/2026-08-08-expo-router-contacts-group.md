# expo-router checkpoint 2, group PR 2: Contacts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Important Contacts" home-grid tile (list screen +
detail screen). This is the second group PR in checkpoint 2's stack, and
the first one with a detail screen — it establishes the
list-detail-via-re-fetch-by-key pattern the design doc's "Standing
decision" section describes, which most of the remaining 13 group PRs will
reuse.

**Architecture:** `source/views/contacts/list.tsx` and `detail.tsx` stay
the permanent screen implementations. `list.tsx` gets its navigation call
swapped (`useNavigation()` → `useRouter()`, `.navigate()` →
`router.push()` to a real dynamic route). `detail.tsx`'s
`ContactsDetailView` changes from reading `route.params.contact` via
`useRoute()` to accepting `contact: ContactType` as a plain prop — this
decouples it from any specific routing system, but it's a real,
externally-visible signature change, so `source/navigation/routes.tsx`'s
Contacts registration (the only other consumer, confirmed by grep) is
removed in the same PR, not left broken. Two new route files:
`app/(home)/Contacts/index.tsx` (list, thin wrapper) and
`app/(home)/Contacts/[title].tsx` (detail — looks up the contact from the
same React Query cache the list uses, via the `title` URL param).

**Tech Stack:** expo-router's dynamic route segments (`[title].tsx`),
`useLocalSearchParams`, the existing `@tanstack/react-query`
`groupedContactsOptions` query (unchanged, just called from a second
place — React Query dedupes by query key, so this is a cache hit, not a
second network request).

## Global Constraints

- Branch `expo-router-home-contacts`, stacked on `expo-router-home-more`
  (this PR's own predecessor in the gh-stack chain) — that branch already
  has checkpoint 1, the home-screen scaffold, and the More group PR. Don't
  re-verify that work.
- iOS only.
- `mise run agent:pre-commit` runs project-wide on every commit. Never
  bypass it.
- No `any`.
- Per the design doc's screenshot requirement: don't clean up the SDD
  workspace until screenshots are captured, uploaded via
  `attach-github-assets`, and posted as a PR comment.
- This PR must be independently mergeable and independently functional —
  once it lands, both the Contacts list and detail screens work; nothing
  else on the home screen changes.

---

### Task 1: Wire the Contacts list and detail screens into expo-router

**Files:**
- Modify: `source/views/contacts/list.tsx`
- Modify: `source/views/contacts/detail.tsx`
- Modify: `source/views/contacts/index.ts`
- Modify: `source/views/contacts/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/views/views.ts`
- Create: `app/(home)/Contacts/index.tsx`
- Create: `app/(home)/Contacts/[title].tsx`

**Interfaces:**
- Consumes: `ContactsListView`, `NavigationOptions` from
  `source/views/contacts/list.tsx`; `ContactsDetailView` (new prop shape:
  `{contact: ContactType}`) from `source/views/contacts/detail.tsx`;
  `groupedContactsOptions`, `contactByTitleOptions` from
  `source/views/contacts/query.ts`; `ContactType` from
  `source/views/contacts/types.ts`.
- Produces: the `/Contacts` and `/Contacts/[title]` routes.

- [ ] **Step 1: Swap the list screen's navigation call**

In `source/views/contacts/list.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {DetailNavigationKey} from './detail'
import {groupedContactsOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {ContactRow} from './row'
import type {ContactType} from './types'
import type {LegacyRootParamList} from '../../navigation/types'
```

with:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useRouter} from 'expo-router'
import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {groupedContactsOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {ContactRow} from './row'
import type {ContactType} from './types'
```

(`DetailNavigationKey` import removed — it's deleted in Step 2, nothing
needs it anymore. `NativeStackNavigationOptions` stays imported from
`@react-navigation/native-stack`, unchanged — matching the More PR's
precedent: it's a type-only import, erased at compile time, so it doesn't
reach Metro's bundle graph or trigger the SDK 56+ react-navigation check.
The actual type incompatibility with expo-router's `Stack.Screen` is
handled once, at the wrapper's usage site in Step 6 — don't fix it twice.)

Then replace:

```typescript
export let ContactsListView = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```typescript
export let ContactsListView = (): React.ReactNode => {
	let router = useRouter()
```

And replace:

```typescript
	let onPressContact = React.useCallback(
		(contactData: ContactType) =>
			navigation.navigate(DetailNavigationKey, {contact: contactData}),
		[navigation],
	)
```

with:

```typescript
	let onPressContact = React.useCallback(
		(contactData: ContactType) =>
			router.push({
				pathname: '/Contacts/[title]',
				params: {title: contactData.title},
			}),
		[router],
	)
```

Nothing else in this file changes.

- [ ] **Step 2: Change the detail screen to accept `contact` as a prop**

In `source/views/contacts/detail.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RootStackParamList} from '../../navigation/types'
import {RouteProp, useRoute} from '@react-navigation/native'
```

with nothing (delete these three lines — no longer needed).

Replace:

```typescript
export const ContactsDetailView = (): React.ReactNode => {
	let route =
		useRoute<RouteProp<RootStackParamList, typeof DetailNavigationKey>>()
	let {contact} = route.params
```

with:

```typescript
type Props = {
	contact: ContactType
}

export const ContactsDetailView = ({contact}: Props): React.ReactNode => {
```

(add `import type {ContactType} from './types'` to the top of the file
alongside the other imports — it wasn't needed before since `contact`'s
type came from the route param generic.)

Delete these two exports entirely — both become dead code once
`routes.tsx` no longer references them (Step 4) and `list.tsx` no longer
imports `DetailNavigationKey` (Step 1):

```typescript
export const DetailNavigationKey = 'ContactsDetail'

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof DetailNavigationKey>
}): NativeStackNavigationOptions => {
	let {title} = props.route.params.contact
	return {
		title: title,
	}
}
```

Everything else in the file (the `Title`/`Container` helper components,
the `onPress` handler, the JSX render) is unchanged — `contact` is now a
destructured prop instead of coming from `route.params`, but every
reference to `contact.title`/`contact.image`/etc. inside the component
body stays exactly as it was.

- [ ] **Step 3: Update the barrel export**

In `source/views/contacts/index.ts`, replace:

```typescript
export {ContactsListView as ContactsView, NavigationOptions} from './list'
export {
	ContactsDetailView,
	NavigationOptions as DetailNavigationOptions,
} from './detail'
```

with:

```typescript
export {ContactsListView as ContactsView, NavigationOptions} from './list'
export {ContactsDetailView} from './detail'
```

(the `DetailNavigationOptions` re-export is deleted along with the
function it pointed to.)

- [ ] **Step 4: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as contacts from '../views/contacts'
```

and remove the entire Contacts `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={contacts.ContactsView}
					name="Contacts"
					options={contacts.NavigationOptions}
				/>
				<Stack.Screen
					component={contacts.ContactsDetailView}
					name="ContactsDetail"
					options={contacts.DetailNavigationOptions}
				/>
			</Stack.Group>
```

This file is unreferenced dead code already (checkpoint 1, Task 7) and
type-checked only — removing this block is required because
`ContactsDetailView`'s new prop signature (Step 2) is incompatible with
how `Stack.Screen` would have injected `route`/`navigation` props into it.
Leave every other group's registration in this file untouched — this is a
group-by-group removal, not a wholesale deletion (the whole file goes away
in checkpoint 7, once every group has migrated).

- [ ] **Step 5: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`importantContacts` entry (the `AllViews()` entry whose `view` is
`importantContacts`, title `'Important Contacts'`).

- [ ] **Step 6: Create the list route wrapper**

Create `app/(home)/Contacts/index.tsx` (capitalized `Contacts` — matches
`importantContacts`'s `NavigationKey`-equivalent value, `'Contacts'`, in
`RootViewsParamList`, the string the home screen's generic
`router.push(\`/${view.view}\`)` call uses):

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {ContactsView, NavigationOptions} from '../../../source/views/contacts'

export default function ContactsPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<typeof Stack.Screen>['options']
				}
			/>
			<ContactsView />
		</>
	)
}
```

(the type cast here follows the same pattern the More PR established —
`NavigationOptions` is still typed against a shape not identical to
expo-router's own `Stack.Screen` options in every remaining group; see the
design doc's "Findings from PR 1" section)

- [ ] **Step 7: Add a `select`-based single-contact query to query.ts**

This is the reference implementation the design doc's "Standing decision"
section describes: a second query-options factory that shares the list
query's exact `queryKey` (and its fetch logic, factored out so it isn't
duplicated) but supplies a different `select`, deriving one contact
instead of grouped sections. Because the `queryKey` matches
`groupedContactsOptions`'s, this resolves from the same cache entry the
list screen already populated — no extra network round-trip — and this
approach is what every later group PR's own detail screen should copy
(swap `contacts`/`Contact`/`title` for that group's own names).

In `source/views/contacts/query.ts`, replace:

```typescript
import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'
import {ContactType} from './types'

export const keys = {
	all: ['contacts'] as const,
}

export const groupedContactsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('contacts', {signal}).json()
		return (response as {data: ContactType[]}).data
	},
	select: (contacts) => {
		let grouped = groupBy(contacts, (c) => c.category)
		return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
	},
})
```

with:

```typescript
import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'
import {ContactType} from './types'

export const keys = {
	all: ['contacts'] as const,
}

async function fetchContacts({signal}: {signal: AbortSignal}) {
	let response = await client.get('contacts', {signal}).json()
	return (response as {data: ContactType[]}).data
}

export const groupedContactsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchContacts,
	select: (contacts) => {
		let grouped = groupBy(contacts, (c) => c.category)
		return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
	},
})

export const contactByTitleOptions = (title: string) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchContacts,
		select: (contacts) => contacts.find((c) => c.title === title),
	})
```

- [ ] **Step 8: Create the detail route**

Create `app/(home)/Contacts/[title].tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {ContactsDetailView} from '../../../source/views/contacts'
import {contactByTitleOptions} from '../../../source/views/contacts/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function ContactsDetailPage(): React.ReactNode {
	let {title} = useLocalSearchParams<{title: string}>()
	let {data: contact, isLoading} = useQuery(contactByTitleOptions(title))

	if (isLoading) {
		return <LoadingView />
	}

	if (!contact) {
		return <NoticeView text={`Could not find contact "${title}".`} />
	}

	return (
		<>
			<Stack.Screen options={{title: contact.title}} />
			<ContactsDetailView contact={contact} />
		</>
	)
}
```

`isLoading` only shows if this screen is somehow the first thing to mount
(e.g. a future deep link) before the list screen ever ran the query — in
the common case (navigating from the list), `contact` resolves
synchronously from the already-populated cache.

- [ ] **Step 9: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (no test files are touched, but confirm nothing broke).

- [ ] **Step 10: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant).
Expected: the home screen shows three tiles now (Campus Map, More,
Important Contacts). Tapping "Important Contacts" shows the grouped
contact list (sections by category). Tapping a contact row navigates to
that contact's detail screen, showing its title, image (if any),
description, and action button. No crash. Since this screen fetches live
data, the list may show a loading state indefinitely in a sandboxed
environment with no network access — per the design doc's finding from PR
1, that's expected and not a defect if the code path is otherwise correct;
note it in your report rather than treating it as a failure, and recommend
a real-device follow-up.

Screenshot: the home screen (confirm three tiles, no others), the Contacts
list screen, and the Contacts detail screen (if data loads in your
environment) or its loading/empty state (if it doesn't) — look at every
screenshot yourself.

**Keep these screenshots — do not clean up the SDD workspace until they've
been uploaded via the `attach-github-assets` skill and posted as a comment
on this PR.**

- [ ] **Step 11: Commit**

```bash
git add source/views/contacts/list.tsx source/views/contacts/detail.tsx source/views/contacts/index.ts source/views/contacts/query.ts source/navigation/routes.tsx source/views/views.ts app/\(home\)/Contacts/index.tsx app/\(home\)/Contacts/\[title\].tsx
git commit -m "Restore the Important Contacts home-grid tile

Second group PR in checkpoint 2's stack, and the first with a detail
screen. Establishes the list-detail pattern the design doc's
\"Standing decision\" section describes: the detail screen uses a
second query-options factory, contactByTitleOptions(title), that
shares groupedContactsOptions's exact queryKey (and fetch function,
factored out to avoid duplication) but supplies a different select
-- deriving one contact instead of grouped sections. Same cache
entry, no extra network call, and each detail screen gets a
properly-typed single item straight out of useQuery instead of a
raw list to search inline. The contact's title is passed as a real
URL param (app/(home)/Contacts/[title].tsx) -- expo-router only
accepts string route params, unlike React Navigation's
pass-anything-by-reference.

ContactsDetailView now takes contact as a plain prop instead of
reading route.params via useRoute(), decoupling it from any specific
routing system. That's a real signature change, so
source/navigation/routes.tsx's Contacts registration (dead code,
still type-checked) is removed in the same commit rather than left
broken -- it was the only other consumer."
```

- [ ] **Step 12: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use the `attach-github-assets`
skill to upload each screenshot and post them as one PR comment, per the
design doc's standing requirement. Only clean up the SDD workspace after
this step completes.
