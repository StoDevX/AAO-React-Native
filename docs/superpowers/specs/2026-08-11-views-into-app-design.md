# Move navigation-relevant files into `app/`

## The problem

The expo-router migration left every screen behind a wrapper. A route file in
`app/` sets a title and a toolbar, then renders a component imported from
`source/views/`. `app/(home)/Contacts/index.tsx` is twelve lines, of which one
is the screen:

```tsx
import {ContactsView} from '../../../source/views/contacts'
```

and `source/views/contacts/index.ts` exists only to rename
`ContactsListView` to `ContactsView` on the way through. Opening the route
tells you nothing about the screen; you follow two hops to read it.

`source/views/` also holds a good deal that was never a view — the building
hours reducer, the course-search filter formatter — both imported by Redux
rather than by any screen.

## The rule

A file moves into `app/` if and only if it is the screen that **exactly one**
route renders. It then moves *into that route file*, so the route is the
screen: one component, no wrapper, no re-export.

Everything else moves to `source/features/<feature>/`, keeping its current
internal layout.

Three exceptions, each forced rather than chosen:

- **A screen backing two or more routes stays in `source/features/`.**
  Counting per component rather than per file, exactly one screen qualifies:
  `DebugKeyPathScreen` in `settings/screens/debug/route-screen.tsx`, rendered
  by both `Debug/index.tsx` and `Debug/[...keyPath].tsx`. Inlining would
  duplicate it. (Three query-option exports are also multi-route —
  `buildingByNameOptions`, `wordByTermOptions`, `jobByIdOptions` — and are
  support, so they stay regardless.)
- **A screen a non-route file actually *renders* stays in `source/features/`**,
  even with only one route, since inlining would strand that consumer. No
  screen currently qualifies. When checking this, distinguish a real consumer
  from a pass-through barrel: `transportation/index.tsx` imports
  `OtherModesView` only to `export {OtherModesView}` for the route's benefit,
  which is a barrel to delete, not a dependency to respect. Five *support*
  exports do have real non-route consumers and stay regardless:
  `FaqBannerGroup` and `FAQ_TARGETS` (rendered by the settings overview and
  `sis/balances`), `FILL_WIDTH`, `createMomentForDay`, `useRedditPreferences`.
- **A file holding several single-route screens splits.** Each screen goes to
  its own route; whatever else the file exported stays behind.
  `streaming/radio/schedule.tsx` is the case: `KSTOScheduleView` and
  `KRLXScheduleView` go to `Streaming Media/ksto.tsx`-adjacent routes
  `KSTOSchedule.tsx` and `KRLXSchedule.tsx` respectively, while
  `KSTO_POWERED_BY` and `KRLX_POWERED_BY` remain in
  `source/features/streaming/radio/` for `EventDetail.tsx`.
- **Anything with a test stays in `source/features/`.** Tests cannot live
  under `app/` (see below). All 38 existing test files target support code —
  `lib/` functions, the building reducer, the FAQ store, `comment-row` and
  `post-list` — so no test needs to move into a route.
- **Barrels die only where they aliased screens.** `contacts/index.ts` goes;
  a barrel exporting support survives.

`source/views/views.ts`, the `AllViews` home-tile registry, is neither view
nor screen and becomes `source/features/views.ts`.

## The verified inventory

Derived by resolving every route import through its barrel chain to the file
that defines it, then listing that file's importers by resolved module path
rather than by name. Both steps matter: name-based counting reported
`OtherModesView` as shared when its only other mention is a pass-through
re-export, and reported the `More` screen as having 161 consumers because it
is exported under the name `View`, which collides with react-native's.

**75 files back routes**, of which 47 are rendered by exactly one route and
imported by nothing else, so they inline directly.

Counting only the files routes import *directly* gives 24 and is wrong: it
misses every screen reached through a barrel, which shows up as imported by one
non-route file and zero routes.

**Hybrid files** both define a screen and re-export siblings:
`faqs/index.tsx`, `menus/index.tsx`, `reddit/index.tsx`,
`transportation/index.tsx`, `building-hours/list.tsx`. Their defined screen
inlines like any other, and their re-export lines simply vanish — each
re-exported screen inlines into its own route, and each re-exported support
file gets imported directly by whoever still needs it. Re-export lines must not
travel into a route file; a route exports one component and nothing else.

Recognising hybrids matters: judging a file by whether some non-route file
mentions its exports reports `building-hours/detail/index.tsx`,
`menus/carleton-menus.tsx` and `reddit/post-detail.tsx` as blocked, when the
only "consumer" in each case is a re-export in a file that is itself being
emptied.

**When inlining empties a file down to shared leftovers, the leftovers move to
a named support file** rather than staying in a file named after the departed
screen. Two cases, both attribution constants that two routes each need after
the split:

| leftover | from | to |
| --- | --- | --- |
| `STOLAF_POWERED_BY`, `NORTHFIELD_POWERED_BY` | `calendar/index.tsx` | `source/features/calendar/constants.ts` |
| `KSTO_POWERED_BY`, `KRLX_POWERED_BY` | `streaming/radio/schedule.tsx` | `source/features/streaming/radio/constants.ts` |

`constants.ts` follows `faqs/constants.ts`, which already holds `FAQ_TARGETS`
in this role. The other four splitting files —
`news/index.tsx`, `menus/index.tsx`, `reddit/index.tsx`,
`transportation/index.tsx` — hold nothing but screens and re-exports, so they
are deleted outright.

**Eight barrels die**, having only ever re-exported: `building-hours/index.ts`,
`contacts/index.ts`, `dictionary/index.ts`, `directory/index.ts`,
`settings/screens/api-test/index.ts`, `stoprint/index.ts`,
`streaming/index.tsx`, `student-orgs/index.ts`.

**Seven files back more than one route.** Six define several distinct
single-route screens and split; the seventh, `debug/route-screen.tsx`, backs two
routes with the *same* component and therefore stays:

| file | inlines | stays |
| --- | --- | --- |
| `calendar/index.tsx` | `StOlafCalendarView`, `NorthfieldCalendarView` | `STOLAF_POWERED_BY`, `NORTHFIELD_POWERED_BY` |
| `news/index.tsx` | `StOlafNewsView`, `MessNewsView` | — |
| `reddit/index.tsx` | `StOlafFeedScreen`, `CarletonFeedScreen` | re-export of `PostDetailView` dies |
| `menus/index.tsx` | `StavHallMenuView`, `TheCageMenuView`, `ThePauseMenuView` | re-export block dies |
| `transportation/index.tsx` | `ExpressLineBusView`, `RedLineBusView`, `BlueLineBusView`, `OlesGoView` | `BusView` stays support |
| `streaming/radio/schedule.tsx` | `KSTOScheduleView`, `KRLXScheduleView` | `KSTO_POWERED_BY`, `KRLX_POWERED_BY` |

**One file is genuinely shared and stays:**
`settings/screens/debug/route-screen.tsx`.

Every other file a route imports is support — `query.ts`, `types.ts`,
`constants.ts`, `store.ts`, `views.ts`, `faqs/index.tsx`, `bus/line.tsx`,
`bus/components/day-picker.tsx`, `home/button.tsx` — and stays by the rule.

Four features alias a screen to `View` on the way out and back again
(`export {MoreView as View}` in the file, `export {View as DictionaryView}` in
the barrel): `dictionary`, `student-orgs`, `transportation/other-modes`,
`more`. That indirection disappears with the barrels.

## Why not colocate everything under `app/`

Wholesale colocation was the first choice, and expo-router 57 forbids it. The
route glob in `expo-router/_ctx.ios.js` is:

```
/^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)|(?:\+middleware)))\.[tj]sx?$).*(?:\.android|\.web)?\.[tj]sx?$/
```

Every `.ts`/`.tsx` file under the app root matches, save `+api`, `+html` and
`+middleware`. There is no private-directory convention, and the `options.ignore`
hook in `getRoutesCore.js` is internal to static rendering and the
testing-library ponyfill — unreachable from app config.

So a colocated `query.ts` registers the route `/Contacts/query` and warns
*"Route … is missing the required default export"* on startup, while a
colocated `row.tsx` registers a **silently navigable** route rendering a bare
list row, because it does export a component. Both pollute typed routes, which
this project has enabled. A `__tests__/list.test.tsx` would likewise become
`/Contacts/__tests__/list`.

## Naming

`source/features/` — the honest description of a folder holding reducers,
query options, types and row components alongside the odd shared screen.

## Settings

`source/views/settings/screens/` already mirrors the route tree, so its
mapping is mechanical:

| from | into |
| --- | --- |
| `screens/credits.tsx` | `app/(settings)/Credits.tsx` |
| `screens/legal.tsx` | `app/(settings)/Legal.tsx` |
| `screens/privacy.tsx` | `app/(settings)/Privacy.tsx` |
| `screens/overview/index.tsx` | `app/(settings)/SettingsRoot.tsx` |
| `screens/api-test/list.tsx` | `app/(settings)/APITest.tsx` |
| `screens/api-test/detail.tsx` | `app/(settings)/APITestDetail.tsx` |
| `screens/banner-builder/index.tsx` | `app/(settings)/BannerBuilder.tsx` |
| `screens/network-logger/index.tsx` | `app/(settings)/NetworkLogger.tsx` |
| `screens/overview/report-problem/screen.tsx` | `app/(settings)/ReportProblem.tsx` |
| `screens/overview/component-library/{badge,button,colors,context-menu,faq-banners,index}.tsx` | the six `app/(component-library)/` routes |

`component-library/library.tsx` and `component-library/base/library-wrapper.tsx`
back no route and stay in `source/features/settings/`.

`screens/debug/route-screen.tsx` stays in `source/features/settings/`: both
`Debug/index.tsx` and `Debug/[...keyPath].tsx` render its `DebugKeyPathScreen`,
so it is a two-route screen. `screens/debug/list.tsx` backs no route either —
`route-screen.tsx` consumes it.

`app/(settings)/BonAppPicker.tsx` renders a screen from a different feature,
`source/views/menus/dev-bonapp-picker`. It inlines when **menus** moves, not
when settings does, so the settings commit leaves that one route untouched and
no path is edited twice. Afterwards the route imports `BonAppHostedMenu` from
`source/features/menus/menu-bonapp` — a settings route reaching into menus
support, which is what a BonApp preview tool inherently does. That import is
safe because no route renders `BonAppHostedMenu` itself, so it is never
inlined out from under this one.

Its section components — `developer.tsx`, `miscellany.tsx`, `support.tsx`,
`server-url.tsx`, `change-icon.tsx`, `login-credentials.tsx` — back no route.
They are parts of the overview screen and stay in `source/features/settings/`,
as do `gate.ts`, `submit.ts`, `version.ts`, `use-server-discovery.ts`,
`get-at-key-path.ts`, `query.ts`, the highlight helpers, and
`components/rows.tsx`.

## Per-feature commit

Five steps, the same every time:

1. `mv source/views/<feature> source/features/<feature>`. Plain `mv` — jj
   records the rename, and relative imports inside the folder are unaffected.
2. Move each single-route screen's body into its route file, leaving one
   component.
3. Delete barrels that only aliased screens.
4. Repoint the surviving imports: the route files' own, plus the four edges
   from outside the tree — one each in `source/lib/storage.ts` and
   `source/redux/parts/courses.ts`, two in
   `source/redux/parts/building-hours-report.ts` — and the single
   cross-feature import within it.
5. `mise run agent:pre-commit`, then commit.

Measured coupling, which is what makes this cheap: 97 import references from
`app/` into `source/views/`, four from anywhere else, one across features, and
no tsconfig path aliases.

## Order

Settings first, while checkpoint 4's shape is fresh and before more work piles
onto the old paths. Then:

1. `settings` (44 files)
2. `contacts`, `student-orgs`, `directory` — identical list/detail shape (6 each)
3. `calendar`, `more`, `news`, `faqs`, `home` — single screens
4. `menus`, `streaming`, `reddit`, `dictionary`, `stoprint` — tabbed or nested
5. `transportation` (33), `building-hours` (43), `sis` (20)

Seventeen commits, one MR, branched off PR #7709's tip and targeting
`hawken/working`; retarget to `master` once #7709 merges.

`home` has no wrapper to collapse — `app/(home)/index.tsx` is already the real
home screen — so its three files simply relocate.

## Verification

- `mise run tsc` — a move that breaks an import cannot type-check. This is the
  main guard.
- `mise run test` — covers the support code, which carries every test.
- **The path set under `app/` must be byte-identical before and after every
  commit.** Screens merge into route files that already exist, so nothing new
  may appear and nothing may vanish; `find app -type f | sort` diffed across
  the commit proves it. A change there means an accidental route, a lost one,
  or drifted typed routes.
- The UITest shards drive real navigation and are the functional check. Run
  them on CI per push rather than locally per commit; run them locally once
  before the MR goes up.

## Out of scope

- Screens living in `modules/` (`@frogpond/*`), such as `MenuItemDetail`.
- Any behaviour change. Every commit is a move plus the import edits it forces.
- Renaming routes or changing the URL surface.
