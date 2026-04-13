# All About Anything — MVP Design Spec

## Overview

A SwiftUI iOS app that reimagines All About Olaf as a generic, school-agnostic platform. The MVP mimics the home screen of the existing React Native app with a customizable grid of shortcut buttons.

**Stack:** Swift 6.2, SwiftUI, TCA (The Composable Architecture), GRDB, SPM for dependencies

**Project location:** `aaa/` directory (sibling to the existing React Native project root)

**Project type:** Standard Xcode `.xcodeproj` with SPM dependencies added via Xcode's package dependency UI.

## Data Model (GRDB)

### `home_item` — catalog of available items

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Stable identifier, e.g. `"menus"`, `"sis"` |
| `title` | TEXT NOT NULL | Display label |
| `sf_symbol` | TEXT NOT NULL | SF Symbol name, e.g. `"fork.knife"` |
| `tint_color` | TEXT NOT NULL | Hex color for the icon circle |
| `destination_view` | TEXT | View identifier, nullable |
| `destination_url` | TEXT | URL string, nullable |

Constraint: `CHECK ((destination_view IS NOT NULL) != (destination_url IS NOT NULL))` — exactly one destination must be set.

### `home_item_customization` — per-user overrides

| Column | Type | Notes |
|--------|------|-------|
| `item_id` | TEXT PK, FK → home_item | |
| `sort_order` | INTEGER | Position in grid |
| `is_visible` | BOOLEAN | On the main grid (true) or in hidden section (false) |

Items without a customization row use the seed-data order and default to visible.

### Seed Data

A bundled `default-items.json` file seeds the `home_item` table on first launch. Initial items are ported from the React Native app's `AllViews()`, with Entypo icons mapped to SF Symbols:

| Item | SF Symbol | Tint Color | Destination |
|------|-----------|------------|-------------|
| Menus | fork.knife | #34c759 | view: menus |
| SIS | touchid | #ff9500 | view: sis |
| Building Hours | clock | #007aff | view: building-hours |
| Calendar | calendar | #af52de | view: calendar |
| Directory | person.text.rectangle | #ff2d55 | view: directory |
| Streaming Media | play.tv | #5ac8fa | view: streaming |
| News | newspaper | #5856d6 | view: news |
| Campus Map | map | #1c2541 | url: https://www.myatlascms.com/map/index.php?id=294 |
| Important Contacts | phone | #ff3b30 | view: contacts |
| Transportation | bus | #8e8e93 | view: transportation |
| Campus Dictionary | book | #ff2d55 | view: dictionary |
| Student Orgs | globe | #1c3879 | view: student-orgs |
| More | link | #30d158 | view: more |
| stoPrint | printer | #25c4b0 | view: print-jobs |
| Course Catalog | graduationcap | #bf5af2 | view: course-search |
| Oleville | safari | #ffcc00 | url: https://oleville.com/ |

## TCA Architecture

### `AppFeature` — root reducer

Owns the navigation stack. State contains a `StackState` with `HomeFeature` as root and `PlaceholderFeature` as a push destination. Handles path-based navigation via `StackAction`.

### `HomeFeature` — main reducer

**State:**
- `gridItems: IdentifiedArrayOf<HomeItem>` — visible items in display order
- `hiddenItems: IdentifiedArrayOf<HomeItem>` — hidden items in display order
- `isEditing: Bool` — edit mode toggle
- Navigation path managed by parent `AppFeature`

**Actions:**
- `onAppear` — loads items + customizations from GRDB, computes grid/hidden lists
- `toggleEditMode` — enters/exits edit mode
- `moveItem(from:to:)` — reorders within the visible grid only (not across grid/hidden boundary), persists new sort_order
- `hideItem(id:)` — moves item from grid to hidden section, persists
- `showItem(id:)` — moves item from hidden section back to grid, persists
- `itemTapped(id:)` — navigates to placeholder (only in non-edit mode)

**Dependencies:**
- `DatabaseClient`

### `PlaceholderFeature` — trivial reducer

**State:** item title, SF Symbol, tint color

Displays a "Coming Soon" screen with the item's icon and name. Validates that navigation works end-to-end.

### `DatabaseClient` — TCA dependency

Wraps GRDB access as a `DependencyKey`.

**Methods:**
- `seedIfNeeded()` — populates `home_item` from `default-items.json` on first launch
- `fetchHomeItems() -> [HomeItemWithCustomization]` — joins items with customizations
- `updateCustomization(itemId:sortOrder:isVisible:)` — upserts a customization row

Provides `liveValue` (backed by GRDB `DatabaseQueue`) and `testValue` / `previewValue` implementations.

## SwiftUI Views

### `HomeGridView`

Main screen. Two-column `LazyVGrid` with flexible columns. Toolbar "Edit" button toggles edit mode.

In normal mode: tapping a cell navigates to the placeholder screen.

In edit mode: cells show a red minus badge (top-left corner), items are draggable for reorder. Below the grid, a divider and "Hidden" section label introduce the hidden items.

### `HomeItemCell`

A single grid cell. Rounded rectangle containing:
- A colored circle with an SF Symbol (native iOS style, like Settings.app)
- Title label below
- In edit mode: red minus badge overlay (top-left)

### `HiddenItemsSection`

Inline section below the main grid, visible only in edit mode. Same grid layout as the main grid but cells are slightly dimmed with green plus badges. Tapping a hidden item restores it to the main grid.

Separated from the main grid by a divider and a small-caps "Hidden" section header.

### `PlaceholderView`

Destination screen pushed onto the navigation stack. Displays the item's SF Symbol (large, in tint color), title, and a "Coming Soon" subtitle. Standard back navigation via the stack.

## Project Structure

```
aaa/
└── AllAboutAnything.xcodeproj
    ├── AllAboutAnything/
    │   ├── AllAboutAnythingApp.swift        # Entry point, creates Store<AppFeature>
    │   ├── App/
    │   │   └── AppFeature.swift             # Root reducer, navigation stack
    │   ├── Features/
    │   │   ├── Home/
    │   │   │   ├── HomeFeature.swift         # Grid state + edit mode reducer
    │   │   │   ├── HomeGridView.swift        # Main grid view
    │   │   │   ├── HomeItemCell.swift        # Single grid cell
    │   │   │   └── HiddenItemsSection.swift  # Inline hidden items
    │   │   └── Placeholder/
    │   │       ├── PlaceholderFeature.swift   # Coming Soon reducer
    │   │       └── PlaceholderView.swift      # Coming Soon view
    │   ├── Database/
    │   │   ├── DatabaseClient.swift           # TCA DependencyKey
    │   │   ├── AppDatabase.swift              # GRDB setup + migrations
    │   │   ├── HomeItem.swift                 # GRDB Record
    │   │   └── HomeItemCustomization.swift    # GRDB Record
    │   └── Seed/
    │       └── default-items.json             # First-launch seed data
    └── AllAboutAnythingTests/
        ├── HomeFeatureTests.swift
        └── DatabaseClientTests.swift
```

## Out of Scope (MVP)

- Actual feature views (Menus, SIS, Calendar, etc.) — placeholder only
- Remote configuration or OTA item updates
- Multiple school/institution support (data model is generic, but no UI for switching)
- Jiggle animation in edit mode
- Bottom sheet drawer for hidden items (inline section for now)
- iPad or macOS support
- Dark/light mode theming beyond system default
