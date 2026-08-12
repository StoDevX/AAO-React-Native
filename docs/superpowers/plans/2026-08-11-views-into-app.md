# Move navigation-relevant files into `app/` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each expo-router route file contain the screen it renders, and
move the rest of `source/views/` to `source/features/`, so `source/views/`
ceases to exist.

**Architecture:** Every route in `app/` currently sets a title and toolbar, then
renders a component imported from `source/views/`. For each screen rendered by
exactly one route, the screen's body moves into that route file, leaving one
component instead of a wrapper plus a screen plus (usually) a renaming barrel.
Everything a route does not render — queries, types, reducers, row components,
shared constants — moves to `source/features/<feature>/` with its internal
layout and relative imports untouched.

**Tech Stack:** TypeScript, React Native 0.86.2, expo-router 57, React Query 5,
Redux Toolkit, Jest + React Native Testing Library, jj for version control.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-08-11-views-into-app-design.md`.
  Read it before starting; it records why whole-folder colocation under `app/`
  is impossible and carries the verified per-file inventory.
- **Nothing may be added to or removed from `app/`.** Screens merge into route
  files that already exist. `find app -type f | sort` must be byte-identical
  before and after every commit. A change there means an accidental route, a
  lost route, or drifted typed routes.
- **No behaviour change.** Each commit is a move plus the import edits it
  forces. No renamed routes, no changed URLs, no refactoring of screen bodies
  beyond merging them into their route function.
- **A route file exports exactly one component, its default.** Re-export lines
  never travel into `app/`.
- **No file may be created under `app/` for tests.** Test files there register
  as routes (`/Contacts/__tests__/list`). Tests stay with their subjects in
  `source/features/`.
- This project uses jj, not git. `mv` is enough — jj records renames itself.
- Commit messages: imperative, capitalised, no trailing full stop, no
  conventional-commit prefix.
- Run `mise run agent:pre-commit` before every commit; do not commit if it
  fails.
- TypeScript only, no `any`. Match each file's existing style (tabs, single
  quotes, no semicolons).
- Out of scope: screens in `modules/` (`@frogpond/*`), including
  `MenuItemDetail`.

## Router chrome goes in a wrapper component

When a route's `Stack.Title` / `Stack.Screen` / `Stack.Toolbar` was rendered
unconditionally by the wrapper, and the screen being inlined has early returns,
put the chrome in an outer component and the screen in an inner one — both in
the route file. `app/(home)/BuildingHoursProblemReport.tsx` is the reference:

```tsx
function InnerXPage(): React.ReactNode {
	// data logic and early returns, each returning BARE content
	if (isLoading) return <LoadingView />
	return <TheContent />
}

export default function XPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>…</Stack.Title>
			<InnerXPage />
		</>
	)
}
```

The chrome then renders once, outside the branching, and no branch can omit
it. The alternative — computing the chrome into a variable and splicing it into
every return — puts an obligation on each branch, and Task 10 shipped a
regression that way: five branches, two of which dropped the title.

This also keeps the original component boundaries. Flattening a route and its
screen into one function forces hooks above every early return, forces renames
where destructurings collide, changes when queries fire, and can trip the React
Compiler's `preserve-manual-memoization` rule. Keeping an inner component
avoids all four, and is closer to a pure move.

Reproduce the chrome exactly as the pre-merge tree rendered it — including
chrome that only appeared in the success branch. Do not "improve" it by hoisting
title elements into branches that never had them; that is as much a behaviour
change as dropping them.

### Naming, and when a third component is needed

Two components: `BlahPage` for the chrome, `BlahView` for the screen — the name
the screen had before it was inlined, so `git log -S` still traces it.

Three components, named `BlahPage` (chrome), `BlahLoader` (the route's query and
its early returns), `BlahView` (the screen itself, keeping its original name).
The screen keeps `…View`; the loader is the layer that gets the new name.

A third component is **required** — not stylistic — when flattening the loader
into the screen would change behaviour. Two causes, both seen in this refactor:

- **A `useState` initialiser seeded from loaded data.** React evaluates a
  `useState` initial argument only on first mount. Hoisting such a hook into a
  component that mounts while the query is still loading freezes the value at
  its pre-load state forever. `app/(home)/Dictionary/[word]/edit.tsx`.
- **The screen's own queries are ungated.** If the screen calls `useQuery`
  without an `enabled` guard, it must not mount until the loader's data
  resolves, or those requests fire earlier and more often than before.
  `app/(home)/PrintJobs/[jobId]/printers.tsx`, whose printer-list options carry
  no `enabled` gate.

Where neither applies, two components are enough.

## The recipe

Every task is the same five moves. The per-task sections below give the exact
files; this is the shape.

1. `mv source/views/<feature> source/features/<feature>`.
2. For each screen listed under **Inline**, move its body into the named route
   file so the route's `export default function …Page()` *is* the screen. Merge
   the screen's imports into the route's, keep the route's existing
   `Stack.Title` / `Stack.Screen` / toolbar, and delete the screen's file.
3. Delete the barrels and hybrid leftovers listed under **Delete**.
4. Repoint the imports listed under **Repoint**.
5. Verify, then commit.

**Verification, every task.** Capture the `app/` file list before editing and
compare after:

```bash
find app -type f | sort > /tmp/app-before.txt   # before editing
find app -type f | sort > /tmp/app-after.txt    # after editing
diff /tmp/app-before.txt /tmp/app-after.txt     # must print nothing
mise run agent:pre-commit                        # must pass
```

---

### Task 1: settings

Settings first: checkpoint 4 is in flight on this branch, so its files should
move before more work piles onto the old paths.

**Files:**

- Move: `source/views/settings` → `source/features/settings`
- Inline (screen → route), 15 screens:

| screen | route |
| --- | --- |
| `screens/credits.tsx` (`CreditsView`) | `app/(settings)/Credits.tsx` |
| `screens/legal.tsx` (`LegalView`) | `app/(settings)/Legal.tsx` |
| `screens/privacy.tsx` (`PrivacyView`) | `app/(settings)/Privacy.tsx` |
| `screens/overview/index.tsx` (`View as SettingsView`) | `app/(settings)/SettingsRoot.tsx` |
| `screens/overview/report-problem/screen.tsx` (`ReportProblemView`) | `app/(settings)/ReportProblem.tsx` |
| `screens/api-test/list.tsx` (`APITestView`) | `app/(settings)/APITest.tsx` |
| `screens/api-test/detail.tsx` (`APITestDetailView`) | `app/(settings)/APITestDetail.tsx` |
| `screens/banner-builder/index.tsx` (`BannerBuilderView`) | `app/(settings)/BannerBuilder.tsx` |
| `screens/network-logger/index.tsx` (`NetworkLoggerView`) | `app/(settings)/NetworkLogger.tsx` |
| `screens/overview/component-library/library.tsx` (`ComponentLibrary`) | `app/(component-library)/ComponentLibrary.tsx` |
| `screens/overview/component-library/badge.tsx` (`BadgeLibrary`) | `app/(component-library)/BadgeLibrary.tsx` |
| `screens/overview/component-library/button.tsx` (`ButtonLibrary`) | `app/(component-library)/ButtonLibrary.tsx` |
| `screens/overview/component-library/colors.tsx` (`ColorsLibrary`) | `app/(component-library)/ColorsLibrary.tsx` |
| `screens/overview/component-library/context-menu.tsx` (`ContextMenuLibrary`) | `app/(component-library)/ContextMenuLibrary.tsx` |
| `screens/overview/component-library/faq-banners.tsx` (`FaqBannerLibrary`) | `app/(component-library)/FaqBannerLibrary.tsx` |

- Delete: `screens/api-test/index.ts` (pure barrel);
  `screens/overview/component-library/index.tsx` (barrel — but check first
  whether it also defines anything, and if so keep the definitions)
- Stays (do not inline): `screens/debug/route-screen.tsx` — both
  `app/(settings)/Debug/index.tsx` and `app/(settings)/Debug/[...keyPath].tsx`
  render its `DebugKeyPathScreen`. Those two routes keep importing it, from
  `source/features/settings/screens/debug/route-screen`.
- Stays (support, 28 files): `components/logo.tsx`, `components/rows.tsx`,
  `screens/change-icon.tsx`, `screens/debug/{list,row,get-at-key-path,index}.*`,
  `screens/api-test/query.ts`, `screens/api-test/util/*`,
  `screens/overview/{developer,login-credentials,miscellany,server-url,support}.tsx`,
  `screens/overview/{query.ts,use-server-discovery.ts,version.ts}`,
  `screens/overview/report-problem/{gate.ts,submit.ts}`,
  `screens/overview/component-library/base/library-wrapper.tsx`, and all four
  `__tests__/` directories.
- Do **not** touch `app/(settings)/BonAppPicker.tsx`. Its screen lives in
  `source/views/menus/dev-bonapp-picker.tsx` and is handled by Task 12.

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: `source/features/settings/**`. Later tasks that import settings
  support (none currently do) would use that path.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/settings source/features/settings
```

- [ ] **Step 3: Inline the three simple screens**

`Credits.tsx`, `Legal.tsx`, `Privacy.tsx` are the smallest — do them first to
settle the pattern. For each: open the route, open the screen, move the
screen's imports up into the route's import block (dropping the import of the
screen itself), move the screen's body into the route's `…Page()` function
above/around the existing `Stack.*` elements, then delete the screen file.

Result shape, using Credits as the example:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'
// …whatever screens/credits.tsx imported

export default function CreditsPage(): React.ReactNode {
	// …whatever CreditsView's body was
	return (
		<>
			<Stack.Title>Credits</Stack.Title>
			{/* …whatever CreditsView returned */}
		</>
	)
}
```

- [ ] **Step 4: Type-check**

Run: `mise run tsc`
Expected: PASS. A missing import or a stale path fails here.

- [ ] **Step 5: Inline the remaining 12 screens**

Work down the table above. `screens/overview/index.tsx` → `SettingsRoot.tsx` is
the largest; its section components (`developer.tsx`, `miscellany.tsx`,
`support.tsx`, `server-url.tsx`, `change-icon.tsx`, `login-credentials.tsx`)
stay put and the route imports them from
`../../source/features/settings/screens/overview/…`.

- [ ] **Step 6: Delete the dead barrels**

```bash
rm source/features/settings/screens/api-test/index.ts
```

Check `screens/overview/component-library/index.tsx` before deleting: if it
only re-exports, delete it; if it defines `ComponentLibrary`, that definition
is what Step 5 already inlined, so it goes too.

- [ ] **Step 7: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 8: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS — 55 suites, 342 tests.

- [ ] **Step 9: Commit**

```bash
jj commit -m "Move the settings screens into their routes"
```

---

### Task 2: contacts

**Files:**

- Move: `source/views/contacts` → `source/features/contacts`
- Inline: `list.tsx` (`ContactsListView`, exported as `ContactsView`) →
  `app/(home)/Contacts/index.tsx`; `detail.tsx` (`ContactsDetailView`) →
  `app/(home)/Contacts/[title].tsx`
- Delete: `index.ts` — it exists only to alias `ContactsListView` to
  `ContactsView`
- Stays: `query.ts` (`groupedContactsOptions` used by the list screen,
  `contactByTitleOptions` by the detail route), `row.tsx`, `types.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/contacts/{query.ts,row.tsx,types.ts}`. The two
  route files import `groupedContactsOptions`, `ContactRow`, `ContactType` and
  `contactByTitleOptions` from there.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/contacts source/features/contacts
```

- [ ] **Step 3: Inline the list screen**

`app/(home)/Contacts/index.tsx` becomes the `SectionList` itself:

```tsx
import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {groupedContactsOptions} from '../../../source/features/contacts/query'
import {ContactRow} from '../../../source/features/contacts/row'
import type {ContactType} from '../../../source/features/contacts/types'

const styles = StyleSheet.create({
	listContainer: {backgroundColor: c.secondarySystemGroupedBackground},
	contentContainer: {flexGrow: 1},
})

export default function ContactsPage(): React.ReactNode {
	let router = useRouter()
	// …the rest of ContactsListView's body, unchanged…
	return (
		<>
			<Stack.Title>Important Contacts</Stack.Title>
			<SectionList /* …unchanged props… */ />
		</>
	)
}
```

Then `rm source/features/contacts/list.tsx`.

- [ ] **Step 4: Inline the detail screen**

`app/(home)/Contacts/[title].tsx` already fetches the contact and handles
loading, error and not-found. Move `ContactsDetailView`'s body into its success
branch, keeping the existing `Stack.Screen options={{title: …}}` logic, then
`rm source/features/contacts/detail.tsx`.

- [ ] **Step 5: Delete the barrel**

```bash
rm source/features/contacts/index.ts
```

- [ ] **Step 6: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 7: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
jj commit -m "Move the contacts screens into their routes"
```

---

### Task 3: student-orgs

**Files:**

- Move: `source/views/student-orgs` → `source/features/student-orgs`
- Inline: `list.tsx` (`StudentOrgsView`, aliased from local `View`) →
  `app/(home)/StudentOrgs/index.tsx`; `detail.tsx` (`StudentOrgsDetailView`,
  also aliased from local `View`) → `app/(home)/StudentOrgs/[name].tsx`
- Delete: `index.ts` (`export {View as StudentOrgsView} from './list'` and the
  same for detail)
- Stays: `query.ts` (`studentOrgsOptions` used by the list screen,
  `orgByNameOptions` by the detail route), `types.ts`, `util.ts`

Note the double alias: `list.tsx` ends with `export {StudentOrgsView as View}`
and the barrel renames it back. Both aliases disappear — the inlined screen is
just the page function.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/student-orgs/{query.ts,types.ts,util.ts}`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/student-orgs source/features/student-orgs
```

- [ ] **Step 3: Inline both screens**

List body into `StudentOrgs/index.tsx`, detail body into
`StudentOrgs/[name].tsx`, dropping the `export {X as View}` line from each.
Then delete `list.tsx` and `detail.tsx`.

- [ ] **Step 4: Delete the barrel**

```bash
rm source/features/student-orgs/index.ts
```

- [ ] **Step 5: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 6: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
jj commit -m "Move the student orgs screens into their routes"
```

---

### Task 4: directory

**Files:**

- Move: `source/views/directory` → `source/features/directory`
- Inline: `list.tsx` (`DirectoryView`) → `app/(home)/Directory/index.tsx`;
  `detail.tsx` (`DirectoryDetailView`) → `app/(home)/Directory/[index].tsx`
- Delete: `index.ts` (pure barrel)
- Stays: `query.ts` (`directoryEntriesOptions` used by the list screen,
  `directoryContactOptions` by the detail route), `types.ts`, `helpers.ts`

`types.ts` has four internal consumers (`helpers.ts`, `list.tsx`, `query.ts`,
`detail.tsx`); after inlining, the two route files import from
`source/features/directory/types` and the other two keep their relative
imports.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/directory/{query.ts,types.ts,helpers.ts}`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/directory source/features/directory
```

- [ ] **Step 3: Inline both screens, delete the barrel**

```bash
rm source/features/directory/index.ts
```

- [ ] **Step 4: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 5: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
jj commit -m "Move the directory screens into their routes"
```

---

### Task 5: calendar

The whole feature is one file holding two screens and two constants.

**Files:**

- Move: `source/views/calendar` → `source/features/calendar`
- Inline: `StOlafCalendarView` → `app/(home)/Calendar/index.tsx`;
  `NorthfieldCalendarView` → `app/(home)/Calendar/northfield.tsx`
- Create: `source/features/calendar/constants.ts` holding `STOLAF_POWERED_BY`
  and `NORTHFIELD_POWERED_BY`, moved verbatim
- Delete: `source/features/calendar/index.tsx` once both screens and both
  constants have left
- Repoint: `app/(home)/EventDetail.tsx` imports
  `{STOLAF_POWERED_BY, NORTHFIELD_POWERED_BY}` from
  `'../../source/features/calendar/constants'`; each inlined screen imports its
  own `*_POWERED_BY` from the same file

Both constants have two consumers after the split — the inlined calendar screen
and `EventDetail` — so they cannot ride into either route.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/calendar/constants.ts` exporting
  `STOLAF_POWERED_BY: {title: string; href: string}` and
  `NORTHFIELD_POWERED_BY: {title: string; href: string}`. Task 11 (streaming)
  creates the sibling file for the radio constants; `EventDetail` ends up
  importing from both.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/calendar source/features/calendar
```

- [ ] **Step 3: Create the constants file**

```ts
export const STOLAF_POWERED_BY = {
	title: 'Powered by the St. Olaf calendar',
	href: 'https://wp.stolaf.edu/calendar/',
}

export const NORTHFIELD_POWERED_BY = {
	title: 'Powered by VisitingNorthfield.com',
	href: 'https://visitingnorthfield.com/events/calendar/',
}
```

- [ ] **Step 4: Inline both screens and delete the emptied file**

Each screen's body moves into its route, importing `CccCalendarView`,
`namedCalendarOptions`, `eventKey`, `EventType` and `useQuery` as the original
did, plus its `poweredBy` constant from `./constants`' new path. Then
`rm source/features/calendar/index.tsx`.

- [ ] **Step 5: Repoint EventDetail**

```tsx
import {
	STOLAF_POWERED_BY,
	NORTHFIELD_POWERED_BY,
} from '../../source/features/calendar/constants'
```

- [ ] **Step 6: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 7: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
jj commit -m "Move the calendar screens into their routes"
```

---

### Task 6: more

**Files:**

- Move: `source/views/more` → `source/features/more`
- Inline: `index.tsx` (`MoreView`, exported as `View`) →
  `app/(home)/More/index.tsx`, then delete the file
- Stays: `query.ts`, `types.ts`

The route currently imports a component literally named `View`, which collides
with react-native's `View`. Once inlined there is no alias and no collision.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/more/{query.ts,types.ts}`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder, inline the screen**

```bash
mv source/views/more source/features/more
```

Then move `MoreView`'s body into `app/(home)/More/index.tsx` under the existing
`<Stack.Title>More</Stack.Title>`, drop the `export {MoreView as View}` line,
and `rm source/features/more/index.tsx`.

- [ ] **Step 3: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 4: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
jj commit -m "Move the More screen into its route"
```

---

### Task 7: news

**Files:**

- Move: `source/views/news` → `source/features/news`
- Inline: `StOlafNewsView` → `app/(home)/News/index.tsx`; `MessNewsView` →
  `app/(home)/News/mess.tsx`. Both are four-line wrappers around `NewsList`.
- Delete: `source/features/news/index.tsx` — it holds nothing but those two
  screens
- Stays: `news-list.tsx`, `news-row.tsx`, `query.ts`, `types.ts`, `lib/util.ts`
  and its two test files

Each route ends up as roughly:

```tsx
export default function StOlafNewsPage(): React.ReactNode {
	return (
		<NewsList
			query={useQuery(namedNewsOptions('stolaf'))}
			thumbnail={newsImages.stolaf}
		/>
	)
}
```

keeping whatever `Stack.*` the route already had.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/news/{news-list.tsx,query.ts,types.ts,lib/util.ts}`.
  Both routes import `NewsList`, `namedNewsOptions` and `images/news-sources`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder, inline both screens, delete the file**

```bash
mv source/views/news source/features/news
rm source/features/news/index.tsx   # after both screens are inlined
```

- [ ] **Step 3: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 4: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
jj commit -m "Move the news screens into their routes"
```

---

### Task 8: faqs

**Files:**

- Move: `source/views/faqs` → `source/features/faqs`
- Inline: `index.tsx` defines `FaqView` (exported as `View`) → move into
  `app/(home)/Faq.tsx`, keeping that route's title and close button. `FaqCard`
  is a private helper inside the same file and moves with it.
- Delete: `source/features/faqs/index.tsx` once `FaqView` has left. Its other
  line, `export {FaqBanner, FaqBannerGroup} from './banner'`, is a re-export —
  its consumers import from `banner.tsx` directly instead (next step).
- Repoint, because the barrel is going away:
  - `app/(home)/index.tsx`: `FaqBannerGroup` from
    `'../../source/features/faqs/banner'`
  - `source/features/settings/screens/overview/index.tsx`: `FaqBannerGroup`
    from `'../../../faqs/banner'`
  - `source/features/sis/balances.tsx`: `FaqBannerGroup` from
    `'../faqs/banner'`
  - `source/features/settings/screens/overview/component-library/faq-banners.tsx`
    already imports `FaqBanner` from `'../../../../faqs'` — point it at
    `'../../../../faqs/banner'`
- Stays: `banner.tsx`, `constants.ts`, `store.ts`, `dev-banner-store.ts`,
  `query.ts`, `conditions.ts`, `schema.ts`, `types.ts`, `local-faqs.ts`, and
  `__tests__/` (three files — `banner.test.tsx` imports `../banner`, which is
  unaffected by the folder move)

`faqs/index.tsx` is a hybrid: part screen, part barrel. Only the screen moves
into `app/`.

**Interfaces:**

- Consumes: `source/features/settings/**` from Task 1 and
  `source/features/sis/**` from Task 16 — but only as import *paths* in files
  those tasks own. If Task 16 has not run yet, `sis/balances.tsx` is still at
  `source/views/sis/balances.tsx`; repoint it there and Task 16's `mv` carries
  it along.
- Produces: `source/features/faqs/banner.tsx` as the direct import target for
  `FaqBanner` and `FaqBannerGroup`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/faqs source/features/faqs
```

- [ ] **Step 3: Inline `FaqView` into `app/(home)/Faq.tsx`**

Move the `styles`, `FaqView` body and the `FaqCard` helper into the route,
keeping its `<Stack.Title>FAQs</Stack.Title>` and close-button toolbar.

- [ ] **Step 4: Repoint the four banner importers, then delete the barrel**

```bash
rm source/features/faqs/index.tsx
```

- [ ] **Step 5: Type-check**

Run: `mise run tsc`
Expected: PASS. A missed banner importer fails here.

- [ ] **Step 6: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 7: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS — the three faqs test files must still pass.

- [ ] **Step 8: Commit**

```bash
jj commit -m "Move the FAQ screen into its route"
```

---

### Task 9: home

There is no wrapper to collapse: `app/(home)/index.tsx` is already the real home
screen. Only `notice.tsx` inlines.

**Files:**

- Move: `source/views/home` → `source/features/home`
- Inline: `notice.tsx` (`UnofficialAppNotice`) → `app/(home)/index.tsx`, which
  is its only consumer, then delete the file
- Stays: `button.tsx` (the route imports `HomeScreenButton`, `CELL_MARGIN`,
  `FILL_WIDTH`, `SCREEN_MARGIN`; `notice.tsx` used `FILL_WIDTH` and the inlined
  copy keeps that import), `colors.ts`
- Also move: `source/views/views.ts` → `source/features/views.ts`, and repoint
  `app/(home)/index.tsx` (`AllViews`, `ViewType`) and
  `source/features/home/button.tsx` (`ViewType` from `'../views'`)

`views.ts` is the `AllViews` home-tile registry — neither view nor screen, and
it cannot live under `app/`.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/views.ts` exporting `AllViews` and the `ViewType`
  type; `source/features/home/button.tsx` exporting `HomeScreenButton`,
  `CELL_MARGIN`, `FILL_WIDTH`, `SCREEN_MARGIN`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move both**

```bash
mv source/views/home source/features/home
mv source/views/views.ts source/features/views.ts
```

- [ ] **Step 3: Inline the notice, repoint `views.ts` consumers**

Move `UnofficialAppNotice` into `app/(home)/index.tsx`, `rm
source/features/home/notice.tsx`, and fix the two `views` imports.

- [ ] **Step 4: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 5: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
jj commit -m "Move the home screen's notice into its route"
```

---

### Task 10: reddit

**Files:**

- Move: `source/views/reddit` → `source/features/reddit`
- Inline: `StOlafFeedScreen` → `app/(home)/Communities/index.tsx`;
  `CarletonFeedScreen` → `app/(home)/Communities/carleton.tsx`;
  `post-detail.tsx` (`PostDetailView`) → `app/(home)/RedditPostDetail.tsx`
- Delete: `source/features/reddit/index.tsx` — after the two feed screens leave
  it holds only `export {PostDetailView} from './post-detail'`, and
  `post-detail.tsx` is itself being inlined
- Stays: `query.ts`, `store.ts` (`useRedditPreferences`, used by
  `app/(home)/Communities/_layout.tsx` and by both inlined feed screens),
  `post-list.tsx`, `comment-row.tsx`, `post-row*.tsx`, `reddit-api.ts`,
  `segmented-text.tsx`, `types.ts`, `useRedditLinkHandler.ts`,
  `utils/format-count.ts`, and `__tests__/` (four files)

The two feed screens are near-identical but differ in subreddit and in the
`communityName` param they push, so each inlines separately rather than being
shared.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/reddit/{store.ts,query.ts,post-list.tsx}`. Three
  route files import `useRedditPreferences`; two import `PostList` and
  `redditPostsOptions`; `RedditPostDetail.tsx` imports
  `redditPostByUrlOptions` and `redditCommentsOptions`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/reddit source/features/reddit
```

- [ ] **Step 3: Inline the two feed screens**

Each becomes its route's page function, keeping its `router.push` to
`/RedditPostDetail` with the right `communityName`.

- [ ] **Step 4: Inline `PostDetailView`, delete the hybrid file**

```bash
rm source/features/reddit/index.tsx source/features/reddit/post-detail.tsx
```

(after their bodies have moved into the routes)

- [ ] **Step 5: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 6: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS — the four reddit test files must still pass.

- [ ] **Step 7: Commit**

```bash
jj commit -m "Move the Reddit screens into their routes"
```

---

### Task 11: streaming

**Files:**

- Move: `source/views/streaming` → `source/features/streaming`
- Inline:

| screen | route |
| --- | --- |
| `streams/list.tsx` (`StreamListView`) | `app/(home)/Streaming Media/index.tsx` |
| `webcams/list.tsx` (`WebcamsView`) | `app/(home)/Streaming Media/webcams.tsx` |
| `radio/station-ksto.tsx` (`KstoStationView`) | `app/(home)/Streaming Media/ksto.tsx` |
| `radio/station-krlx.tsx` (`KrlxStationView`) | `app/(home)/Streaming Media/krlx.tsx` |
| `radio/schedule.tsx` (`KSTOScheduleView`) | `app/(home)/KSTOSchedule.tsx` |
| `radio/schedule.tsx` (`KRLXScheduleView`) | `app/(home)/KRLXSchedule.tsx` |

- Create: `source/features/streaming/radio/constants.ts` holding
  `KSTO_POWERED_BY` and `KRLX_POWERED_BY`, moved verbatim
- Delete: `source/features/streaming/index.tsx` (pure barrel);
  `source/features/streaming/radio/schedule.tsx` once both screens and both
  constants have left; and update `radio/index.ts`, which re-exports the two
  schedule views that no longer exist
- Repoint: `app/(home)/EventDetail.tsx` imports `{KSTO_POWERED_BY,
  KRLX_POWERED_BY}` from `'../../source/features/streaming/radio/constants'`
- Stays: `movie.tsx`, `radio/{buttons,controller,player,theme,types}.*`,
  `streams/{query,row,types}.*`, `webcams/{query,thumbnail,types}.*`, and the
  `streams/index.ts` / `webcams/index.ts` barrels if anything still uses them

**Interfaces:**

- Consumes: Task 5 created `source/features/calendar/constants.ts`;
  `EventDetail.tsx` will import from both constants files.
- Produces: `source/features/streaming/radio/constants.ts` exporting
  `KSTO_POWERED_BY` and `KRLX_POWERED_BY`, both `{title: string; href: string}`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/streaming source/features/streaming
```

- [ ] **Step 3: Create the radio constants file**

```ts
export const KSTO_POWERED_BY = {
	title: 'Powered by the KSTO team',
	href: 'https://pages.stolaf.edu/ksto/',
}

export const KRLX_POWERED_BY = {
	title: 'Powered by the KRLX team',
	href: 'https://www.krlx.org/schedule/',
}
```

- [ ] **Step 4: Inline the six screens**

Each schedule screen imports its own `*_POWERED_BY` from
`../../source/features/streaming/radio/constants`.

- [ ] **Step 5: Delete the barrel and the emptied schedule file, fix `radio/index.ts`**

```bash
rm source/features/streaming/index.tsx source/features/streaming/radio/schedule.tsx
```

Then remove the schedule re-exports from `source/features/streaming/radio/index.ts`.

- [ ] **Step 6: Repoint EventDetail, then type-check**

Run: `mise run tsc`
Expected: PASS.

- [ ] **Step 7: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 8: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
jj commit -m "Move the streaming screens into their routes"
```

---

### Task 12: menus

**Files:**

- Move: `source/views/menus` → `source/features/menus`
- Inline:

| screen | route |
| --- | --- |
| `index.tsx` (`StavHallMenuView`) | `app/(home)/Menus/index.tsx` |
| `index.tsx` (`TheCageMenuView`) | `app/(home)/Menus/the-cage.tsx` |
| `index.tsx` (`ThePauseMenuView`) | `app/(home)/Menus/the-pause.tsx` |
| `carleton-menus.tsx` (`CarletonCafeIndex`) | `app/(home)/Menus/carleton.tsx` |
| `carleton-menus.tsx` (`CarletonBurtonMenuScreen`) | `app/(home)/CarletonBurtonMenu.tsx` |
| `carleton-menus.tsx` (`CarletonLDCMenuScreen`) | `app/(home)/CarletonLDCMenu.tsx` |
| `carleton-menus.tsx` (`CarletonWeitzMenuScreen`) | `app/(home)/CarletonWeitzMenu.tsx` |
| `carleton-menus.tsx` (`CarletonSaylesMenuScreen`) | `app/(home)/CarletonSaylesMenu.tsx` |
| `dev-bonapp-picker.tsx` (`BonAppPickerView`) | `app/(settings)/BonAppPicker.tsx` |

- Delete: `source/features/menus/index.tsx` (three screens plus a re-export
  block, nothing else); `carleton-menus.tsx` and `dev-bonapp-picker.tsx` once
  emptied — check `carleton-menus.tsx` for shared helpers before deleting and
  keep any that more than one of its five screens used
- Stays: `menu-bonapp.tsx`, `menu-github.tsx`, `query.ts` (used by
  `app/(home)/MenuItemDetail.tsx`, `menu-bonapp.tsx` and `menu-github.tsx`),
  `types.ts`, `lib/*` and its tests

`app/(settings)/BonAppPicker.tsx` is a settings-group route backed by a menus
screen, which is why it is handled here rather than in Task 1. Afterwards it
imports `BonAppHostedMenu` from
`'../../source/features/menus/menu-bonapp'` — safe, because no route renders
`BonAppHostedMenu` itself.

The three `index.tsx` screens carry long `loadingMessage` arrays; move them
verbatim.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/menus/{menu-bonapp.tsx,menu-github.tsx,query.ts,types.ts}`.
  Eight home routes plus `app/(settings)/BonAppPicker.tsx` import from these.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/menus source/features/menus
```

- [ ] **Step 3: Inline the three `index.tsx` screens**

- [ ] **Step 4: Inline the five Carleton screens**

- [ ] **Step 5: Inline the BonApp picker into `app/(settings)/BonAppPicker.tsx`**

- [ ] **Step 6: Delete the emptied files**

```bash
rm source/features/menus/index.tsx source/features/menus/dev-bonapp-picker.tsx
```

Delete `carleton-menus.tsx` too if nothing but the five screens remained.

- [ ] **Step 7: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 8: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS — the two menus lib test files must still pass.

- [ ] **Step 9: Commit**

```bash
jj commit -m "Move the menus screens into their routes"
```

---

### Task 13: dictionary

**Files:**

- Move: `source/views/dictionary` → `source/features/dictionary`
- Inline: `list.tsx` (`DictionaryView`, aliased from local `View`) →
  `app/(home)/Dictionary/index.tsx`; `detail.tsx` (`DictionaryDetailView`) →
  `app/(home)/Dictionary/[word]/index.tsx`; `report/editor.tsx`
  (`DictionaryEditorView`) → `app/(home)/Dictionary/[word]/edit.tsx`
- Delete: `index.ts` (pure barrel); `report/index.ts` if it only re-exported
  the editor
- Stays: `query.ts` (`dictionaryOptions` used by the list screen,
  `wordByTermOptions` by both `[word]` routes), `types.ts`,
  `report/submit.ts` and `report/__tests__/stringify-entry.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/dictionary/{query.ts,types.ts,report/submit.ts}`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder, inline the three screens, delete the barrels**

```bash
mv source/views/dictionary source/features/dictionary
rm source/features/dictionary/index.ts
```

- [ ] **Step 3: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 4: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS — `stringify-entry.test.ts` must still pass.

- [ ] **Step 5: Commit**

```bash
jj commit -m "Move the dictionary screens into their routes"
```

---

### Task 14: stoprint

**Files:**

- Move: `source/views/stoprint` → `source/features/stoprint`
- Inline: `print-jobs.tsx` (`PrintJobsView`) →
  `app/(home)/PrintJobs/index.tsx`; `printers.tsx` (`PrinterListView`) →
  `app/(home)/PrintJobs/[jobId]/printers.tsx`; `print-release.tsx`
  (`PrintJobReleaseView`) → `app/(home)/PrintJobs/[jobId]/release.tsx`
- Delete: `index.ts` (pure barrel)
- Stays: `query.ts` (`jobByIdOptions` used by both `[jobId]` routes,
  `printerByNameOptions` by the release route, `printJobsOptions` and
  `heldJobsOptions` by the inlined screens), `lib.ts`,
  `components/{error,notice,index}.*`

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/stoprint/{query.ts,lib.ts,components/*}`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder, inline the three screens, delete the barrel**

```bash
mv source/views/stoprint source/features/stoprint
rm source/features/stoprint/index.ts
```

- [ ] **Step 3: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 4: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
jj commit -m "Move the stoPrint screens into their routes"
```

---

### Task 15: transportation

**Files:**

- Move: `source/views/transportation` → `source/features/transportation`
- Inline:

| screen | route |
| --- | --- |
| `index.tsx` (`ExpressLineBusView`) | `app/(home)/Transportation/index.tsx` |
| `index.tsx` (`RedLineBusView`) | `app/(home)/Transportation/red-line.tsx` |
| `index.tsx` (`BlueLineBusView`) | `app/(home)/Transportation/blue-line.tsx` |
| `index.tsx` (`OlesGoView`) | `app/(home)/Transportation/oles-go.tsx` |
| `other-modes/list.tsx` (`OtherModesView`, aliased from local `View`) | `app/(home)/Transportation/other-modes.tsx` |
| `bus/detail.tsx` (`BusRouteDetail`) | `app/(home)/BusRouteDetail.tsx` |

- Delete: `source/features/transportation/index.tsx` — its four screens are
  one-liners wrapping `<BusView line="…" />` and its only other line
  re-exports `OtherModesView`; `other-modes/index.ts` (pure barrel)
- Stays: `bus/wrapper.tsx`, `bus/line.tsx` (the `BusRouteDetail` route imports
  `deriveFromProps` from it, and `wrapper.tsx` imports `BusLine`),
  `bus/query.ts`, `bus/types.ts`, `bus/constants.ts`,
  `bus/components/*` (including `day-picker.tsx`, which the route imports
  `createMomentForDay` from), `bus/lib/*` and its seven test files,
  `other-modes/{query.ts,row.tsx}`, `types.ts`

The four bus-line routes end up as three-line files, e.g.:

```tsx
export default function RedLinePage(): React.ReactNode {
	return <BusView line="Red Line" />
}
```

with `BusView` imported from `'../../../source/features/transportation/bus'`.

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/transportation/bus/**` and
  `other-modes/{query.ts,row.tsx}`. Five `Transportation/*` routes import
  `BusView`; `BusRouteDetail.tsx` imports `deriveFromProps`,
  `createMomentForDay`, `busLineOptions` and the `DayOfWeek` type.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/transportation source/features/transportation
```

- [ ] **Step 3: Inline the four bus-line screens and delete `index.tsx`**

```bash
rm source/features/transportation/index.tsx
```

- [ ] **Step 4: Inline `OtherModesView` and `BusRouteDetail`**

```bash
rm source/features/transportation/other-modes/index.ts
```

- [ ] **Step 5: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 6: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS — the seven `bus/lib` test files must still pass.

- [ ] **Step 7: Commit**

```bash
jj commit -m "Move the transportation screens into their routes"
```

---

### Task 16: sis

**Files:**

- Move: `source/views/sis` → `source/features/sis`
- Inline:

| screen | route |
| --- | --- |
| `balances-acknowledgement.tsx` (`BalancesOrAcknowledgementView`) | `app/(home)/SIS/index.tsx` |
| `student-work/index.tsx` (`StudentWorkView`) | `app/(home)/SIS/student-work.tsx` |
| `student-work/detail.tsx` (`JobDetailView`) | `app/(home)/JobDetail.tsx` |
| `course-search/search.tsx` (`CourseSearchView`) | `app/(home)/CourseSearch.tsx` |
| `course-search/results.tsx` (`CourseSearchResultsView`) | `app/(home)/CourseSearchResults.tsx` |
| `course-search/detail/index.tsx` (`CourseDetailView`) | `app/(home)/CourseDetail.tsx` |

- `student-work/lib.ts` exports `shareJob`, which only `app/(home)/JobDetail.tsx`
  imports. It is support, not a screen — leave it in
  `source/features/sis/student-work/lib.ts` and have the route import it from
  there. Do not inline it.
- `course-search/search.tsx` also exports a `NavigationOptions` type that its
  route imports; move the type into the route with the screen.
- Stays: `balances.tsx` (renders `FaqBannerGroup`; see Task 8),
  `components/recents-list.tsx`, `course-search/query.ts`,
  `course-search/lib/*`, `course-search/row.tsx`, `student-work/query.ts`,
  `student-work/job-row.tsx`, `student-work/types.ts`
- Repoint, because two files outside the feature import into it:
  - `source/lib/storage.ts`: `FilterComboType` from
    `'../features/sis/course-search/lib/format-filter-combo'`
  - `source/redux/parts/courses.ts`: from
    `'../../features/sis/course-search/lib/format-filter-combo'`

**Interfaces:**

- Consumes: `source/features/faqs/banner.tsx` from Task 8, imported by
  `balances.tsx`.
- Produces: `source/features/sis/**`, including
  `course-search/lib/format-filter-combo.ts` for `storage.ts` and
  `redux/parts/courses.ts`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/sis source/features/sis
```

- [ ] **Step 3: Repoint the two outside importers, then type-check**

Run: `mise run tsc`
Expected: PASS.

- [ ] **Step 4: Inline the six screens**

- [ ] **Step 5: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 6: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
jj commit -m "Move the SIS screens into their routes"
```

---

### Task 17: building-hours

Largest feature, 43 files, and the last one — after it, `source/views/` is
empty.

**Files:**

- Move: `source/views/building-hours` → `source/features/building-hours`
- Inline:

| screen | route |
| --- | --- |
| `list.tsx` (`BuildingHoursView`) | `app/(home)/BuildingHours/index.tsx` |
| `detail/index.tsx` (`BuildingHoursDetailView`) | `app/(home)/BuildingHours/[name].tsx` |
| `report/overview.tsx` (`BuildingHoursProblemReportView`) | `app/(home)/BuildingHoursProblemReport.tsx` |
| `report/editor.tsx` (`BuildingHoursScheduleEditorView`) | `app/(home)/BuildingHoursScheduleEditor.tsx` |

- `list.tsx` is a hybrid: its line 13 is
  `export {BuildingHoursDetailView} from './detail'`. That re-export must not
  travel into the route — the detail screen inlines into its own route, so the
  line simply disappears.
- Delete: `index.ts` (pure barrel); `report/index.ts` if it only re-exported;
  `detail/index.tsx` and `report/{overview,editor}.tsx` once emptied
- Stays: `detail/{building,header,link-table,schedule-row,schedule-table}.tsx`,
  `row.tsx`, `query.ts` (`useGroupedBuildings` for the inlined list screen,
  `buildingByNameOptions` for two routes), `types.ts`, `lib/**` and its ten
  test files, `report/building-reducer.ts` and its test, `report/submit.ts`
- Repoint: `source/redux/parts/building-hours-report.ts` imports
  `BuildingType` from `'../../features/building-hours/types'` and the reducer
  from `'../../features/building-hours/report/building-reducer'`

**Interfaces:**

- Consumes: nothing.
- Produces: `source/features/building-hours/**`, including
  `report/building-reducer.ts` and `types.ts` for
  `source/redux/parts/building-hours-report.ts`.

- [ ] **Step 1: Record the `app/` file list**

```bash
find app -type f | sort > /tmp/app-before.txt
```

- [ ] **Step 2: Move the folder**

```bash
mv source/views/building-hours source/features/building-hours
```

- [ ] **Step 3: Repoint the Redux importer, then type-check**

Run: `mise run tsc`
Expected: PASS.

- [ ] **Step 4: Inline the four screens, dropping `list.tsx`'s re-export line**

- [ ] **Step 5: Delete the barrels**

```bash
rm source/features/building-hours/index.ts
```

- [ ] **Step 6: Confirm `source/views/` is gone**

```bash
ls source/views 2>&1
```

Expected: `No such file or directory`. If anything remains, it was missed by an
earlier task — move it to `source/features/` in this commit and say so in the
message.

- [ ] **Step 7: Verify the route set is unchanged**

```bash
find app -type f | sort > /tmp/app-after.txt
diff /tmp/app-before.txt /tmp/app-after.txt
```

Expected: no output.

- [ ] **Step 8: Full gate**

Run: `mise run agent:pre-commit`
Expected: PASS — the eleven building-hours test files must still pass.

- [ ] **Step 9: Grep for stragglers**

```bash
grep -rn "source/views\|views/" app/ source/ modules/ --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: no hits referring to the old path.

- [ ] **Step 10: Commit**

```bash
jj commit -m "Move the building hours screens into their routes"
```

---

### Task 18: run the UITests, then open the MR

The UITest shards drive real navigation and are the functional check for all
seventeen moves. They cannot run per-commit at 15 minutes apiece, so they run
once here.

- [ ] **Step 1: Build the UITest bundle**

```bash
SKIP_BUNDLING=true CODE_SIGNING_DISABLED=true xcodebuild build-for-testing \
  -workspace ios/AllAboutOlaf.xcworkspace -scheme AllAboutOlaf \
  -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build \
  -only-testing:AllAboutOlafUITests \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
```

- [ ] **Step 2: Inject the JS bundle**

`build-for-testing` with `SKIP_BUNDLING` produces an app with no
`main.jsbundle`; CI restores one from cache afterwards, and a local run must do
the same or every test fails at launch.

```bash
mise run bundle:ios
APP=ios/build/Build/Products/Debug-iphonesimulator/AllAboutOlaf.app
cp ios/AllAboutOlaf/main.jsbundle "$APP/"
rm -rf "$APP/assets" && cp -R ios/assets "$APP/assets"
```

- [ ] **Step 3: Run the suite**

```bash
xcodebuild test-without-building \
  -xctestrun $(find ios/build/Build/Products -name '*.xctestrun' -print -quit) \
  -destination "platform=iOS Simulator,name=iPhone 17 Pro Max"
```

Expected: 28 tests, 0 failures. Omit `-resultBundlePath` — it adds a
`simctl diagnose --timeout=600` step that can take ten minutes after the tests
have already passed.

- [ ] **Step 4: Open the MR**

Base the MR on `hawken/working` so its diff shows only the move, and retarget
to `master` once PR #7709 merges. Leave the description to Wren.

```bash
jj bookmark set hawken/views-to-app -r @-
jj git push --bookmark hawken/views-to-app
```

## Notes for whoever executes this

- Screens reached through a barrel do not look like screens. `contacts/list.tsx`
  has no importer in `app/` at all — the barrel does. Trust the per-task tables,
  which were built by resolving barrel chains, not by grepping for route
  imports.
- Judging a file by whether some non-route file mentions its exports gives
  false positives. `building-hours/list.tsx`, `faqs/index.tsx`,
  `menus/index.tsx`, `reddit/index.tsx` and `transportation/index.tsx` are
  hybrids that re-export siblings; a re-export is not a dependency.
- Four features alias a screen to `View` and back again
  (`export {MoreView as View}` in the file, `export {View as MoreView}` in the
  barrel). Both aliases die with the barrel.
- If a task's `diff /tmp/app-before.txt /tmp/app-after.txt` prints anything,
  stop. Either a route was created (every `.ts`/`.tsx` under `app/` becomes a
  route in expo-router 57, including a stray helper or test) or one was lost.
