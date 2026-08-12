# expo-router checkpoint 2, group PR 6: stoPrint

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "stoPrint" home-grid tile (print jobs list → printer
list → release/cancel). Sixth group PR in checkpoint 2's stack, and the
first group with mutations (`useMutation` for releasing/cancelling a print
job) and a URL-optional second entity (a job can be released with or
without a chosen printer).

**Architecture:** Same `select`-based-on-the-same-queryKey pattern as prior
groups, applied twice: `jobByIdOptions(username, jobId)` shares
`printJobsOptions(username)`'s queryKey/fetch and selects one job by `id`;
`printerByNameOptions(username, printerName)` shares
`allPrintersOptions(username)`'s queryKey/fetch and selects one printer by
`printerName`. Both list queries were already keyed by `username`
(resolved from `credentialsOptions`, itself a query) — so every screen in
this group has a two-level async dependency (credentials → the
username-keyed list), not the one-level dependency every prior group had.

**Routes:**
- `/PrintJobs` — the list (unchanged shape, job press navigates onward).
- `/PrintJobs/[jobId]/printers` — printer selection, reached only for a
  "Pending Release" job.
- `/PrintJobs/[jobId]/release` — release/cancel, reached either directly
  from the list (already-sent jobs, no printer choice needed) or from the
  printer list (a `printer` query-string param carries the chosen
  printer's name — expo-router merges extra `params` keys not matched by
  a `[segment]` into the URL's query string, same mechanism Directory's
  department drill-down already uses).

`printerByNameOptions`'s `enabled` is `Boolean(username) && printerName !==
undefined` (mirrors the existing `heldJobsOptions`'s own `printerName !==
undefined` idiom in this same file) — when no `printer` param is present,
the query simply never runs and its `data`/`isLoading` both read as "not
requested," so the release page's optional-printer rendering needs no
extra branching for the "no printer param" case beyond passing the result
straight through.

**Settings button (decided by Wren):** `PrintJobsView`'s "Open Settings"
button, shown in the not-logged-in empty state, keeps its existing
`navigation.navigate('Settings')` call and behavior — untouched. The hook
it comes from does change, though: `useNavigation` must be imported from
`expo-router`, not as a runtime value from `@react-navigation/native`
(that import alone trips Metro's SDK56+ react-navigation-incompatibility
check — the same one the checkpoint-2 scaffold task already hit and
fixed). `NavigationProp` stays a type-only import from
`@react-navigation/native` — erased at compile time, so it never reaches
that check — and expo-router's `useNavigation()` result is cast to it, so
the call site and its behavior are identical to today. Settings itself
hasn't been migrated (out of scope, a later checkpoint) and its old
registration lives only in `source/navigation/routes.tsx`'s navigator,
which is unmounted dead code since checkpoint 1 pointed the JS entry at
`expo-router/entry` (`index.js` → `expo-router/entry`; `source/app.tsx`,
which used to mount that navigator via `RootStack`, is itself unreferenced
now). This button is already non-functional in production today — the
`disabled: true` flag has kept the whole group unreachable — and this
migration does not fix or worsen that; it's carried forward exactly as it
is until Settings itself is migrated. `handleJobPress`, the *other* use of
navigation in this same file, does move to expo-router's `useRouter()` —
two different hooks for two different jobs, in the same component, same
precedent Student Orgs/Directory/Dictionary already established.

**Mutations:** `PrintJobReleaseView`'s `releaseJob`/`cancelJob`
`useMutation` calls are untouched — they already work from props
(`job`/`printer`/`username`/`heldJob`), not from route objects, so nothing
about the expo-router migration touches them beyond `returnToJobsView`
switching from `navigation.navigate('PrintJobs')` to
`router.push('/PrintJobs')`.

## Global Constraints

- Branch `expo-router-home-stoprint`, stacked on `expo-router-home-dictionary`
  (PR #7673).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.
- Manual boot verification for this group cannot exercise the real
  stoPrint API without live St. Olaf credentials and pending print jobs —
  screenshot as much of the flow as the sandboxed environment's stoPrint
  mock (`isStoprintMocked`, already used throughout this group's code) or
  the not-logged-in empty state allows, and say plainly in the report
  which screens could and couldn't be reached.

---

### Task 1: Wire the stoPrint list, printer-list, and release screens into expo-router

**Files:**
- Modify: `source/views/stoprint/print-jobs.tsx`
- Modify: `source/views/stoprint/printers.tsx`
- Modify: `source/views/stoprint/print-release.tsx`
- Modify: `source/views/stoprint/query.ts`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/views/views.ts`
- Create: `app/(home)/PrintJobs/index.tsx`
- Create: `app/(home)/PrintJobs/[jobId]/printers.tsx`
- Create: `app/(home)/PrintJobs/[jobId]/release.tsx`

**Interfaces:**
- Consumes: `PrintJobsView`, `PrintJobsNavigationOptions` from
  `print-jobs.tsx`; `PrinterListView` (new prop shape: `{job: PrintJob}`),
  `PrinterListNavigationOptions` from `printers.tsx`;
  `PrintJobReleaseView` (new prop shape: `{job: PrintJob; printer?:
  Printer}`), `PrintJobReleaseNavigationOptions` from `print-release.tsx`;
  `jobByIdOptions`, `printerByNameOptions` from `query.ts`; `PrintJob`,
  `Printer` from `../../lib/stoprint`; `credentialsOptions` from
  `../../lib/login`.
- Produces: the `/PrintJobs`, `/PrintJobs/[jobId]/printers`, and
  `/PrintJobs/[jobId]/release` routes.

- [ ] **Step 1: Add the shared `select`-based single-job and single-printer queries**

In `source/views/stoprint/query.ts`, replace the whole file with:

```typescript
import {queryOptions} from '@tanstack/react-query'
import {
	fetchAllPrinters,
	fetchColorPrinters,
	fetchJobs,
	fetchRecentPrinters,
	heldJobsAvailableAtPrinterForUser,
} from '../../lib/stoprint/api'

export const keys = {
	jobs: (username: string) => ['printing', 'jobs', 'all', username] as const,
	heldJobs: ({
		username,
		printerName,
	}: {
		username: string
		printerName: string
	}) => ['printing', 'jobs', 'held', username, printerName] as const,
	printers: (username: string) => ['printing', 'printers', username] as const,
	recentPrinters: (username: string) =>
		['printing', 'printers', 'recent', username] as const,
	colorPrinters: ['printing', 'printers', 'color'] as const,
}

async function fetchJobsForUser(username: string, signal?: AbortSignal) {
	return fetchJobs(username, {signal})
}

export const printJobsOptions = (username: string) =>
	queryOptions({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchJobsForUser(username, signal),
	})

export const jobByIdOptions = (
	username: string,
	jobId: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchJobsForUser(username, signal),
		select: (data) => data.jobs.find((j) => j.id.toString() === jobId),
	})

async function fetchAllPrintersForUser(username: string, signal?: AbortSignal) {
	return fetchAllPrinters(username, {signal})
}

export const allPrintersOptions = (username: string) =>
	queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchAllPrintersForUser(username, signal),
	})

export const printerByNameOptions = (
	username: string,
	printerName: string | undefined,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username) && printerName !== undefined,
		queryFn: ({signal}) => fetchAllPrintersForUser(username, signal),
		select: (data) => data.find((p) => p.printerName === printerName),
	})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const recentPrintersOptions = (username: string) =>
	queryOptions({
		queryKey: keys.recentPrinters(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchRecentPrinters(username, {signal}),
	})

export const colorPrintersOptions = queryOptions({
	queryKey: keys.colorPrinters,
	queryFn: ({signal}) => fetchColorPrinters({signal}),
})

export const heldJobsOptions = (
	username: string,
	printerName: string | undefined,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) => {
	let usablePrinterName = printerName || 'undefined'
	return queryOptions({
		enabled: Boolean(username) && printerName !== undefined,
		queryKey: keys.heldJobs({username, printerName: usablePrinterName}),
		queryFn: ({signal}) =>
			heldJobsAvailableAtPrinterForUser(usablePrinterName, username, {signal}),
	})
}
```

(`printJobsOptions` and `allPrintersOptions` are otherwise unchanged in
behavior — only their inline fetches became `fetchJobsForUser`/
`fetchAllPrintersForUser` so `jobByIdOptions`/`printerByNameOptions` can
share them. `recentPrintersOptions`, `colorPrintersOptions`,
`heldJobsOptions` are copied over unchanged.)

- [ ] **Step 2: Swap the list screen's job-press navigation (keep the Settings navigation as-is)**

In `source/views/stoprint/print-jobs.tsx`, replace:

```typescript
import {NavigationProp, useNavigation} from '@react-navigation/native'
```

with:

```typescript
import type {NavigationProp} from '@react-navigation/native'
import {useNavigation, useRouter} from 'expo-router'
```

(`useNavigation` must come from `expo-router`, not `@react-navigation/native`
— a runtime `import {useNavigation} from '@react-navigation/native'` trips
Metro's SDK56+ "expo-router is no longer compatible with react-navigation"
bundler check, the same failure the checkpoint-2 scaffold task already hit
and fixed once. `NavigationProp` is kept as a **type-only** import — type
imports are erased at compile time, so they never reach Metro's runtime
scan; only value imports of `@react-navigation/native` do. expo-router's
`useNavigation` is itself generic (`useNavigation<T = ...>()`), so it
takes the same `<NavigationProp<LegacyRootParamList>>` type argument the
`@react-navigation/native` version did — no cast needed, and
`@typescript-eslint/no-unnecessary-type-assertion` would reject an `as`
cast here since the type argument alone already narrows the return type.
This preserves the exact `.navigate('Settings')` call this plan's
"Settings button" section requires, without a runtime react-navigation
import.)

Replace:

```typescript
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
	let openSettings = () => navigation.navigate('Settings')

	let handleJobPress = (job: PrintJob) => {
		if (job.statusFormatted === 'Pending Release') {
			navigation.navigate('PrinterList', {job: job})
		} else {
			navigation.navigate('PrintJobRelease', {job: job})
		}
	}
```

with:

```typescript
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
	let router = useRouter()
	let openSettings = () => navigation.navigate('Settings')

	let handleJobPress = (job: PrintJob) => {
		let jobId = job.id.toString()
		if (job.statusFormatted === 'Pending Release') {
			router.push({pathname: '/PrintJobs/[jobId]/printers', params: {jobId}})
		} else {
			router.push({pathname: '/PrintJobs/[jobId]/release', params: {jobId}})
		}
	}
```

Everything else in the file — the credentials/jobs queries, the loading/
error/empty states, the `SectionList` render, the exported
`NavigationOptions` — is unchanged.

- [ ] **Step 3: Change the printer-list screen to accept `job` as a prop**

In `source/views/stoprint/printers.tsx`, replace:

```typescript
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
import type {PrintJob} from '../../lib/stoprint'
```

(the file's existing `import type {Printer} from '../../lib/stoprint'`
stays — add `PrintJob` to that same import instead of a new line:
`import type {Printer, PrintJob} from '../../lib/stoprint'`, then drop the
standalone line above if you added it separately.)

Replace:

```typescript
export const PrinterListView = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let route = useRoute<RouteProp<RootStackParamList, 'PrinterList'>>()
	let {job} = route.params
```

with:

```typescript
type Props = {
	job: PrintJob
}

export const PrinterListView = ({job}: Props): React.ReactNode => {
	let router = useRouter()
```

Replace:

```typescript
	let openPrintRelease = React.useCallback(
		(printer: Printer) =>
			navigation.navigate('PrintJobRelease', {job, printer}),
		[navigation, job],
	)
```

with:

```typescript
	let openPrintRelease = React.useCallback(
		(printer: Printer) =>
			router.push({
				pathname: '/PrintJobs/[jobId]/release',
				params: {jobId: job.id.toString(), printer: printer.printerName},
			}),
		[router, job],
	)
```

Everything else in the file — the username/printers queries, the
error/loading branches, the grouping logic, the `SectionList` render, the
exported `NavigationOptions` — is unchanged.

- [ ] **Step 4: Change the release screen to accept `job`/`printer` as props**

In `source/views/stoprint/print-release.tsx`, replace:

```typescript
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
```

Replace:

```typescript
export const PrintJobReleaseView = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let route = useRoute<RouteProp<RootStackParamList, 'PrintJobRelease'>>()
	let {job, printer} = route.params
```

with:

```typescript
type Props = {
	job: PrintJob
	printer?: Printer
}

export const PrintJobReleaseView = ({job, printer}: Props): React.ReactNode => {
	let router = useRouter()
```

Replace:

```typescript
	const returnToJobsView = React.useCallback(() => {
		navigation.navigate('PrintJobs')
	}, [navigation])
```

with:

```typescript
	const returnToJobsView = React.useCallback(() => {
		router.push('/PrintJobs')
	}, [router])
```

Everything else in the file — the username/heldJobs queries, both
`useMutation` calls, the `requestCancel`/`requestRelease` handlers, the
loading/status logic, the `ScrollView`/`TableView` render, the exported
`NavigationOptions` — is unchanged.

- [ ] **Step 5: Update the barrel export**

`source/views/stoprint/index.ts` needs no changes — it already re-exports
`PrintJobsView`, `PrinterListView`, `PrintJobReleaseView`, and all three
`NavigationOptions` by name, none of which changed their export names,
only their prop signatures.

- [ ] **Step 6: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as stoprint from '../views/stoprint'
```

and remove the stoPrint `Stack.Group` block (all three screens —
`PrintJobs`, `PrinterList`, `PrintJobRelease`):

```typescript
				<Stack.Group>
					<Stack.Screen
						component={stoprint.PrintJobsView}
						name="PrintJobs"
						options={stoprint.PrintJobsNavigationOptions}
					/>
					<Stack.Screen
						component={stoprint.PrinterListView}
						name="PrinterList"
						options={stoprint.PrinterListNavigationOptions}
					/>
					<Stack.Screen
						component={stoprint.PrintJobReleaseView}
						name="PrintJobRelease"
						options={stoprint.PrintJobReleaseNavigationOptions}
					/>
				</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 7: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`printJobs` entry.

- [ ] **Step 8: Create the list route wrapper**

Create `app/(home)/PrintJobs/index.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	PrintJobsView,
	PrintJobsNavigationOptions,
} from '../../../source/views/stoprint'

export default function PrintJobsPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					PrintJobsNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<PrintJobsView />
		</>
	)
}
```

- [ ] **Step 9: Create the printer-list route**

Create `app/(home)/PrintJobs/[jobId]/printers.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {
	PrinterListView,
	PrinterListNavigationOptions,
} from '../../../../source/views/stoprint'
import {jobByIdOptions} from '../../../../source/views/stoprint/query'
import {credentialsOptions} from '../../../../source/lib/login'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function PrinterListPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()

	let {data: username = '', isLoading: credentialsLoading} = useQuery({
		...credentialsOptions,
		select: (data) => data?.username,
	})

	let {
		data: job,
		isLoading: jobLoading,
		error: jobError,
		refetch: jobRefetch,
	} = useQuery(jobByIdOptions(username, jobId))

	let screen = (
		<Stack.Screen
			options={
				PrinterListNavigationOptions as React.ComponentProps<
					typeof Stack.Screen
				>['options']
			}
		/>
	)

	if (credentialsLoading || jobLoading) {
		return (
			<>
				{screen}
				<LoadingView text="Loading…" />
			</>
		)
	}

	if (jobError) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={jobRefetch}
					text={`A problem occured while loading: ${
						jobError instanceof Error ? jobError.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!job) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this print job." />
			</>
		)
	}

	return (
		<>
			{screen}
			<PrinterListView job={job} />
		</>
	)
}
```

- [ ] **Step 10: Create the release route**

Create `app/(home)/PrintJobs/[jobId]/release.tsx`:

```typescript
import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {
	PrintJobReleaseView,
	PrintJobReleaseNavigationOptions,
} from '../../../../source/views/stoprint'
import {
	jobByIdOptions,
	printerByNameOptions,
} from '../../../../source/views/stoprint/query'
import {credentialsOptions} from '../../../../source/lib/login'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function PrintJobReleasePage(): React.ReactNode {
	let {jobId, printer: printerName} = useLocalSearchParams<{
		jobId: string
		printer?: string
	}>()

	let {data: username = '', isLoading: credentialsLoading} = useQuery({
		...credentialsOptions,
		select: (data) => data?.username,
	})

	let {
		data: job,
		isLoading: jobLoading,
		error: jobError,
		refetch: jobRefetch,
	} = useQuery(jobByIdOptions(username, jobId))

	let {
		data: printer,
		isLoading: printerLoading,
		error: printerError,
		refetch: printerRefetch,
	} = useQuery(printerByNameOptions(username, printerName))

	let screen = (
		<Stack.Screen
			options={
				PrintJobReleaseNavigationOptions as React.ComponentProps<
					typeof Stack.Screen
				>['options']
			}
		/>
	)

	if (credentialsLoading || jobLoading || printerLoading) {
		return (
			<>
				{screen}
				<LoadingView text="Loading…" />
			</>
		)
	}

	if (jobError) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={jobRefetch}
					text={`A problem occured while loading: ${
						jobError instanceof Error ? jobError.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!job) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this print job." />
			</>
		)
	}

	if (printerName !== undefined && printerError) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={printerRefetch}
					text={`A problem occured while loading: ${
						printerError instanceof Error
							? printerError.message
							: 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (printerName !== undefined && !printer) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this printer." />
			</>
		)
	}

	return (
		<>
			{screen}
			<PrintJobReleaseView job={job} printer={printer} />
		</>
	)
}
```

(the `printerName !== undefined` guards on the error/not-found branches
matter here — when no `printer` param was ever passed, `printerByNameOptions`
never runs, `printerError` is `null`, and `printer` is `undefined` by
design, which is the normal "release an already-sent job, no printer
needed" case, not a failure.)

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
Expected: home screen shows seven tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory, Campus Dictionary, stoPrint). Tapping
"stoPrint" without St. Olaf credentials stored shows the "You are not
logged in" empty state with a (non-functional, per this plan's decision)
"Open Settings" button — no crash. If `isStoprintMocked` mock data is
reachable in this environment, also verify: the print jobs list renders,
tapping a "Pending Release" job opens the printer list, tapping a printer
opens the release screen with printer info shown, tapping a non-pending
job opens the release screen directly with no printer section. Note
plainly in the report which of these states were and weren't reachable
without live credentials.

Screenshot: home screen (seven tiles, no others), and whichever of the
not-logged-in / jobs-list / printer-list / release states were reachable —
look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 13: Commit**

```bash
git add source/views/stoprint/print-jobs.tsx source/views/stoprint/printers.tsx source/views/stoprint/print-release.tsx source/views/stoprint/query.ts source/navigation/routes.tsx source/views/views.ts app/\(home\)/PrintJobs/index.tsx app/\(home\)/PrintJobs/\[jobId\]/printers.tsx app/\(home\)/PrintJobs/\[jobId\]/release.tsx
git commit -m "Restore the stoPrint home-grid tile

Sixth group PR in checkpoint 2's stack, and the first with mutations
and an optional second URL-keyed entity. jobByIdOptions and
printerByNameOptions each share their list query's exact queryKey
and fetch function (printJobsOptions/allPrintersOptions), same
select-based pattern as every prior group -- extended here to two
independent lookups instead of one, since releasing a job needs both
the job and (sometimes) a chosen printer.

PrintJobsView keeps its existing navigation.navigate('Settings') for
the not-logged-in empty state's button untouched -- Settings hasn't
been migrated yet and that call is already inert in production
(source/navigation/routes.tsx's navigator is unmounted dead code
since checkpoint 1), so this migration neither fixes nor worsens it.
handleJobPress moves to expo-router's useRouter(), same two-hooks-one-
component precedent Student Orgs/Directory/Dictionary established.

source/navigation/routes.tsx's stoPrint registration (all three
screens, dead code, still type-checked) is removed in the same
commit."
```

- [ ] **Step 14: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
