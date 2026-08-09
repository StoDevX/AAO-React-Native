# expo-router checkpoint 4, PR 2: Report a Problem

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Report a Problem" screen (a Sentry-feedback form,
modal-presented within the Settings modal) into `app/(settings)/`.
Second PR of checkpoint 4's 8-PR stack.

**Architecture:** `ReportProblemView`'s own `NavigationOptions` export
(`{title, presentation: 'modal', headerLeft}`) stays untouched in
`source/views/settings/screens/overview/report-problem/screen.tsx` —
`source/navigation/routes.tsx`'s still-live `SettingsStackScreens`
registration needs it. The new `app/(settings)/ReportProblem.tsx`
wrapper casts and reuses that same object (the established More/Faq/
Student Orgs pattern), and `app/(settings)/_layout.tsx` ALSO gets an
explicit `{presentation: 'modal'}` entry for `ReportProblem` — matching
`BuildingHoursProblemReport`'s precedent, where the modal/gesture flags
appear in BOTH the parent layout (authoritative, since these are
native-VC-creation-time properties that a screen's own inline
`Stack.Screen` can't set on its own) and the wrapper's cast object
(redundant but harmless, since the parent's copy is what actually
takes effect).

## Global Constraints

- Branch `expo-router-settings-report-problem`, stacked on
  `expo-router-settings-static` (PR #7697).
- iOS only. Never bypass the pre-commit hook. No `any`.
- `source/views/settings/screens/overview/report-problem/gate.ts` is
  NOT touched by this PR — it's consumed by `support.tsx`
  (`SettingsRoot`'s sub-section), which is PR 8's scope, not this one.
- This route remains unreachable after this PR — no entry point exists
  yet (PR 8's job).

---

### Task 1: Wire the Report a Problem screen

**Files:**
- Modify: `source/views/settings/screens/overview/report-problem/screen.tsx`
- Modify: `app/(settings)/_layout.tsx`
- Create: `app/(settings)/ReportProblem.tsx`

**Interfaces:**
- Consumes: `ReportProblemView`, `ReportProblemNavigationOptions`
  (unchanged export names) from `source/views/settings`.
- Produces: `/ReportProblem` — a flat screen inside the `(settings)`
  modal group, modal-presented within that modal (same "modal nested
  inside a modal-presented stack" shape `BuildingHoursProblemReport`
  already has nested inside `(home)`).

- [ ] **Step 1: Swap `useNavigation`'s import source**

In `source/views/settings/screens/overview/report-problem/screen.tsx`,
replace:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
```

with:

```typescript
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from 'expo-router'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
```

(`NativeStackNavigationOptions` stays imported from
`@react-navigation/native-stack` — `NavigationOptions` below is still
typed against it, and `source/navigation/routes.tsx` still consumes
that export as-is, same as every other migrated group's leftover
source-file typing until checkpoint 7 deletes `routes.tsx`.)

Everything else in the file — `NavigationOptions`, `ReportProblemView`'s
body, `submit`, the whole `Form`/`Section`/`TextField` tree — is
unchanged. `navigation.goBack()` still works identically:
expo-router's own `useNavigation()` supports `.goBack()` the same way
react-navigation's did.

- [ ] **Step 2: Register the modal presentation in the group layout**

In `app/(settings)/_layout.tsx`, replace:

```typescript
		<Stack>
			<Stack.Screen name="Credits" options={{title: 'Credits'}} />
			<Stack.Screen name="Privacy" options={{title: 'Privacy'}} />
			<Stack.Screen name="Legal" options={{title: 'Legal'}} />
		</Stack>
```

with:

```typescript
		<Stack>
			<Stack.Screen name="Credits" options={{title: 'Credits'}} />
			<Stack.Screen name="Privacy" options={{title: 'Privacy'}} />
			<Stack.Screen name="Legal" options={{title: 'Legal'}} />
			<Stack.Screen
				name="ReportProblem"
				options={{presentation: 'modal'}}
			/>
		</Stack>
```

(`presentation: 'modal'` must live here, in the parent layout, to
actually take effect — it's a native-view-controller-creation-time
property a screen's own inline `Stack.Screen` can't set on its own.
This is the exact same lesson `BuildingHoursProblemReport`/
`BuildingHoursScheduleEditor` already established: their modal/gesture
flags live in `app/(home)/_layout.tsx`, not just inline in their own
wrapper files.)

- [ ] **Step 3: Create the Report a Problem route**

Create `app/(settings)/ReportProblem.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	ReportProblemView,
	ReportProblemNavigationOptions,
} from '../../source/views/settings'

export default function ReportProblemPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen
				options={
					ReportProblemNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<ReportProblemView />
		</>
	)
}
```

(the cast-and-reuse of `ReportProblemNavigationOptions` here is
redundant with Step 2's `presentation: 'modal'` — the parent layout's
copy is what actually takes effect, this one supplies `title` and
`headerLeft`, matching `BuildingHoursProblemReport.tsx`'s own
established precedent of listing the modal flags in both places rather
than only the authoritative one.)

- [ ] **Step 4: Verify**

Run: `mise run tsc` — expect 0 errors.
Run: `mise run lint` — expect clean.
Run: `mise run test` — expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake before treating it as
real).

- [ ] **Step 5: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then
`APP_VARIANT=development mise run ios`, in the FOREGROUND, genuinely
waited on to completion.

Since nothing links to `/ReportProblem` yet, verify via a direct deep
link, same as PR 1's Credits/Privacy/Legal:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://ReportProblem"
```

Expected: the form renders (Description text field, Contact
name/email fields, a disabled "Send" button that enables once
Description has text), title "Report a Problem", a "Cancel" button in
the header-left corner that dismisses the screen when tapped. Typing
into the Description field should enable the Send button. **Do not
actually tap Send** — this calls `Sentry.captureFeedback` for real; the
brief only asks you to confirm the button's enabled/disabled state
toggles correctly, not to submit a real report. Confirm dismissal via
"Cancel" works and returns cleanly (to wherever the deep link's
underlying anchor puts you — this project has an open, tracked,
unrelated issue where a cold-start deep-linked dismissal doesn't land
on the real Home screen; note if you observe this here too, but it's
not this task's concern to fix).

Screenshot: the Report a Problem form — look at it yourself before
trusting a report that claims it shows what it claims.

- [ ] **Step 6: Commit**

```bash
git add source/views/settings/screens/overview/report-problem/screen.tsx app/\(settings\)/_layout.tsx app/\(settings\)/ReportProblem.tsx
git commit -m "Restore the Report a Problem screen

Second PR of checkpoint 4's 8-PR stack. ReportProblemView's own
NavigationOptions export stays untouched -- routes.tsx's still-live
SettingsStackScreens registration needs it until checkpoint 7 -- and
the new app/(settings)/ReportProblem.tsx wrapper casts and reuses
that same object, the established More/Faq/Student Orgs pattern.

presentation: 'modal' is set explicitly in
app/(settings)/_layout.tsx's own entry too, since that's the only
place it actually takes effect (a native-VC-creation-time property a
screen's own inline Stack.Screen can't set alone) -- matching
BuildingHoursProblemReport/BuildingHoursScheduleEditor's established
precedent of listing modal flags in both the parent layout and the
wrapper's own cast object.

Only useNavigation's import source changes in screen.tsx itself --
swapped to expo-router's own, which supports .goBack() identically.
gate.ts (support.tsx's IS_PRODUCTION check before opening this
screen) is untouched, since support.tsx itself is PR 8's scope.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload the screenshot and post it as a PR comment.

---

## Self-Review

**Spec coverage:** ReportProblem's modal-within-modal shape (design
doc's own callout) is directly addressed by Step 2/Step 3's
both-places pattern. No task references `SettingsRoot`, `gate.ts`, or
`support.tsx` — correctly deferred to PR 8.

**Placeholder scan:** None found.

**Type consistency:** `ReportProblemView`/`ReportProblemNavigationOptions`
consumed with their existing barrel-export names, matching
`source/views/settings/index.ts` exactly.
