# expo-router checkpoint 2 scaffold: real home screen, all groups hidden

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace checkpoint 1's placeholder `app/index.tsx` with the real
home screen (ported from `source/views/home/index.tsx`), with every
home-grid menu item hidden until its `Stack.Group`'s migration PR lands.
This is additional scope on checkpoint 1's still-open branch/PR, not a new
stacked PR — it's a strict improvement over the placeholder either way.

**Architecture:** Move the home screen into `app/(home)/index.tsx` (a route
group — invisible in the URL, so this is still the app's `/` route) with
its own `app/(home)/_layout.tsx`, matching the migration's overall
architecture (`(home)`, later `(settings)`, `(component-library)` as
sibling groups under the root stack). Reuse the existing `AllViews()`
`disabled` filter — already wired into `HomePage`'s render logic — to hide
every one of the 15 `Stack.Group`-backed menu tiles. Two pieces of the
current `HomePage` are deliberately NOT ported yet: the FAQ banner and the
settings header button. Both call `.navigate()` by string key against
routes (`'Faq'`, `'Settings'`) that don't exist as expo-router routes until
later checkpoints/PRs — rendering them now would ship dead interactive
elements, which violates this migration's "no PR ships a broken button"
rule just as much as an un-hidden grid tile would.

**Tech Stack:** expo-router (already a dependency, checkpoint 1), the
existing `@expo/ui/swift-ui` components `HomePage` already uses (unchanged).

## Global Constraints

- This branch already has checkpoint 1's expo-router scaffold merged in
  (root `app/_layout.tsx`, `expo-router/entry` as JS entry, `LegacyRootParamList`
  typing fix). This plan builds directly on top of that — don't re-verify
  checkpoint 1's own work, just build on it.
- iOS only.
- `mise run agent:pre-commit` (prettier, eslint, tsc, jest) runs on every
  commit, project-wide, with no scoping to staged files — a regression
  anywhere blocks every commit, not just ones touching the changed files.
  Never bypass this hook for any reason; if it fails, that's real
  information to act on.
- No `any`. Match existing code style (tabs, single quotes, no semicolons —
  this repo's Prettier config).

---

### Task 1: Move the home screen into `app/(home)/`, hiding every group's tile

**Files:**
- Create: `app/(home)/_layout.tsx`
- Create: `app/(home)/index.tsx`
- Delete: `app/index.tsx` (checkpoint 1's placeholder — superseded)
- Modify: `source/views/views.ts`

**Interfaces:**
- Consumes: `AllViews()`, `ViewType` from `source/views/views.ts`; `HomeScreenButton`, `CELL_MARGIN`, `FILL_WIDTH`, `SCREEN_MARGIN` from `source/views/home/button.tsx`; `UnofficialAppNotice` from `source/views/home/notice.tsx`; `openUrl` from `@frogpond/open-url`; `useIsDevMode` from `source/lib/use-is-dev-mode`.
- Produces: the app's real `/` route. Nothing else consumes this yet — later group PRs each flip one `AllViews()` entry's `disabled` field, which this task sets up.

- [ ] **Step 1: Hide every group's home-grid entry**

In `source/views/views.ts`, add `disabled: true` to all 15 `type: 'view'`
entries (every entry except the `type: 'url'` Campus Map entry, which isn't
a route and stays untouched). The file currently has no `disabled` key on
any entry; add it as the last property in each `type: 'view'` object
literal, e.g.:

```typescript
		{
			type: 'view',
			view: menus,
			title: 'Menus',
			icon: 'fork.knife',
			gradient: c.greenGradient,
			disabled: true,
		},
```

Apply this identically to the entries for: `menus`, `sis`, `hours`,
`calendar`, `directory`, `streaming`, `news`, `importantContacts`,
`transportation`, `dictionary`, `studentOrgs`, `more`, `printJobs`,
`courseSearch`, `reddit`. That's all 15 `type: 'view'` entries in the file
(reddit already has `devOnly: true` — add `disabled: true` alongside it,
both flags apply independently: `HomePage` filters on
`!view.disabled && (isDev || !view.devOnly)`).

- [ ] **Step 2: Create the `(home)` layout**

Create `app/(home)/_layout.tsx`:

```typescript
import * as React from 'react'
import {Stack} from 'expo-router'

export default function HomeLayout(): React.ReactNode {
	return <Stack />
}
```

- [ ] **Step 3: Port the home screen to `app/(home)/index.tsx`**

Create `app/(home)/index.tsx`, adapted from `source/views/home/index.tsx`:
same component, same rendering, with these changes from the original:
- `useNavigation<NavigationProp<LegacyRootParamList>>()` (from
  `@react-navigation/native`) replaced with expo-router's `useRouter()`,
  and `navigation.navigate(view.view)` replaced with
  `router.push(...)` — but since every `type: 'view'` entry is currently
  `disabled: true` (Step 1), no `type: 'view'` button can actually be
  pressed right now; the `onPress` branch for `view.type === 'view'` is
  therefore currently unreachable in practice. Write it correctly anyway
  (don't stub it out) so the first group PR (News) only has to flip a
  `disabled` flag, not also fix this callback. Since expo-router route
  paths don't exist yet for any group, and won't until each group's PR
  adds its `app/(home)/<group>/` route, use a plain string path built
  from the view key for now: `router.push(`/${view.view}` as never)`. Yes,
  `as never` — expo-router's typed `Href` requires the path to statically
  match a real route, and no `(home)/<group>` routes exist yet in this
  task; every group PR after this one will replace this line's need for
  `as never` by then having real matching routes, at which point revisit
  whether the cast can go away (likely once every group has a route,
  since `Href` is a union of all known routes at that point — don't
  "fix" this now, it's correctly unreachable dead code until the first
  group PR).
- The `FaqBannerGroup`/`RNHostView` block (banner import, render, and the
  `styles.banner` style) is removed entirely — not commented out, not
  behind a flag, just not present. It comes back when the Faq group PR
  (last in the stack) adds a working `'Faq'` route.
- `NavigationOptions`'s `headerRight: (props) => <OpenSettingsButton
  {...props} />` is dropped from the options object passed to
  `Stack.Screen` (see below) — `OpenSettingsButton` calls
  `navigation.navigate('Settings')` by string key, and Settings isn't a
  migrated stack in this checkpoint. Every other `NavigationOptions` key
  (`title`, `contentStyle`, `headerShadowVisible`, `headerLargeTitleEnabled`,
  `headerTransparent`) carries over unchanged — these are the same
  `NativeStackNavigationOptions` shape expo-router's `Stack.Screen` accepts.
- `OpenSettingsButton` and `NavigationProp`/`useNavigation`/
  `NativeStackNavigationOptions`/`LegacyRootParamList` imports are dropped
  accordingly.
- Screen options are set via a `<Stack.Screen options={{...}} />` element
  rendered as a sibling inside the component (the documented expo-router
  pattern for per-screen options set from within the screen file itself),
  rather than the old file's separate `NavigationOptions` export (that
  export pattern was `source/navigation/routes.tsx`'s wiring mechanism,
  which doesn't exist for expo-router routes).

Full file:

```typescript
import * as React from 'react'
import {PlatformColor, StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {Grid, Host, ScrollView, Spacer, VStack} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, frame, padding} from '@expo/ui/swift-ui/modifiers'

import {AllViews} from '../../source/views/views'
import type {ViewType} from '../../source/views/views'
import {
	CELL_MARGIN,
	FILL_WIDTH,
	HomeScreenButton,
	SCREEN_MARGIN,
} from '../../source/views/home/button'
import {openUrl} from '@frogpond/open-url'
import {UnofficialAppNotice} from '../../source/views/home/notice'
import {useIsDevMode} from '../../source/lib/use-is-dev-mode'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

/// Health lays its cards out as a grid, not as two columns: both cards in a row
/// share a height, so a two-line title on one side lifts the card beside it too.
/// Independent columns can't express that -- each card sizes to its own content
/// and the two sides drift out of step as the taller ones accumulate -- so the
/// views are grouped into rows and handed to a real Grid.
function inPairs(views: ViewType[]): ViewType[][] {
	let rows: ViewType[][] = []
	for (let i = 0; i < views.length; i += 2) {
		rows.push(views.slice(i, i + 2))
	}
	return rows
}

export default function HomePage(): React.ReactNode {
	let router = useRouter()
	let isDev = useIsDevMode()
	let allViews = AllViews().filter(
		(view) => !view.disabled && (isDev || !view.devOnly),
	)
	let rows = inPairs(allViews)

	return (
		<>
			<Stack.Screen
				options={{
					title: 'All About Olaf',
					contentStyle: {backgroundColor: PlatformColor('systemBackground')},
					headerShadowVisible: false,
					headerLargeTitleEnabled: true,
					headerTransparent: true,
				}}
			/>
			{/* SwiftUI owns the scrolling. Wrapping this in a React Native ScrollView
			    instead puts that scroll view between the touch and the SwiftUI buttons,
			    and the tiles stop responding reliably on device. */}
			<Host
				matchContents={false}
				modifiers={[accessibilityIdentifier('screen-homescreen')]}
				style={styles.host}
			>
				<ScrollView>
					<VStack
						modifiers={[
							padding({all: SCREEN_MARGIN}),
							frame({maxWidth: FILL_WIDTH}),
						]}
						spacing={CELL_MARGIN}
					>
						<Grid horizontalSpacing={CELL_MARGIN} verticalSpacing={CELL_MARGIN}>
							{rows.map((row, i) => (
								<Grid.Row key={i}>
									{row.map((view) => (
										<HomeScreenButton
											key={view.type === 'view' ? view.view : view.title}
											onPress={() => {
												if (view.type === 'url') {
													return openUrl(view.url)
												} else if (view.type === 'view') {
													return router.push(`/${view.view}` as never)
												} else {
													throw new Error(`unexpected view type ${view.type}`)
												}
											}}
											view={view}
										/>
									))}
									{row.length === 1 ? <Spacer /> : null}
								</Grid.Row>
							))}
						</Grid>

						<UnofficialAppNotice />
					</VStack>
				</ScrollView>
			</Host>
		</>
	)
}
```

- [ ] **Step 4: Delete the placeholder**

```bash
rm app/index.tsx
```

- [ ] **Step 5: Verify**

Run: `mise run tsc`
Expected: 0 errors (same baseline as the rest of checkpoint 1).

Run: `mise run lint`
Expected: clean (checkpoint 1's final-review fix already added `app/` to
lint's path list).

Run: `mise run test`
Expected: same pass/fail counts as before this task — nothing here should
affect existing test files.

- [ ] **Step 6: Manual boot verification**

Run: `mise run prebuild` then `mise run ios` (or the `development` variant).
Expected: the app boots to the real home screen — the grid renders with
**zero** tiles visible (every `type: 'view'` entry is `disabled: true`),
except the "Campus Map" `type: 'url'` tile, which should still render and
open the campus map URL when tapped. No FAQ banner, no settings button in
the header. No crash. This is a real behavior change from checkpoint 1's
placeholder text — confirm visually, don't assume from `tsc`/lint passing.

- [ ] **Step 7: Commit**

```bash
git add app/index.tsx app/\(home\)/_layout.tsx app/\(home\)/index.tsx source/views/views.ts
git commit -m "Move the home screen into app/(home)/, hiding every group's tile

Ports source/views/home/index.tsx into app/(home)/index.tsx, the
real / route replacing checkpoint 1's placeholder. Every
Stack.Group-backed home-grid tile is hidden via AllViews()'s
existing disabled field -- already wired into HomePage's render
filter, no new mechanism needed -- until that group's own migration
PR flips it back on. The FAQ banner and settings header button are
deliberately not ported yet: both navigate by string key to routes
('Faq', 'Settings') that don't exist until later PRs/checkpoints,
and shipping them now would mean dead interactive elements on an
otherwise-working screen."
```
