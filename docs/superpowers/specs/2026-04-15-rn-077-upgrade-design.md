# React Native 0.76.9 → 0.77.3 Upgrade — Design

**Date:** 2026-04-15
**Branch:** `claude/plan-rn-upgrade-Gcog7`
**Precedent:** PR #7454 / commit `72e8be6` (RN 0.75.4 → 0.76.9)
**Related:** Issue #7453 (New Architecture adoption — out of scope here)

## Goal

Upgrade React Native from 0.76.9 to 0.77.3 on iOS, following the same
one-hop, minimal-scope pattern used for the 0.75 → 0.76 upgrade. New
Architecture remains opted out; it is tracked as a separate effort under
issue #7453 and will get its own PR with its own verification gates.

## Scope

### In scope

- `react-native`: 0.76.9 → 0.77.3
- Lockstep packages pinned to the RN version:
  - `@react-native/babel-preset` → 0.77.3
  - `@react-native/metro-config` → 0.77.3
- Workspace `peerDependencies`: 26 `modules/*/package.json` files bumped
  from `"react-native": "^0.76.0"` to `"react-native": "^0.77.0"`
- Native iOS project file diffs from the React Native Upgrade Helper
  (`ios/` — Podfile, `project.pbxproj`, `Info.plist`, any new template
  files), applied **selectively** and preserving our local
  customizations (see "Must preserve" below)
- `package-lock.json` regeneration
- `CLAUDE.md`: `React Native 0.76.9` → `React Native 0.77.3`
- `contrib/0001-rn.patch` — verify it still applies against 0.77;
  rebase or drop if upstream fixed it

### Out of scope

- New Architecture flip (`ENV['RCT_NEW_ARCH_ENABLED']`) — stays `'0'`.
  Tracked separately in #7453.
- `@react-native-community/cli` + `cli-platform-ios` — these upgrade
  on their own Renovate track; do not touch.
- Discretionary dependency bumps — Renovate handles those.
- Other RN ecosystem libraries unless RN 0.77 outright breaks them.
- `ios/Podfile.lock` regeneration — handled by CI on push (see
  "Execution" step 5).

## Must preserve (local iOS customizations)

When merging the Upgrade Helper's `ios/` diff, these local
customizations **must not be clobbered**:

- Swift `AppDelegate` (migrated from ObjC in commit `f25c471`)
- `ExpoUITestsAutolinkingFix` module in `ios/Podfile` (lines 17–23)
  — the prepend-override that makes Expo autolinking skip the
  `AllAboutOlafUITests` target
- `ENV['RCT_NEW_ARCH_ENABLED'] = '0'` opt-out in `ios/Podfile`
- Podfile `post_install` block:
  - `STRIP_INSTALLED_PRODUCT = 'YES'` on every pod target
  - ccache `CLANG_ENABLE_EXPLICIT_MODULES = 'NO'` conditional
  - `system('cd .. && scripts/apply-patches.sh')` call
- `AllAboutOlafUITests` target config (`inherit! :none`)

## Execution

Ordered, mechanical steps. Nothing architecturally novel — this is a
repeat of the 0.76 pattern.

1. **Generate the diff.** Open the React Native Upgrade Helper for
   `0.76.9 → 0.77.3`. Use it as a checklist/reference, not a blind
   `patch` — our local customizations require a manual merge on the
   native side.
2. **Bump versions in `package.json`.** Set `react-native`,
   `@react-native/babel-preset`, `@react-native/metro-config` to
   `0.77.3`. Regenerate `package-lock.json` via `npm install`.
3. **Bump workspace peerDeps.** In each of the 26 affected
   `modules/*/package.json` files, replace `"react-native": "^0.76.0"`
   with `"react-native": "^0.77.0"`. Use a scripted replace across all
   files to avoid missing one.
4. **Apply native file diffs to `ios/`.** Podfile,
   `project.pbxproj`, `Info.plist`, and any new template files. Each
   hunk reviewed against the "Must preserve" list before applying.
5. **`ios/Podfile.lock` regeneration: skipped locally.** CI regenerates
   it on branch push, matching the convention established by
   `chore: update Podfile.lock for …` commits (e.g. `bc001f9`,
   `544e663`, `c26205e`).
6. **Verify `contrib/0001-rn.patch`.** Run
   `scripts/apply-patches.sh` after `npm install`. If it fails, diff
   `@callstack/react-theme-provider`'s current typings against the
   patch and either rebase or drop the patch if upstream fixed it.
7. **Update `CLAUDE.md`.** Change the `React Native 0.76.9` reference
   to `React Native 0.77.3` (per the in-file rule requiring version
   references to be updated in the same change).
8. **Run verification gates** (see "Success criteria" below).

## Success criteria

- `mise run agent:pre-commit` green (prettier, ESLint, tsc, jest)
- `pod install` succeeds on CI (no codegen / autolinking errors)
- iOS simulator build succeeds
- App launches to first screen without crashing

## Risks & mitigations

- **`contrib/0001-rn.patch` breaks on 0.77.** Expected — the patch
  targets a third-party package, not RN itself, so probably still
  applies. Step 6 handles rebase or drop.
- **Template diff conflicts with our customizations.** Step 4 is a
  manual merge, not auto-apply, guided by the "Must preserve" list.
- **Workspace peerDep drift (missing a module).** Scripted replace
  across all `modules/*/package.json` files avoids this.
- **RN 0.77 requires a `@react-native-community/cli` version range
  incompatible with our pinned v20.** If this surfaces, it's a blocker
  and would force us to revisit the "cli out of scope" decision.
  v20 is recent; expected to be fine, but flag early if not.

## Deliverables

- **Commit 1** (local): `chore: upgrade React Native from 0.76.9 to 0.77.3`
  - `package.json` + `package-lock.json` version bumps
  - 26 `modules/*/package.json` peerDep bumps
  - `ios/` native file diffs (Podfile, `project.pbxproj`, `Info.plist`,
    template-introduced files)
  - `contrib/0001-rn.patch` rebased or removed
  - `CLAUDE.md` version reference update
  - Commit message follows the 0.76 precedent: one-hop rationale, list
    of what changed, note that CI will regenerate `Podfile.lock` and
    that New Arch remains opted-out
- **Commit 2** (CI): `chore: update Podfile.lock for claude/plan-rn-upgrade-Gcog7`
  - Generated automatically on push
- **Branch pushed** to `origin/claude/plan-rn-upgrade-Gcog7`
- **No PR created** unless explicitly requested

## Rollback

A single squash-revert of Commit 1 restores the 0.76.9 state. No data
migration, no persistent-state changes.
