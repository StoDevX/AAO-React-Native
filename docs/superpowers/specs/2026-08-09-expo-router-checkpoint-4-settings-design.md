# React Navigation → expo-router migration: checkpoint 4 (Settings + Component Library)

## Goal

Migrate `SettingsStackScreens` and `ComponentLibraryStackScreens` — 17
screens total (`Faq`'s dual registration was already resolved during
checkpoint 2) — from the dead React Navigation code in
`source/navigation/`/`source/views/settings/` onto live expo-router
routes under `app/(settings)/` and `app/(component-library)/`. Like
checkpoint 2, this ships as a **stack of PRs** via `gh-stack`, every PR
independently safe to merge.

Checkpoint 3 (the 7 feature tab areas → `NativeTabs`) was already
absorbed into checkpoint 2's own group PRs and needs no separate work.
This is genuinely the next unstarted checkpoint. End goal driving
checkpoints 4-7 as a whole: full removal of `@react-navigation/*` from
`package.json`.

## Baseline

Both stacks are **completely unreachable today** — not just dead code
like the rest of `source/navigation/`, but with zero live UI entry
point anywhere in `app/`. The only place that ever opened Settings
(`OpenSettingsButton` in the legacy `source/views/home/index.tsx`) is
itself dead; the live `app/(home)/index.tsx` has no gear icon or any
other Settings affordance. Confirmed via direct inspection — this isn't
a regression from prior checkpoints, Settings has simply never been
wired into the live app tree.

Two packages this checkpoint touches are already ahead of where the
original top-level migration design doc expected:

- **`@frogpond/navigation-buttons`**: every button actually reachable
  from live `app/` code (`CloseScreenButton`, `OpenSettingsButton`,
  `NetworkLoggerButton`, `SearchButton`, `FavoriteButton`) already
  imports `useNavigation`/`useTheme` from `expo-router`, not
  `@react-navigation/native`. Converting these to `Stack.Toolbar` + SF
  Symbols remains checkpoint 5's scope, not this one — same deferral
  checkpoint 2 already established for every group it touched.
- **`@frogpond/app-theme`**: already imports `DarkTheme`/`DefaultTheme`/
  `useTheme` from `expo-router/react-navigation`, not
  `@react-navigation/native` — zero direct `@react-navigation/*`
  imports anywhere in the package already. Nothing to do here.

`source/views/building-hours/report/*` (part of checkpoint 4's original
scope per the top-level design doc) was already migrated during
checkpoint 2's Building Hours group PR — confirmed, no rework needed.

## Architecture: two nested modal route groups, not flat modal screens

`app/(settings)/` and `app/(component-library)/` each get their own
`_layout.tsx` establishing a nested `Stack`, with only the *group's*
entry point marked `presentation: 'modal'` from `(home)/_layout.tsx`.
Screens *inside* each group's own `Stack` push normally.

This is a different shape from Building Hours' `ProblemReport`/
`ScheduleEditor` (checkpoint 2), which were single, standalone modal
forms marked `presentation: 'modal'` directly on their `Stack.Screen`
entry in the flat `(home)` stack — that works because those screens
have no internal navigation of their own. Settings has ~11 screens with
real internal push navigation (`SettingsRoot` → `Credits`/`Privacy`/
`Legal`/`ReportProblem`/5 dev-tool screens, `APITest` →
`APITestDetail`, `Debug` → itself, recursively). Marking each
individually modal in a flat stack would either stack a new sheet on
top of the previous one for every push, or (for non-modal children)
push directly onto *Home's* back-stack, breaking the current "one sheet
presented, push navigates within it" behavior. A nested route group
reproduces that behavior correctly: the group's own root screen is the
one modal presentation; everything inside pushes within that same
sheet.

`ComponentLibrary` is its own separate modal group, not nested inside
Settings' modal, even though it's reached *from* Settings' developer
section — matching today's `RootStack`, which registers `HomeRoot`,
`Settings`, and `ComponentLibrary` as three independent stacks, not two.

`ReportProblem` is itself modal-presented *within* the Settings
modal today (`presentation: 'modal'` in its own `NavigationOptions`) —
the same "modal nested inside a modal-presented stack" shape Building
Hours' `ProblemReport`/`ScheduleEditor` already had nested inside
`(home)`, just one level deeper. Under expo-router this is
`app/(settings)/_layout.tsx`'s own `Stack.Screen` entry for
`ReportProblem`, marked `presentation: 'modal'` there.

## PR ordering: leaf screens first, hub screens last — no visibility flag needed

Checkpoint 2 needed `AllViews()`'s `disabled` flag because the home grid
auto-renders every registered entry — a group had to exist in a
suppressed state before its own PR could safely un-suppress it. Settings
and Component Library have no equivalent auto-discovery: they're reached
*only* through explicit buttons/rows this migration controls directly.
So instead of a flag, **ordering alone** keeps every PR shippable:

Every leaf/dev-tool screen migrates first, in dependency order. Each
lands as a real, working, but still-currently-unreachable route — the
same "shipped but not yet exposed" state checkpoint 2's `disabled: true`
entries were in, just achieved by "nothing points here yet" rather than
a flag. `SettingsRoot` — whose sub-sections link to *every one* of the
other screens, including the `ComponentLibrary` hub — is the **last**
PR in the whole checkpoint. It's also the PR that adds the gear-icon
entry point to `app/(home)/index.tsx`, the single moment Settings
actually becomes reachable by real users, once every link target it
could route to already exists.

This means all 6 Component Library screens land *before* `SettingsRoot`,
even though Settings' own leaf screens are sequenced before Component
Library's (Wren's call on the two-stacks-one-checkpoint question) —
`SettingsRoot` has to come last regardless, since it's the one screen
depending on literally everything else.

## The 8 PRs

Batched the same way checkpoint 2 batched related screens into one PR
(Dictionary's 3 screens, Menus' 6 screens) rather than one PR per
screen:

| # | PR | Screens | Notes |
|---|---|---|---|
| 1 | Static content | `Credits`, `Privacy`, `Legal` | 3 trivial static screens, no deps, no nav hooks at all today. Also creates the `app/(settings)/` and `app/(component-library)/` route-group `_layout.tsx` shells — folded into this PR rather than its own scaffold PR, same call Wren made for checkpoint 2's scaffold work. |
| 2 | Report a Problem | `ReportProblem` | Form + submission logic (`gate.ts`/`submit.ts`), modal-within-the-Settings-modal (see Architecture). Distinct enough from pure static content to warrant its own PR. |
| 3 | API Test | `APITest`, `APITestDetail` | List→detail pair, same shape as Contacts/Student Orgs/Directory in checkpoint 2. Both currently use `navigation.setOptions` inside `useLayoutEffect` for header config (search bar + `NetworkLoggerButton`, dynamic title) — same pattern already proven working under expo-router in Directory/Student Orgs/Dictionary/More. |
| 4 | Simple dev tools | `BonAppPicker`, `NetworkLogger` | Two standalone dev-tool wrappers, no shared logic, no interdependencies, no navigation hooks beyond header options. |
| 5 | Banner Builder | `BannerBuilder` | Its own PR — writes into `useDevBannerStore`, read live by production `FaqBanner`/`FaqBannerGroup` on the home screen. Manual verification for this PR must check the home screen's banner, not just this screen in isolation. |
| 6 | Debug | `Debug` (catch-all `[...keyPath]` route) | Its own PR for the novel route shape — see below. |
| 7 | Component Library | `ComponentLibraryRoot` + `BadgeLibrary`, `ButtonLibrary`, `ColorsLibrary`, `ContextMenuLibrary`, `FaqBannerLibrary` | All 6 in one PR — every showcase screen is simple/static with zero real logic differences between them, matching Menus' 6-screens-in-one-PR precedent. |
| 8 | SettingsRoot + entry point | `SettingsRoot` | The overview screen itself, plus wiring the gear-icon entry point into `app/(home)/index.tsx`. The PR that makes Settings reachable. |

## `Debug`'s catch-all route

`Debug` currently navigates to itself repeatedly
(`navigation.navigate('DebugView', {keyPath: [...keyPath, key]})`) to
drill into nested Redux-state objects/arrays, with its title computed
per-push from `route.params.keyPath` via
`options={({route}) => ({title: toLaxTitleCase(...)})}`.
`keyPath: string[]` maps directly onto expo-router's own catch-all
dynamic segment support: `app/(settings)/Debug/[...keyPath].tsx`. Each
drill-down level becomes a real URL segment (e.g.
`/Debug/redux/settings/devMode`) rather than a query-string-encoded
array, matching expo-router's own idiom for this shape and giving every
level of the tree a real, shareable URL — the same reasoning this whole
migration has applied everywhere else it chose id-based routes over
object/array params in the URL.

## Explicitly out of scope for checkpoint 4

- `Stack.Toolbar` + SF Symbol conversion for header buttons (checkpoint
  5, already deferred once in checkpoint 2).
- Real deep linking (checkpoint 6).
- Deleting `source/navigation/` or removing `@react-navigation/*` from
  `package.json` (checkpoint 7) — `routes.tsx`/`types.tsx` stay in place
  as source until every checkpoint through 6 is done, same as
  checkpoint 2 left them.
- Any screen's actual behavior/UI changing beyond the navigation
  call-site swap and the new gear-icon entry point — this is a
  routing-layer migration, same ground rule as checkpoint 2. PR 6
  (Debug) is a human-approved exception: it fixes two pre-existing
  bugs, real Redux keyPath slicing and API Test's wrong-data
  drill-down, tracked in
  `docs/superpowers/plans/2026-08-09-expo-router-settings-debug.md`.
