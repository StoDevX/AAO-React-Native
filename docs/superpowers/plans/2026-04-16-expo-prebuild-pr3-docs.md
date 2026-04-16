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
