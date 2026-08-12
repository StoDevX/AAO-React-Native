# expo-router checkpoint 2, group PR 9: News

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "News" home-grid tile: a 2-tab screen (St. Olaf,
The Mess). Ninth group PR in checkpoint 2's stack, and the simplest of
the three tab-bar groups — apply the now-proven Menus/Streaming pattern
directly. No shared detail screen, no internal navigation of any kind:
both tabs are leaf list screens whose only "navigation" is `openUrl()`
(opens a story link in the system browser, nothing in-app).

**Same shape as Menus/Streaming, smaller still.** `source/views/news/index.tsx`
uses `createNativeBottomTabNavigator` from
`@react-navigation/bottom-tabs/unstable` for its 2 tabs — convert to
expo-router's file-based `NativeTabs`, flat structure (no wrapping Stack
around the tab group). `app/(home)/_layout.tsx` gets a third
`<Stack.Screen name="News" options={{title: 'News'}}/>` entry, alongside
the existing `Menus` and `Streaming Media` entries — not
`headerShown: false` (the lesson paid for twice already in this stack).

## Global Constraints

- Branch `expo-router-home-news`, stacked on `expo-router-home-streaming`
  (PR #7679).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Don't clean up the SDD workspace/screenshots until they're uploaded via
  `attach-github-assets` and posted as a PR comment.
- Independently mergeable and independently functional.

---

### Task 1: Wire the News tab bar into expo-router

**Files:**
- Modify: `source/views/news/index.tsx`
- Modify: `source/navigation/routes.tsx`
- Modify: `source/navigation/types.tsx`
- Modify: `source/views/views.ts`
- Modify: `app/(home)/_layout.tsx`
- Create: `app/(home)/News/_layout.tsx`
- Create: `app/(home)/News/index.tsx`
- Create: `app/(home)/News/mess.tsx`

**Interfaces:**
- Consumes: `StOlafNewsView`, `MessNewsView` from `source/views/news`.
- Produces: `/News` (tab group, default tab St. Olaf), `/News/mess` (both
  within the tab bar, no per-tab header).

- [ ] **Step 1: Turn `source/views/news/index.tsx` into a plain re-export**

Replace the whole file with:

```typescript
import * as React from 'react'

import * as newsImages from '../../../images/news-sources/index'
import {NewsList} from './news-list'
import {namedNewsOptions} from './query'
import {useQuery} from '@tanstack/react-query'

export const StOlafNewsView = (): React.ReactNode => (
	<NewsList
		query={useQuery(namedNewsOptions('stolaf'))}
		thumbnail={newsImages.stolaf}
	/>
)

export const MessNewsView = (): React.ReactNode => (
	<NewsList
		query={useQuery(namedNewsOptions('mess'))}
		thumbnail={newsImages.mess}
	/>
)
```

(`createNativeBottomTabNavigator`, `Tab`, `View`, `Params`,
`NavigationParams`, `NavigationKey`, `NavigationOptions` are all deleted —
dead once `routes.tsx` no longer references them, Step 2, and once
expo-router's file-based `NativeTabs` layout owns tab routing, Steps 5-6.
`StOlafNewsView`/`MessNewsView` were previously unexported local consts —
now exported directly, since the two new `app/` route files need to
import them.)

- [ ] **Step 2: Remove the dead registration from routes.tsx**

In `source/navigation/routes.tsx`, remove the import:

```typescript
import * as news from '../views/news'
```

and remove the News `Stack.Group` block:

```typescript
			<Stack.Group>
				<Stack.Screen
					component={news.View}
					name={news.NavigationKey}
					options={news.NavigationOptions}
				/>
			</Stack.Group>
```

Leave every other group's registration untouched.

- [ ] **Step 3: Update `source/navigation/types.tsx`**

Replace:

```typescript
import * as news from '../views/news'
```

with nothing (delete the line — `news.NavigationKey` no longer exists
after Step 1).

Replace:

```typescript
	[news.NavigationKey]: undefined
```

with:

```typescript
	News: undefined
```

(same pattern already used for `Menus: undefined`/`'Streaming Media':
undefined` on the surrounding lines — a literal string replacing what
used to be a computed key derived from the now-deleted export.)

- [ ] **Step 4: Restore the group's home-grid entry**

In `source/views/views.ts`, remove the `disabled: true` line from the
`news` entry.

- [ ] **Step 5: Give the outer "News" entry its title**

In `app/(home)/_layout.tsx`, add a third entry to the existing `<Stack>`
(alongside the `Menus` and `Streaming Media` entries prior groups' plans
already added):

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
			<Stack.Screen name="News" options={{title: 'News'}} />
		</Stack>
	)
}
```

- [ ] **Step 6: Create the native tab bar layout**

Create `app/(home)/News/_layout.tsx` — this is the *entire* file, not a
wrapper around anything else, exactly like Menus'/Streaming's
`_layout.tsx`:

```typescript
import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function NewsLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="graduationcap.fill" />
				<NativeTabs.Trigger.Label>St. Olaf</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="mess">
				<NativeTabs.Trigger.Icon sf="newspaper.fill" />
				<NativeTabs.Trigger.Label>The Mess</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
```

- [ ] **Step 7: Create the 2 tab route files**

Create `app/(home)/News/index.tsx`:

```typescript
import * as React from 'react'
import {StOlafNewsView} from '../../../source/views/news'

export default function StOlafNewsPage(): React.ReactNode {
	return <StOlafNewsView />
}
```

Create `app/(home)/News/mess.tsx`:

```typescript
import * as React from 'react'
import {MessNewsView} from '../../../source/views/news'

export default function MessNewsPage(): React.ReactNode {
	return <MessNewsView />
}
```

(neither needs its own `<Stack.Screen options={...}>` — `NativeTabs`
draws the tab bar and each leaf screen renders full-bleed below it with
no per-tab header, matching the original
`Tab.Navigator screenOptions={{headerShown: false}}` behavior exactly.)

- [ ] **Step 8: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake; confirm via a clean
rerun before treating a failure as real).

- [ ] **Step 9: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or development variant), in
the FOREGROUND, genuinely waited on to completion.

Expected: home screen shows ten tiles now (Campus Map, More, Important
Contacts, Student Orgs, Directory, Campus Dictionary, stoPrint, Menus,
Streaming Media, News). Tapping "News" shows a header reading "‹ All
About Olaf | News" with a working back button, and below it a native tab
bar with 2 tabs (St. Olaf, The Mess), each with the correct SF Symbol
icon, St. Olaf selected by default. Tapping between tabs switches content
without losing the tab bar or the header. Tapping a story opens it in the
system browser (or shows the expected native "Open in Safari" flow) — no
in-app navigation to verify, no crash anywhere in this flow.

Both tabs hit live network endpoints — note in the report whether real
data was reachable in this sandboxed environment, and if not, confirm the
loading/error states at minimum render correctly and non-crashing.

Screenshot: home screen (ten tiles, no others), the News tab bar (St.
Olaf selected, showing the header with back button), and the other tab —
look at each yourself.

**Keep these screenshots until they're uploaded via `attach-github-assets`
and posted as a PR comment — don't clean up the SDD workspace first.**

- [ ] **Step 10: Commit**

```bash
git add source/views/news/index.tsx source/navigation/routes.tsx source/navigation/types.tsx source/views/views.ts app/\(home\)/_layout.tsx app/\(home\)/News/
git commit -m "Restore the News home-grid tile

Ninth group PR in checkpoint 2's stack, and the simplest of the
three tab-bar groups (after Menus and Streaming Media) -- applies
the same proven flat-structure NativeTabs pattern with no wrinkles:
no shared detail screen, no in-app navigation at all (both tabs'
only interaction is openUrl(), opening a story in the system
browser). app/(home)/_layout.tsx gets a third Stack.Screen entry
with a real title, matching the two already added by the prior
tab-bar groups.

source/navigation/routes.tsx's News registration (dead code, still
type-checked) is removed in the same commit."
```

- [ ] **Step 11: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.
