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
checkpoint. Discovered mid-execution: `expo-router` ships a global type that
collides with this app's existing React Navigation typed-navigation
augmentation the moment anything imports from `expo-router` for real, which
this checkpoint also resolves permanently (Tasks 4b-4g) rather than leaving
`tsc` broken for the rest of the migration.

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
- Task 4b replaces `source/navigation/types.tsx`'s hand-rolled
  `ReactNavigation.RootParamList` global augmentation with a named
  `LegacyRootParamList` export, then fixes every call site that relied on
  the old ambient typing (29 files, 47 `tsc` errors) with an explicit
  `NavigationProp<LegacyRootParamList>` type argument — all as ONE commit,
  since this repo's pre-commit hook checks the whole project on every
  commit and nothing here compiles cleanly until all of it lands together.
  Task 4b must fully complete before Task 5 and Task 6; both need the
  `expo-router` global-type collision gone before they can import anything
  from `expo-router` at all.
- **Never bypass, skip, or disable the pre-commit hook to work around a
  known/expected intermediate error state (e.g. `HK=0`, `--no-verify`).**
  If a task's intermediate steps leave `tsc` non-clean on purpose, the task
  is structured so the commit only happens once verification confirms a
  clean state (see Task 4b) — finish the remaining steps, don't route
  around the hook.

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

### Task 4b: Replace the global RootParamList augmentation and re-type every affected call site

**This task is unusually large (1 type file + 29 call-site files) and MUST land as ONE commit — not one commit per group.** This repo's pre-commit hook runs `tsc` across the entire project on every commit, with no scoping to staged files. Steps 2 through 6 below each leave a known, expected set of `tsc` errors in place until the next step — only after Step 6 does `tsc` return to 0 errors. Committing after any earlier step would fail the hook (correctly) and block every later commit in this checkpoint. **Do not commit until Step 7 confirms 0 errors. Do not use any mechanism to skip, disable, or bypass the pre-commit hook to work around this — if the hook blocks you before Step 7, that means you committed too early; back up and finish the remaining groups first.**

**Files:**
- Modify: `source/navigation/types.tsx`
- Modify (group 1): `modules/event-list/event-list.tsx`, `modules/food-menu/fancy-menu.tsx`, `modules/navigation-buttons/network-logger.tsx`, `modules/navigation-buttons/open-settings.tsx`, `source/views/building-hours/detail/index.tsx`, `source/views/building-hours/list.tsx`
- Modify (group 2): `source/views/contacts/list.tsx`, `source/views/dictionary/detail.tsx`, `source/views/dictionary/list.tsx`, `source/views/home/index.tsx`, `source/views/menus/carleton-menus.tsx`, `source/views/reddit/index.tsx`
- Modify (group 3): `source/views/settings/screens/api-test/list.tsx`, `source/views/settings/screens/debug/list.tsx`, `source/views/settings/screens/overview/component-library/library.tsx`
- Modify (group 4): `source/views/settings/screens/overview/developer.tsx`, `source/views/settings/screens/overview/miscellany.tsx`, `source/views/settings/screens/overview/support.tsx`
- Modify (group 5): `source/views/sis/balances.tsx`, `source/views/sis/course-search/results.tsx`, `source/views/sis/course-search/search.tsx`, `source/views/sis/student-work/index.tsx`, `source/views/stoprint/print-jobs.tsx`, `source/views/stoprint/print-release.tsx`, `source/views/stoprint/printers.tsx`, `source/views/streaming/radio/controller.tsx`, `source/views/student-orgs/list.tsx`, `source/views/transportation/bus/line.tsx`, `source/views/transportation/bus/wrapper.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `export type LegacyRootParamList = RootStackParamList & SettingsStackParamList & ComponentLibraryStackParamList` — a plain named export, no `declare global`, imported explicitly by every group-1-through-5 file (`useNavigation<NavigationProp<LegacyRootParamList>>()`) instead of relying on ambient/global type inference. Consumed by Task 5 and Task 6 in the sense that both need the `TS2300` collision gone before they can import anything from `expo-router` at all.

**Why this exists, and why it's bigger than originally planned:** `expo-router` ships its own global `declare global { namespace ReactNavigation { type RootParamList = {} } }`. This collides (`TS2300`) with this file's `interface RootParamList` the moment anything imports from `expo-router` for real (Task 5's `expo-router/react-navigation`, Task 6's `expo-router`) — TypeScript does not merge a `type` alias with an `interface` of the same name.

The plan originally assumed deleting the augmentation outright would only weaken typing on old `useNavigation()`/`.navigate()` calls. That assumption was wrong: without ANY augmentation, those calls fall back to expo-router's own empty `RootParamList = {}`, and `.navigate()` calls against an empty param list produce real `tsc` errors (`TS2345`/`TS2769`, argument not assignable to `never`) — confirmed empirically: 47 errors across 29 files. There is no documented expo-router mechanism for keeping the old ambient-global pattern working alongside expo-router's own typed routes.

Wren's decision: keep every affected call site fully type-checked, permanently, via an explicit (non-ambient) type argument at each call site, rather than patching `expo-router` itself or leaving the collision unresolved. This widens checkpoint 1 — pulling forward part of what checkpoints 2-6 would otherwise have done screen-by-screen — but only the typing mechanics, not the `router.push()` rewrite or any behavior change. A first attempt at splitting this into six separately-committable tasks (4b-4g) ran into the pre-commit hook problem described above; this single-task, single-commit structure replaces that attempt.

- [ ] **Step 1: Replace the augmentation with a named export**

In `source/navigation/types.tsx`, replace lines 144-154 (the comment, the `declare global` block, and everything inside it):

```typescript
// this block sourced from https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace ReactNavigation {
		interface RootParamList
			extends
				RootStackParamList,
				SettingsStackParamList,
				ComponentLibraryStackParamList {}
	}
}
```

with:

```typescript
// Explicit, non-ambient replacement for the old global ReactNavigation.RootParamList
// augmentation: expo-router ships its own global `type RootParamList = {}`, which
// cannot coexist with an `interface` of the same name (TypeScript does not merge a
// type alias with an interface). Every useNavigation() call against the legacy
// React Navigation stack now takes this as an explicit generic instead
// (useNavigation<NavigationProp<LegacyRootParamList>>()) — see checkpoint 1's
// Tasks 4c-4g. This type, and every file that imports it, goes away in checkpoint 7
// once the legacy stack is fully replaced by expo-router's own typed routes.
export type LegacyRootParamList = RootStackParamList &
	SettingsStackParamList &
	ComponentLibraryStackParamList
```

Leave everything else in the file untouched — `RootStackParamList`, `SettingsStackParamList`, `ComponentLibraryStackParamList`, and every other exported type stay exactly as they are.

- [ ] **Step 2: Verify the collision is gone**

Run: `mise run tsc`
Expected: the `TS2300: Duplicate identifier 'RootParamList'` error is gone. The 47 `TS2345`/`TS2769` errors from the 29 affected files are EXPECTED at this point — Steps 3-6 fix those. Confirm no error beyond that known, closed set of 47 appears (compare file:line against the lists below) — anything outside that set is a real regression to investigate. **Do not commit yet.**

**The mechanical pattern for every remaining step, worked in full on one file (`modules/navigation-buttons/network-logger.tsx`):**

Before:
```typescript
import {useNavigation, useTheme} from '@react-navigation/native'
// ...
export const NetworkLoggerButton: React.FC = () => {
	const navigation = useNavigation()
```

After:
```typescript
import {NavigationProp, useNavigation, useTheme} from '@react-navigation/native'
import type {LegacyRootParamList} from '../../source/navigation/types'
// ...
export const NetworkLoggerButton: React.FC = () => {
	const navigation = useNavigation<NavigationProp<LegacyRootParamList>>()
```

(Adjust the `LegacyRootParamList` import path to each file's actual relative path to `source/navigation/types.tsx` — the example above is for a file under `modules/navigation-buttons/`. Match each file's existing import style: if a file already imports other things from `@react-navigation/native`, add `NavigationProp` to that same import statement rather than a new one; if it imports types with `import type {...}` elsewhere in the file, follow that convention for the `LegacyRootParamList` import.)

Apply this exact pattern — add `NavigationProp` to the file's existing `@react-navigation/native` import, import `LegacyRootParamList` as a type (adjusting the relative path to `source/navigation/types.tsx` per file's location; match each file's existing import style — e.g. if it already imports other types with `import type {...}`, follow that convention), and add the `<NavigationProp<LegacyRootParamList>>` generic to every no-argument `useNavigation()` call — to every file in every group below. Every error listed must be gone after your fix, and no other file's error count may change.

- [ ] **Step 3: Fix group 1 (event-list, food-menu, navigation-buttons, building-hours) — do not commit yet**

```
modules/event-list/event-list.tsx(51,24): error TS2345: Argument of type '[string, { event: EventType; poweredBy: PoweredBy; }]' is not assignable to parameter of type 'never'.
modules/food-menu/fancy-menu.tsx(185,28): error TS2345: Argument of type '[string, { item: MenuItemType; icons: MasterCorIconMapType; }]' is not assignable to parameter of type 'never'.
modules/navigation-buttons/network-logger.tsx(27,39): error TS2769: No overload matches this call.
modules/navigation-buttons/open-settings.tsx(20,39): error TS2769: No overload matches this call.
source/views/building-hours/detail/index.tsx(18,24): error TS2345: Argument of type '[string, { initialBuilding: BuildingType; }]' is not assignable to parameter of type 'never'.
source/views/building-hours/list.tsx(39,24): error TS2345: Argument of type '[string, { building: BuildingType; }]' is not assignable to parameter of type 'never'.
```

Fix each file, then run `mise run tsc` and confirm none of these 6 error lines appear anymore (41 should remain — the rest belong to the groups below, not yet fixed).

- [ ] **Step 4: Fix group 2 (contacts, dictionary, home, menus, reddit) — do not commit yet**

```
source/views/contacts/list.tsx(36,24): error TS2345: Argument of type '[string, { contact: ContactType; }]' is not assignable to parameter of type 'never'.
source/views/dictionary/detail.tsx(56,29): error TS2345: Argument of type '[string, { item: WordType; }]' is not assignable to parameter of type 'never'.
source/views/dictionary/list.tsx(129,42): error TS2345: Argument of type '[string, { item: WordType; }]' is not assignable to parameter of type 'never'.
source/views/home/index.tsx(99,40): error TS2769: No overload matches this call.
source/views/menus/carleton-menus.tsx(61,42): error TS2769: No overload matches this call.
source/views/reddit/index.tsx(67,24): error TS2345: Argument of type '[string, { postUrl: string; title: string; author: string; publishedAt: string; contentHtml: string; thumbnail: string | null; communityName: string; postAuthor: string; postType: "link" | ... 5 more ... | undefined; ... 5 more ...; pollData: PollData | ... 1 more ... | undefined; }]' is not assignable to parameter of type 'never'.
source/views/reddit/index.tsx(100,24): error TS2345: Argument of type '[string, { postUrl: string; title: string; author: string; publishedAt: string; contentHtml: string; thumbnail: string | null; communityName: string; postAuthor: string; postType: "link" | ... 5 more ... | undefined; ... 5 more ...; pollData: PollData | ... 1 more ... | undefined; }]' is not assignable to parameter of type 'never'.
```

Note `source/views/reddit/index.tsx` has two errors from the same hook call — one fix covers both. Fix each file, then run `mise run tsc` and confirm none of these 7 error lines appear anymore (34 should remain).

- [ ] **Step 5: Fix group 3 (settings: api-test, debug, component-library) — do not commit yet**

```
source/views/settings/screens/api-test/list.tsx(48,23): error TS2345: Argument of type '[string, { query: { displayName: string; path: string; params: never[]; }; }]' is not assignable to parameter of type 'never'.
source/views/settings/screens/api-test/list.tsx(65,40): error TS2345: Argument of type '[string, { query: ServerRoute; }]' is not assignable to parameter of type 'never'.
source/views/settings/screens/debug/list.tsx(109,27): error TS2345: Argument of type '[string, { keyPath: string[]; }]' is not assignable to parameter of type 'never'.
source/views/settings/screens/debug/list.tsx(139,27): error TS2345: Argument of type '[string, { keyPath: string[]; }]' is not assignable to parameter of type 'never'.
source/views/settings/screens/overview/component-library/library.tsx(19,41): error TS2769: No overload matches this call.
source/views/settings/screens/overview/component-library/library.tsx(23,41): error TS2769: No overload matches this call.
source/views/settings/screens/overview/component-library/library.tsx(27,41): error TS2769: No overload matches this call.
source/views/settings/screens/overview/component-library/library.tsx(31,41): error TS2769: No overload matches this call.
source/views/settings/screens/overview/component-library/library.tsx(35,41): error TS2769: No overload matches this call.
```

Note `api-test/list.tsx` and `debug/list.tsx` each have two errors from the same hook call; `component-library/library.tsx` has five, likely from either one shared `useNavigation()` call used across multiple handlers, or several separate calls — read the file to confirm which, and fix every one. Fix each file, then run `mise run tsc` and confirm none of these 9 error lines appear anymore (25 should remain).

- [ ] **Step 6: Fix group 4 (settings overview: developer, miscellany, support) — do not commit yet**

`developer.tsx` has one `const navigation = useNavigation()` call feeding six separate `.navigate(...)` calls in the handlers below it; fixing that one `useNavigation()` call resolves all six listed errors for this file.

```
source/views/settings/screens/overview/developer.tsx(15,55): error TS2769: No overload matches this call.
source/views/settings/screens/overview/developer.tsx(16,48): error TS2769: No overload matches this call.
source/views/settings/screens/overview/developer.tsx(17,51): error TS2769: No overload matches this call.
source/views/settings/screens/overview/developer.tsx(18,58): error TS2769: No overload matches this call.
source/views/settings/screens/overview/developer.tsx(19,50): error TS2345: Argument of type '["DebugView", { keyPath: string[]; }]' is not assignable to parameter of type 'never'.
source/views/settings/screens/overview/developer.tsx(20,58): error TS2769: No overload matches this call.
source/views/settings/screens/overview/miscellany.tsx(12,50): error TS2769: No overload matches this call.
source/views/settings/screens/overview/miscellany.tsx(13,50): error TS2769: No overload matches this call.
source/views/settings/screens/overview/miscellany.tsx(14,48): error TS2769: No overload matches this call.
source/views/settings/screens/overview/support.tsx(55,54): error TS2769: No overload matches this call.
```

Fix each file, then run `mise run tsc` and confirm none of these 10 error lines appear anymore (15 should remain).

- [ ] **Step 7: Fix group 5 (sis, stoprint, streaming, student-orgs, transportation) — verify full return to baseline**

```
source/views/sis/balances.tsx(39,47): error TS2769: No overload matches this call.
source/views/sis/course-search/results.tsx(154,24): error TS2345: Argument of type '[string, { course: CourseType; }]' is not assignable to parameter of type 'never'.
source/views/sis/course-search/search.tsx(46,26): error TS2345: Argument of type '[string, { initialQuery: string; }]' is not assignable to parameter of type 'never'.
source/views/sis/course-search/search.tsx(64,24): error TS2345: Argument of type '[string, { initialQuery: string; }]' is not assignable to parameter of type 'never'.
source/views/sis/course-search/search.tsx(89,24): error TS2345: Argument of type '[string, { initialFilters: FilterType<CourseType>[]; }]' is not assignable to parameter of type 'never'.
source/views/sis/student-work/index.tsx(61,53): error TS2345: Argument of type '[string, { job: JobType; }]' is not assignable to parameter of type 'never'.
source/views/stoprint/print-jobs.tsx(46,47): error TS2769: No overload matches this call.
source/views/stoprint/print-jobs.tsx(50,24): error TS2345: Argument of type '[string, { job: PrintJob; }]' is not assignable to parameter of type 'never'.
source/views/stoprint/print-jobs.tsx(52,24): error TS2345: Argument of type '[string, { job: PrintJob; }]' is not assignable to parameter of type 'never'.
source/views/stoprint/print-release.tsx(95,23): error TS2769: No overload matches this call.
source/views/stoprint/printers.tsx(74,24): error TS2345: Argument of type '[string, { job: PrintJob; printer: Printer; }]' is not assignable to parameter of type 'never'.
source/views/streaming/radio/controller.tsx(115,23): error TS2769: No overload matches this call.
source/views/student-orgs/list.tsx(96,48): error TS2345: Argument of type '[string, { org: StudentOrgType; }]' is not assignable to parameter of type 'never'.
source/views/transportation/bus/line.tsx(244,27): error TS2345: Argument of type '[string, { stop: BusTimetableEntry; line: UnprocessedBusLine; subtitle: string; }]' is not assignable to parameter of type 'never'.
source/views/transportation/bus/wrapper.tsx(53,26): error TS2345: Argument of type '[string, { line: UnprocessedBusLine; }]' is not assignable to parameter of type 'never'.
```

Fix each file. Then run: `mise run tsc`
Expected: **0 errors**, matching Task 3's original baseline exactly. This confirms the RootParamList collision (Step 1) and its full 47-error cascade (Steps 3-7) are completely resolved, permanently — not deferred, not suppressed.

Also run: `mise run test` and `mise run lint`, to confirm nothing across this whole task introduced any other regression.

- [ ] **Step 8: Commit everything as one commit**

```bash
git add source/navigation/types.tsx modules/event-list/event-list.tsx modules/food-menu/fancy-menu.tsx modules/navigation-buttons/network-logger.tsx modules/navigation-buttons/open-settings.tsx source/views/building-hours/detail/index.tsx source/views/building-hours/list.tsx source/views/contacts/list.tsx source/views/dictionary/detail.tsx source/views/dictionary/list.tsx source/views/home/index.tsx source/views/menus/carleton-menus.tsx source/views/reddit/index.tsx source/views/settings/screens/api-test/list.tsx source/views/settings/screens/debug/list.tsx source/views/settings/screens/overview/component-library/library.tsx source/views/settings/screens/overview/developer.tsx source/views/settings/screens/overview/miscellany.tsx source/views/settings/screens/overview/support.tsx source/views/sis/balances.tsx source/views/sis/course-search/results.tsx source/views/sis/course-search/search.tsx source/views/sis/student-work/index.tsx source/views/stoprint/print-jobs.tsx source/views/stoprint/print-release.tsx source/views/stoprint/printers.tsx source/views/streaming/radio/controller.tsx source/views/student-orgs/list.tsx source/views/transportation/bus/line.tsx source/views/transportation/bus/wrapper.tsx
git commit -m "Replace the global RootParamList augmentation and re-type every affected call site

expo-router ships its own global ReactNavigation.RootParamList type
alias, which cannot coexist with source/navigation/types.tsx's
interface of the same name once anything imports from expo-router
for real (TypeScript does not merge a type alias with an interface).

Deleting the augmentation outright (rather than replacing it) would
leave 29 files' useNavigation()/.navigate() calls resolving against
expo-router's own empty RootParamList, producing 47 real tsc errors
-- not just weaker typing. LegacyRootParamList is the explicit,
non-ambient replacement each call site now takes as a type argument.
This single commit covers the type replacement and all 29 call-site
fixes together, since this repo's pre-commit hook checks the whole
project on every commit and nothing here compiles cleanly until all
of it lands together.

source/navigation/types.tsx (and LegacyRootParamList with it) still
goes away in checkpoint 7, once every screen has moved off it."
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
import {Stack, useNavigationContainerRef} from 'expo-router'
import * as Sentry from '@sentry/react-native'

import {LoadingView} from '@frogpond/notice'
import {IS_PRODUCTION} from '@frogpond/constants'
import {StatusBar, useColorScheme} from 'react-native'

function RootLayout(): React.ReactNode {
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'
	const navigationContainerRef = useNavigationContainerRef()

	React.useEffect(() => {
		if (!IS_PRODUCTION) {
			return
		}

		sentryInit.navigationIntegration.registerNavigationContainer(
			navigationContainerRef,
		)
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

Note: `Sentry.wrapExpoRouter(router)` (from `useRouter()`) is intentionally
**not** included, despite being in the original design spec as a "near-free"
enhancement for `navigation.prefetch` span visibility. It isn't free:
`@sentry/react-native@8.11.0`'s `wrapExpoRouter<T extends ExpoRouter>`
generic constraint requires `ExpoRouter['prefetch']`'s parameter type
(`pathname?: string`, optional) to be assignable *from*
`expo-router@57.0.11`'s actual `ImperativeRouter['prefetch']` parameter type
(`HrefObject`, `pathname: string`, required) — under this project's
`strict: true`, a narrower-parameter function isn't assignable where a
wider-parameter one is expected, so `useRouter()`'s return value fails the
constraint. Confirmed this isn't a stale-version issue: `@sentry/react-native@8.22.0`
(latest published) has the identical incompatible shape — this is a genuine
upstream type drift between the two packages, not something a dependency
bump fixes. The load-bearing Sentry wiring (`registerNavigationContainer`,
`appLoaded`) is unaffected and stays; only the optional prefetch-span
enhancement is dropped. Revisit once Sentry's and expo-router's types
realign, not before.

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

**Keep this file as `index.js` — do not rename it to `index.ts`.**
`fastlane/lib/sourcemaps.rb:8,13` hardcodes `entry_file = 'index.js'` for
Sentry release sourcemap generation (both the iOS and Android lanes); a
rename silently breaks that. The `declare module 'react' {...}` block from
the plan's earlier draft of this step is deliberately **not** included
below — it was a copy-paste mistake, pulled from `source/root.tsx`'s
content by mistake while writing this plan. `source/root.tsx` still exists
in the tree (unreferenced until checkpoint 7 deletes it), and TypeScript
module augmentations via `declare module` apply to the whole compiled
program regardless of whether the file that declares them is actually
imported at runtime — so that augmentation is already active globally.
Duplicating it here would only be redundant, not necessary, and would force
an unnecessary `.ts` rename this file doesn't need.

```javascript
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

**What actually happened:** Step 3 caught a real boot crash — `TypeError:
Cannot assign to read-only property 'NONE'` in React Native's `Event.js`,
triggered the first time the Metro dev WebSocket connection dispatched an
event, which only happens once `expo-router/entry` (Task 7) is the real JS
entry. Root cause, found via systematic debugging (not a guess): listing
`@babel/plugin-transform-private-methods` in `babel.config.js`'s top-level
`plugins` array (added long before this migration, for a third-party
package's private class methods) ran class-feature lowering ahead of
`babel-preset-expo`'s Flow type-stripping, so React Native's own
`class Event { +NONE: 0; ... }` type-only field declarations survived as
real fields and compiled (in the preset's loose mode) to `this.NONE = void 0`
— an assignment over the non-writable `Event.prototype.NONE` that
`Event.js` installs via `Object.defineProperty`. `babel-preset-expo`
already lowers private methods on its own, so removing the redundant
plugin entry costs nothing. Fixed in commit `d4fea8ae5`, verified with a
full rebuild + screenshot after clearing Metro's stale transform cache.

Two more side effects surfaced while chasing this down, both committed
separately since they're real and unrelated to the crash itself:
- `expo run:ios` also triggered Expo CLI's own first-run sync of
  `.gitignore` (adds `expo-env.d.ts`) and `tsconfig.json` (adds
  `.expo/types/**/*.ts` + `expo-env.d.ts` to `include`, extends
  `expo/tsconfig.base`) — this was always going to happen the first time
  anyone ran the app locally with typed routes enabled (Task 4); it just
  hadn't happened yet before this task. Committed (`8671491b9`) rather than
  left as permanent local drift.
- Once `expo-env.d.ts` entered the `tsc` program, it widened React
  Native's own style types enough to reveal a genuine pre-existing bug in
  `modules/markdown/`: `ListItem`/`ThematicBreak` styles were typed as
  `TextStyle` despite both wrapping a `View`. Fixed in commit `926862abd`.

A debugging subagent handling this also briefly mishandled a stash
(`git stash push`/`pop` collided with an already-obsolete stash from an
earlier, superseded attempt at the Task 4b fix) — verified no data was
lost (the stash's content was confirmed identical to the abandoned
"delete" approach already superseded by the committed "replace" approach),
and the stale stash was dropped for hygiene.
