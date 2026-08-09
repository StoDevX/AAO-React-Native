# expo-router checkpoint 4, PR 5: Banner Builder

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Banner Builder" dev-tool screen (a form for building
fake FAQ banners to preview on the home screen) into `app/(settings)/`.
Fifth PR of checkpoint 4's 8-PR stack. Its own PR (not folded into the
dev-tools PR) because of a cross-cutting effect: it writes into
`useDevBannerStore`, the same Zustand store the LIVE home screen's
`FaqBannerGroup` already reads from -- manual verification for this PR
must check the home screen's banner too, not just Banner Builder itself.

**Architecture:** A single, self-contained form screen -- no
`useNavigation`/`useRoute` runtime hooks, no route params, no
list/detail split (structurally closer to NetworkLogger than API Test).
Only a type-only `NativeStackNavigationOptions` import for its static
`NavigationOptions` export, which stays untouched. Plain push, no
modal presentation, so -- matching APITest/BonAppPicker's already-migrated
shape -- it needs no entry in `app/(settings)/_layout.tsx`.

## Global Constraints

- Branch `expo-router-settings-banner-builder`, stacked on
  `expo-router-settings-dev-tools` (PR #7700).
- iOS only. Never bypass the pre-commit hook. No `any`.
- `source/views/settings/screens/overview/developer.tsx` is NOT touched
  by this PR -- it's part of `SettingsRoot`, PR 8's scope.
- `source/views/settings/screens/banner-builder/index.tsx` needs NO code
  change -- it already has zero react-navigation runtime hooks.
- `source/views/faqs/dev-banner-store.ts` (the Zustand store) and
  `source/views/faqs/banner.tsx` (`FaqBannerGroup`, the live consumer)
  are NOT touched -- this PR only restores the screen that WRITES to the
  store; the read side is already live and already migrated (checkpoint
  2's Faq group PR).
- This route remains unreachable after this PR -- no entry point exists
  yet (PR 8's job).

---

### Task 1: Wire the Banner Builder screen

**Files:**
- Create: `app/(settings)/BannerBuilder.tsx`

**Interfaces:**
- Consumes: `BannerBuilderView`, `BannerBuilderNavigationOptions`
  (unchanged barrel export names) from `source/views/settings`.
- Produces: `/BannerBuilder` -- a flat push screen inside the
  `(settings)` group's own stack, no entry needed in
  `app/(settings)/_layout.tsx`.

- [ ] **Step 1: Create the Banner Builder route**

Create `app/(settings)/BannerBuilder.tsx`:

```tsx
import * as React from 'react'
import {Stack} from 'expo-router'

import {
	BannerBuilderNavigationOptions,
	BannerBuilderView,
} from '../../source/views/settings'

export default function BannerBuilderPage(): React.ReactNode {
	return (
		<>
			{/* BannerBuilderNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					BannerBuilderNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<BannerBuilderView />
		</>
	)
}
```

- [ ] **Step 2: Verify**

Run: `mise run tsc` -- expect 0 errors.
Run: `mise run lint` -- expect clean.
Run: `mise run test` -- expect the same pass/fail counts as before this
task (rerun once if a failure looks like a flake -- e.g.
`source/views/faqs/__tests__/banner.test.tsx`'s dismiss-banner test is a
known, previously-documented flake in this repo -- before treating it as
real).

- [ ] **Step 3: Manual boot verification**

Run: `APP_VARIANT=development mise run prebuild` then boot the app in the
FOREGROUND, genuinely waited on to completion.

Since nothing links to `/BannerBuilder` yet, verify via a direct deep
link:

```bash
xcrun simctl openurl booted "AllAboutOlafDev://BannerBuilder"
```

Expected: title "Banner Builder", a live preview at the top, and a
`TableView` with sections for content/appearance/colors/behavior/target
screens/actions. Fill in a Title and Text field, tap "Apply to App" (the
`ButtonCell` in the ACTIONS section) -- expect an `Alert` confirming the
banner was applied. Then navigate to the real home screen (dismiss back
to `(home)`, or relaunch) and confirm the fake banner now renders above
the tile grid via the live `FaqBannerGroup` -- this is the one thing
this PR must prove end-to-end, since Banner Builder writes to a store
the live home screen already reads from. Do NOT tap "Export as YAML"
during verification (it opens the native Share sheet, which needs manual
dismissal and isn't necessary to confirm this PR's behavior).

Screenshot both the Banner Builder form and the resulting live home
screen banner -- look at them yourself before trusting a report that
claims what they show.

- [ ] **Step 4: Commit**

```bash
git add app/\(settings\)/BannerBuilder.tsx
git commit -m "Restore the Banner Builder dev-tool screen

Fifth PR of checkpoint 4's 8-PR stack. No changes needed to the
underlying view -- it already had zero react-navigation runtime hooks,
only a type-only NativeStackNavigationOptions import for its existing
static NavigationOptions export.

Its own PR (not folded into PR 4's dev-tools batch) because it writes
into useDevBannerStore, the same store the live home screen's
FaqBannerGroup already reads from -- manual verification confirmed a
banner applied here renders on the real home screen, not just in
isolation.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Attach screenshots to the PR**

Once the PR is open (via `gh stack submit`), use `attach-github-assets` to
upload both screenshots and post them as a PR comment. Do this BEFORE
deleting the SDD workspace that holds them.

---

## Self-Review

**Spec coverage:** the design doc's PR-5 slot ("Banner Builder, own PR
due to cross-cutting Zustand store effect") is covered -- the plan's
manual verification step explicitly proves the cross-cutting effect,
not just the isolated screen.

**Placeholder scan:** none found.

**Type consistency:** `BannerBuilderView`/`BannerBuilderNavigationOptions`
used with their existing barrel-export names, matching
`source/views/settings/index.ts`.

## Followup (not this PR's scope)

Investigate the missing-index / default-Menu issue: dismissing a
cold-start deep-linked modal sheet lands on `app/(home)/Menus`, not the
real Home tile grid (`app/(home)/index.tsx`). Root cause not yet found
(a targeted `unstable_settings.anchor` fix on `app/(home)/_layout.tsx`
was tried and verified NOT to change the outcome, then cleanly
reverted). Doesn't block this PR or any of checkpoint 4's remaining
PRs -- every Settings route is deep-link-only until PR 8 -- but needs a
real fix before checkpoint 6 (deep linking) ships. Full detail already
tracked in memory: `expo-router-modal-dismiss-lands-on-menus.md`.
