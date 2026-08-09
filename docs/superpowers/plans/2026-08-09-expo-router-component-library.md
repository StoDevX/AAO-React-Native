# expo-router checkpoint 4, PR 7: Component Library

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Component Library (a dev-only showcase of shared UI
components) into `app/(component-library)/` -- a root screen plus five
flat showcase screens. Seventh PR of checkpoint 4's 8-PR stack.

**Architecture:** `(component-library)` is already registered as its own
top-level modal group, a sibling of `(settings)`, in the root
`app/_layout.tsx` (from checkpoint 4 PR 1's scaffold). Its own
`app/(component-library)/_layout.tsx` is currently a bare `<Stack />`
and needs NO changes in this PR -- none of the six new screens are
modal-presented (that's what set `ReportProblem`/`NetworkLogger` apart
in earlier PRs); they're all plain pushes inside the already-modal
group, exactly like `APITest`/`BonAppPicker`/`BannerBuilder` needed no
`_layout.tsx` entries.

Of the six underlying view files, only `library.tsx` (the root screen)
actually uses react-navigation -- it's the only one that calls
`useNavigation()` and pushes to the other five. The five showcase
screens (`badge.tsx`, `button.tsx`, `colors.tsx`, `context-menu.tsx`,
`faq-banners.tsx`) have zero react-navigation hooks and need no source
changes at all -- only new wrapper route files.

One naming decision: `colors.tsx` exports `NavigationKey = 'ColorsInfoView'`
-- a legacy route name that never matched its own screen title
("Colors") or its barrel export name (`ColorsLibrary`). This PR does
NOT preserve that mismatch. The new route file is named
`ColorsLibrary.tsx` (matching every other screen's file-name-equals-
barrel-export-name convention used throughout this whole migration),
and `library.tsx`'s push target becomes the literal string
`'ColorsLibrary'`. `colors.tsx`'s own `NavigationKey` export stays
untouched and unused by the new code -- `source/navigation/routes.tsx`
still needs it, and it's otherwise a harmless, disconnected legacy
detail.

## Global Constraints

- Branch `expo-router-component-library`, stacked on
  `expo-router-settings-debug` (PR #7702).
- iOS only. Never bypass the pre-commit hook. No `any`.
- `app/(component-library)/_layout.tsx` is NOT touched -- it already
  exists as a bare `<Stack />` and needs no per-screen entries (none of
  the six screens are modal).
- `source/views/settings/screens/overview/component-library/badge.tsx`,
  `button.tsx`, `colors.tsx`, `context-menu.tsx`, `faq-banners.tsx`, and
  `base/library-wrapper.tsx` are NOT touched -- none has any
  react-navigation dependency to remove.
- `source/views/settings/screens/overview/developer.tsx` (the entry
  point that will eventually link to `/(component-library)`) is NOT
  touched -- it's part of `SettingsRoot`, PR 8's scope.
- This route group remains unreachable after this PR -- no entry point
  exists yet (PR 8's job).

---

### Task 1: Wire the Component Library root and five showcase screens

**Files:**
- Modify: `source/views/settings/screens/overview/component-library/library.tsx`
- Create: `app/(component-library)/index.tsx`
- Create: `app/(component-library)/BadgeLibrary.tsx`
- Create: `app/(component-library)/ButtonLibrary.tsx`
- Create: `app/(component-library)/ColorsLibrary.tsx`
- Create: `app/(component-library)/ContextMenuLibrary.tsx`
- Create: `app/(component-library)/FaqBannerLibrary.tsx`

**Interfaces:**
- Consumes: `ComponentLibrary`, `ComponentLibraryNavigationOptions`,
  `BadgeLibrary`, `ButtonLibrary`, `ColorsLibrary`, `ContextMenuLibrary`,
  `FaqBannerLibrary`, `FaqBannerNavigationOptions` (all unchanged
  barrel-export names) from `source/views/settings`.
- Produces: `/` (component-library group root), `/BadgeLibrary`,
  `/ButtonLibrary`, `/ColorsLibrary`, `/ContextMenuLibrary`,
  `/FaqBannerLibrary` -- six flat screens inside the
  `(component-library)` group's own stack.

- [ ] **Step 1: Swap `library.tsx`'s navigation to expo-router**

In `source/views/settings/screens/overview/component-library/library.tsx`,
replace:

```tsx
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import type {LegacyRootParamList} from '../../../../../navigation/types'

import {NavigationKey as ColorsLibrNavigationKey} from './colors'

export const ComponentLibrary = (): React.ReactNode => {
	const navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

with:

```tsx
import {useNavigation} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const ComponentLibrary = (): React.ReactNode => {
	const navigation = useNavigation()
```

Replace the push target for Colors specifically:

```tsx
				<PushButtonCell
					onPress={() => navigation.navigate(ColorsLibrNavigationKey)}
					title="Colors"
				/>
```

with:

```tsx
				<PushButtonCell
					onPress={() => navigation.navigate('ColorsLibrary')}
					title="Colors"
				/>
```

(the other four `navigation.navigate('BadgeLibrary')`,
`navigation.navigate('ButtonLibrary')`,
`navigation.navigate('ContextMenuLibrary')`,
`navigation.navigate('FaqBannerLibrary')` calls are unchanged --
`useNavigation()`'s expo-router implementation supports `.navigate(name)`
for simple named pushes identically to react-navigation, same pattern
already used by `NetworkLoggerButton` elsewhere in this migration. The
exported `NavigationOptions` const at the bottom of the file, including
its `Platform.OS === 'ios'`-gated `CloseScreenButton`, is unchanged.)

- [ ] **Step 2: Create the Component Library root route**

Create `app/(component-library)/index.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	ComponentLibrary,
	ComponentLibraryNavigationOptions,
} from '../../source/views/settings'

export default function ComponentLibraryRootPage(): React.ReactNode {
	return (
		<>
			{/* ComponentLibraryNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					ComponentLibraryNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<ComponentLibrary />
		</>
	)
}
```

- [ ] **Step 3: Create the Badge, Button, Colors, and Context Menu showcase routes**

None of these four export a `NavigationOptions` from their source
file -- their titles were only ever set inline at the
`routes.tsx` registration site. Set titles the same way here, inline
in each wrapper's own `<Stack.Screen>`.

Create `app/(component-library)/BadgeLibrary.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {BadgeLibrary} from '../../source/views/settings'

export default function BadgeLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Badges'}} />
			<BadgeLibrary />
		</>
	)
}
```

Create `app/(component-library)/ButtonLibrary.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {ButtonLibrary} from '../../source/views/settings'

export default function ButtonLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Buttons'}} />
			<ButtonLibrary />
		</>
	)
}
```

Create `app/(component-library)/ColorsLibrary.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {ColorsLibrary} from '../../source/views/settings'

export default function ColorsLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Colors'}} />
			<ColorsLibrary />
		</>
	)
}
```

Create `app/(component-library)/ContextMenuLibrary.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {ContextMenuLibrary} from '../../source/views/settings'

export default function ContextMenuLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Context Menus'}} />
			<ContextMenuLibrary />
		</>
	)
}
```

- [ ] **Step 4: Create the FAQ Banners showcase route**

Unlike the previous four, `faq-banners.tsx` DOES export a
`FaqBannerNavigationOptions` (title, `presentation: 'card'` -- the
default push presentation, not a modal, so no `_layout.tsx` change is
needed -- and an unconditional `CloseScreenButton` header-right). Use
the cast-and-reuse pattern for this one, matching `ReportProblem.tsx`'s
precedent.

Create `app/(component-library)/FaqBannerLibrary.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	FaqBannerLibrary,
	FaqBannerNavigationOptions,
} from '../../source/views/settings'

export default function FaqBannerLibraryPage(): React.ReactNode {
	return (
		<>
			{/* FaqBannerNavigationOptions is still typed against
			    @react-navigation/native-stack for the same reason as
			    ComponentLibraryNavigationOptions above. */}
			<Stack.Screen
				options={
					FaqBannerNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<FaqBannerLibrary />
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
known, previously-documented flake in this repo -- before treating it
as real).

- [ ] **Step 6: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then boot the app in
the FOREGROUND, genuinely waited on to completion.

Since nothing links to `/(component-library)` yet, verify via direct
deep links to each of the five showcase screens:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://BadgeLibrary"
xcrun simctl openurl booted "AllAboutOlafDev://ButtonLibrary"
xcrun simctl openurl booted "AllAboutOlafDev://ColorsLibrary"
xcrun simctl openurl booted "AllAboutOlafDev://ContextMenuLibrary"
xcrun simctl openurl booted "AllAboutOlafDev://FaqBannerLibrary"
```

Expect each to render its own title and content correctly (Badges:
outline/solid badge examples; Buttons: button cell + button examples;
Colors: the platform/fallback/dynamic/variant color tables; Context
Menus: a native SwiftUI menu; FAQ Banners: a scrollable list of example
FAQ banners with "Targets: ..." labels above each). The component
library's own root screen (with its five `PushButtonCell` rows) is
harder to deep-link to directly since it's the group's index route --
if a direct deep link to the bare group root doesn't resolve cleanly,
that's fine to note and move on; the six individual screens above are
the real verification surface, and PR 8 will wire a real, tappable
entry point into the root anyway. Use ONLY `xcrun simctl io booted
screenshot` for screenshots -- do NOT use unscoped `screencapture` or
any desktop-level GUI automation tooling on this machine (see project
memory on this).

Screenshot at least the Badges and Colors screens -- look at them
yourself before trusting a report that claims what they show.

- [ ] **Step 7: Commit**

```bash
git add source/views/settings/screens/overview/component-library/library.tsx app/\(component-library\)/index.tsx app/\(component-library\)/BadgeLibrary.tsx app/\(component-library\)/ButtonLibrary.tsx app/\(component-library\)/ColorsLibrary.tsx app/\(component-library\)/ContextMenuLibrary.tsx app/\(component-library\)/FaqBannerLibrary.tsx
git commit -m "Restore the Component Library root and showcase screens

Seventh PR of checkpoint 4's 8-PR stack. Only library.tsx (the root
screen) needed a source change -- it's the only one of the six
underlying view files that used react-navigation, swapped to
expo-router's useNavigation() with its navigate(name) calls otherwise
unchanged, same pattern as NetworkLoggerButton elsewhere in this
migration.

The Colors screen's route file is named ColorsLibrary.tsx, not the
legacy NavigationKey = 'ColorsInfoView' -- that mismatch never matched
the screen's own title or barrel export name, and isn't worth carrying
forward into the new architecture. colors.tsx's own NavigationKey
export stays untouched and unused by the new code; routes.tsx still
needs it until checkpoint 7.

app/(component-library)/_layout.tsx needed no changes -- none of the
six screens are modal-presented, matching how APITest/BonAppPicker/
BannerBuilder needed no _layout.tsx entries in the Settings group.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets`
to upload the screenshots and post them as a PR comment. Do this
BEFORE deleting the SDD workspace that holds them.

---

## Self-Review

**Spec coverage:** the design doc's PR-7 slot ("ComponentLibraryRoot +
5 showcase screens in one PR") is covered exactly -- one task, six
files created, one file modified.

**Placeholder scan:** none found.

**Type consistency:** `ComponentLibrary`/`ComponentLibraryNavigationOptions`/
`BadgeLibrary`/`ButtonLibrary`/`ColorsLibrary`/`ContextMenuLibrary`/
`FaqBannerLibrary`/`FaqBannerNavigationOptions` all used with their
existing barrel-export names, matching `source/views/settings/index.ts`
exactly. The five `navigation.navigate(...)` string literals in
`library.tsx` match the five new route files' names one-for-one.
