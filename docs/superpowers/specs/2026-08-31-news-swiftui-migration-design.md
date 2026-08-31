# News SwiftUI migration

## Goal

Port `source/features/news/news-list.tsx` and `news-row.tsx` from `FlatList`/
`@frogpond/lists` to `@expo/ui/swift-ui`, following the pattern already
established by Calendar (`modules/event-list`) and Menus
(`modules/food-menu`).

`NewsList`'s props (`query`, `thumbnail`) stay the same, so
`app/(home)/News/index.tsx` and `app/(home)/News/mess.tsx` need no changes.

## Architecture

`news-list.tsx`:

```
Host
  VStack(spacing: 0)
    RNHostView(matchContents)
      FilterToolbar          — unchanged, still plain RN (@frogpond/filter)
    List(listStyle: plain, refreshable: refetch)
      — one NewsRow per filtered story, via .map(), no Section
```

- **List style:** `plain`, matching News' current flat-list look (no cards —
  this is a deliberate divergence from Menus' `insetGrouped`).
- **Empty state** (filtered entries empty): `ContentUnavailableView` with
  `systemImage="newspaper"`. Title/description switch on whether a category
  filter is active:
  - No filter active: title "No news stories."
  - Filter active, nothing matches: title "No stories to show.", description
    "Try changing the filters."
- **Loading state:** `ProgressView` (native `@expo/ui/swift-ui` primitive) —
  `ContentUnavailableView` is for a settled empty state, not a transient
  fetch.
- **Error state** (`isError`): unchanged — an early return of the existing RN
  `NoticeView` with its retry button, before any SwiftUI tree is built at
  all. `ContentUnavailableView` has no action slot, so it isn't a fit here.

`news-row.tsx`:

```
Button(buttonStyle: plain)
  HStack
    RNHostView(matchContents)     — only when there's a thumbnail
      Image (RN)                  — local asset fallback or story.featuredImage
    VStack
      Text(title, lineLimit: 2)
      Text(excerpt, lineLimit: 3)
```

- Thumbnail stays a real RN `<Image>` bridged via `RNHostView`:
  `@expo/ui/swift-ui`'s own `Image` only takes `systemName`/`assetName`/a
  local `uiImage` file URI — no remote URL support — so it cannot render
  `story.featuredImage` or the bundled fallback source directly.
- Row separator: `alignmentGuide('listRowSeparatorLeading', 101)` on rows
  with a thumbnail, reproducing `ListSeparator`'s current `left: 101` inset;
  omitted (default full-bleed) on rows without one.
- Press behavior (`onPress`, "nowhere to go" `Alert`) is unchanged logic,
  moved from `ListRow.onPress` to `Button.onPress`.
- New `NEWS_ROW_PREFIX` constant + `accessibilityIdentifier`, matching
  `EVENT_ROW_PREFIX`/`FOOD_ROW_PREFIX`, plus an `accessibilityLabel`
  combining title/excerpt so the row states what's otherwise sighted-only.

## Data flow

`filterStories`, `cleanEntries`, `getStoryCategories`, and the `filters`
`useMemo` are pure JS and untouched by this migration.

## Testing

No new Jest coverage: the pure filtering/category logic already has no view
coupling and isn't touched by this change. There's no existing News view
test to migrate — `source/features/news/__tests__/` only covers feed
parsers. Per the project's Jest/XCUITest split, appearance (thumbnail
layout, separator inset, empty-state rendering) isn't something Jest can
see, so no test will assert it there.

A `uitests/News*.swift` suite verifying the migrated screen on-device is a
reasonable follow-up, using `NEWS_ROW_PREFIX`, but is out of scope for this
change — Calendar's and Menus' own migrations didn't require one in the same
pass either.

## Risk

Bridging each row's thumbnail through `RNHostView` carries the same
per-row overhead flagged for Menus' migration (`@expo/ui row cost is
scattered ARC`), but News feeds are small — tens of items per page, not
Menus' 200-item station lists — so it shouldn't be perceptible. Confirmed by
eye on the simulator once built, not asserted as a number here.

## Follow-up (tracked separately, not part of this branch)

Menus (`FancyMenu`) and Calendar (`EventList`) currently render their own
empty/error states with an ad-hoc `Text` or the plain RN `NoticeView`
instead of `ContentUnavailableView`. Migrating them is tracked as a
follow-up, not part of this change.
