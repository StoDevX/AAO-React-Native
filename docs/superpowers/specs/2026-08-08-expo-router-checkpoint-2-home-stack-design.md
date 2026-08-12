# React Navigation → expo-router migration: checkpoint 2 (home stack)

## Goal

Migrate the `(home)` stack — the app's main menu screen plus its 15
`Stack.Group`s (41 screens total) — from the dead React Navigation code
still sitting in `source/navigation/`/`source/views/` onto live expo-router
routes under `app/(home)/`. Unlike checkpoint 1 (a single branch, merged as
one unit), checkpoint 2 ships as a **stack of PRs**, managed with the
`gh-stack` tool, where every PR in the stack is independently safe to merge
on its own.

## Baseline correction

The original migration spec (`docs/superpowers/specs/2026-08-07-expo-router-migration-design.md`)
said "11 `Stack.Group`s, ~54 screens" for this checkpoint. Direct inspection
of `source/navigation/routes.tsx` found **15 `Stack.Group`s, 41 screens**
(the 54/61 figure conflated the full `RootStackParamList` type union, which
includes several dead/unused entries like `Help`, `Profile`, `Feed`,
`BusMapView` with no matching `Stack.Screen`, with what's actually mounted).
Treat this document's numbers as authoritative for checkpoint 2.

## Why "independently functional per PR" matters here

Checkpoint 1's Task 7 already pointed the JS entry at `expo-router/entry`.
That means **all 41 home-stack screens are currently runtime-unreachable**
right now — not "still working the old way." `source/navigation/`'s
`HomeStackScreens` never mounts. Checkpoint 2 isn't a gradual migration of
live screens; it's restoring functionality one group at a time. Given that,
every PR in the stack must leave the app in a shippable state — no PR may
expose a menu button that leads nowhere.

## The `disabled` mechanism (already exists, no new code needed)

`source/views/views.ts` defines `AllViews(): ViewType[]`, the data-driven
list `source/views/home/index.tsx` renders as the home-screen grid.
`CommonView` already has a `disabled?: boolean` field, and `HomePage`
already filters `!view.disabled` before rendering. This is exactly the
switch this checkpoint needs — no new mechanism required:

- The scaffold step sets `disabled: true` on all 15 `type: 'view'` entries
  in `AllViews()` (the one `type: 'url'` entry, Campus Map, isn't a route
  at all — leave it untouched).
- Each group's PR flips that one entry's `disabled` back to `false` (or
  removes the field) as part of restoring that group.

## Scaffold work (folds into checkpoint 1's existing PR #7656, not a separate PR)

Per Wren's decision, this does not become its own stacked-PR entry — it's
additional commits on the current branch (`worktree-bridge-cse_01AbV8NxWFTDXpFr8PkwUHb8`),
extending checkpoint 1's scope from "boots to a placeholder" to "boots to a
real (mostly-hidden) home screen." This is a strict improvement over the
placeholder either way, so it's still safe to merge on its own.

**What it does:**
1. `app/(home)/_layout.tsx` — the home stack's layout. Since `Home` is the
   root screen of the stack (not inside any `Stack.Group`), this is a
   `Stack` with `Home` as its index route; the 15 groups get their own
   subfolders in later PRs, each free to add its own nested layout if a
   group's internal navigation needs one (most are flat).
2. `app/(home)/index.tsx` (or `app/index.tsx` directly, replacing
   checkpoint 1's placeholder — exact placement decided when this is
   planned in detail) — the real `HomePage` component ported from
   `source/views/home/index.tsx`, with its `useNavigation()` call
   converted to expo-router's `useRouter()`/`router.push()` for the one
   thing it still needs live: the FAQ banner and settings button, neither
   of which route anywhere in this checkpoint's scope (FAQ banner opens a
   modal/sheet in place; settings button is checkpoint 4/5's concern per
   the original spec's checkpoint list — until then it can either be
   hidden or left as a dead button, decided during that PR's planning).
3. `source/views/views.ts` — add `disabled: true` to all 15 `type: 'view'`
   entries.

This needs its own full bite-sized plan (per-file, TDD where applicable) —
not written yet. Write it next, execute it as an extension of checkpoint 1
before that PR is considered done.

## The 15 group PRs — stack order and per-group scope

Each PR: create `app/(home)/<group>/` route file(s) for that group's
screens, convert that group's internal `.navigate()`/`useNavigation()`
calls to `router.push()`/`useRouter()`, flip that group's `AllViews()`
entry's `disabled` to `false`. Same mechanical pattern every time — the
first PR (News) gets a fully detailed plan; each subsequent PR gets planned
just-in-time, immediately before it's executed, reusing News's plan as a
template and adjusting for that group's actual screens.

**Real risk per PR, not solvable up front:** a screen in one group can
`.navigate('ScreenKeyInAnotherGroup')` by string key even though no group
imports another group's code directly. If the target group isn't migrated
yet, that one in-app link stays broken even though the source group is
"done." Check for this at the start of each group's planning — grep the
group's screens for `.navigate(`/`.push(` calls whose target isn't one of
that same group's own screen keys — don't assume independence just because
no shared imports exist.

Stack order, base to tip (after the scaffold work lands in checkpoint 1):

| # | Group | Screens | `AllViews()` entry | Notes |
|---|---|---|---|---|
| 1 | More | 1 | `more` | Simplest, confirmed by reading the file — single screen, no `.navigate()` calls at all (its only `useNavigation()` use is `setOptions()` for a native search bar). Establishes the pattern. |
| 2 | News | 1 (screen) but 2 internal tabs | `news` | **Corrected from the original draft, which wrongly called this the simplest group.** Reading the file found it's a nested `createNativeBottomTabNavigator` (St. Olaf / The Mess tabs) — same category as Menus and Streaming, not a plain single screen. Move this later, planned alongside those. |
| 3 | Student Orgs | 2 | `studentOrgs` | List → detail, one internal nav call. |
| 4 | Contacts | 2 | `importantContacts` | List → detail, same shape as Student Orgs. |
| 5 | Directory | 2 | `directory` | List → detail. |
| 6 | Dictionary | 3 | `dictionary` | List, detail, editor. |
| 7 | Stoprint | 3 | `printJobs` | Print jobs, printer list, release. |
| 8 | Menus | 6 | `menus` | Includes `MenuItemDetail` from the shared `@frogpond/food-menu` package — first PR touching a Frogpond-package screen. |
| 9 | Streaming | 3 | `streaming` | KSTO/KRLX schedules. |
| 10 | Transportation | 2 | `transportation` | Bus route detail. |
| 11 | Building Hours | 4 | `hours` | Includes a report/editor flow — check whether those screens are reachable from outside this group (they were modal-presented in the original navigation design spec). |
| 12 | Reddit | 2 | `reddit` (marked `devOnly: true` in `AllViews()` — stays dev-only after migration unless told otherwise) | Largest by content (1943 lines). |
| 13 | SIS + Student Work | 6 | `sis` and `courseSearch` (two separate `AllViews()` entries pointing into one group — both flip together) | Largest by screen count. |
| 14 | Calendar | 2 | `calendar` | Screens live in the shared `@frogpond/event-list` package, not `source/views/` — different file layout than every other group, plan this one carefully. |
| 15 | Faq | 1 | not in `AllViews()` (reached via the FAQ banner/settings, not a home-grid tile) | Also registered in `SettingsStackScreens` — this PR must not touch or break that second registration, which is out of checkpoint 2's scope (settings stack migration is a later checkpoint). |

Calendar and Faq are deliberately last: both are special cases (shared
Frogpond package; dual stack registration) and the pattern should be
proven on 13 ordinary groups first.

## Tooling

- `gh-stack` manages the branch chain: each group PR branches from the
  previous group's branch (or from the checkpoint-1 branch, for the first
  group PR), so review happens incrementally and merging PR N doesn't
  require PR N+1 to exist yet.
- Each PR still goes through the existing subagent-driven-development
  process (fresh implementer, task review, fix loop) — the stack changes
  how PRs relate to each other, not how each one gets built.

## Standing decision: list → detail params (every group with a detail screen)

expo-router only accepts **string** route params (confirmed against Expo's
own docs and migration guidance) — unlike React Navigation, which passes
whatever JS value you hand it, including whole objects, by reference. Most
of the remaining groups have exactly this shape: a list screen currently
does `navigation.navigate('XDetail', {x: fullObject})`.

**Decision (Wren, applies to every group with this shape): re-fetch by key,
via the React Query cache.** The list screen passes a stable identifying
field (whatever it already uses as its `keyExtractor`) as a string route
param. The detail screen re-runs the *same* `useQuery(...)` the list
screen uses — React Query dedupes by query key, so this resolves from
cache instantly, no extra network round-trip — then finds the matching
item client-side. This produces real, clean, shareable URLs (e.g.
`/Contacts/John-Doe`) instead of a JSON blob in the query string, which
Expo's own docs actively discourage. Each group's detail screen needs to
handle a genuinely new state the old code never had to: "query still
loading" and "item not found" (the old code always received the object
directly, so these states were structurally impossible before).

## Standing requirement: screenshots as a PR comment (every group PR)

Every group PR's plan must end with attaching visual evidence as a PR
comment, not just a local boot-verification screenshot the implementer
looks at and discards:

- A screenshot of the home screen showing that group's tile now present
  (and no unrelated tile changes).
- A screenshot of the group's own screen — one per tab, if the group is a
  tabbed/nested-navigator case (News, Menus, Streaming).
- Use the `attach-github-assets` skill (`upload.sh`) to upload each
  screenshot and get a `user-attachments/assets` URL, then post them as one
  PR comment via `gh pr comment <number> --body "..."` with each image as
  `![...](url)`.
- **Do not delete the SDD workspace (or otherwise clean up the
  screenshots) until after they're attached to the PR.** This was missed
  for PR 1 (More) — the workspace was deleted right after the task review,
  before anyone asked for screenshots on the PR, and they had to be
  regenerated from scratch. Every later group PR's plan should sequence
  this explicitly: boot-verify → keep screenshots → open the PR → attach
  screenshots → then clean up.

## Findings from PR 1 (More), applicable to every later group PR

- **Type fork between navigators.** Each group's existing `NavigationOptions`
  export is typed against `@react-navigation/native-stack`'s
  `NativeStackNavigationOptions`, still required by `source/navigation/routes.tsx`
  (not deleted until checkpoint 7). expo-router forks its own,
  structurally-different `NativeStackNavigationOptions`. Every wrapper route
  file needs `NavigationOptions as React.ComponentProps<typeof
  Stack.Screen>['options']` at the point it's passed to `Stack.Screen` — a
  real cast to a concrete type, not `any`. This now has three group PRs'
  worth of precedent (once Task 2 or 3 hits it again); consider hoisting it
  into a one-line shared helper at that point rather than repeating the
  multi-line inline comment + cast in every wrapper — not worth building
  for a single use case, worth it by the second or third.
- **Network-dependent screens can't be fully verified in a sandboxed
  environment.** Any group whose screen fetches live data (most of them)
  will hit this the same way More did — the sandbox has no outbound network
  access, so a "Loading…" state is the most a sandboxed boot-verification
  screenshot can show. The existing XCUITest suite (`uitests/`) is a
  legitimate substitute for verifying the *navigation* path (real touch
  events, not deep links), but not for verifying that fetched content
  actually renders. Flag every group PR with a live data dependency for a
  quick real-device spot-check before it's considered fully validated.

## Explicitly out of scope for checkpoint 2

- The Settings stack and Component Library stack (checkpoints 4-5 per the
  original migration spec) — Faq's dual registration there is left alone.
- `Stack.Toolbar` + SF Symbol header buttons (checkpoint 1's spec deferred
  this broadly; still deferred).
- Any screen's actual behavior/UI changing — this is a routing-layer
  migration only, screen components move, their contents don't change
  beyond the navigation call-site swap.
