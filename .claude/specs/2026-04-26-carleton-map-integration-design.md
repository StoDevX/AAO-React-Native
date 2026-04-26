# Carleton Map Integration — Design

**Date:** 2026-04-26
**Branch:** `claude/integrate-map-view-JkLNt`
**Status:** approved (pending user review of this written spec)

## Summary

Port the `map-carls/` view from [carls-app/carls](https://github.com/carls-app/carls) into AAO-React-Native as a native iOS map screen. Interim: the screen renders **Carleton's** building data and Mapbox style, inside the St. Olaf app, alongside (not replacing) the existing atlascms.com web-map link. Future work — tracked as follow-up issues — swaps in St. Olaf data and migrates off Mapbox.

## Goals

1. Native (non-WebView) campus map screen in AAO, ported from carls.
2. Modernize the carls implementation: Flow → TypeScript, class components → hooks, dead deps → modern equivalents.
3. Preserve carls' UX: tap-to-select buildings, search, category filter, building info card, draggable bottom sheet.
4. Keep the door open for swapping Carleton-specific URLs/style for St. Olaf equivalents later.

## Non-goals

- Porting carls' `MapReporterView` ("report a problem with this map" form).
- Android support (AAO is iOS-only).
- Replacing the existing `Campus Map → atlascms.com` URL tile in this PR.
- Provisioning St. Olaf-specific GeoJSON data or a St. Olaf Mapbox style.
- Persisting GeoJSON to disk for offline use beyond React Query's session cache.

## Decisions log (from brainstorming)

| # | Question | Decision |
|---|---|---|
| 1 | What map data does the new view show? | Carleton's, as-is — the carls API endpoint and Mapbox style URL are imported unchanged for now. |
| 2 | Native map SDK | `@rnmapbox/maps` (modern continuation of carls' `@mapbox/react-native-mapbox-gl`). Follow-up issue: research MapLibre / non-Mapbox alternatives. |
| 3 | Scope of port | Full port (search, categories, info card, bottom sheet) using `react-native-screens` native sheet detents in place of carls' custom drag overlay. Reporter view skipped. |
| 4 | Mapbox tokens | TODO placeholders. carls gitignores its `.env.js`, so we cannot copy values; user provides public + downloads tokens before merge. |
| 5 | Home-screen placement | Add a second tile alongside the existing `Campus Map → atlascms.com` URL tile. Title proposal: `"Carleton Map (Beta)"`. Final title/icon/tint locked in implementation. |
| 6 | User-location dot | On. Adds `NSLocationWhenInUseUsageDescription` + `PrivacyInfo.xcprivacy` precise-location declaration. |

## Architecture

### File layout

New directory: `source/views/map/`.

```
source/views/map/
  index.ts                       # barrel; exports NavigationKey = 'Map'
  map-screen.tsx                 # main screen — owns map + selection state
  building-picker.tsx            # sheet content: search + categories + list
  building-list.tsx              # FlatList of buildings
  category-picker.tsx            # iOS segmented control wrapper
  building-info.tsx              # sheet content: selected-building detail
  query.ts                       # useMapData() React Query hook
  types.ts                       # GeoJSON / Building / Feature types
  urls.ts                        # MAPBOX_CARLETON_STYLE
  lib/
    lookup-building.ts           # tap coords -> building, point-in-polygon
    parse-link-string.ts         # "Label <href>" parser
    __tests__/
      lookup-building.test.ts
      parse-link-string.test.ts
  __tests__/
    building-picker.test.tsx
    building-list.test.tsx
    category-picker.test.tsx
```

Skipped from carls' source tree: `info.android.js`, `segmentedcontrol.android.js`, `is-x.js`, `grabber.js`, `overlay.js`, `report/`, the second TS info variant. iOS-only and the native sheet replaces the overlay/grabber stack.

### Navigation

`source/navigation/types.tsx` — extend `RootViewsParamList`:

```ts
Map: undefined
MapBuildingPicker: undefined
MapBuildingInfo: { buildingId: string }
```

`source/navigation/routes.tsx` — register all three. `MapBuildingPicker` and `MapBuildingInfo` use:

```ts
{
  presentation: 'formSheet',
  sheetAllowedDetents: ['medium', 'large'],
  sheetLargestUndimmedDetent: 'large',
  sheetGrabberVisible: true,
  sheetCornerRadius: 16,
}
```

`MapScreen` runs `navigation.navigate('MapBuildingPicker')` in a mount `useEffect` so the picker auto-presents at the medium detent. Selecting a building from the picker calls `navigation.replace('MapBuildingInfo', { buildingId })` so swiping the sheet down dismisses straight back to the map (not picker → map).

### Home-screen tile

`source/views/views.ts` — append (do not remove the atlascms entry):

```ts
{ type: 'view', view: map, title: 'Carleton Map (Beta)', icon: 'compass', foreground: 'light', tint: <free gradient> }
```

Tint locked at implementation time after surveying current tints to avoid duplication.

## Dependencies

### New JS deps

| Package | Approx. version | Why |
|---|---|---|
| `@rnmapbox/maps` | ^10.x | Native Mapbox SDK, replaces carls' `@mapbox/react-native-mapbox-gl` |
| `@turf/boolean-point-in-polygon` | ^7.x | Tap-coordinate → which building polygon |
| `fuzzyfind` | ^2.x | Picker search ranking |
| `@react-native-segmented-control/segmented-control` | latest | iOS segmented control for `CategoryPicker` |

No removals.

### iOS native setup

1. **Podfile** — add at the top of the `AllAboutOlaf` target block:
   ```ruby
   $RNMapboxMapsImpl = 'mapbox'
   ```
2. **`mise run pods`** — installs new pods; commits `Podfile.lock`. Must be run by the user (or in CI with a downloads token); the agent environment cannot reach Mapbox's authenticated registry.
3. **Mapbox downloads token (build-time secret).** `@rnmapbox/maps` reads from `~/.netrc`:
   ```
   machine api.mapbox.com
     login mapbox
     password <SECRET_DOWNLOADS_TOKEN>
   ```
   For Xcode Cloud: the existing `ios/ci_scripts/ci_post_clone.sh` gains a block that writes `~/.netrc` from a `MAPBOX_DOWNLOADS_TOKEN` env var. Block ships with a TODO marker; user adds the env var to Xcode Cloud's secret-environment.
4. **Mapbox public access token (runtime).** Lives in a new `source/lib/mapbox.ts`:
   ```ts
   import MapboxGL from '@rnmapbox/maps'
   export const MAPBOX_PUBLIC_TOKEN = 'pk.TODO_REPLACE_BEFORE_MERGE'
   MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN)
   ```
   Imported once from `source/init/` so it runs at app start, before any Map screen mounts. User replaces the placeholder with the real `pk.…` token.
5. **`Info.plist`** — add `NSLocationWhenInUseUsageDescription` = `"Shows your location on the campus map."`.
6. **`PrivacyInfo.xcprivacy`** — add a `NSPrivacyCollectedDataType` entry with type `NSPrivacyCollectedDataTypePreciseLocation`, linked = false, tracking = false, purpose = `NSPrivacyCollectedDataTypePurposeAppFunctionality`.
7. **No Android changes.**

## Data flow

### Server data — second shared API client

`@frogpond/api` (`modules/api/index.ts`) gains a peer client:

```ts
import ky from 'ky'

export let client: typeof ky
export let carletonClient: typeof ky

export function setApiRoot(url: URL): void {
  client = ky.create({prefix: url})
}

export function setCarletonApiRoot(url: URL): void {
  carletonClient = ky.create({prefix: url})
}
```

`source/lib/constants.ts`:

```ts
export const CARLETON_DEFAULT_URL = 'https://carleton.api.frogpond.tech/v1'
```

`source/init/api.ts` — initializes both. The Carleton URL is hardcoded; the existing user-overridable `server-url.tsx` settings screen continues to govern only the St. Olaf URL.

```ts
setApiRoot(new URL(address))
setCarletonApiRoot(new URL(CARLETON_DEFAULT_URL))
```

`source/views/map/query.ts`:

```ts
import {useQuery} from '@tanstack/react-query'
import {carletonClient} from '@frogpond/api'

export function useMapData() {
  return useQuery({
    queryKey: ['carleton-map', 'geojson'],
    queryFn: () =>
      carletonClient.get('map/geojson').json<FeatureCollection<Building>>(),
    staleTime: 1000 * 60 * 60,
  })
}
```

### Client state

`MapScreen` uses `useReducer`:

```ts
type MapState = {
  selectedBuildingId: string | null
  category: 'Buildings' | 'Outdoors' | 'Parking' | 'Athletics'
  searchQuery: string
}

type MapAction =
  | { type: 'select-building'; id: string }
  | { type: 'clear-selection' }
  | { type: 'set-category'; category: MapState['category'] }
  | { type: 'set-search'; query: string }
```

Visible markers are derived (`selectedBuildingId == null ? [] : [selectedBuildingId]`), not stored. carls' `overlaySize` state disappears entirely — owned by `UISheetPresentationController`.

Picker → screen communication uses a small React context, **not** `route.params` callbacks (which break navigation-state serialization in React Navigation v7) and not Redux (this state is screen-local).

A `MapSelectionContext` defined in `source/views/map/selection-context.tsx` exposes `{ selectedBuildingId, selectBuilding, clearSelection }`. The provider wraps a nested `NativeStack` containing the three Map-related screens (`Map`, `MapBuildingPicker`, `MapBuildingInfo`); the nested stack is registered as a single screen on the root navigator. All three screens read/write via `useContext`. Concrete sequence on selection from picker:

1. `BuildingPicker` calls `selectBuilding(id)` then `navigation.replace('MapBuildingInfo', { buildingId: id })`.
2. `MapScreen` (mounted underneath, behind the sheet) sees `selectedBuildingId` change and updates its camera + drops the marker.
3. `BuildingInfo` reads the building from `useMapData()` keyed on `selectedBuildingId` (also accepts `route.params.buildingId` as a fallback for direct deep-links).

Concrete sequence on close from info card:

1. `BuildingInfo` calls `clearSelection()` then `navigation.goBack()`.
2. `MapScreen` removes its marker; the picker reappears beneath.

### Camera control

`useRef<MapboxGL.Camera>` ref. `useEffect` watching `selectedBuildingId` calls:

```ts
cameraRef.current?.setCamera({
  centerCoordinate: [lng, lat],
  zoomLevel: 17,
  animationDuration: 500,
})
```

carls' "shift latitude down by 0.0005 when overlay is open" hack is removed — `sheetLargestUndimmedDetent: 'large'` keeps the map full-bleed and the user can drag the sheet themselves.

### Tap-on-map → building lookup

Direct port of carls' `lookupBuildingByCoordinates` into `lib/lookup-building.ts`: iterate features, find each one's polygon geometry, call `@turf/boolean-point-in-polygon`. Pure function; jest unit test under `lib/__tests__/`.

### Errors & offline

- `useMapData()` errors → render an empty map plus a banner via `@frogpond/notice`. Map tiles still load from Mapbox even with no GeoJSON.
- Mapbox tile failures → handled by the SDK; no extra UI.
- No on-disk GeoJSON cache. React Query's in-memory cache covers session repeats; cold-launch offline shows the banner. Future work if needed.

## UI port — file-by-file diffs from carls

### `MapScreen` (`map-screen.tsx`)

- One `MapboxGL.MapView` in `StyleSheet.absoluteFill`, `styleURL={MAPBOX_CARLETON_STYLE}`, `logoEnabled={false}`, `showUserLocation={true}`.
- `MapboxGL.Camera` ref. Initial camera: centerpoint `[-93.15488752015, 44.460800862266]`, zoom 15 (carls values, unchanged).
- `onPress` adapter: new SDK passes a `GeoJSON.Feature<Point>`; convert to `[lng, lat]` and feed into `lookupBuildingByCoordinates`.
- `useEffect` on mount → `navigation.navigate('MapBuildingPicker')`.
- Visible marker: when `selectedBuildingId != null`, render one `MapboxGL.PointAnnotation` styled per carls (`white` outer circle, gold inner; `c.olevilleGold` → existing AAO gold from `@frogpond/colors` such as `c.yellowToGoldDark[0]`).

### `BuildingPicker` (`building-picker.tsx`)

- Lives on the `MapBuildingPicker` sheet screen.
- iOS-only: drop carls' `Platform.OS === 'android'` branch, drop `react-native-paper` `Searchbar`. Use a single iOS `SearchBar` — either AAO's existing pattern if one exists, or `react-native-screens` `headerSearchBarOptions` via `useLayoutEffect`.
- Empty query → `<CategoryPicker>` + filtered `<BuildingList>`.
- Non-empty query → `fuzzyfind(query, features, {accessor: b => `${name} ${nickname}`.toLowerCase()})`.
- On select → `navigation.replace('MapBuildingInfo', {buildingId})`.

### `CategoryPicker` (`category-picker.tsx`)

- `@react-native-segmented-control/segmented-control`.
- Categories `['Buildings', 'Outdoors', 'Parking', 'Athletics']`. Lookup table maps display name → carls' `Category` string (`'building' | 'outdoors' | 'parking' | 'athletics'`) for filtering.

### `BuildingList` (`building-list.tsx`)

- `FlatList` (per CLAUDE.md mobile priorities; carls used `ScrollView`).
- Row: name (primary), nickname or category (secondary), chevron. Built on `@frogpond/lists` for consistency with other AAO list screens.
- Row component is `React.memo`'d.

### `BuildingInfo` (`building-info.tsx`)

- Lives on the `MapBuildingInfo` sheet screen.
- Sections from carls' iOS variant: name + nickname header; first photo (if `properties.photos?.[0]`); description; tappable address (opens Apple Maps via `Linking.openURL('http://maps.apple.com/?q=...')`); accessibility; departments / offices / floors as link lists (each entry parsed via `parseLinkString`).
- `parseLinkString` ported to `lib/parse-link-string.ts` as a pure function; jest unit test.
- Header: Close button on the left, `navigation.goBack()` to return to the picker.

### Colors / tokens

All `c.olevilleGold`, `c.iosGray`, etc. references substitute one-for-one to existing values in `@frogpond/colors`. No new color values introduced.

### Accessibility

- Every touchable row: `accessibilityRole="button"` + `accessibilityLabel={building.name}`.
- Sheet grabber is native (handled by iOS).
- Map markers: `accessibilityLabel="${name} marker"` + `accessibilityRole="button"` on the `PointAnnotation` wrapper view.

## Testing

### Jest unit + component tests

| Test | Focus |
|---|---|
| `lib/__tests__/lookup-building.test.ts` | hits inside polygon; misses outside; ignores features without a polygon; multi-polygon features |
| `lib/__tests__/parse-link-string.test.ts` | `"Foo <https://x>"` → `{label, href}`; malformed input returns sensible default |
| `__tests__/building-picker.test.tsx` | empty categories → renders all four; non-empty query → fuzzy-filtered list; row press fires `onSelect(id)` |
| `__tests__/building-list.test.tsx` | renders N rows; row press fires callback; empty state |
| `__tests__/category-picker.test.tsx` | smoke render; change event |

### Mocks

- `jest.setup.ts` adds `import '@rnmapbox/maps/setup-jest'` so importing `@rnmapbox/maps` in tests doesn't blow up.

### No automated test for `MapScreen`

`MapboxGL.MapView` is a native bridge and is fully mocked in jest. Visual + interaction verification happens via the manual checklist below.

### Manual verification checklist (lives in PR description)

1. Open Map from home → screen mounts; sheet auto-presents at medium.
2. Drag sheet to small / large → map remains interactive at large.
3. Type in search → list filters; clear search → categories visible again.
4. Tap a category → list filters to that category.
5. Tap a building row → sheet swaps to info; map zooms + drops marker.
6. Close info → sheet returns to picker; marker clears.
7. Tap a building outline directly on the map → same selection flow.
8. Pan / zoom map → no jank; user-location dot visible after permission grant.
9. Cold-launch with no network → banner notes "couldn't load buildings".
10. Settings → Privacy → location permission listed.

## Risks

- **Mapbox tokens.** Without both, the iOS build won't run. PR lands with placeholders + CI-script TODO; user fills in before merge.
- **`Podfile.lock`.** Cannot regenerate in the agent environment without the downloads token. User runs `mise run pods` locally and commits the lockfile before pushing the final commit.
- **Carleton API availability.** If `carleton.api.frogpond.tech` is down, picker is empty; banner covers it. Migrating to St. Olaf data eliminates the cross-domain dependency.
- **App Store privacy review.** New precise-location declaration may be flagged on next submission. Expected.
- **One-frame flash on mount.** `useEffect → navigation.navigate(...)` runs after first render; the bare map shows for a frame before the sheet animates in. Acceptable; standard iOS behavior.

## Implementation sequencing (rough commit order)

1. `@frogpond/api` `carletonClient` + `init/api.ts` wiring + `CARLETON_DEFAULT_URL`.
2. JS deps: `@rnmapbox/maps`, `@turf/boolean-point-in-polygon`, `fuzzyfind`, `@react-native-segmented-control/segmented-control`.
3. iOS native: `Podfile` flag, `Info.plist`, `PrivacyInfo.xcprivacy`, `ci_post_clone.sh` netrc block (with TODO for env var name), `Podfile.lock` regenerated (by user).
4. `source/lib/mapbox.ts` (public token TODO + `setAccessToken`); init wired from `source/init/`.
5. Port pure files: `types.ts`, `urls.ts`, `lib/parse-link-string.ts`, `lib/lookup-building.ts` + tests.
6. UI: `building-list.tsx`, `category-picker.tsx`, `building-picker.tsx`, `building-info.tsx`.
7. `query.ts`, `map-screen.tsx`, `index.ts`.
8. Navigation: register `Map`, `MapBuildingPicker`, `MapBuildingInfo` in `navigation/types.tsx` + `routes.tsx`.
9. Append home-screen tile to `views.ts`.
10. `jest.setup.ts` Mapbox mock import.
11. `mise run agent:pre-commit` clean.

## Follow-up issues to file when PR opens

1. **Migrate Map view off Mapbox.** Research MapLibre + open-source style hosting (MapTiler / Stadia); eliminate public + downloads tokens; regain Android viability.
2. **Switch Map data source from Carleton to St. Olaf.** Provision `stolaf.api.frogpond.tech/v1/map/geojson`; build a St. Olaf Mapbox style; swap `MAPBOX_CARLETON_STYLE` and the `carletonClient` call site; retire `carletonClient` from `@frogpond/api` if no other consumer.
3. **Port `MapReporterView`.** Optional; carls had a "report a problem with this map" form. Skipped here.
4. **Replace atlascms.com Campus Map tile.** Once #2 lands, remove the URL-tile entry in `views.ts`.
