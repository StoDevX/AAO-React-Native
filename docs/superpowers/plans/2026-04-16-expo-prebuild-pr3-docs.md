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

