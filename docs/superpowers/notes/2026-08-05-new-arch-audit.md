# New Architecture readiness audit

**Date:** 2026-08-05
**Task:** Phase A, Task 1 of `docs/superpowers/plans/2026-08-05-expo-phase-a-new-architecture.md`
**State at audit:** Expo 54.0.33, React Native 0.81.5, legacy architecture

## Verdict

Nothing blocks enabling the New Architecture. No first-party code changes were
needed. Two native modules will run through React Native's legacy-module interop
layer rather than as TurboModules; both are already at their latest published
version, so there is no upgrade that would change that. They are the subject of
the manual checks in Task 2.

> **Correction, added during Task 2.** This audit's central method was unsound.
> It treated "declares `codegenConfig` in `package.json`" as meaning "supports
> the New Architecture", and on that basis cleared `react-native-change-icon`
> 5.0.0. That module in fact breaks under the New Architecture: its header
> declares conformance to the generated `NativeChangeIconSpec`, which inherits
> `RCTTurboModule`, so legacy interop skips the class — while nothing registers
> it as a TurboModule either. It is never instantiated and app-icon switching
> silently does nothing. See `contrib/0004-change-icon-legacy-module.patch`.
>
> No static signal separated it from the modules that work. Declaring
> `codegenConfig` does not imply a conforming native implementation, and
> counting `RCT_NEW_ARCH_ENABLED` occurrences does not either — async-storage,
> gesture-handler, keychain, reanimated and webview have none and all work.
> **Only running the code found this.** Treat the inventory below as a map of
> what to test, never as evidence that anything works.

## Removed-API scan

Fabric drops `findNodeHandle`, direct `UIManager` dispatch, and
`requireNativeComponent`. Searched for those plus `NativeModules.` access.

```bash
rg -n 'findNodeHandle|UIManager\.|requireNativeComponent|NativeModules\.' source/ modules/
```

**First-party (`source/`, `modules/`): zero hits.** Nothing to fix.

**JS-only libraries:**

| Library | Version | Hits | Verdict |
| --- | --- | --- | --- |
| `react-native-tableview-simple` | 4.4.1 | 0 | safe |
| `react-native-popover-view` | 6.1.0 | 0 | safe |
| `react-native-network-logger` | 2.0.1 | 0 | safe |
| `react-native-button` | 3.1.0 | 0 | safe |
| `react-native-typography` | 1.4.1 | 0 | safe |
| `react-native-paper` | 5.15.0 | 4 | safe — see below |

The four `react-native-paper` hits are one expression, duplicated across its
source and its two compiled outputs. In `src/components/Switch/Switch.tsx:14`:

```ts
const version = NativeModules.PlatformConstants
  ? NativeModules.PlatformConstants.reactNativeVersion
  : undefined;
```

Its only use is at line 78:

```ts
    version && version.major === 0 && version.minor <= 56
```

That is a compatibility check for React Native 0.56 and older. The read is
guarded twice — the ternary, then `version &&` — so if `PlatformConstants` were
unavailable the expression evaluates false, which is the correct branch for any
modern React Native. Safe regardless of how the interop layer treats it.

## Native module inventory

`codegen` means the package declares `codegenConfig` in `package.json` and is
compiled as a TurboModule or Fabric component. `legacy` means it does not.

| Module | Version | Kind |
| --- | --- | --- |
| `@react-native-async-storage/async-storage` | 3.1.0 | codegen |
| `@react-native-clipboard/clipboard` | 1.16.3 | codegen |
| `@react-native-community/datetimepicker` | 9.1.0 | codegen |
| `@react-native-community/netinfo` | 12.0.1 | codegen |
| `@react-native-picker/picker` | 2.11.4 | codegen |
| `@react-native-vector-icons/entypo` | 13.1.0 | legacy |
| `@react-native-vector-icons/ionicons` | 13.1.0 | legacy |
| `@react-native-vector-icons/material-design-icons` | 13.1.0 | legacy |
| `@sentry/react-native` | 8.11.0 | codegen |
| `react-native-change-icon` | 5.0.0 | codegen |
| `react-native-device-info` | 15.0.2 | legacy |
| `react-native-gesture-handler` | 2.31.0 | codegen |
| `react-native-ios-context-menu` | 3.2.1 | codegen |
| `react-native-ios-utilities` | 5.1.4 | codegen |
| `react-native-keychain` | 10.0.0 | codegen |
| `react-native-reanimated` | 3.19.5 | codegen |
| `react-native-restart-newarch` | 1.0.85 | codegen |
| `react-native-safe-area-context` | 5.7.0 | codegen |
| `react-native-screens` | 4.24.0 | codegen |
| `react-native-webview` | 13.16.1 | codegen |
| `react-native-zeroconf` | 0.14.0 | legacy |

Eighteen of twenty-one declare `codegenConfig`. Per the correction above, that is
a statement about `package.json` and nothing more — `react-native-change-icon`
5.0.0 appears in that eighteen and is the one module that actually broke.

The prerequisite upgrades tracked in #7453 did hold up under runtime testing for
`react-native-ios-context-menu` 3.2.1, `react-native-ios-utilities` 5.1.4, and
`react-native-keychain` 10.0.0.

## The three `legacy` entries

### `@react-native-vector-icons/*` — not a risk

These are resource-only pods. Their entire podspec body is:

```ruby
  s.resources = 'fonts/*.ttf'
```

There is no native source, so there is nothing to migrate. The absence of
`codegenConfig` is expected, not a gap.

### `react-native-device-info` 15.0.2 — interop, verify at runtime

A legacy `RCTBridgeModule`. Its podspec depends only on `React-Core` and its
sources are `ios/**/*.{h,m}`. It will be bridged by React Native's
legacy-module interop layer under bridgeless.

Already at the latest published version (15.0.2 = latest), so waiting for an
upgrade is not an option. Verify at runtime in Task 2 by confirming the Settings
screen renders version and device strings rather than blanks.

Candidate for replacement by `expo-device` + `expo-application` in Phase B,
Task 1 — which would remove the interop dependency entirely.

### `react-native-zeroconf` 0.14.0 — interop, lowest stakes

Same shape: legacy `RCTBridgeModule`, `React-Core` only, `ios/**/*.{h,m}`.
Already at the latest published version (0.14.0 = latest).

Lowest-stakes failure in the set. It powers dev-only mDNS discovery on the
Settings → Server URL screen, and that screen is already written to skip
discovery silently when the pod is absent. Verify at runtime in Task 2.

Expo has no mDNS-browsing equivalent, so it stays through Phase B.

## Follow-ups recorded, not acted on here

- `react-native-restart-newarch` 1.0.85 is a fork whose reason to exist is New
  Architecture support, currently running on the legacy one. Whether upstream
  `react-native-restart` can replace it is checked in Task 2, Step 7 and acted on
  in Task 6, Step 7.
- `react-native-reanimated` stays at 3.19.5 here. The move to 4.x is Task 3.
