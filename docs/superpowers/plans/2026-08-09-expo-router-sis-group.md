# expo-router checkpoint 2, group PR 13: SIS + Course Catalog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore both home-grid tiles backed by `source/views/sis/`: the
"SIS" tile (a 2-tab screen — Balances, Open Jobs) and the "Course Catalog"
tile (a 3-screen search → results → detail stack, source-adjacent but a
separate top-level tile). Thirteenth group PR in checkpoint 2's stack.
Both tiles are `disabled: true` today; both come off disabled in this PR,
since they share one source directory and were investigated together —
splitting them into separate PRs would mean re-reading the same files
twice for no benefit.

**Two tasks, matching the two tiles.** Task 1 restores the SIS tab bar
(Balances + Open Jobs) and Open Jobs' detail screen — a direct
`NativeTabs` + id-based-detail conversion, templated on the already-
migrated Menus (tab bar) and stoPrint (`jobByIdOptions`) groups with no
new design questions. Task 2 restores the Course Catalog stack — same
search-bar-driven list→detail shape already proven in Student
Orgs/Directory/Dictionary/More, but with one genuine design decision
(below) for the course-detail lookup and another for how a "recent
filter combination" travels between screens.

**Course detail needs a two-hop lookup, not a plain `select`.** Every
other id-based detail screen in this migration (`jobByIdOptions`,
`busLineOptions`, `bonAppMenuItemOptions`, `redditPostByUrlOptions`) has
one flat, always-current list query to `select` an item out of. Course
data doesn't: `courseDataOptions(term, levels, gereqs)` fetches one
**term's** courses at a time, and its query key embeds the full
`TermType` object the results screen resolved from the user's filter
selection — not just a course id. A course detail screen reached later
(from a fresh app launch, or after the results screen's own query has
been garbage-collected) only has a `clbid` and a `term` **number** from
the URL, not the `TermType` object the original list query was keyed on.
So course lookup is a genuine two-hop chain: first resolve the term
number to a `TermType` via a new `termByNumberOptions(term)` query
(`select`ing a single match out of the same `keys.terms` cache entry
`availableTermsOptions` already populates, since both queries share that
key), then fetch that term's full course list via
`courseDataOptions(term, [], [])` — deliberately unfiltered (empty
`levels`/`gereqs`), so the fetch always contains the target course
regardless of what filters were active when the user was browsing — and
`select` the one course by `clbid`. This costs an extra network call
versus reusing whatever filtered list was already in cache (matching
this migration's established precedent of accepting a redundant fetch
for simplicity, e.g. Reddit's `redditPostByUrlOptions`), but needs no
new state, no prop drilling, and no assumption that the originating list
query is still alive.

**A "recent filter combination" travels as a description string, not as
serialized objects.** `CourseSearchView`'s "Recent" filters list lets a
user re-apply a past combination of filters by tapping its human-
readable description (e.g. "MATH, Open Courses"). Today that combination
travels through navigation params as the fully-resolved
`FilterType<CourseType>[]` array — not viable through expo-router's
string-only URL params. Since the description alone already uniquely
identifies one of at most 3 stored combinations
(`redux/parts/courses.ts`'s `updateRecentFilters` dedupes by
description and caps the list at 3), this plan passes just that
description string through the URL and has `CourseSearchResultsView`
(which already reads `recentFilters` from Redux and `basicFilters` from
`useFilters()`, both needed to reconstruct the filter array) redo the
same `fromPairs`/lookup reconstruction `search.tsx` used to do inline —
moving, not duplicating, that logic.

**A dead-end Settings link stays a dead end, deliberately.**
`BalancesView`'s "Log in with St. Olaf" cell today calls
`navigation.navigate('Settings')` — and `Settings` isn't reachable from
anywhere in the app right now: `source/navigation/routes.tsx`'s whole
legacy tree (which is where `Settings` is registered) is dead code at
runtime already, since `app/_layout.tsx` mounts only expo-router's own
`(home)` stack. Today this tap is a no-op because nothing ever
processes it. Converting the call to `router.push('/Settings')` would
change that from a silent no-op into expo-router's "Unmatched Route"
screen the moment this tile ships un-disabled — a real regression, since
Settings hasn't been migrated to expo-router yet (that's a separate,
later checkpoint). This plan keeps the tap a no-op (removes the dead
`navigation.navigate` call, replaces it with nothing) with a comment
explaining why, rather than shipping a route that resolves to an error
screen. Revisit once Settings has its own expo-router route.

## Global Constraints

- Branch `expo-router-home-sis`, stacked on `expo-router-home-reddit`
  (PR #7686).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- Both `sis` and `courseSearch` entries in `source/views/views.ts` lose
  `disabled: true` (no other flags on either entry to preserve).

---

### Task 1: Wire the SIS tab bar and Open Jobs detail into expo-router

**Files:**
- Modify: `source/views/sis/balances.tsx`
- Modify: `source/views/sis/student-work/index.tsx`
- Modify: `source/views/sis/student-work/detail.tsx`
- Modify: `source/views/sis/student-work/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Modify: `source/views/views.ts`
- Modify: `app/(home)/_layout.tsx`
- Create: `app/(home)/SIS/_layout.tsx`
- Create: `app/(home)/SIS/index.tsx`
- Create: `app/(home)/SIS/student-work.tsx`
- Create: `app/(home)/JobDetail.tsx`

**Interfaces:**
- Consumes: `BalancesOrAcknowledgementView` (unchanged, no navigation
  dependency), `StudentWorkView` from `source/views/sis/student-work`;
  `JobDetailView` (new prop shape: `{job: JobType}`) from
  `source/views/sis/student-work/detail`; `jobByIdOptions` from
  `source/views/sis/student-work/query.ts`.
- Produces: `/SIS` (tab group, default tab Balances), `/SIS/student-work`
  (both within the tab bar, no per-tab header); `/JobDetail` (flat
  sibling of `SIS/` at the `(home)/` level, dynamic header set by its
  `app/` wrapper, tab bar hidden).

- [ ] **Step 1: Add the by-id job query**

In `source/views/sis/student-work/query.ts`, add below the existing
`studentWorkPostingsOptions`:

```typescript
export const jobByIdOptions = (jobId: string) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get<JobType[]>('jobs', {signal}).json()

			return response.map((job) => ({
				...job,
				type: titleCase(job.type),
			})) as JobType[]
		},
		select: (data) => data.find((j) => j.id.toString() === jobId),
	})
```

(re-declares the same `queryFn` body as `studentWorkPostingsOptions`
rather than spreading it, matching `source/views/stoprint/query.ts`'s
`jobByIdOptions`/`printJobsOptions` pair — same `keys.all` cache entry,
different `select`, so a job-row tap costs no extra network call.)

- [ ] **Step 2: Change `JobDetailView` to accept `job` as a prop**

In `source/views/sis/student-work/detail.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'
```

with nothing (delete these three lines — no longer needed).

Delete:

```typescript
export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, 'JobDetail'>
}): NativeStackNavigationOptions => {
	let {job} = props.route.params
	return {
		title: job.title,
		headerRight: () => <ShareButton onPress={() => shareJob(job)} />,
	}
}
```

(this becomes the `app/` wrapper's job in Step 6 — the title and share
button both depend only on `job`, which the wrapper already has once its
query resolves.)

Replace:

```typescript
export const JobDetailView = (): React.ReactNode => {
	let route = useRoute<RouteProp<RootStackParamList, 'JobDetail'>>()
	let {job} = route.params

	return (
```

with:

```typescript
type Props = {
	job: JobType
}

export const JobDetailView = ({job}: Props): React.ReactNode => {
	return (
```

Everything else in the file — `ContactInformation`, `JobInformation`,
`Description`, `Skills`, `Comments`, `FirstYearAppropriate`, `Timeline`,
`OpenWebpage`, `LastUpdated`, and the returned JSX — is unchanged.
`ShareButton`/`shareJob` are no longer used in this file; leave their
imports (`@frogpond/navigation-buttons`, `./lib`) — wait, they were only
used inside the now-deleted `NavigationOptions`, so remove those two
imports too:

```typescript
import {ShareButton} from '@frogpond/navigation-buttons'
import {shareJob} from './lib'
```

(delete both lines.)

- [ ] **Step 3: Swap `StudentWorkView`'s navigation**

In `source/views/sis/student-work/index.tsx`, replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {studentWorkPostingsOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import type {LegacyRootParamList} from '../../../navigation/types'
```

with:

```typescript
import {useRouter} from 'expo-router'
import {studentWorkPostingsOptions} from './query'
import {useQuery} from '@tanstack/react-query'
```

Replace:

```typescript
const StudentWorkView = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
	let {
```

with:

```typescript
const StudentWorkView = (): React.ReactNode => {
	let router = useRouter()
	let {
```

Replace:

```typescript
				renderItem={({item}) => (
					<JobRow
						job={item}
						onPress={(job: JobType) => navigation.navigate('JobDetail', {job})}
					/>
				)}
```

with:

```typescript
				renderItem={({item}) => (
					<JobRow
						job={item}
						onPress={(job: JobType) =>
							router.push({
								pathname: '/JobDetail',
								params: {jobId: job.id.toString()},
							})
						}
					/>
				)}
```

Delete the trailing export (dead once `routes.tsx` no longer references
it, Step 5):

```typescript
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Open Jobs',
}
```

- [ ] **Step 4: Neutralize the dead-end Settings link in `balances.tsx`**

In `source/views/sis/balances.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {NoCredentialsError, credentialsOptions} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
import type {LegacyRootParamList} from '../../navigation/types'
```

with:

```typescript
import {NoCredentialsError, credentialsOptions} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
```

Replace:

```typescript
export const BalancesView = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
	let {data: username = ''} = useQuery({
```

with:

```typescript
export const BalancesView = (): React.ReactNode => {
	let {data: username = ''} = useQuery({
```

Replace:

```typescript
	let openSettings = () => navigation.navigate('Settings')
	let refresh = <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
```

with:

```typescript
	// Settings hasn't been migrated to expo-router yet, so there's no route
	// to send this to without landing on an "Unmatched Route" screen --
	// leave it a no-op (matching today's actual behavior, since Settings is
	// unreachable already) until that migration lands.
	let openSettings = () => {}
	let refresh = <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
```

Everything else in the file is unchanged — the "Log in with St. Olaf"
cell still renders and is still tappable, it just does nothing yet,
matching its current, already-unreachable behavior.

- [ ] **Step 5: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the imports:

```typescript
import * as sis from '../views/sis'
import * as studentwork from '../views/sis/student-work'
import * as studentworkdetail from '../views/sis/student-work/detail'
```

and remove the whole `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={studentwork.View}
					name="Job"
					options={studentwork.NavigationOptions}
				/>
				<Stack.Screen
					component={studentworkdetail.View}
					name="JobDetail"
					options={studentworkdetail.NavigationOptions}
				/>
				<Stack.Screen
					component={sis.View}
					name={sis.NavigationKey}
					options={sis.NavigationOptions}
				/>
				<Stack.Screen
					component={sis.CourseSearchView}
					name="CourseSearch"
					options={sis.CourseSearchViewNavigationOptions}
				/>
				<Stack.Screen
					component={sis.CourseSearchResultsView}
					initialParams={{initialFilters: [], initialQuery: ''}}
					name="CourseSearchResults"
					options={sis.CourseSearchNavigationOptions}
				/>
				<Stack.Screen
					component={sis.CourseDetailView}
					name="CourseDetail"
					options={sis.CourseSearchDetailNavigationOptions}
				/>
			</Stack.Group>
```

(this whole group covers both this task's screens and Task 2's — remove
it here, in Task 1, since it's one contiguous block; Task 2 doesn't need
to touch `routes.tsx` again.)

- [ ] **Step 6: Update `source/navigation/types.tsx`**

Remove the line:

```typescript
import * as sis from '../views/sis'
```

Replace:

```typescript
	[sis.NavigationKey]: undefined
```

with:

```typescript
	SIS: undefined
```

(same pattern already used for `Menus`/`Communities`/every other
migrated group on the surrounding lines.) Leave `Job: undefined`,
`JobDetail: {job: JobType}`, `CourseSearchResults: ...`,
`CourseDetail: {course: CourseType}` and their supporting imports
(`JobType`, `CourseType`, `FilterType`) completely untouched — these
become dead-but-documented leftovers, same as every other migrated
group's detail param types in this file.

- [ ] **Step 7: Restore the SIS home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`sis` entry (leave `courseSearch`'s `disabled: true` in place — Task 2
removes that one).

- [ ] **Step 8: Give the outer "SIS" entry its title**

In `app/(home)/_layout.tsx`, add a new entry to the existing `<Stack>`:

```typescript
<Stack.Screen name="SIS" options={{title: 'SIS'}} />
```

- [ ] **Step 9: Create the native tab bar layout**

Create `app/(home)/SIS/_layout.tsx`:

```typescript
import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function SISLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="creditcard.rewards.fill" />
				<NativeTabs.Trigger.Label>Balances</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="student-work">
				<NativeTabs.Trigger.Icon sf="briefcase.fill" />
				<NativeTabs.Trigger.Label>Open Jobs</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

- [ ] **Step 10: Create the 2 tab route files**

Create `app/(home)/SIS/index.tsx`:

```typescript
import * as React from 'react'
import {BalancesOrAcknowledgementView} from '../../../source/views/sis/balances-acknowledgement'

export default function SISBalancesPage(): React.ReactNode {
	return <BalancesOrAcknowledgementView />
}
```

Create `app/(home)/SIS/student-work.tsx`:

```typescript
import * as React from 'react'
import {StudentWorkView} from '../../../source/views/sis/student-work'

export default function SISStudentWorkPage(): React.ReactNode {
	return <StudentWorkView />
}
```

(neither needs its own `<Stack.Screen options={...}>` — `NativeTabs`
draws the tab bar and each leaf screen renders full-bleed below it with
no per-tab header, matching the original
`Tab.Navigator screenOptions={{headerShown: false}}` behavior exactly.)

- [ ] **Step 11: Create the JobDetail route**

Create `app/(home)/JobDetail.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {ShareButton} from '@frogpond/navigation-buttons'

import {JobDetailView} from '../../source/views/sis/student-work/detail'
import {jobByIdOptions} from '../../source/views/sis/student-work/query'
import {shareJob} from '../../source/views/sis/student-work/lib'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function JobDetailPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()

	let {
		data: job,
		isLoading,
		error,
		refetch,
	} = useQuery(jobByIdOptions(jobId))

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

	if (!job) {
		return <NoticeView text="Could not find this job posting." />
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: job.title,
					headerRight: () => <ShareButton onPress={() => shareJob(job)} />,
				}}
			/>
			<JobDetailView job={job} />
		</>
	)
}
```

- [ ] **Step 12: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake — see this project's
known `source/views/faqs/__tests__/banner.test.tsx` flake — before
treating it as real).

- [ ] **Step 13: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion. (This tile isn't `devOnly`, unlike Reddit's —
it should also be visible on a production-variant build, but the dev
variant is fine for this check too.)

Expected: home screen shows the "SIS" tile. Tapping it shows a header
reading "‹ All About Olaf | SIS" with a working back button, and below
the header a native tab bar with 2 tabs (Balances, Open Jobs), each with
the correct SF Symbol icon, Balances selected by default. If the
balances-acknowledgement hasn't been agreed to yet, the Balances tab
shows the acknowledgement card first — agreeing to it should reveal the
real balances view (or its network-error/log-in state, depending on
whether real SIS credentials are reachable in this sandbox — note
whichever applies in the report). Tapping between tabs switches content
without losing the tab bar or the header. On the Open Jobs tab, tapping
a job row hides the tab bar and pushes to the job detail screen, showing
the real job title/description and a working Share button in the
header-right; back button returns to Open Jobs. No crash anywhere in
this flow.

This tile hits a live network endpoint for both balances and job
postings — note in the report whether real data was reachable in this
sandboxed environment, and if not, confirm the loading/error states at
minimum render correctly and non-crashing.

Screenshot: home screen showing the SIS tile, the SIS tab bar (Balances
tab, whatever state it resolves to), the Open Jobs tab, and a job detail
screen (showing the header with back button and Share button) — look at
each yourself, the same way you would review any other screenshot,
before trusting a report that claims they show what they claim.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 14: Commit**

```bash
git add source/views/sis/balances.tsx source/views/sis/student-work/index.tsx source/views/sis/student-work/detail.tsx source/views/sis/student-work/query.ts source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/SIS/ app/\(home\)/JobDetail.tsx
git commit -m "Restore the SIS home-grid tile

Thirteenth group PR in checkpoint 2's stack -- the sixth NativeTabs
conversion, applying the same proven flat-structure pattern. Open
Jobs' detail screen follows stoPrint's jobByIdOptions precedent
exactly: one query, same cache key as the list, a different select.

BalancesView's 'Log in with St. Olaf' cell called
navigation.navigate('Settings'), a route that's already unreachable
today (Settings' registration lives in source/navigation/routes.tsx,
dead code at runtime since app/_layout.tsx only mounts expo-router's
own stack). Converting that call to router.push would trade a
silent no-op for expo-router's Unmatched Route screen the moment
this tile ships un-disabled, since Settings hasn't been migrated
yet -- so the tap stays a no-op, with a comment explaining why,
until Settings gets its own route.

source/navigation/routes.tsx's Job/JobDetail/SIS/CourseSearch/
CourseSearchResults/CourseDetail registrations (all dead code, one
contiguous Stack.Group) are removed in the same commit -- the latter
three belong to Task 2's Course Catalog tile, landing in this same
PR."
```

---

### Task 2: Wire the Course Catalog stack into expo-router

**Files:**
- Modify: `source/views/sis/course-search/search.tsx`
- Modify: `source/views/sis/course-search/results.tsx`
- Modify: `source/views/sis/course-search/detail/index.tsx`
- Modify: `source/views/sis/course-search/query.ts`
- Modify: `source/views/views.ts`
- Create: `app/(home)/CourseSearch.tsx`
- Create: `app/(home)/CourseSearchResults.tsx`
- Create: `app/(home)/CourseDetail.tsx`

**Interfaces:**
- Consumes: `CourseSearchView` (unchanged export name, from
  `source/views/sis/course-search/search.tsx`),
  `CourseSearchResultsView` (unchanged export name, from
  `.../results.tsx`), `CourseDetailView` (new prop shape:
  `{course: CourseType}`, from `.../detail/index.tsx`),
  `termByNumberOptions`/`courseByIdOptions` (new, from `.../query.ts`).
- Produces: `/CourseSearch` (home-grid entry point), `/CourseSearchResults`
  (flat sibling), `/CourseDetail` (flat sibling) — a plain 3-screen
  stack, no tab bar, matching the existing Directory/Student
  Orgs/Dictionary/More list→detail shape extended by one screen.

- [ ] **Step 1: Add the term-lookup and course-by-id queries**

In `source/views/sis/course-search/query.ts`, add below the existing
`availableTermsOptions`:

```typescript
export const termByNumberOptions = (term: number) =>
	queryOptions({
		queryKey: keys.terms,
		queryFn: async ({signal}) => {
			const resp = await infoJson({signal})
			return resp.files
		},
		select: (data) => data.find((t) => t.term === term),
	})
```

and below the existing `courseDataOptions`:

```typescript
export const courseByIdOptions = (term: TermType, clbid: number) =>
	queryOptions({
		queryKey: keys.courses(term, [], []),
		queryFn: ({signal}) => coursesForTerm(term, [], [], {signal}),
		select: (data) => data.find((c) => c.clbid === clbid),
	})
```

(`termByNumberOptions` shares `keys.terms` with `availableTermsOptions`
— same cache entry, a `select` that finds one term instead of filtering
to the last 5 years. `courseByIdOptions` takes the *resolved* `TermType`
object, always fetches with empty `levels`/`gereqs` so the target course
is never excluded by whatever filters were active when it was found,
and shares `courseDataOptions`'s `keys.courses(term, levels, gereqs)`
key shape — so if a user reached this exact unfiltered term-list before,
this reuses that cache entry instead of re-fetching.)

- [ ] **Step 2: Change `CourseDetailView` to accept `course` as a prop**

In `source/views/sis/course-search/detail/index.tsx`, replace:

```typescript
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../../navigation/types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
```

with nothing (delete these three lines).

Delete:

```typescript
export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, 'CourseDetail'>
}): NativeStackNavigationOptions => {
	let {name} = props.route.params.course
	return {
		title: name,
	}
}
```

(the `app/` wrapper takes this over in Step 6 — the title depends only
on `course`, which the wrapper already has once its query resolves.)

Replace:

```typescript
export const CourseDetailView = (): React.ReactNode => {
	let route = useRoute<RouteProp<RootStackParamList, 'CourseDetail'>>()
	let {course} = route.params

	let status = course.status === 'O' ? ('Open' as const) : ('Closed' as const)
```

with:

```typescript
type Props = {
	course: CourseType
}

export const CourseDetailView = ({course}: Props): React.ReactNode => {
	let status = course.status === 'O' ? ('Open' as const) : ('Closed' as const)
```

Everything else in the file (`Information`, `Schedule`, `Notes`,
`Description`, the returned JSX) is unchanged.

- [ ] **Step 3: Move the recent-filter reconstruction into `results.tsx`, swap navigation**

In `source/views/sis/course-search/results.tsx`, replace:

```typescript
import {
	NavigationProp,
	RouteProp,
	useNavigation,
	useRoute,
} from '@react-navigation/native'
import {
	ChangeTextEvent,
	LegacyRootParamList,
	RootStackParamList,
} from '../../../navigation/types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
```

with:

```typescript
import {useLocalSearchParams, useNavigation, useRouter} from 'expo-router'
import {ChangeTextEvent} from '../../../navigation/types'
import {fromPairs} from 'lodash'
import {selectRecentFilters} from '../../../redux/parts/courses'
import {useAppSelector} from '../../../redux'
```

(`updateRecentFilters`/`updateRecentSearches` were already imported from
`../../../redux/parts/courses` two lines above — add `selectRecentFilters`
to that existing import instead of a second one:)

```typescript
import {
	updateRecentSearches,
	updateRecentFilters,
	selectRecentFilters,
} from '../../../redux/parts/courses'
```

Replace:

```typescript
export const CourseSearchResultsView = (): React.ReactNode => {
	let dispatch = useAppDispatch()
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let route = useRoute<RouteProp<RootStackParamList, 'CourseSearchResults'>>()
	let {initialFilters = [], initialQuery = ''} = route.params ?? {}

	let {
		data: basicFilters = [],
		error: filterError,
		isLoading: filtersLoading,
	} = useFilters()

	let [filters, setFilters] = React.useState<FilterType<CourseType>[]>(
		initialFilters.length ? initialFilters : basicFilters,
	)
```

with:

```typescript
export const CourseSearchResultsView = (): React.ReactNode => {
	let dispatch = useAppDispatch()
	let navigation = useNavigation()
	let router = useRouter()

	let {initialQuery = '', filterDescription} = useLocalSearchParams<{
		initialQuery?: string
		filterDescription?: string
	}>()

	let {
		data: basicFilters = [],
		error: filterError,
		isLoading: filtersLoading,
	} = useFilters()

	let recentFilters = useAppSelector(selectRecentFilters)

	let initialFilters = React.useMemo(() => {
		let selectedFilterCombo = filterDescription
			? recentFilters.find((f) => f.description === filterDescription)
			: undefined
		if (!selectedFilterCombo) {
			return []
		}
		let filterLookup = fromPairs(
			selectedFilterCombo.filters.map((f) => [f.key, f]),
		)
		return basicFilters.map((f) => filterLookup[f.key] || f)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterDescription])

	let [filters, setFilters] = React.useState<FilterType<CourseType>[]>(
		initialFilters.length ? initialFilters : basicFilters,
	)
```

(the `eslint-disable` matches this file's existing style of narrowing a
`useMemo`/`useEffect`'s deps deliberately — here, `basicFilters` and
`recentFilters` change identity on every render once loaded, and
re-deriving `initialFilters` from a fresh `basicFilters` reference on
every render would fight the `useState` initializer's "only read once"
contract the same way the original `initialFilters` prop's identity
churn never did. `initialQuery` keeps its `''` default, same as the
original `route.params` destructure, so the rest of the file — which
still reads it as a plain `string` — needs no further changes.)

Replace:

```typescript
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.systemFill,
				onChangeText: (event: ChangeTextEvent) =>
					setSearchQuery(event.nativeEvent.text),
			},
		})
	}, [initialQuery, navigation, searchQuery])
```

with the same body (unchanged — `navigation` is now expo-router's own,
which still supports `.setOptions()` the same way, matching Directory/
Student Orgs/Dictionary/More's already-proven usage of this exact
pattern):

```typescript
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.systemFill,
				onChangeText: (event: ChangeTextEvent) =>
					setSearchQuery(event.nativeEvent.text),
			},
		})
	}, [initialQuery, navigation, searchQuery])
```

Replace:

```typescript
			navigation.navigate('CourseDetail', {course: data})
```

with:

```typescript
			router.push({
				pathname: '/CourseDetail',
				params: {clbid: data.clbid.toString(), term: data.term.toString()},
			})
```

(`handlePress`'s dependency array already lists `navigation` — change it
to list `router` instead:)

```typescript
		[router, dispatch, delayedQuery, filters],
```

Delete the trailing export (dead once `routes.tsx` no longer references
it — already removed in Task 1's Step 5, since it was one contiguous
block):

```typescript
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Course Catalog',
}
```

- [ ] **Step 4: Swap `CourseSearchView`'s navigation and the recent-filter press handler**

In `source/views/sis/course-search/search.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {debounce, fromPairs} from 'lodash'
import * as React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {ChangeTextEvent, LegacyRootParamList} from '../../../navigation/types'
```

with:

```typescript
import {useNavigation, useRouter} from 'expo-router'
import {debounce} from 'lodash'
import * as React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {ChangeTextEvent} from '../../../navigation/types'
```

Replace:

```typescript
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Course Catalog',
}

const RightButton: React.FC<{onPress: () => void}> = ({onPress}) => (
	<SearchButton onPress={onPress} title="Browse" />
)

export const CourseSearchView = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```typescript
export const NavigationOptions = {
	title: 'Course Catalog',
}

const RightButton: React.FC<{onPress: () => void}> = ({onPress}) => (
	<SearchButton onPress={onPress} title="Browse" />
)

export const CourseSearchView = (): React.ReactNode => {
	let navigation = useNavigation()
	let router = useRouter()
```

(`NavigationOptions` drops its `NativeStackNavigationOptions` type
annotation but keeps its literal value — the `app/(home)/CourseSearch.tsx`
wrapper created in Step 7 casts it the same way `app/(home)/StudentOrgs/
index.tsx` already casts `NavigationOptions` for its own static title.)

Replace:

```typescript
	React.useLayoutEffect(() => {
		const getRightButton = () => (
			<RightButton
				onPress={() =>
					navigation.navigate('CourseSearchResults', {initialQuery: ''})
				}
			/>
		)

		navigation.setOptions({
			headerRight: getRightButton,
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) => {
					setTypedQuery(event.nativeEvent.text)
				},
			},
		})
	}, [navigation, typedQuery])
```

with:

```typescript
	React.useLayoutEffect(() => {
		const getRightButton = () => (
			<RightButton
				onPress={() =>
					router.push({
						pathname: '/CourseSearchResults',
						params: {initialQuery: ''},
					})
				}
			/>
		)

		navigation.setOptions({
			headerRight: getRightButton,
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) => {
					setTypedQuery(event.nativeEvent.text)
				},
			},
		})
	}, [navigation, router, typedQuery])
```

Replace:

```typescript
	let showSearchResult = React.useCallback(
		(query: string) => {
			navigation.navigate('CourseSearchResults', {initialQuery: query})
		},
		[navigation],
	)
```

with:

```typescript
	let showSearchResult = React.useCallback(
		(query: string) => {
			router.push({
				pathname: '/CourseSearchResults',
				params: {initialQuery: query},
			})
		},
		[router],
	)
```

Replace:

```typescript
	let onRecentFilterPress = React.useCallback(
		(text: string) => {
			let selectedFilterCombo = recentFilters.find(
				(f) => f.description === text,
			)

			let selectedFilters = basicFilters
			if (selectedFilterCombo) {
				let filterLookup = fromPairs(
					selectedFilterCombo.filters.map((f) => [f.key, f]),
				)
				selectedFilters = basicFilters.map((f) => filterLookup[f.key] || f)
			}

			navigation.navigate('CourseSearchResults', {
				initialFilters: selectedFilters,
			})
		},
		[basicFilters, navigation, recentFilters],
	)
```

with:

```typescript
	let onRecentFilterPress = React.useCallback(
		(text: string) => {
			router.push({
				pathname: '/CourseSearchResults',
				params: {filterDescription: text},
			})
		},
		[router],
	)
```

(the `fromPairs`/`filterLookup` reconstruction moved to `results.tsx` in
Step 3, which is where the resolved filter array is actually consumed —
`search.tsx` only needs to pass the description string it already has.
`recentFilters`/`basicFilters` stay used elsewhere in this file for
rendering the "Recent" list itself, so their own `useAppSelector`/
`useFilters()` calls above are unchanged.)

- [ ] **Step 5: Restore the Course Catalog home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`courseSearch` entry.

- [ ] **Step 6: Create the CourseSearch, CourseSearchResults, and CourseDetail routes**

Create `app/(home)/CourseSearch.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	CourseSearchView,
	NavigationOptions,
} from '../../source/views/sis/course-search/search'

export default function CourseSearchPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					NavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<CourseSearchView />
		</>
	)
}
```

Create `app/(home)/CourseSearchResults.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {CourseSearchResultsView} from '../../source/views/sis/course-search/results'

export default function CourseSearchResultsPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Course Catalog'}} />
			<CourseSearchResultsView />
		</>
	)
}
```

Create `app/(home)/CourseDetail.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {CourseDetailView} from '../../source/views/sis/course-search/detail'
import {
	courseByIdOptions,
	termByNumberOptions,
} from '../../source/views/sis/course-search/query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import type {TermType} from '../../source/lib/course-search'

const PENDING_TERM: TermType = {hash: '', path: '', term: 0, type: '', year: 0}

export default function CourseDetailPage(): React.ReactNode {
	let {clbid, term} = useLocalSearchParams<{clbid: string; term: string}>()

	let {data: resolvedTerm, isLoading: termLoading} = useQuery(
		termByNumberOptions(Number(term)),
	)

	let {
		data: course,
		isLoading: courseLoading,
		error,
		refetch,
	} = useQuery({
		...courseByIdOptions(resolvedTerm ?? PENDING_TERM, Number(clbid)),
		enabled: Boolean(resolvedTerm),
	})

	if (termLoading || courseLoading) {
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

	if (!course) {
		return <NoticeView text="Could not find this course." />
	}

	return (
		<>
			<Stack.Screen options={{title: course.name}} />
			<CourseDetailView course={course} />
		</>
	)
}
```

(`PENDING_TERM` is never fetched with — `courseByIdOptions`'s query is
`enabled: Boolean(resolvedTerm)`, so it stays inert until the real term
resolves; it exists only so `courseByIdOptions` always has a real
`TermType` to build a query key from, the same role `keys.jobs(username)`
staying stable under `enabled: Boolean(username)` plays in stoPrint's
`jobByIdOptions`.)

- [ ] **Step 7: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake before treating it as
real).

- [ ] **Step 8: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Expected: home screen shows the "Course Catalog" tile. Tapping it shows
the search screen with header "‹ All About Olaf | Course Catalog", a
working back button, a native search bar, and a "Browse" header-right
button. Typing 2+ characters and pausing should navigate to the results
screen after the debounce; tapping "Browse" should navigate to results
immediately with no query. The results screen shows the same "Course
Catalog" title, its own native search bar, and (once course/filter data
loads) either search results or the "no courses matched"/empty-state
message. Tapping a course row pushes to the course detail screen showing
the resolved course's real title in the header and its info/schedule/
notes/description sections; back button returns to results. If any
"Recent" filter combinations exist in Redux state at test time, tapping
one from the search screen should reach the results screen pre-filtered
to match — otherwise note in the report that this specific path (recent
filter combo) wasn't exercised live and why (e.g. no prior combos
existed in a fresh app install) rather than skipping it silently.

This tile hits a live network endpoint (`stolaf.dev/course-data/`) for
terms/courses/departments/GE requirements — note in the report whether
real data was reachable in this sandboxed environment, and if not,
confirm the loading/error states at minimum render correctly and
non-crashing.

Screenshot: home screen showing the Course Catalog tile, the search
screen, the results screen (whatever data/empty/error state it resolves
to), and a course detail screen (showing the resolved title in the
header) — look at each yourself before trusting a report that claims
they show what they claim, the same way you would for any other
screenshot in this process.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 9: Commit**

```bash
git add source/views/sis/course-search/search.tsx source/views/sis/course-search/results.tsx source/views/sis/course-search/detail/index.tsx source/views/sis/course-search/query.ts source/views/views.ts app/\(home\)/CourseSearch.tsx app/\(home\)/CourseSearchResults.tsx app/\(home\)/CourseDetail.tsx
git commit -m "Restore the Course Catalog home-grid tile

Second half of checkpoint 2's SIS group PR -- a plain 3-screen
search-to-detail stack, the same shape already proven in Directory/
Student Orgs/Dictionary/More, extended by one screen.

Course detail needed a two-hop lookup rather than a plain select:
courseDataOptions fetches one term's courses at a time, keyed on
the full TermType object the results screen resolved from the
user's filter selection -- not something a freshly-launched detail
screen has. termByNumberOptions resolves a term number to that
TermType (select over the same keys.terms cache entry
availableTermsOptions already populates), then courseByIdOptions
fetches that term's courses unfiltered and selects the one course
by clbid, so the target course is never excluded by whatever level/
GE filters happened to be active when it was found.

The 'recent filter combination' feature (re-apply a past filter set
by tapping its description) moved its filterLookup/fromPairs
reconstruction from search.tsx into results.tsx, since only a
description string -- not the resolved filter array -- fits through
a URL param; results.tsx already had both pieces (Redux's
recentFilters, useFilters()'s basicFilters) needed to redo that
reconstruction itself."
```

- [ ] **Step 10: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload every screenshot from both tasks and post them as one PR comment.
