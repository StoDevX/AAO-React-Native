# expo-router checkpoint 4, PR 1: Settings scaffold + static content

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `app/(settings)/` and `app/(component-library)/`
modal route-group shells, and migrate the three static-content Settings
screens (Credits, Privacy, Legal) into `app/(settings)/`. First PR of
checkpoint 4's 8-PR stack.

**Architecture:** `(settings)` and `(component-library)` become
siblings of `(home)` in the root `app/_layout.tsx`'s `<Stack>`, each
marked `presentation: 'modal'` — matching today's `RootStack`, which
registers `HomeRoot`/`Settings`/`ComponentLibrary` as three independent
stacks. Each group gets its own `_layout.tsx` with a nested `<Stack>` of
its own; screens pushed within a group navigate inside that one
presented sheet, not as separate stacked modals. Credits/Privacy/Legal
have no existing `NavigationOptions` export (routes.tsx registers them
with no `options=` at all) — no `NativeStackNavigationOptions`-cast
dance needed, unlike most other migrated screens.

## Global Constraints

- Branch `expo-router-settings-static`, stacked on
  `expo-router-home-faq-highlight-fix` (PR #7696, tip of the
  checkpoint-2 + follow-ups stack).
- iOS only. Never bypass the pre-commit hook. No `any`.
- Both new route groups remain fully unreachable after this PR — no
  entry point exists yet (that's PR 8's job). This is expected and
  correct, matching every checkpoint-2 group PR before its home-grid
  tile was un-disabled — a real, working, but not-yet-exposed route.
- `app/(component-library)/_layout.tsx` is created with an empty
  `<Stack>` (no screen entries) — its first real entries land in PR 7.

---

### Task 1: Scaffold the two modal route groups and migrate Credits/Privacy/Legal

**Files:**
- Modify: `app/_layout.tsx`
- Create: `app/(settings)/_layout.tsx`
- Create: `app/(component-library)/_layout.tsx`
- Create: `app/(settings)/Credits.tsx`
- Create: `app/(settings)/Privacy.tsx`
- Create: `app/(settings)/Legal.tsx`

**Interfaces:**
- Consumes: `CreditsView`, `PrivacyView`, `LegalView` (unchanged export
  names) from `source/views/settings`.
- Produces: `/Credits`, `/Privacy`, `/Legal` — flat screens inside the
  `(settings)` modal group, currently unreachable (no push call exists
  yet).

- [ ] **Step 1: Register both modal groups in the root layout**

In `app/_layout.tsx`, replace:

```typescript
									<Stack>
										<Stack.Screen
											name="(home)"
											options={{headerShown: false}}
										/>
									</Stack>
```

with:

```typescript
									<Stack>
										<Stack.Screen
											name="(home)"
											options={{headerShown: false}}
										/>
										<Stack.Screen
											name="(settings)"
											options={{headerShown: false, presentation: 'modal'}}
										/>
										<Stack.Screen
											name="(component-library)"
											options={{headerShown: false, presentation: 'modal'}}
										/>
									</Stack>
```

(`headerShown: false` here matches how `(home)` is already registered
— each group's own `_layout.tsx` owns its screens' headers, the outer
registration doesn't render one of its own.)

- [ ] **Step 2: Create the Settings group layout**

Create `app/(settings)/_layout.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

export default function SettingsLayout(): React.ReactNode {
	return (
		<Stack>
			<Stack.Screen name="Credits" options={{title: 'Credits'}} />
			<Stack.Screen name="Privacy" options={{title: 'Privacy'}} />
			<Stack.Screen name="Legal" options={{title: 'Legal'}} />
		</Stack>
	)
}
```

(no `SettingsRoot`/`index` entry yet — that's PR 8. Later PRs each add
their own new screen's entry here, the same incremental-growth pattern
`app/(home)/_layout.tsx` already used throughout checkpoint 2.)

- [ ] **Step 3: Create the empty Component Library group layout**

Create `app/(component-library)/_layout.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

export default function ComponentLibraryLayout(): React.ReactNode {
	return <Stack />
}
```

(no screens yet — PR 7 adds all six at once.)

- [ ] **Step 4: Create the three static-content routes**

Create `app/(settings)/Credits.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {CreditsView} from '../../source/views/settings'

export default function CreditsPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Credits'}} />
			<CreditsView />
		</>
	)
}
```

Create `app/(settings)/Privacy.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {PrivacyView} from '../../source/views/settings'

export default function PrivacyPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Privacy'}} />
			<PrivacyView />
		</>
	)
}
```

Create `app/(settings)/Legal.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {LegalView} from '../../source/views/settings'

export default function LegalPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Legal'}} />
			<LegalView />
		</>
	)
}
```

(`CreditsView`/`PrivacyView`/`LegalView` are all pure, prop-less,
navigation-free components already — confirmed via direct read, zero
`@react-navigation/*` imports in any of the three source files. No
conversion needed in `source/views/settings/screens/{credits,privacy,legal}.tsx`
themselves, only new `app/` wrapper files.)

- [ ] **Step 5: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake — see this project's
known `source/views/faqs/__tests__/banner.test.tsx` flake — before
treating it as real).

- [ ] **Step 6: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Since nothing links to `/Credits`, `/Privacy`, or `/Legal` yet, verify
each via a direct deep link rather than a real tap-through — say so
explicitly in the report, this is expected for this PR (not a shortcut
around a reachable screen, there genuinely isn't one yet):

```bash
xcrun simctl openurl booted "AllAboutOlafDev://Credits"
xcrun simctl openurl booted "AllAboutOlafDev://Privacy"
xcrun simctl openurl booted "AllAboutOlafDev://Legal"
```

Expected for each: the screen renders its real content (Credits' logo
and contributor lists; Privacy's real `docs/privacy.json` text; Legal's
MIT license text), presented as a modal sheet (confirm via the
presentation style — modals show a swipe-down-to-dismiss handle/behavior
distinct from a pushed screen), with a header showing the correct title
and a working back/dismiss. No crash. Also confirm the home screen
(`app/(home)/index.tsx`) and its tile grid render completely
unaffected — this PR should have zero visible impact on any screen
reachable through real navigation.

Screenshot: each of the three screens — look at each yourself before
trusting a report that claims they show what they claim.

- [ ] **Step 7: Commit**

```bash
git add app/_layout.tsx app/\(settings\)/ app/\(component-library\)/
git commit -m "Scaffold the Settings + Component Library route groups

First PR of checkpoint 4's 8-PR stack. (settings) and
(component-library) join (home) as sibling modal route groups in the
root layout, matching today's RootStack (three independent stacks:
HomeRoot, Settings, ComponentLibrary) rather than nesting either
inside (home) -- Settings has ~11 screens with real internal push
navigation (SettingsRoot fans out to Credits/Privacy/Legal/
ReportProblem/5 dev-tool screens, APITest to APITestDetail, Debug to
itself), so only the group's own root screen needs the modal
presentation; everything inside pushes within that one sheet.
Marking each screen individually modal in a flat stack would instead
either stack a new sheet per push or drop pushed screens onto Home's
own back-stack.

Credits/Privacy/Legal migrate cleanly with no NavigationOptions cast
-- unlike most other groups this migration has touched, routes.tsx
registers all three with no options at all, so there's no existing
NativeStackNavigationOptions-typed object to bridge into expo-router's
own Stack.Screen options type.

Both route groups are fully unreachable after this PR -- no entry
point exists yet, same 'shipped but not yet exposed' state every
checkpoint-2 group PR was in before its home-grid tile was
un-disabled, just achieved here by 'nothing points here yet' instead
of a flag. SettingsRoot, the screen that actually exposes Settings
(gear icon + links to everything else in both stacks), is
deliberately the last PR in this checkpoint.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload each screenshot and post them as one PR comment.

---

## Self-Review

**Spec coverage:** Route-group scaffolding (Step 1-3) and static-content
migration (Step 4) both covered, matching PR 1's stated scope in
`docs/superpowers/specs/2026-08-09-expo-router-checkpoint-4-settings-design.md`.
No task references `SettingsRoot`, `ReportProblem`, or any dev-tool
screen — correctly deferred to their own later PRs.

**Placeholder scan:** None found.

**Type consistency:** No new types introduced. `CreditsView`/
`PrivacyView`/`LegalView` are consumed with their existing signatures
(no props) — matches `source/views/settings/screens/{credits,privacy,legal}.tsx`
exactly.
