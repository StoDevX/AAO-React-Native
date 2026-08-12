# expo-router checkpoint 4, PR 4: Simple dev tools

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Bon Appetit Picker" and "Network Logger" dev-tool
screens into `app/(settings)/`. Fourth PR of checkpoint 4's 8-PR stack.
Both are simple, param-free screens -- no `useNavigation`/`useRoute`
runtime hooks in either underlying view, only a type-only import of
`NativeStackNavigationOptions` for their static `NavigationOptions`
exports, which stay untouched.

**Architecture:** `BonAppPickerView` lives under `source/views/menus/`
(not `source/views/settings/`) and was never re-exported from the
settings barrel -- `source/navigation/routes.tsx` has always imported it
directly. The new wrapper does the same (imports directly from
`source/views/menus/dev-bonapp-picker`), rather than adding it to the
settings barrel -- that would be an unrelated restructuring, not
something this migration needs. `NetworkLoggerView` IS barrel-exported
already and its wrapper uses the barrel, matching every other Settings
screen migrated so far.

`NetworkLogger`'s existing `NavigationOptions` includes
`presentation: 'modal', gestureEnabled: false` -- per the established
rule from `BuildingHoursProblemReport`/`ReportProblem`, these only take
effect when declared in the PARENT layout's own `<Stack.Screen>` entry,
so `app/(settings)/_layout.tsx` gets a `NetworkLogger` entry with those
two flags. `BonAppPicker` has no such flags (plain push, matching
`APITest`'s already-migrated shape) so it needs no `_layout.tsx` entry at
all.

## Global Constraints

- Branch `expo-router-settings-dev-tools`, stacked on
  `expo-router-settings-api-test` (PR #7699).
- iOS only. Never bypass the pre-commit hook. No `any`.
- `source/views/settings/screens/overview/developer.tsx` (the entry point
  that will eventually link to both screens) is NOT touched by this PR --
  it's part of `SettingsRoot`, PR 8's scope.
- `source/init/network.ts` (which calls `startNetworkLogging()` at app
  boot) is unrelated to navigation and is NOT touched.
- `modules/navigation-buttons/network-logger.tsx` (`NetworkLoggerButton`,
  already confirmed compatible -- imports `useNavigation` from
  `expo-router` already) is NOT touched.
- Neither `source/views/menus/dev-bonapp-picker.tsx` nor
  `source/views/settings/screens/network-logger/index.tsx` needs any
  code change -- both already have zero react-navigation runtime hooks;
  only their wrapper route files are new.
- These routes remain unreachable after this PR -- no entry point exists
  yet (PR 8's job).

---

### Task 1: Wire the BonAppPicker and NetworkLogger screens

**Files:**
- Modify: `app/(settings)/_layout.tsx`
- Create: `app/(settings)/BonAppPicker.tsx`
- Create: `app/(settings)/NetworkLogger.tsx`

**Interfaces:**
- Consumes: `BonAppPickerView`, `DevBonAppNavigationOptions` from
  `source/views/menus/dev-bonapp-picker` (NOT the settings barrel).
  `NetworkLoggerView`, `NetworkLoggerNavigationOptions` (barrel-renamed
  from `NavigationOptions`) from `source/views/settings`.
- Produces: `/BonAppPicker` (flat push) and `/NetworkLogger` (flat,
  modal-presented) -- two more screens inside the `(settings)` group's
  own stack.

- [ ] **Step 1: Register NetworkLogger's modal presentation in the group layout**

In `app/(settings)/_layout.tsx`, replace:

```tsx
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

with:

```tsx
		<Stack>
			<Stack.Screen name="Credits" options={{title: 'Credits'}} />
			<Stack.Screen name="Privacy" options={{title: 'Privacy'}} />
			<Stack.Screen name="Legal" options={{title: 'Legal'}} />
			<Stack.Screen
				name="ReportProblem"
				options={{presentation: 'modal'}}
			/>
			<Stack.Screen
				name="NetworkLogger"
				options={{presentation: 'modal', gestureEnabled: false}}
			/>
		</Stack>
```

(`BonAppPicker` gets no entry here -- it's a plain push, matching
`APITest`'s already-migrated shape, which also has no `_layout.tsx`
entry.)

- [ ] **Step 2: Create the BonAppPicker route**

Create `app/(settings)/BonAppPicker.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	BonAppPickerView,
	DevBonAppNavigationOptions,
} from '../../source/views/menus/dev-bonapp-picker'

export default function BonAppPickerPage(): React.ReactNode {
	return (
		<>
			{/* DevBonAppNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					DevBonAppNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<BonAppPickerView />
		</>
	)
}
```

- [ ] **Step 3: Create the NetworkLogger route**

Create `app/(settings)/NetworkLogger.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	NetworkLoggerNavigationOptions,
	NetworkLoggerView,
} from '../../source/views/settings'

export default function NetworkLoggerPage(): React.ReactNode {
	return (
		<>
			{/* NetworkLoggerNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. presentation/gestureEnabled here are
			    redundant with Step 1's _layout.tsx entry (the parent's copy is what
			    actually takes effect) -- matching BuildingHoursProblemReport's own
			    established precedent of listing modal flags in both places. */}
			<Stack.Screen
				options={
					NetworkLoggerNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<NetworkLoggerView />
		</>
	)
}
```

- [ ] **Step 4: Verify**

Run: `mise run tsc` -- expect 0 errors.
Run: `mise run lint` -- expect clean.
Run: `mise run test` -- expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake -- e.g.
`source/views/faqs/__tests__/banner.test.tsx`'s dismiss-banner test is a
known, previously-documented flake in this repo -- before treating it as
real).

- [ ] **Step 5: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then boot the app in the
FOREGROUND, genuinely waited on to completion.

Since nothing links to either route yet, verify via direct deep links:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://BonAppPicker"
```

Expected: title "Dev BonApp Picker", a numeric `TextInput` toolbar, and
a "Please enter a Cafe ID." notice (no data loaded yet -- that's
correct, matches the empty-input state).

```bash
xcrun simctl openurl booted "AllAboutOlafDev://NetworkLogger"
```

Expected: the screen presents as a MODAL (slides up from the bottom,
distinct from BonAppPicker's push), with a "react-native-network-logger"
header, a custom `‹` back button on the left, and (iOS) a close button
in the header-right via `CloseScreenButton`. Confirm the modal-vs-push
distinction is visually correct between the two screens -- that's the
one behavior this task's `_layout.tsx` change is actually responsible
for.

Screenshot both screens -- look at them yourself before trusting a
report that claims what they show.

- [ ] **Step 6: Commit**

```bash
git add app/\(settings\)/_layout.tsx app/\(settings\)/BonAppPicker.tsx app/\(settings\)/NetworkLogger.tsx
git commit -m "Restore the BonAppPicker and NetworkLogger dev-tool screens

Fourth PR of checkpoint 4's 8-PR stack. Neither underlying view file
needed changes -- both already had zero react-navigation runtime
hooks, only a type-only NativeStackNavigationOptions import for their
existing static NavigationOptions exports.

BonAppPickerView/DevBonAppNavigationOptions are imported directly from
source/views/menus/dev-bonapp-picker, not the settings barrel -- it
was never barrel-exported (routes.tsx has always imported it
directly), and adding it now would be an unrelated restructuring.

NetworkLogger's presentation: 'modal', gestureEnabled: false move to
app/(settings)/_layout.tsx's own entry, the only place they actually
take effect -- matching BuildingHoursProblemReport/ReportProblem's
established precedent. BonAppPicker needs no _layout.tsx entry, same
as APITest's already-migrated shape (plain push, no modal flags).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload both screenshots and post them as a PR comment.

---

## Self-Review

**Spec coverage:** the design doc's PR-4 slot ("Simple dev tools --
BonAppPicker + NetworkLogger") is covered by both screens in one task,
matching their genuinely simple, coupled nature (both static, both
part of the same "developer tools" section, neither has enough surface
area to need its own PR).

**Placeholder scan:** none found.

**Type consistency:** `BonAppPickerView`/`DevBonAppNavigationOptions`
imported from their real module path (not the settings barrel, since
they were never exported there); `NetworkLoggerView`/
`NetworkLoggerNavigationOptions` used with their existing barrel-export
names, matching `source/views/settings/index.ts`.
