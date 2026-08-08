# expo-router Checkpoint 1: Scaffold the router skeleton

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working, empty expo-router shell — root layout, Sentry
wiring, theming, native entry point — that boots on a real iOS simulator with
no crash, before any screen is migrated.

**Architecture:** Add `expo-router` as a direct dependency, switch the Babel
preset to `babel-preset-expo` (a hard prerequisite), point the JS entry point
at `expo-router/entry` instead of the hand-rolled `AppRegistry.registerComponent`
call, and port `source/app.tsx`'s provider stack (Redux, React Query, Paper,
Sentry, theming) into a new `app/_layout.tsx`. A single placeholder route
(`app/index.tsx`) proves the router mounts; no real screens move in this
checkpoint.

**Tech Stack:** expo-router 57.0.11, babel-preset-expo, Expo SDK 57, React
Navigation (now consumed only via `expo-router/react-navigation`), Sentry
React Native SDK 8.11.0.

## Global Constraints

- This is checkpoint 1 of 8 in the full React-Navigation → expo-router
  cutover (see `docs/superpowers/specs/2026-08-07-expo-router-migration-design.md`).
  Single dedicated branch; `source/navigation/` stays in the tree, unreferenced,
  until checkpoint 7 deletes it.
- iOS only — no Android/web work, ever, in this migration.
- `pnpm-workspace.yaml` pins `saveExact: true` / `savePrefix: ''`: every new
  dependency version below is an exact pin, no `^`/`~`.
- `strictPeerDependencies: false` / `autoInstallPeers: true` in
  `pnpm-workspace.yaml` — peers resolve automatically, but this repo's
  convention (seen throughout `package.json`) is to still list anything a
  direct dependency's `peerDependencies` requires explicitly, so Renovate and
  `pnpm dedupe` track it. Follow that convention for every peer added here.
- No automated test can exercise the actual native boot — this project's
  Jest setup uses `@react-native/jest-preset`, not `jest-expo`, so
  expo-router's file-based `require.context` resolution doesn't run under
  Jest. The final verification step in this checkpoint is a manual simulator
  boot, per this project's own guidance that UI/boot changes need a real
  device/simulator check, not just green tests.

---

### Task 1: Stop hardcoding the native module name

**Files:**
- Modify: `plugins/with-app-delegate-customizations.ts`
- Modify: `plugins/__tests__/with-app-delegate-customizations.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `patchAppDelegate` (unchanged signature: `(contents: string) => string`) now leaves `withModuleName: "main"` untouched instead of rewriting it to `withModuleName: "AllAboutOlaf"`.

**Why this has to happen first:** `source/root.tsx` currently calls
`AppRegistry.registerComponent('AllAboutOlaf', () => App)`, and this plugin
patches the generated `AppDelegate.swift` to expect that same custom name
(`withModuleName: "AllAboutOlaf"`) instead of Expo's template default,
`"main"`. `expo-router/entry` (added in Task 7) calls Expo's own
`registerRootComponent`, which registers under the template's default name,
`"main"` — not `"AllAboutOlaf"`. Left unpatched, this mismatch means the
native side looks for a JS module named `"AllAboutOlaf"` that no longer
exists, and the app fails to launch. This must land before Task 8's
`mise run prebuild`, or the regenerated `AppDelegate.swift` will still carry
the stale override.

- [ ] **Step 1: Write the failing test**

Replace the `'registers the module name the JS side registers'` test in
`plugins/__tests__/with-app-delegate-customizations.test.ts` with one that
asserts the module name is left alone:

```typescript
it('leaves the default module name alone, matching what expo-router registers', () => {
	expect(patchAppDelegate(STOCK)).toContain('withModuleName: "main"')
})
```

Also delete the `'throws when the module-name anchor is missing'` test — once
the plugin no longer looks for `withModuleName: "main"` as an anchor, this
throw path no longer exists.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm jest plugins/__tests__/with-app-delegate-customizations.test.ts`
Expected: FAIL — the current code still rewrites `"main"` to `"AllAboutOlaf"`,
so `patchAppDelegate(STOCK)` does not contain `withModuleName: "main"`.

- [ ] **Step 3: Remove the module-name patch**

In `plugins/with-app-delegate-customizations.ts`, delete the `MODULE_NAME`
constant (lines 3-5) and the module-name patch block (lines 86-92):

```typescript
	if (!result.includes(`withModuleName: "${MODULE_NAME}"`)) {
		require_(result, 'withModuleName: "main"')
		result = result.replace(
			'withModuleName: "main"',
			`withModuleName: "${MODULE_NAME}"`,
		)
	}

```

Update the docstring above `patchAppDelegate` from "the four things our
AppDelegate does" to "the three things our AppDelegate does".

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm jest plugins/__tests__/with-app-delegate-customizations.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add plugins/with-app-delegate-customizations.ts plugins/__tests__/with-app-delegate-customizations.test.ts
git commit -m "Stop overriding the native module name

expo-router/entry registers the root component under Expo's default
name (\"main\"), not the app's old custom AppRegistry name. Keeping
the override would point the native side at a JS module that no
longer exists once entry.js changes."
```

---

### Task 2: Add expo-router and its required peer dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `expo-router` resolvable from anywhere in the workspace (used by Task 6's `app/_layout.tsx` and Task 5's `@frogpond/app-theme` rework).

- [ ] **Step 1: Add the dependencies**

In `package.json`, `"dependencies"`, insert alphabetically (exact versions,
matching this repo's `saveExact` convention — verified against the npm
registry against expo SDK 57.0.10):

```json
    "@expo/log-box": "57.0.2",
    "@expo/metro-runtime": "57.0.8",
```
(true alphabetical order: both sort before `"@expo/react-native-action-sheet": "4.1.1",` — insert right after `"@expo/config-plugins"`'s dependency-list neighbor or wherever `@expo/*` entries begin, immediately before `"@expo/react-native-action-sheet"`. If this plan's stated position elsewhere conflicts with true alphabetical order, true alphabetical order governs — this plan had the ordering wrong.)

```json
    "expo-linking": "57.0.5",
```
(insert after `"expo-font": "57.0.1",`, before `"expo-modules-core": "57.0.9",`)

```json
    "expo-router": "57.0.11",
```
(insert after `"expo-modules-core": "57.0.9",`, before `"expo-web-browser": "57.0.2",`)

In `"devDependencies"`, bump the existing entry (expo-router's peer requires
`>= 13.2.0`; the project currently pins `12.9.0`):

```json
    "@testing-library/react-native": "14.0.1",
```

- [ ] **Step 1b: Add a temporary release-age exclusion**

`expo-router@57.0.11` and its transitive dependency `expo-symbols@57.0.2`
were published 2026-08-06, inside this repo's 3-day `minimumReleaseAge`
supply-chain gate in `pnpm-workspace.yaml` — `pnpm install` will fail with
`ERR_PNPM_NO_MATURE_MATCHING_VERSION` without this step. Add both to the
existing `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml`, following
the exact pattern already there for other same-release-train Expo SDK 57
packages:

```yaml
  - 'expo-router@57.0.11'
  - 'expo-symbols@57.0.2'
```

Add a comment above the two new entries explaining why (same style as the
existing block): these are part of the same Expo SDK 57 release train as
the packages already listed, published within the same few days, and the
exclusion should be removed once they clear the gate on their own
(2026-08-09, ~3 days after publish — reuse the existing block's removal-date
convention rather than inventing a new one).

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: lockfile updates cleanly, no `ERR_PNPM_NO_MATURE_MATCHING_VERSION`
and no `ERR_PNPM_PEER_DEP_ISSUES` (this repo runs with
`strictPeerDependencies: false`, so any *remaining* unmet peer — e.g.
`react-dom`/`react-native-web`, which this iOS-only app deliberately
excludes per the `overrides` block in `pnpm-workspace.yaml` — only warns, it
does not fail the install).

- [ ] **Step 3: Verify the existing suite is unaffected**

Run: `mise run test`
Expected: same pass/fail state as before this change — the
`@testing-library/react-native` major bump (12 → 14) is a real upgrade;
if any existing test breaks because of it, stop and fix that test before
continuing (do not proceed with a broken suite).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Add expo-router and its required peer dependencies"
```

---

### Task 3: Switch the Babel preset to babel-preset-expo

**Files:**
- Modify: `package.json` (devDependency)
- Modify: `babel.config.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: a Babel config expo-router's Metro integration can rely on (expo-router requires `babel-preset-expo`, not `@react-native/babel-preset` directly).

- [ ] **Step 1: Add the devDependency**

In `package.json`, `"devDependencies"`, insert alphabetically:

```json
    "babel-preset-expo": "57.0.6",
```
(confirmed against the npm registry: `57.0.6` is `babel-preset-expo`'s current `latest` dist-tag, as of this plan's amendment — insert after `"babel-plugin-transform-remove-console": "6.9.4",`, before `"babel-core": "7.0.0-bridge.0"` — actually alphabetically `babel-core` < `babel-jest` < `babel-plugin-transform-remove-console` < `babel-preset-expo`, so place it after `babel-plugin-transform-remove-console` and before `eslint`)

Re-verify the exact version against the npm registry before installing
regardless — it may have moved again since this plan was last amended.

**If `pnpm install` fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`** on
`babel-preset-expo` (the same `minimumReleaseAge` supply-chain gate that
blocked Task 2's `expo-router`/`expo-symbols`): this exact situation is
pre-authorized to resolve the same way Task 2's did — add a
`minimumReleaseAgeExclude` entry to `pnpm-workspace.yaml` for the exact
blocked version, with a comment matching the existing block's style
(explaining it's the same Expo SDK 57 release train, published within days
of the other excluded packages, remove once it clears the gate on its own).
No need to stop and ask; proceed and note it in your report.

- [ ] **Step 2: Update babel.config.js**

Replace the preset, and disable the preset's automatic worklets plugin since
`babel.config.js` already appends `react-native-worklets/plugin` manually
and it must stay last in the plugin list:

```javascript
module.exports = {
	presets: [
		['babel-preset-expo', {worklets: false}],
		'@babel/preset-typescript',
	],
	plugins: [
		'@babel/plugin-transform-export-namespace-from',
		['@babel/plugin-transform-private-methods', {loose: true}],
		// the worklets plugin must come last
		'react-native-worklets/plugin',
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
```

(`babel-preset-expo` extends `@react-native/babel-preset` itself, so the
old preset entry is removed rather than kept alongside the new one.)

- [ ] **Step 3: Install and verify the existing suite still passes**

Run: `pnpm install && mise run test`
Expected: PASS — same test results as before this change. A Babel preset
swap can silently change transform output; if anything breaks here, that's
a real regression to fix now, not to carry forward.

- [ ] **Step 4: Verify TypeScript and lint are unaffected**

Run: `mise run tsc && mise run lint`
Expected: same error count as the pre-existing baseline (this worktree had
pre-existing, unrelated `tsc`/`lint` errors before this plan started — see
the migration spec's baseline notes; this step confirms this task didn't
add new ones, not that the baseline is clean).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml babel.config.js
git commit -m "Switch Babel preset to babel-preset-expo

expo-router requires babel-preset-expo rather than
@react-native/babel-preset directly; the reanimated/worklets plugin
babel-preset-expo would otherwise auto-add is disabled to preserve
the existing manual ordering (it must run last)."
```

---

### Task 4: Enable typed routes

**Files:**
- Modify: `app.config.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `experiments.typedRoutes: true` in the generated Expo config, which makes `expo start`/`expo run:ios` generate `.expo/types/router.d.ts` from the `app/` file tree (already gitignored via the existing `/.expo/` entry).

- [ ] **Step 1: Add the experiments block**

In `app.config.ts`, inside the `config` object, add (placed after
`userInterfaceStyle: 'automatic',` and before the `ios:` block, matching the
file's existing top-to-bottom ordering of simple config before nested
platform blocks):

```typescript
	experiments: {
		typedRoutes: true,
	},
```

- [ ] **Step 2: Verify the config still loads**

Run: `npx expo config --type public --json > /dev/null`
Expected: exits 0, no throw from `app.config.ts` (this project's own
`__tests__/app.config.test.ts` also exercises this file — run
`pnpm jest __tests__/app.config.test.ts` and confirm it still passes).

- [ ] **Step 3: Commit**

```bash
git add app.config.ts
git commit -m "Enable expo-router typed routes"
```

---

### Task 5: Rework @frogpond/app-theme to drop the react-navigation import

**Files:**
- Modify: `modules/app-theme/index.ts`
- Modify: `modules/app-theme/paper.ts`
- Create: `modules/app-theme/__tests__/paper.test.ts`

**Interfaces:**
- Consumes: `ThemeProvider`, `DarkTheme`, `DefaultTheme`, `useTheme` from `expo-router/react-navigation` (confirmed re-exports, per Expo's own migration docs).
- Produces: `CombinedLightTheme`, `CombinedDarkTheme` (unchanged shape — still `deepmerge(MD3*Theme, Navigation*Theme)`), `useTheme` (unchanged signature) — both re-exported from `modules/app-theme/index.ts` exactly as before. This is what Task 6's `app/_layout.tsx` imports.

- [ ] **Step 1: Write the failing test**

Create `modules/app-theme/__tests__/paper.test.ts`:

```typescript
import {CombinedLightTheme, CombinedDarkTheme} from '../paper'

describe('CombinedLightTheme / CombinedDarkTheme', () => {
	it('merges Paper MD3 theme properties into the light theme', () => {
		expect(CombinedLightTheme.colors).toHaveProperty('primary')
	})

	it('merges React Navigation theme properties into the light theme', () => {
		expect(CombinedLightTheme.colors).toHaveProperty('card')
	})

	it('merges both into the dark theme too', () => {
		expect(CombinedDarkTheme.colors).toHaveProperty('primary')
		expect(CombinedDarkTheme.colors).toHaveProperty('card')
	})

	it('marks the dark theme as dark', () => {
		expect(CombinedDarkTheme.dark).toBe(true)
	})
})
```

- [ ] **Step 2: Run the test to verify it currently passes (baseline)**

Run: `pnpm jest modules/app-theme/__tests__/paper.test.ts`
Expected: PASS — this test documents current behavior against the
`@react-navigation/native`-backed implementation before the import swap, so
Step 4 proves the swap didn't change behavior.

- [ ] **Step 3: Swap the import in paper.ts**

In `modules/app-theme/paper.ts`:

```typescript
import merge from 'deepmerge'

import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationLightTheme,
} from 'expo-router/react-navigation'

import {
	MD3DarkTheme as PaperDarkTheme,
	MD3LightTheme as PaperLightTheme,
} from 'react-native-paper'

export const CombinedLightTheme = merge(PaperLightTheme, NavigationLightTheme)

export const CombinedDarkTheme = merge(PaperDarkTheme, NavigationDarkTheme)
```

- [ ] **Step 4: Swap the import in index.ts**

In `modules/app-theme/index.ts`, change:

```typescript
import {useTheme} from '@react-navigation/native'
```

to:

```typescript
import {useTheme} from 'expo-router/react-navigation'
```

- [ ] **Step 5: Run the test to verify it still passes**

Run: `pnpm jest modules/app-theme/__tests__/paper.test.ts`
Expected: PASS, unchanged — confirms `expo-router/react-navigation`'s
`DarkTheme`/`DefaultTheme` re-exports are drop-in equivalent to
`@react-navigation/native`'s for this usage.

- [ ] **Step 6: Confirm no direct `@react-navigation/*` imports remain in this package**

Run: `grep -rn "@react-navigation" modules/app-theme/`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add modules/app-theme/index.ts modules/app-theme/paper.ts modules/app-theme/__tests__/paper.test.ts
git commit -m "Drop @react-navigation/native import from @frogpond/app-theme

Import ThemeProvider/DarkTheme/DefaultTheme/useTheme from
expo-router/react-navigation instead, per Expo Router SDK 56+'s
policy against direct @react-navigation/* imports in app code."
```

---

### Task 6: Create the root layout and a placeholder route

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`

**Interfaces:**
- Consumes: `store`, `persistor` from `../source/redux`; `queryClient`, `persister` from `../source/init/tanstack-query`; `CombinedLightTheme`, `CombinedDarkTheme` from `@frogpond/app-theme`; `navigationIntegration` from `../source/init/sentry`; `LoadingView` from `@frogpond/notice`; `IS_PRODUCTION` from `@frogpond/constants`.
- Produces: the default-exported root layout component expo-router mounts automatically because of its `app/_layout.tsx` path — no manual registration needed elsewhere.

This ports `source/app.tsx`'s provider stack verbatim, swapping only the
navigation-specific pieces (`NavigationContainer` → `ThemeProvider` +
`Stack`, the manual `navigationRef` → `useNavigationContainerRef()`).

- [ ] **Step 1: Write app/_layout.tsx**

```typescript
// initialization
import '../source/init/constants'
import '../source/init/moment'
import * as sentryInit from '../source/init/sentry'
import '../source/init/api'
import '../source/init/theme'
import {queryClient, persister} from '../source/init/tanstack-query'

import * as React from 'react'
import {PersistGate} from 'redux-persist/integration/react'
import {Provider as ReduxProvider} from 'react-redux'
import {Provider as PaperProvider} from 'react-native-paper'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {store, persistor} from '../source/redux'
import {CombinedLightTheme, CombinedDarkTheme} from '@frogpond/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {ThemeProvider} from 'expo-router/react-navigation'
import {Stack, useNavigationContainerRef, useRouter} from 'expo-router'
import * as Sentry from '@sentry/react-native'

import {LoadingView} from '@frogpond/notice'
import {IS_PRODUCTION} from '@frogpond/constants'
import {StatusBar, useColorScheme} from 'react-native'

function RootLayout(): React.ReactNode {
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'
	const navigationContainerRef = useNavigationContainerRef()
	const router = useRouter()

	React.useEffect(() => {
		if (!IS_PRODUCTION) {
			return
		}

		sentryInit.navigationIntegration.registerNavigationContainer(
			navigationContainerRef,
		)
		Sentry.wrapExpoRouter(router)
		Sentry.appLoaded()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<ReduxProvider store={store}>
			<PersistGate
				loading={<LoadingView text="Loading App..." />}
				persistor={persistor}
			>
				<PersistQueryClientProvider
					client={queryClient}
					persistOptions={{persister}}
				>
					<PaperProvider theme={theme}>
						<ActionSheetProvider>
							<ThemeProvider value={theme}>
								<StatusBar barStyle={statusBarStyle} />
								<Stack />
							</ThemeProvider>
						</ActionSheetProvider>
					</PaperProvider>
				</PersistQueryClientProvider>
			</PersistGate>
		</ReduxProvider>
	)
}

export default Sentry.wrap(RootLayout)
```

Note: `Sentry.ErrorBoundary`/`ErrorFallback` from `source/app.tsx` is
intentionally **not** ported here yet — it depends on `React.ReactElement`
props shaped around the old `NavigationContainer` tree and needs its own
look once real screens exist to error on. Carrying it forward as a TODO
would violate this plan's no-placeholder rule; instead, it's tracked as
follow-up scope for checkpoint 2 (the first checkpoint that mounts real
screens under this layout) — note this explicitly in that checkpoint's plan
when it's written.

- [ ] **Step 2: Write app/index.tsx**

A placeholder proving the shell boots; checkpoint 2 replaces this file's
contents with the real home screen.

```typescript
import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

export default function PlaceholderHome(): React.ReactElement {
	return (
		<View style={styles.container}>
			<Text
				accessibilityRole="header"
				style={styles.text}
			>
				expo-router shell — checkpoint 1
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
	text: {
		fontSize: 16,
	},
})
```

- [ ] **Step 3: Type-check the new files**

Run: `mise run tsc`
Expected: no new errors introduced by `app/_layout.tsx` or `app/index.tsx`
(compare against Task 3 Step 4's baseline count).

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/index.tsx
git commit -m "Add expo-router root layout and placeholder route

Ports source/app.tsx's provider stack (Redux, React Query, Paper,
Sentry, theming) to app/_layout.tsx. The placeholder index route
exists only to give the router something to mount; checkpoint 2
replaces it with the real home screen."
```

---

### Task 7: Point the JS entry at expo-router

**Files:**
- Modify: `index.js`

**Interfaces:**
- Consumes: `expo-router/entry` (registers the root component under Expo's default module name, `"main"` — see Task 1).
- Produces: nothing consumed elsewhere; this is the actual app entry point.

- [ ] **Step 1: Update index.js**

```javascript
// This declaration must be inside the app code, so that Typescript merges
// it with the default react typings. If it is placed into a separate .d.ts
// file, Typescript will instead replace the default typings.
declare module 'react' {
	// source: https://fettblog.eu/typescript-react-generic-forward-refs/
	function forwardRef<T, P = object>(
		render: (props: P, ref: React.RefObject<T>) => React.ReactElement | null,
	): (props: P & React.RefAttributes<T>) => React.ReactElement | null
}

import './source/polyfills/buffer'
import 'text-encoding-polyfill'
import 'react-native-url-polyfill/auto'
import 'expo-router/entry'
```

(the polyfills load first, exactly as before, so anything expo-router or the
app's own code needs them for is unaffected; only the final import — what
gets registered as the root component — changes)

- [ ] **Step 2: Commit**

```bash
git add index.js
git commit -m "Point the JS entry point at expo-router/entry"
```

---

### Task 8: Regenerate the native project and verify boot

**Files:**
- None (regenerates `ios/`, which is fully generated from `app.config.ts` + `plugins/`)

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: a verified-booting app, the deliverable this whole checkpoint exists to prove.

- [ ] **Step 1: Regenerate the native project**

Run: `mise run prebuild`
Expected: exits 0. This deletes and regenerates `ios/` from `app.config.ts`
and `plugins/`, including Task 1's un-patched `AppDelegate.swift`
(`withModuleName: "main"`, left as the Expo template default).

- [ ] **Step 2: Confirm the module name in the generated file**

Run: `grep -n 'withModuleName' ios/AllAboutOlaf/AppDelegate.swift`
Expected: `withModuleName: "main"` — not `"AllAboutOlaf"`. If this still
shows `"AllAboutOlaf"`, Task 1 didn't take effect before this prebuild; stop
and re-check it before continuing.

- [ ] **Step 3: Build and launch on a simulator**

Run: `mise run ios` (or `APP_VARIANT=development mise run ios` for the dev
variant — either works for this check)
Expected: the app builds, launches, and shows the placeholder screen
("expo-router shell — checkpoint 1") with no crash, no red screen, no hang
on a blank/splash screen. This is the manual verification this checkpoint
cannot get from Jest — actually look at the running simulator before
checking this box.

- [ ] **Step 4: Confirm typed routes generated**

Run: `ls .expo/types/router.d.ts`
Expected: file exists (created by `expo start`/`expo run:ios` because of
Task 4's `experiments.typedRoutes`). Already covered by the existing
`/.expo/` gitignore entry — nothing to add there.

- [ ] **Step 5: Final commit for the checkpoint**

No file changes in this task, so nothing to commit here — Task 8 is
verification-only. If Steps 1–4 all pass, checkpoint 1 is done; the branch
is ready for checkpoint 2's plan to be written (migrating the `(home)`
stack and its `Stack.Group` folders), per the migration spec's
branch-and-checkpoint plan.
