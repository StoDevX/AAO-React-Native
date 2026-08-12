# expo-router checkpoint 2, group PR 1: More

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "More" home-grid tile — the first group PR in
checkpoint 2's 15-PR stack, establishing the template every later group PR
reuses. `source/views/more/index.tsx` is a single screen with no
`.navigate()` calls at all (its only `useNavigation()` use is
`.setOptions()` for a native search bar) — the simplest possible case,
confirmed by reading the file directly (the design doc originally called
"News" the simplest group; that was wrong, corrected separately).

**Architecture:** `source/views/more/index.tsx` stays the permanent
screen implementation (checkpoint 7 deletes `source/navigation/`, not
`source/views/`) — it gets a minimal import swap (`@react-navigation/native`
→ `expo-router`, since SDK 56+ app code shouldn't import
`@react-navigation/*` directly), nothing else. A new thin wrapper route
file, `app/(home)/More/index.tsx`, re-exports that screen as the route's
default export and wires its existing `NavigationOptions` via
`<Stack.Screen options={...} />` — the same pattern the scaffold PR used
for Home, minus the reasons Home needed a full port (Home had real content
changes: dropped FAQ banner, dropped settings button, swapped navigation
calls). More has no such changes, so no full port is needed, just a wrapper.

**Naming detail, load-bearing for every later group PR too:** the route
folder is `app/(home)/More/` — capital M, matching `NavigationKey =
'More'` exactly. The scaffold PR's Home screen does
`router.push(\`/${view.view}\` as never)`, where `view.view` is the exact
string `'More'`. expo-router route paths are case-sensitive by
file/folder name; a lowercase `more/` folder would make that `router.push`
404. Every later group PR must name its route folder to match its own
`NavigationKey` string's exact casing for the same reason.

**Tech Stack:** expo-router (existing), `@react-navigation/native` import
swapped for `expo-router`'s own `useNavigation` re-export (confirmed real,
documented, and behaviorally identical for this file's usage —
`node_modules/expo-router/build/useNavigation.d.ts` — no generic type
argument needed since this file never calls `.navigate()`).

## Global Constraints

- This branch (`expo-router-home-more`) is stacked on
  `worktree-bridge-cse_01AbV8NxWFTDXpFr8PkwUHb8` (checkpoint 1 + the home
  screen scaffold, already merged in that sense — it's the trunk this PR
  branches from) via `gh-stack`. Don't re-verify that branch's own work.
- iOS only.
- `mise run agent:pre-commit` (prettier, eslint, tsc, jest) runs
  project-wide on every commit. Never bypass it for any reason.
- No `any`. Match existing code style.
- This PR must be independently mergeable and independently functional —
  once it lands, the "More" tile works; nothing else on the home screen
  changes.

---

### Task 1: Wire the More screen into expo-router

**Files:**
- Modify: `source/views/more/index.tsx`
- Create: `app/(home)/More/index.tsx`
- Modify: `source/views/views.ts`

**Interfaces:**
- Consumes: `MoreView` (exported as `View`) and `NavigationOptions` from
  `source/views/more/index.tsx`.
- Produces: the `/More` route. Nothing else consumes this yet.

- [ ] **Step 1: Swap the `@react-navigation/native` import**

In `source/views/more/index.tsx`, change:

```typescript
import {useNavigation} from '@react-navigation/native'
```

to:

```typescript
import {useNavigation} from 'expo-router'
```

Nothing else in this file changes — `navigation.setOptions({...})` (the
only thing `navigation` is used for) is unaffected; expo-router's
`useNavigation()` mirrors `@react-navigation/native`'s exactly for this
usage (same underlying React Navigation instance, confirmed via
`node_modules/expo-router/build/useNavigation.d.ts`).

- [ ] **Step 2: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`more` entry (added by the scaffold PR):

```typescript
		{
			type: 'view',
			view: more,
			title: 'More',
			icon: 'ellipsis.circle.fill',
			gradient: c.mintGradient,
			disabled: true,
		},
```

becomes:

```typescript
		{
			type: 'view',
			view: more,
			title: 'More',
			icon: 'ellipsis.circle.fill',
			gradient: c.mintGradient,
		},
```

- [ ] **Step 3: Create the route wrapper**

Create `app/(home)/More/index.tsx` (capital `More` — see the naming note
above, this must match `NavigationKey` exactly):

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {View, NavigationOptions} from '../../../source/views/more'

export default function MorePage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={NavigationOptions} />
			<View />
		</>
	)
}
```

- [ ] **Step 4: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this task.

- [ ] **Step 5: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or the development variant).
Expected: the home screen now shows two tiles — Campus Map and More.
Tapping More navigates to the More screen: a searchable list of links,
tapping a link opens it in the browser, the native search bar filters the
list. No crash, no red screen. Screenshot both the home screen (confirm
the tile appears, confirm no OTHER tiles reappeared) and the More screen
itself (confirm it renders and the search bar is present) — look at both
images yourself before claiming success, don't infer from tsc/lint passing.

- [ ] **Step 6: Commit**

```bash
git add source/views/more/index.tsx app/\(home\)/More/index.tsx source/views/views.ts
git commit -m "Restore the More home-grid tile

First group PR in checkpoint 2's stack: app/(home)/More/index.tsx is
a thin wrapper around the existing source/views/more/index.tsx
screen (which stays the permanent implementation -- checkpoint 7
deletes source/navigation/, not source/views/), with its
@react-navigation/native import swapped for expo-router's own
useNavigation re-export. The route folder is capitalized (More, not
more) to match the home screen's generic router.push(\`/\${view.view}\`)
call, which uses the exact NavigationKey string."
```
