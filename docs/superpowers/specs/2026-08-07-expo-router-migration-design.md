# React Navigation → expo-router migration

## Goal

Full cutover from React Navigation (manually-wired `NavigationContainer` + typed
param lists) to expo-router (file-based routing), done all at once on a
dedicated branch, merged when the whole app is verified working. Not a
feasibility spike, not a long-term coexistence strategy.

## Current state (baseline)

- ~61 screens across `source/navigation/routes.tsx` / `types.tsx`, organized
  into `RootStackParamList`/`RootViewsParamList`, `CafeMenuParamList`,
  `RadioScheduleParamList`, `MiscViewParamList`, `SettingsStackParamList`,
  `ComponentLibraryStackParamList`.
- 4 native-stack navigators (`HomeStackScreens`, `SettingsStackScreens`,
  `ComponentLibraryStackScreens`, top-level `RootStack`).
- 7 feature areas (calendar, transportation, streaming, sis, news, reddit,
  menus) each embed their own `createNativeBottomTabNavigator` (from
  `@react-navigation/bottom-tabs/unstable`), not reflected in the top-level
  param lists.
- 44 files use `useNavigation`/`.navigate`/`.push`/`useRoute`/`route.params`.
- Already an Expo-managed app (`expo 57`, `app.config.ts`); `expo-router` is
  not yet a dependency; entry point is `./source/root`, not
  `expo-router/entry`.
- `app.config.ts` declares per-variant URL schemes (`AllAboutOlaf` /
  `AllAboutOlafDev`) but nothing wires them to in-app routing today — no
  `linking` prop is configured.
- Sentry navigation instrumentation is registered via
  `Sentry.reactNavigationIntegration()` against `navigationRef` in
  `source/init/sentry.ts`.
- Modal presentation is used for the Settings and Component Library root
  stacks, plus `network-logger` and `building-hours/report/*` screens.
- 19 files configure custom `headerLeft`/`headerRight`/`headerTitle`.
- 11 `Stack.Group` blocks exist purely for code organization within a single
  flat stack.
- `source/navigation/constants.ts` disables navigation-state persistence
  (`persistenceKey = null`) pending an unresolved audit.
- `@frogpond/navigation-buttons`: header-button components
  (`CloseScreenButton`, `OpenSettingsButton`, `FavoriteButton`,
  `DebugNoticeButton`, `SearchButton`, `NetworkLoggerButton`, `ShareButton`),
  15 call sites, calls `useNavigation()` and types against
  `NativeStackHeaderRightProps` from `@react-navigation/native-stack`.
- `@frogpond/app-theme`: generic color tokens plus a `DarkTheme`/
  `DefaultTheme` merge (from `@react-navigation/native`) with
  `react-native-paper`'s MD3 themes, fed to `NavigationContainer`'s `theme`
  prop.

## Architecture

- `app/_layout.tsx` — root native-stack `Stack`, wrapped in
  `Sentry.wrap(RootLayout)`.
- `app/(home)/` — the ~54-screen main stack (today's `HomeStackScreens`).
- `app/(settings)/` — modal route group (`presentation: 'modal'` on the
  group layout).
- `app/(component-library)/` — modal route group, same treatment.
- The 11 existing `Stack.Group` blocks become subfolders under `(home)/`,
  named by whatever they group by today — a real restructuring, not a
  rename, since file-based routing has no inline-group equivalent.
- The 7 feature tab areas become folders, each with its own `_layout.tsx`
  built with `NativeTabs`/`NativeTabs.Trigger` (from
  `expo-router/unstable-native-tabs`), replacing
  `createNativeBottomTabNavigator` outright. This is a real rewrite per
  feature area (icon/label/badge config is reshaped against
  `NativeTabs.Trigger`'s API), not a drop-in adapter.
- Other modal-presented screens (`network-logger`,
  `building-hours/report/*`) become a `(modals)` group or per-route
  `presentation: 'modal'`.
- **Open risk, logged for the record, not currently blocking:**
  [expo/expo#47687](https://github.com/expo/expo/issues/47687) — iOS
  Release builds on RN 0.86 bridgeless + New Architecture can hang forever
  on the native splash screen when tabs host nested stacks (repro used the
  classic JS `<Tabs>` component). This app has no splash screen and uses no
  classic `<Tabs>`, so the known repro conditions don't apply — but
  `expo-router/unstable-native-tabs` is an unstable API ("may change or be
  removed in minor versions"), so re-check this issue if a splash screen is
  ever added later.

## Typed routes & navigation calls

- Delete `source/navigation/types.tsx` and its param-list types
  (`RootParamList`, `CafeMenuParamList`, `RadioScheduleParamList`,
  `MiscViewParamList`, `SettingsStackParamList`,
  `ComponentLibraryStackParamList`) once every screen has moved. Expo
  Router's generated typed routes (from the `app/` file tree) replace them.
- 30 files: `navigation.navigate(...)`/`.push(...)` → `router.push('/path')`
  / `router.navigate('/path')`.
- 19 files: `route.params` → `useLocalSearchParams<...>()`. URL params are
  always strings, so any currently-typed non-string params (numbers,
  objects) need explicit parsing/serialization at the call site — the
  fiddliest part of this pass, not a mechanical rename.
- 20 files: `useRoute()` usage not covered by the params case (e.g. reading
  `route.name`) needs a per-file look — there's no direct `route.name`
  equivalent since the route is the file path.

## Frogpond helper packages

- **`@frogpond/app-theme`**: keep the generic color-token logic as-is.
  Rework the theme-merge to import `ThemeProvider`, `DarkTheme`,
  `DefaultTheme`, `useTheme` from `expo-router/react-navigation` instead of
  `@react-navigation/native` — this entry point exists specifically because
  Expo Router (SDK 56+) no longer accepts app-code imports from
  `@react-navigation/*` directly. Result: zero direct `@react-navigation/*`
  imports anywhere in this package.
- **`@frogpond/navigation-buttons`**: split by usage count.
  - Stay in the package, rebuilt as `Stack.Toolbar.Button`-based components
    with SF Symbol icons, `useNavigation()` replaced by expo-router's own
    `useRouter()`/`router.back()`: `CloseScreenButton` (6 call sites),
    `DebugNoticeButton` (3), `NetworkLoggerButton` (2).
  - Inlined at their single call site, removed from the package:
    `OpenSettingsButton` (`source/views/home/index.tsx`), `FavoriteButton`
    (already a thin wrapper, `BuildingFavoriteButton`, one consumer),
    `SearchButton` (`source/views/sis/course-search/search.tsx`),
    `ShareButton` (`source/views/sis/student-work/detail.tsx`).

## Header buttons → Stack.Toolbar + SF Symbols

- All 19 files with custom `headerLeft`/`headerRight`/`headerTitle` config
  (a superset of the `navigation-buttons` call sites) move to
  `Stack.Toolbar`/`Stack.Toolbar.Button`, placed via the `placement="left"`
  / `placement="right"` prop.
- Every icon currently used in a header button gets mapped to its closest
  SF Symbol equivalent as part of this migration. This app is iOS-only (per
  CLAUDE.md), so there's no Material Symbol / Android branching to design
  around. Icon selection is a per-button design decision, tracked as its own
  checklist item during implementation — not a mechanical rename.
- `Stack.Toolbar.Button`'s `icon` prop only accepts native platform symbols,
  not arbitrary custom JSX — this is why the SF Symbol conversion is a hard
  requirement for this approach to work at all, not an optional nicety.

## Sentry wiring

- Root layout creates `navigationIntegration` via
  `Sentry.reactNavigationIntegration(...)`, registered against
  `useNavigationContainerRef()` imported from `expo-router` (not
  `@react-navigation/native`), inside a `useEffect`.
- Root layout exported as `export default Sentry.wrap(RootLayout)`.
- Include `Sentry.wrapExpoRouter(useRouter())` for `navigation.prefetch`
  span visibility.
- This replaces the current `navigationRef`-based wiring in
  `source/init/sentry.ts`; the rest of Sentry's setup (DSN, breadcrumbs,
  etc.) is unaffected.

## Deep linking

- Scope: real scheme-based deep linking, not universal/associated-domain
  links (no associated domains exist in `app.config.ts` today; adding those
  is a separate concern involving Apple/Google file hosting and
  entitlements, out of scope here).
- Scheme: `allaboutolaf://` — formalizes what `app.config.ts` already
  declares per variant (`AllAboutOlaf` / `AllAboutOlafDev` scheme values),
  which currently exist but do nothing.
- Greenfield: no legacy path aliases to preserve. URL paths are whatever the
  new `app/` file structure produces.
- Verification: manual, via
  `xcrun simctl openurl booted allaboutolaf://<path>` (and the dev variant's
  scheme) against each migrated screen during the regression pass, confirming
  correct screen + params.

## Branch & checkpoint plan

Single dedicated branch. `source/navigation/` and `app/` coexist during the
migration; old system is deleted at the end. Each checkpoint gets a manual
pass before moving to the next:

1. Scaffold `app/` skeleton: root layout, `Sentry.wrap`, theme integration
   via `expo-router/react-navigation`. No screens moved yet — confirm the
   shell boots.
2. Migrate the `(home)` stack and its 11 `Stack.Group` → folder conversions.
3. Migrate the 7 feature tab areas to `NativeTabs`.
4. Migrate `(settings)` and `(component-library)` modal groups, plus the
   standalone modal screens (`network-logger`, `building-hours/report/*`).
5. Convert header buttons to `Stack.Toolbar` + SF Symbols across all 19
   files; inline the 4 single-use `navigation-buttons` components; rebuild
   the 3 shared ones.
6. Wire deep linking; verify per-scheme `openurl` against the new structure.
7. Delete `source/navigation/`; remove now-unused React Navigation packages
   from `package.json`. Note: `@react-navigation/native` itself likely
   stays as an expo-router internal dependency — confirm the exact
   removable set at implementation time rather than guessing here.
8. Full manual regression pass: every screen/flow, both app variants
   (production/development), both color schemes, deep-link scheme checks —
   then merge.

## Explicitly out of scope

- Universal/associated-domain links.
- Resolving the disabled navigation-state-persistence audit
  (`persistenceKey = null` in `source/navigation/constants.ts`) — carried
  forward as-is unless it blocks the migration itself.
- Android — this app is iOS-only.
