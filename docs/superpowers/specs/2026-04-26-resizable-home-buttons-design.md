# Resizable Home Screen Buttons — Design

**Date:** 2026-04-26
**Branch:** `claude/resizable-home-buttons-tAQN6`

## Summary

Extend the All About Olaf home screen so each tile (today a fixed-size button) can be resized between four sizes via an iOS context menu surfaced on long-press. Sizes are persisted automatically across app launches.

The four sizes are expressed in **height × width** unit cells, on a 4-column grid where one unit cell is roughly a quarter of the screen wide:

| Size | Rows | Cols | Description |
|------|------|------|-------------|
| `1x1` | 1 | 1 | quarter-screen, single height |
| `1x2` | 1 | 2 | half-screen, single height (current button, default) |
| `2x2` | 2 | 2 | half-screen, double height (square-ish) |
| `2x4` | 2 | 4 | full-width, double height |

## Goals

- Per-tile size selection via long-press → iOS native context menu.
- Sizes persist automatically across app launches with no user action required.
- Existing layout (all tiles at `1x2`) is preserved on first run for users upgrading.
- Layout adapts on rotation and across device sizes.
- "Reset home screen layout" action available so users (and UI tests) can return to defaults.

## Non-goals (deferred to follow-up specs)

1. **Drag-to-reorder edit mode.** Tile order continues to come from `source/views/views.ts` in this work.
2. **Live content previews** in 2×2 / 2×4 (e.g., today's menu, next bus). The 2×4 reserves a subtitle slot to make this addition cheap later, but no view-specific data fetching happens in v1.
3. **Settings-screen UI for sizes.** Long-press is the only affordance.

## Layout strategy

Tiles render in the order from `views.ts` using **strict-order packing**: a cursor advances left-to-right, top-to-bottom; if the next tile doesn't fit in the remaining columns of the current row, the row ends and a gap is left. This keeps a tile's position predictable from "what's before me, and how big am I" — no Tetris-style backfill, no orphan-promotion.

Gaps are accepted as visually honest about what the user has chosen. Rotation and width changes are handled by recomputing positions against `useWindowDimensions()`.

## Architecture

```
HomePage
└── ScrollView
    ├── FaqBannerGroup            (unchanged)
    ├── HomeScreenGrid            (NEW; replaces partition-by-index + Column[])
    │     props: views, renderTile
    │     uses: packTiles() → PackedTile[]
    │     renders absolute-positioned children inside a sized View
    │     for each PackedTile, calls renderTile(packed)
    │           └── HomeScreenTile  (NEW orchestrator)
    │                 - useSelector(selectHomescreenSize(view.id))
    │                 - useDispatch() for size changes
    │                 - useNavigation() / openUrl() for tap
    │                 - wraps button in <ContextMenu>
    │                 └── HomeScreenButton  (existing, now size-aware)
    │                       - renders icon / title per size variant
    └── UnofficialAppNotice       (existing; gains "Reset home screen layout" menu item)
```

Component responsibilities are kept narrow:

- **`packTiles`** — pure function. Knows the 4-column grid and tile dimensions; emits `(view, size, row, col)`. No RN imports, no Redux, no navigation. Easy to unit-test layout edge cases.
- **`HomeScreenGrid`** — pure layout. Takes `views` plus a `renderTile` callback; calls `packTiles` and positions outputs. Doesn't know about Redux, navigation, or the context menu.
- **`HomeScreenTile`** — orchestrator. Reads size from Redux, wires the iOS context menu, dispatches resize, calls navigate/openUrl on tap.
- **`HomeScreenButton`** — pure rendering. Given `view` and `size`, renders the appropriate variant. No state, no callbacks beyond `onPress`.

This split keeps the packer testable in isolation and keeps the visual button purely presentational.

## Data model

### Stable view identifiers

`source/views/views.ts` — add a required `id: string` to `CommonView`:

```ts
type CommonView = {
  id: string                              // NEW: stable, unique, never reused
  title: string
  icon: keyof typeof EntypoGlyphs
  foreground: 'light' | 'dark'
  tint: string
  disabled?: boolean
}
```

Initial id slugs (kebab-case, derived from current titles):
`menus`, `sis`, `building-hours`, `calendar`, `directory`, `streaming-media`, `news`, `campus-map`, `important-contacts`, `transportation`, `campus-dictionary`, `student-orgs`, `more`, `stoprint`, `course-catalog`, `oleville`.

The id is the storage key. Once shipped, ids must not be renamed or reused — that would silently move or lose a user's saved size for that tile. Title and `NavigationKey` may continue to drift independently.

### Tile size types

New file `source/views/home/types.ts`:

```ts
export type TileSize = '1x1' | '1x2' | '2x2' | '2x4'

export const TILE_SIZES: readonly TileSize[] = ['1x1', '1x2', '2x2', '2x4']
export const DEFAULT_TILE_SIZE: TileSize = '1x2'

export const TILE_DIMENSIONS: Record<TileSize, {rows: 1 | 2; cols: 1 | 2 | 4}> = {
  '1x1': {rows: 1, cols: 1},
  '1x2': {rows: 1, cols: 2},
  '2x2': {rows: 2, cols: 2},
  '2x4': {rows: 2, cols: 4},
}

export const GRID_COLUMNS = 4
```

Size labels shown in the iOS menu (mapped from keys at the call site, not stored):

| Key   | Label    |
|-------|----------|
| `1x1` | Small    |
| `1x2` | Medium   |
| `2x2` | Large    |
| `2x4` | Wide     |

### Redux state

`source/redux/parts/settings.ts` — extend the existing slice. The slice is already auto-persisted by `redux-persist` via `source/redux/store.ts`, so no migration plumbing is needed.

```ts
type State = {
  unofficialityAcknowledged: boolean
  devModeOverride: boolean
  homescreenSizes: Record<string, TileSize>   // NEW: keyed by view.id
}

const initialState: State = {
  unofficialityAcknowledged: false,
  devModeOverride: false,
  homescreenSizes: {},
}

// new reducers
setHomescreenTileSize(state, {payload}: PayloadAction<{id: string; size: TileSize}>) {
  state.homescreenSizes[payload.id] = payload.size
}
resetHomescreenSizes(state) {
  state.homescreenSizes = {}
}

// new selector
export const selectHomescreenSize = (id: string) => (state: RootState): TileSize =>
  state.settings.homescreenSizes[id] ?? DEFAULT_TILE_SIZE
```

Migration: none. Existing devices have no `homescreenSizes` key; rehydration falls through to the `{}` initial state, and every view falls back to `DEFAULT_TILE_SIZE` (= `'1x2'`, today's appearance). `persistConfig.version` does not need to be bumped — this change is purely additive.

## Packer

New file `source/views/home/pack-tiles.ts` — pure function, no RN imports.

```ts
export type PackedTile = {
  view: ViewType
  size: TileSize
  row: number   // 0-indexed in unit rows
  col: number   // 0-indexed in unit columns (0–3)
}

export function packTiles(
  views: ViewType[],
  sizeOf: (view: ViewType) => TileSize,
): PackedTile[]
```

### Algorithm

Maintain a cursor `(row, col)` starting at `(0, 0)` and a per-row occupancy set so 2-row tiles correctly block subsequent placements.

For each view in order:

1. Look up its `{rows, cols}` from `TILE_DIMENSIONS`.
2. While the tile would overflow the right edge or overlap a column reserved by a previous 2-row tile, advance the cursor to the next free cell (column-by-column, wrapping to the next row at column 4).
3. Place the tile at the cursor. Mark the cells it occupies (`rows × cols`) as used.
4. Advance the cursor past the placed tile's columns on its first row; continue with the next view.

The function returns `PackedTile[]` in the same order as input. Skipped cells remain unmarked — they're the visible gaps that Strategy A allows.

### Examples

- All defaults (`1x2`): pairs of tiles fill each row of 4 cols → identical to today's two-column layout.
- `[1x1, 1x2, ...]` at position `(0, 0)`: 1×1 at col 0, 1×2 at cols 1–2, next tile (a 1×2) drops to row 1 since only col 3 is free.
- `[1x1, 2x4, ...]` at position `(0, 0)`: 1×1 at col 0, 2×4 needs 4 cols and only 3 are free → 2×4 drops to rows 1–2 spanning cols 0–3, leaving cols 1–3 of row 0 empty.
- `[2x2, 1x2, 2x4]`: 2×2 at rows 0–1 cols 0–1; 1×2 at row 0 cols 2–3; the 2×4 needs 4 contiguous cols, so the cursor wraps to row 1 — but cols 0–1 are reserved and the remaining 2 cols can't hold it, so it wraps again and lands at rows 2–3 cols 0–3. This leaves a 2-cell gap at row 1 cols 2–3 (the visible cost of mixing a wide tile in after a tall one).

## Grid component

New file `source/views/home/grid.tsx`.

### Approach

Position children via absolute positioning inside a wrapping `View` whose total height equals `(maxRow + 1) × (UNIT_HEIGHT + GRID_GUTTER)`. Each tile's `left`, `top`, `width`, and `height` are computed from `(col, row, dimensions, unitWidth, UNIT_HEIGHT)`.

Why not Flexbox row wrapping? A tall tile (e.g. 2×2) next to a short tile (1×2) leaves layout undefined for whatever flows after — RN's flex wrap can't model "skip a column on row N+1 because row N's tile is still occupying it". Computing positions explicitly is simpler than fighting the flex model.

### Constants

```ts
const UNIT_HEIGHT = 80                 // current button visual height; tunable
const GRID_GUTTER = CELL_MARGIN        // reuse existing 10pt
// unitWidth = (screenWidth - 2 × outerPadding - 3 × GRID_GUTTER) / 4
```

`screenWidth` comes from `useWindowDimensions()` so rotation, multitasking, and iPad split-view recalculate naturally.

### Props

```ts
type Props = {
  views: ViewType[]
  renderTile: (packed: PackedTile) => React.ReactElement
}
```

The grid is purely presentational. `HomePage` passes `views` (already filtered by `disabled`) and a `renderTile` callback that returns a `<HomeScreenTile />`.

## Button — size variants

`source/views/home/button.tsx` gains a `size: TileSize` prop and four content variants, picked via a small `contentForSize(size)` helper that returns layout config (column-vs-row, icon size, whether to show the title, title style, line-clamp). One render path with conditional pieces, not four near-duplicate trees.

| Size | Layout | Icon | Title | Subtitle |
|------|--------|------|-------|----------|
| `1x1` | column, centered | 24pt | hidden visually (kept on `accessibilityLabel`) | — |
| `1x2` | column, centered | 32pt (current) | 14pt, 1 line, truncating tail | — |
| `2x2` | column, centered | 44pt | 15pt, up to 2 lines | — |
| `2x4` | row, icon left, text right | 40pt | 17pt semibold, 1 line | reserved slot, hidden in v1 |

The 2×4 reserves a subtitle slot in JSX (rendering `null` for now) so the deferred "live previews" follow-up can populate it without restructuring the component.

The outer `Touchable` always fills its grid cell — width and height come from the grid's positioning. The 44pt minimum touch target is satisfied at every size: even 1×1 (~80–90pt wide × ~70pt tall on a typical iPhone) exceeds it.

`accessibilityLabel` always reads the title regardless of size, so 1×1 is still announced as e.g. "Menus" by VoiceOver.

## Tile orchestrator & context menu

New file `source/views/home/tile.tsx` — the orchestrator wrapping each cell.

```ts
function HomeScreenTile({view}: {view: ViewType}) {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const size = useSelector(selectHomescreenSize(view.id))

  const onPress = () => {
    if (view.type === 'url') openUrl(view.url)
    else if (view.type === 'view') navigation.navigate(view.view)
    else throw new Error(`unexpected view type ${view.type}`)
  }

  const onPressMenuItem = (key: string) => {
    if (TILE_SIZES.includes(key as TileSize)) {
      dispatch(setHomescreenTileSize({id: view.id, size: key as TileSize}))
    }
  }

  return (
    <ContextMenu
      actions={[
        {key: '1x1', title: 'Small'},
        {key: '1x2', title: 'Medium'},
        {key: '2x2', title: 'Large'},
        {key: '2x4', title: 'Wide'},
      ]}
      selectedAction={size}
      onPress={onPress}
      onPressMenuItem={onPressMenuItem}
      title="Tile size"
      testID={`home-tile-${view.id}`}
    >
      <HomeScreenButton view={view} size={size} />
    </ContextMenu>
  )
}
```

### Why this works with `@frogpond/context-menu`

- `selectedAction` already renders a checkmark on the matching item — same affordance as the dev-mode toggle in `notice.tsx`.
- `isMenuPrimaryAction: false` (the default) gives us tap → `onPress` (navigate), long-press → menu (resize). No conflict with the iOS context menu requirement.
- It wraps `react-native-ios-context-menu` underneath — the iOS-native UI the user asked for.

### Module change to `@frogpond/context-menu`

Today, `actions: string[]` and the visible label is `upperFirst(action)`. We need separate keys (stable storage values like `'1x1'`) and labels (human strings like `"Small"`). Extend the prop to accept either form:

```ts
actions: string[] | Array<{key: string; title: string}>
```

The implementation normalizes to `{key, title}` and keeps the existing `upperFirst` behavior for the `string[]` form, so all current callers (`notice.tsx`, `day-picker.tsx`, etc.) keep working unchanged. `selectedAction` continues to compare against the key.

### Selector hookup

`HomeScreenTile` uses `useSelector(selectHomescreenSize(view.id))` so it re-renders only when its own size changes, not when any sibling tile's size changes.

## Reset to default

`source/views/home/notice.tsx` gains a third action on its existing context menu:

```ts
const RESTART_ACTION = 'Restart app'
const DEV_MODE_ACTION = 'Enable dev mode'
const RESET_LAYOUT_ACTION = 'Reset home screen layout'

// in onPressMenuItem:
} else if (menuKey === RESET_LAYOUT_ACTION) {
  dispatch(resetHomescreenSizes())
}
```

The full actions array becomes `[RESTART_ACTION, DEV_MODE_ACTION, RESET_LAYOUT_ACTION]`. No new affordance for users to discover — sits where they already long-press for restart/dev-mode actions, and the menu surface is already visible to UI tests.

## Testing

### Unit tests (Jest, no RN renderer)

- `pack-tiles.test.ts`
  - All `1x2` tiles produce the same `(row, col)` sequence as today's two-column layout (regression fixture).
  - Empty input → empty output.
  - A single `2x4` occupies row 0 spanning cols 0–3.
  - Mixed sequence `[1x2, 1x2, 2x2, 1x1, 1x2]` produces expected `(row, col)` for each, with the gap after the orphan 1×1.
  - `2x2` followed by `1x2` — verifies the 2-row tile's columns on row 1 are reserved (subsequent tiles flow into adjacent free columns, then to next row).
  - `1x1` followed by `2x4` — verifies the 2×4 drops to row 1 because cols 1–3 of row 0 cannot accommodate a 4-col tile.
  - Cursor wrapping: a `2x4` placed when the cursor is at col 2 wraps to the next row.
- `views.test.ts`
  - All `view.id` values across `AllViews()` are unique.
  - All ids match `^[a-z0-9-]+$` (kebab-case slug).
- `settings-slice.test.ts`
  - `setHomescreenTileSize({id, size})` writes to the map.
  - `selectHomescreenSize('unknown-id')` returns `DEFAULT_TILE_SIZE`.
  - `resetHomescreenSizes` clears the map.

### Component tests (RN Testing Library)

- `tile.test.tsx`
  - Tap fires navigation/openUrl per view type (preserves current behavior).
  - The component renders `ContextMenu` with the four size actions and `selectedAction` matching the Redux state.
  - Dispatching a resize through the menu callback updates Redux and re-renders the button at the new size.
- `button.test.tsx`
  - Each of the four sizes renders the expected variant (presence/absence of title text, icon size as a style prop, row vs column layout).
  - `accessibilityLabel` reads the title at every size, including 1×1 where the title is visually hidden.

No snapshot tests for the grid — its output is positions in pixels, which are brittle. The packer's outputs are tested as data; the rendered grid is exercised end-to-end via the component tests above.

### XCUITests

Extend `ios/AllAboutOlafUITests/ModuleHomeTests.swift` (keeping all home-screen behavior in one file). The existing `testShowsTheHomeScreen` and `testLongPressNoticeTogglesDevMode` are unchanged.

```swift
func testLongPressTileChangesSize() throws {
    let homescreen = app.element(matching: "screen-homescreen")
    XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

    XCTContext.runActivity(named: "resize tile via context menu") { _ in
        // Long-press home-tile-menus, capture frame, tap "Large", assert
        // the new frame's height is greater than originalFrame.height × 1.5
        // (safe threshold against gutter rounding).
    }

    XCTContext.runActivity(named: "size persists across launches") { _ in
        // app.terminate(); app.launch()
        // Long-press home-tile-menus again; assert the menu's "Large" item
        // has isSelected == true (the selectedAction indicator).
    }

    XCTContext.runActivity(named: "small tile preserves accessibility label") { _ in
        // Resize home-tile-menus to "Small" via the context menu.
        // Assert app.buttons["Menus"].exists is still true — accessibility
        // label is announced even though the title text is visually hidden.
    }

    XCTContext.runActivity(named: "reset from notice menu restores defaults") { _ in
        // Capture menus frame.
        // Long-press home-notice; tap "Reset home screen layout".
        // Assert menus frame returns to default 1x2 dimensions.
    }
}

func testGapBehaviorWithOrphanSmallTile() throws {
    // setUp: home screen visible.
    // Resize home-tile-menus to "Small" (1x1 at col 0).
    // Resize home-tile-sis to "Wide" (2x4, needs 4 cols).
    // SIS can't fit in remaining 3 cols of row 0, so it drops to row 1.
    // Assert sis.frame.minY > menus.frame.maxY.
    // tearDown: long-press notice → "Reset home screen layout".
}

func testRotationReflowsLayout() throws {
    // Capture home-tile-menus frame in portrait.
    // XCUIDevice.shared.orientation = .landscapeLeft
    // Wait briefly for the layout animation, capture frame again.
    // Assert width changed (proves layout recomputed against new screen width).
    // tearDown: restore .portrait.
}
```

Each mutating test uses the notice menu's "Reset home screen layout" action in its tearDown / final activity, so tests don't pollute each other regardless of execution order. (XCUITest re-launches the app for each test method, but `redux-persist` shares AsyncStorage across launches — hence the explicit reset.)

### Manual iOS verification before merging

- Long-press each size of tile, pick a different size, confirm it persists across an app restart.
- Rotate the device — layout recomputes.
- Resize a tile to 1×1 followed by another to 2×4 — verify the gap behavior.
- VoiceOver each size and confirm titles are still announced.

## Files touched

**New:**

- `source/views/home/types.ts`
- `source/views/home/pack-tiles.ts`
- `source/views/home/grid.tsx`
- `source/views/home/tile.tsx`
- `source/views/home/__tests__/pack-tiles.test.ts`
- `source/views/home/__tests__/tile.test.tsx`
- `source/views/home/__tests__/button.test.tsx`
- `source/views/__tests__/views.test.ts`
- `source/redux/parts/__tests__/settings.test.ts`

**Modified:**

- `source/views/views.ts` (add `id` field)
- `source/views/home/index.tsx` (use `HomeScreenGrid` instead of `partitionByIndex`)
- `source/views/home/button.tsx` (size-aware variants)
- `source/views/home/notice.tsx` (reset-layout menu item)
- `source/redux/parts/settings.ts` (`homescreenSizes` field, reducers, selector)
- `modules/context-menu/index.tsx` (accept `Array<{key, title}>` for actions)
- `ios/AllAboutOlafUITests/ModuleHomeTests.swift` (new tests)

**Removed:**

- Nothing. `source/lib/partition-by-index.ts` is also consumed by `source/views/streaming/webcams/list.tsx`, so it stays.

## Open questions

None at spec time. Implementation choices like the exact `UNIT_HEIGHT` value and final padding numbers will be tuned during the build to match the current visual feel.
