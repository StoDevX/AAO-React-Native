# Expo Prebuild — PR 3 (Documentation + Follow-up Stubs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document the new prebuild workflow in `CLAUDE.md` + `CONTRIBUTING.md`, and seed three stub design specs that capture the context Phases 2–4 will need (so the Phase 1 reasoning isn't lost between phases).

**Prerequisite:** PR 2 (cutover) is merged to `master`. Confirm:
- `app.config.ts` is the source of truth; `ios/` is regenerable via `mise run prebuild`.
- `react-native.config.js` and `@react-native-community/cli*` are gone.
- `.mise.toml` `tasks.{ios,start,prebuild,bundle:ios}` all run via `npx expo`.
- All 16 acceptance criteria from the spec recorded PASS in the PR 2 description.

**Spec:** `docs/superpowers/specs/2026-04-16-expo-prebuild-migration-design.md` — section "Migration Steps" (Step 6).

**Branch:** `claude/expo-prebuild-pr3-docs` (created from `master` in Task 1, after PR 2 merges).

**Tech Stack:** Markdown only. No code or test changes.

---

## File Structure

**Modified files:**

| Path | Change |
|---|---|
| `CLAUDE.md` | Add a "Native iOS configuration" section explaining `app.config.ts` + `plugins/` as the source of truth; update *Development Commands* to reflect the new `mise run prebuild` task and the Expo-CLI-backed `ios`/`start`/`bundle:ios` tasks. |
| `CONTRIBUTING.md` | Add a brief "Native iOS configuration" subsection pointing at `mise run prebuild` and the "don't hand-edit `ios/`" rule. |

**New files:**

| Path | Responsibility |
|---|---|
| `docs/superpowers/specs/2026-04-16-expo-sdk-54-upgrade-design.md` | Phase 2 stub: Expo SDK 53 → 54, RN 0.79 → 0.81, Legacy Architecture preserved. |
| `docs/superpowers/specs/2026-04-16-expo-sdk-55-newarch-upgrade-design.md` | Phase 3 stub: Expo SDK 54 → 55, RN 0.81 → 0.83, New Architecture mandatory; per-library compatibility audit. |
| `docs/superpowers/specs/2026-04-16-expo-prebuild-cng-rehoming-design.md` | Phase 4 stub: gitignore `ios/`, rehome XCUITests so they survive `--clean` regeneration. |

**Not touched:**

- Anything under `source/`, `modules/`, `ios/`, `plugins/`, `app.config.ts`.
- `package.json`, `package-lock.json`.
- `.github/workflows/**`, `fastlane/**`, `.mise.toml`.

---

## Task List

- **Task 0:** Pre-flight verification (PR 2 merged; clean working tree).
- **Task 1:** Create implementation branch `claude/expo-prebuild-pr3-docs`.
- **Task 2:** Update `CLAUDE.md` — *Development Commands* + new "Native iOS configuration" section.
- **Task 3:** Update `CONTRIBUTING.md` — add prebuild note.
- **Task 4:** Author the Phase 2 stub (`expo-sdk-54-upgrade-design.md`).
- **Task 5:** Author the Phase 3 stub (`expo-sdk-55-newarch-upgrade-design.md`).
- **Task 6:** Author the Phase 4 stub (`expo-prebuild-cng-rehoming-design.md`).
- **Task 7:** Pre-commit and open PR against `master`.

Each task ends in one or more commits.

---

## Task 0: Pre-flight Verification

**Files:** None.

- [ ] **Step 1: Confirm PR 2 is merged to `master`**

```bash
git fetch origin master
git log origin/master --oneline -10 | grep -iE "regenerate ios|expo prebuild|cut over"
```

Expected: at least one commit from PR 2 (e.g., "chore: regenerate ios/ via expo prebuild").

- [ ] **Step 2: Confirm prebuild-era state is on `master`**

```bash
git show origin/master:.mise.toml | grep -E "expo (run|start|prebuild|export)"
```

Expected: hits for `expo run:ios`, `expo start`, `expo prebuild`, `expo export`.

- [ ] **Step 3: Confirm RN CLI removed**

```bash
git show origin/master:package.json | grep -E "@react-native-community/cli"
```

Expected: no output (devDeps gone).

- [ ] **Step 4: Confirm `react-native.config.js` removed**

```bash
git ls-tree origin/master react-native.config.js
```

Expected: no output.

- [ ] **Step 5: Clean working tree**

```bash
git status
```

Expected: clean.

## Task 1: Create implementation branch

- [ ] **Step 1: Create + check out branch**

```bash
git checkout master
git pull origin master
git checkout -b claude/expo-prebuild-pr3-docs
```

- [ ] **Step 2: Push empty branch**

```bash
git push -u origin claude/expo-prebuild-pr3-docs
```

---

## Task 2: Update `CLAUDE.md`

**Files:**
- `CLAUDE.md`

Two changes: (1) update the *Development Commands* section so the
listed `mise` tasks reflect the post-cutover state; (2) add a new
"Native iOS configuration" section explaining the prebuild flow so
future agent sessions don't try to hand-edit `ios/`.

### 2.1 Update *Development Commands*

- [ ] **Step 1: Add `prebuild` and clarify the iOS workflow**

In the `## Development Commands` block, the current listing is:

```bash
mise run lint   # ESLint
mise run pretty # Prettier; run `pretty:check` to validate instead
mise run test   # Jest, unit tests
mise run tsc    # Type check
mise run pods   # Install cocoapods, even on Linux
```

Replace with:

```bash
mise run lint     # ESLint
mise run pretty   # Prettier; run `pretty:check` to validate instead
mise run test     # Jest, unit tests
mise run tsc      # Type check
mise run pods     # Install cocoapods (after `mise run prebuild`), even on Linux
mise run prebuild # Regenerate ios/ from app.config.ts via `npx expo prebuild --clean -p ios`
mise run ios      # Build + launch the iOS app via `npx expo run:ios`
mise run start    # Start Metro bundler via `npx expo start`
```

Note the `pods` annotation: pods install must follow prebuild because
prebuild rewrites the Podfile.

### 2.2 Add "Native iOS configuration" section

- [ ] **Step 2: Insert a new section after *Architecture & Patterns***

Insert this section between `## Architecture & Patterns` and
`## Mobile Priorities`:

```markdown
## Native iOS Configuration

The iOS native project is **regenerated from declarative config**, not
hand-edited:

- `app.config.ts` — single source of truth for iOS metadata (bundle
  identifier, scheme, ATS exceptions, `ios.infoPlist` overrides) and
  the `plugins: [...]` array.
- `plugins/` — local config plugins that patch `AppDelegate.swift`,
  `Info.plist`, and `project.pbxproj` for customizations that don't
  fit declarative fields. Each plugin has unit tests in
  `plugins/__tests__/`.
- `ios/` — checked into git, but treated as **regenerable output**.
  Run `mise run prebuild` to recreate it from `app.config.ts` +
  `plugins/`.

**Do not hand-edit anything under `ios/`.** Native changes flow through
`app.config.ts` (declarative fields), a library config plugin
(`expo-build-properties`, `@react-native-vector-icons/common/plugin`),
or a local plugin under `plugins/`. After editing, run
`mise run prebuild && mise run pod:install --deployment` and commit
the regenerated `ios/` diff alongside the source change.

CI runs `mise run prebuild -- --no-install` before `pod install` on
every iOS build (see `.github/workflows/{check,build-and-deploy,cocoapods}.yml`
and `ios/ci_scripts/ci_post_clone.sh`), so a forgotten regeneration
will be caught — but don't rely on that as the primary check.
```

### 2.3 Commit

- [ ] **Step 3: Pre-commit + commit**

```bash
mise run agent:pre-commit
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): document Expo prebuild workflow

Adds a "Native iOS Configuration" section explaining that ios/ is
regenerable output, app.config.ts + plugins/ are the source of truth,
and the don't-hand-edit-ios/ rule. Updates Development Commands with
`mise run prebuild`, `mise run ios`, and `mise run start` and notes
that `mise run pods` must follow prebuild.

See docs/superpowers/specs/2026-04-16-expo-prebuild-migration-design.md
EOF
)"
```

---

## Task 3: Update `CONTRIBUTING.md`

**Files:**
- `CONTRIBUTING.md`

The current `CONTRIBUTING.md` has stale references (Flow, CircleCI,
TravisCI, `npm run flow`) but **don't fix those here** — that's
unrelated cleanup. Scope the edit to a single new subsection about
the prebuild workflow.

### 3.1 Add "Native iOS Configuration" subsection

- [ ] **Step 1: Insert a new subsection under *Keep It Running***

After the "Whenever commits are pushed..." paragraph at the end of the
*Keep It Running* section (currently around line 68), insert:

```markdown
### Native iOS Configuration

The iOS native project (`ios/`) is regenerated from declarative config
in `app.config.ts` and the `plugins/` directory.
**Don't hand-edit anything under `ios/`** — your changes will be lost
the next time CI (or another contributor) regenerates the directory.

To make a native iOS change:

1. Edit `app.config.ts` for declarative fields
   (bundle identifier, ATS exceptions, `ios.infoPlist` overrides), or
   author/extend a config plugin under `plugins/` for anything that
   patches `AppDelegate.swift`, `project.pbxproj`, or the Podfile.
2. Run `mise run prebuild` to regenerate `ios/`.
3. Run `mise run pod:install --deployment` to refresh `Podfile.lock`.
4. Commit `app.config.ts` / the plugin change **plus** the regenerated
   `ios/` diff in the same PR.

CI re-runs prebuild on every push, so it'll catch a forgotten
regeneration — but reviewers find the diff easier to evaluate when the
plugin change and its `ios/` output land together.
```

### 3.2 Commit

- [ ] **Step 2: Pre-commit + commit**

```bash
mise run agent:pre-commit
git add CONTRIBUTING.md
git commit -m "$(cat <<'EOF'
docs(contributing): document Expo prebuild workflow

Adds a Native iOS Configuration subsection under Keep It Running with
the don't-hand-edit-ios/ rule, the four-step "make a native iOS
change" workflow, and a note that CI re-runs prebuild as a safety net.

Stale references elsewhere in the file (Flow, CircleCI, TravisCI) are
intentionally not touched here — out of scope for this PR.

See docs/superpowers/specs/2026-04-16-expo-prebuild-migration-design.md
EOF
)"
```

---

## Task 4: Author the Phase 2 stub (`expo-sdk-54-upgrade-design.md`)

**Files:**
- `docs/superpowers/specs/2026-04-16-expo-sdk-54-upgrade-design.md` (new)

**Intent:** capture enough Phase 1 context that a future session can
brainstorm + write a full design spec for the SDK 53 → 54 / RN 0.79 →
0.81 bump without re-doing the analysis. This is a stub, not a
finished spec — it explicitly punts on most decisions.

### 4.1 Write the stub

- [ ] **Step 1: Create the file with the following content**

```markdown
# Phase 2 — Expo SDK 53 → 54 / RN 0.79 → 0.81 (Stub)

> **Status:** stub. Not yet brainstormed or designed. This file
> captures the Phase 1 context that's relevant when Phase 2 starts so
> the analysis isn't lost between phases.

## What this phase does

Bump:
- Expo SDK 53.0.27 → 54.x (latest patch at start of work)
- React Native 0.79.6 → 0.81.x

Stays on the **Legacy Architecture**. SDK 54 is the last Expo SDK
that supports it; SDK 55 makes the New Architecture mandatory.

## Why this is its own phase

The Phase 1 design spec decomposed the migration into four phases
specifically so each version bump could be evaluated and shipped on
its own. Doing SDK 53 → 55 in one step would conflate prebuild
correctness with New-Architecture compatibility regressions.

## Inherited from Phase 1

- `app.config.ts` is the source of truth.
- `plugins/with-app-delegate-customizations.ts`,
  `plugins/with-alternate-icons.ts`,
  `plugins/with-xcuitest-target.ts` are all unit-tested locally.
- `expo-build-properties` carries `ios.deploymentTarget`,
  `ios.newArchEnabled: false`, `ios.ccacheEnabled: true`.
- CI runs `mise run prebuild -- --no-install` before `pod install`.
- `react-native-vector-icons` ships its config plugin and is wired
  via `@react-native-vector-icons/common/plugin`.

## Open questions for Phase 2 brainstorming

- **AppDelegate template shape.** SDK 54's prebuild template may
  restructure `AppDelegate.swift`. The
  `with-app-delegate-customizations` plugin anchors on
  `self.moduleName = "AllAboutOlaf"`; verify that anchor still
  exists in SDK 54's template, and update if the line moved.
- **`expo-build-properties` schema.** Verify the `ios.ccacheEnabled`
  + `ios.newArchEnabled` keys are still recognized in the SDK 54
  release.
- **Library compatibility audit.** For each library in
  `package.json` that ships native code, check its SDK 54
  compatibility note in the Expo SDK 54 changelog.
- **iOS deployment target.** SDK 54 may bump the floor (current spec
  pins to iOS 14). Decide whether to follow Expo's recommended
  floor or hold at 14.
- **Patches.** Re-validate `0001-rn.patch` and
  `0002-rn-abortsignal.patch` against RN 0.81. Either re-base, drop
  if upstream-fixed, or document why each is still needed.

## Acceptance criteria sketch

When this phase ships, the Phase 1 16-item acceptance checklist must
still PASS unchanged. No new functional capability — just the
upgrade itself.

## Risks (placeholder)

- **Library churn.** Several non-Expo libraries
  (`@react-native-community/*`, `glamorous-native`, etc.) may need
  upgrades or replacements at this step.
- **Patch rebase.** If `0001-rn.patch` no longer applies, decide
  whether to forward-port or drop.

## When to start Phase 2

After Phase 1 (PRs 1–3) is in production for at least one Fastlane
release cycle and no prebuild-related regressions have been reported.

## See also

- Spec: `docs/superpowers/specs/2026-04-16-expo-prebuild-migration-design.md`
- Expo SDK 54 changelog: https://expo.dev/changelog/sdk-54
```

### 4.2 Commit

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-16-expo-sdk-54-upgrade-design.md
git commit -m "$(cat <<'EOF'
docs(spec): seed Phase 2 (Expo SDK 54) design stub

Captures Phase 1 context relevant to the SDK 53 → 54 / RN 0.79 → 0.81
bump: what the prebuild scaffold provides, the open questions a Phase 2
brainstorm should chase (AppDelegate template shape, expo-build-properties
schema, library compatibility audit, deployment target, patches), and
risks. Explicitly a stub — not yet brainstormed or designed.
EOF
)"
```

