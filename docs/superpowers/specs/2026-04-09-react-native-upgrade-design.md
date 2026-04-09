# React Native 0.72.9 → 0.85.0 Upgrade Design

## Overview

Upgrade All About Olaf from React Native 0.72.9 to 0.85.0 using a hybrid approach: use a fresh RN 0.85 template as reference while applying changes file-by-file to preserve project-specific customizations.

This is a major upgrade spanning 13 minor versions. Key milestones along the way: New Architecture became default in 0.76, React 19 landed in 0.78, old architecture was permanently removed in 0.82.

## Section 1: Core Version Bumps

| Package | Current | Target |
|---------|---------|--------|
| `react-native` | 0.72.9 | 0.85.0 |
| `react` | 18.2.0 | 19.2.3 |
| `react-test-renderer` | 18.2.0 | 19.2.3 |
| `@types/react` | 18.2.79 | ^19.2.0 |
| `@types/react-test-renderer` | 18.0.0 | ^19.1.0 |

React Native toolchain:

| Package | Current | Target |
|---------|---------|--------|
| `@react-native/metro-config` | 0.72.11 | 0.85.0 |
| `@react-native/eslint-config` | 0.83.1 | 0.85.0 |
| `metro-react-native-babel-preset` | 0.76.8 | **remove** (replaced by `@react-native/babel-preset`) |
| `@react-native/babel-preset` | *(new)* | 0.85.0 |
| `@react-native/jest-preset` | *(new)* | 0.85.0 |
| `@react-native/typescript-config` | *(new)* | 0.85.0 |

Node.js requirement: `>=18` → `>=22.11.0` in `package.json` engines field. Already satisfied by mise config (Node 22.20.0).

## Section 2: Navigation Upgrade (v6 → v7)

| Package | Current | Target |
|---------|---------|--------|
| `@react-navigation/native` | 6.1.18 | 7.2.2 |
| `@react-navigation/native-stack` | 6.11.0 | latest v7 |
| `@react-navigation/stack` | 6.4.1 | latest v7 |
| `@react-navigation/bottom-tabs` | 6.6.1 | latest v7 |
| `@react-navigation/material-bottom-tabs` | 6.2.29 | **remove** (merged into `bottom-tabs` in v7) |
| `@react-navigation/material-top-tabs` | 6.6.14 | latest v7 |
| `react-native-screens` | 3.24.0 | 4.24.0 |
| `react-native-safe-area-context` | 4.14.1 | 5.7.0 |

Key changes:
- `@react-navigation/material-bottom-tabs` was folded into `@react-navigation/bottom-tabs` — migrate imports
- Navigation types in `source/navigation/types.ts` will need updating

## Section 3: Animation & Gesture Libraries

| Package | Current | Target |
|---------|---------|--------|
| `react-native-reanimated` | 3.7.2 | 4.3.0 |
| `react-native-worklets` | *(new)* | 0.8.x |
| `react-native-gesture-handler` | 2.31.0 | 2.31.1 |

Migration notes:
- Babel plugin: `react-native-reanimated/plugin` → `react-native-worklets/plugin`
- Worklet imports still re-exported from reanimated (deprecated but functional)

## Section 4: Other Dependency Upgrades

Native modules needing upgrades for New Architecture / RN 0.85 compat:

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| `@sentry/react-native` | 5.9.1 | 8.7.0 | Major version jump; has migration guide |
| `@sentry/cli` (dev) | 2.58.5 | latest | Keep in sync with SDK |
| `@react-native-async-storage/async-storage` | 1.19.3 | 3.0.2 | Major bump |
| `@react-native-community/datetimepicker` | 8.6.0 | latest | Yoga patch likely unnecessary |
| `@react-native-community/netinfo` | 11.5.2 | latest | |
| `@react-native-clipboard/clipboard` | 1.16.3 | latest | |
| `@react-native-picker/picker` | 2.11.4 | latest | |
| `react-native-device-info` | 11.1.0 | latest | |
| `react-native-keychain` | 8.2.0 | latest | |
| `react-native-inappbrowser-reborn` | 3.7.1 | latest | |
| `react-native-ios-context-menu` | 1.15.3 | latest | |
| `react-native-calendar-events` | 2.2.0 | latest | |
| `react-native-restart` | 0.0.27 | latest | |
| `react-native-search-bar` | 3.5.1 | latest | Needs New Arch compat check |
| `react-native-sfsymbols` | 1.2.2 | latest | Needs New Arch compat check |
| `react-native-popover-view` | 5.1.9 | latest | |
| `react-native-network-logger` | 2.0.1 | latest | |

JS-only deps (likely fine):

| Package | Current | Target |
|---------|---------|--------|
| `react-native-paper` | 5.15.0 | 5.15.0 (current) |
| `react-native-webview` | 13.16.1 | 13.16.1 (current) |
| `react-redux` | 9.2.0 | latest (React 19 compat) |
| `react-native-tableview-simple` | 4.4.1 | latest |
| `react-native-typography` | 1.4.1 | latest |
| `react-native-button` | 3.1.0 | latest |

Potentially problematic (need research during implementation):
- `react-native-search-bar`, `react-native-sfsymbols` — smaller community libs, may lack New Arch support
- `@hawkrives/react-native-alternate-icons` — custom package, needs checking
- `@callstack/react-theme-provider` — currently patched; may need newer version or updated patch

## Section 5: Build & Config File Changes

### `babel.config.js`
- Replace `module:metro-react-native-babel-preset` → `module:@react-native/babel-preset`
- Remove `@babel/preset-typescript` (included in new preset)
- Remove `@babel/plugin-transform-export-namespace-from` (included in new preset)
- Change `react-native-reanimated/plugin` → `react-native-worklets/plugin`
- Keep `@babel/plugin-transform-private-methods` and `transform-remove-console`

### `metro.config.js`
- Minimal changes — already uses `@react-native/metro-config` pattern. Just needs package version bump.

### `ios/Podfile`
- Remove `flags = get_default_flags()` and `:hermes_enabled` / `:fabric_enabled` flags
- Simplify `use_react_native!` call (just `:path` and `:app_path`)
- Remove `__apply_Xcode_12_5_M1_post_install_workaround`
- Keep custom post_install: clang build settings, deployment target override, strip settings, patch script

### `ios/AllAboutOlaf/AppDelegate`
- Migrate from Objective-C to Swift AppDelegate (0.77+ template)
- New pattern: `RCTReactNativeFactory` + `ReactNativeDelegate`
- Delete old `.m`/`.h` files, add `.swift`

### `contrib/` patches
- `0001-rn.patch` (react-theme-provider types) — check if still needed
- `0002-datetimepicker-yoga.patch` — likely unnecessary (Yoga API changed)
- `0003-0005 sentry patches` — likely unnecessary with Sentry 8.x

### `package.json`
- `engines.node`: `>=18` → `>=22.11.0`
- Remove `metro-react-native-babel-preset` from devDeps
- Add `@react-native/babel-preset`, `@react-native/jest-preset`, `@react-native/typescript-config`
- Remove `@react-navigation/material-bottom-tabs`
- Add `react-native-worklets`

### `tsconfig.json`
- Extend `@react-native/typescript-config` instead of manual config

## Section 6: Code Changes

### React 19
- `react-test-renderer` deprecated — already have `@testing-library/react-native` as primary
- `defaultProps` on function components will warn — audit for usage
- `forwardRef` no longer needed (ref is a regular prop) — not urgent to change

### React Navigation 6 → 7
- Update `source/navigation/types.ts` for v7 types
- Migrate `@react-navigation/material-bottom-tabs` imports → `@react-navigation/bottom-tabs`
- Screen option types may shift

### Sentry 5 → 8
- Initialization API likely changed — update `Sentry.init()` calls
- Navigation integration API may have changed

### Reanimated 3 → 4
- Babel plugin path change (covered above)
- Code-level API largely compatible

### Patches
- Audit all 5 patches in `contrib/` — remove obsolete ones, update any that still apply

## Section 7: Testing & Verification

After making all changes, run in order:

1. `npx tsc --noEmit` — catch type errors from React 19, Nav 7, Reanimated 4, Sentry 8
2. `npm run lint` — catch import/config issues
3. `npm run pretty` — fix formatting
4. `npm test` — Jest suite (may need config updates for `@react-native/jest-preset`)
5. `pod install` in `ios/` — verify native deps resolve
6. iOS build — verify Swift AppDelegate and New Architecture compile

### Expected failure points (priority order)
1. TypeScript errors from React 19 and Nav 7 type changes — highest volume, mostly mechanical
2. Jest config — switch to `@react-native/jest-preset`; test mocks may need updating
3. Sentry API changes — initialization and navigation integration
4. Material bottom tabs → bottom tabs migration — import paths and config
5. Patches that no longer apply — remove or rework
6. Smaller native libs (`react-native-search-bar`, `react-native-sfsymbols`, `@hawkrives/react-native-alternate-icons`) — may not compile under New Architecture

### Out of scope
- Migrate away from `moment` (separate effort)
- Upgrade to React Navigation 8 (wait for stable)
- Refactor `forwardRef` usage (works fine, just unnecessary)
- Rewrite worklet imports from reanimated to `react-native-worklets` (deprecated re-exports still work)
