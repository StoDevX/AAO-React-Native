# All About Anything — Post-MVP Followups

Items deferred during MVP implementation. Each entry notes the task it came from and the reviewer's rationale.

## UX / Features

### Drag-to-reorder grid items
- **From:** Task 7
- **Status:** Deferred — no UI gesture for reordering
- **Why:** `.onMove` is a `List`-only modifier in SwiftUI; it does not compile on `LazyVGrid` + `ForEach`.
- **Workaround:** Users can hide + re-show an item, which appends it to the end of the grid.
- **Fix options:** Custom `DragGesture` + drop-target logic, or a third-party library like `SwiftUIX` / `UniformTypeIdentifiers`-based drag-and-drop. The `HomeFeature.moveItem(fromOffsets:toOffset:)` reducer action already exists and has test coverage.

### URL destinations open in-app browser
- **From:** Task 8
- **Status:** Deferred — URL items currently push to `PlaceholderFeature` like view destinations
- **Why:** MVP scope is just the home grid; real destinations are out of scope.
- **Fix:** Add a new `Path` case (e.g., `browser(URL)`) that presents `SFSafariViewController` wrapped in a SwiftUI `UIViewControllerRepresentable`.

### Bottom-sheet drawer for hidden items
- **From:** Design spec (considered but rejected for MVP)
- **Status:** Deferred — using inline section instead
- **Why:** Inline is simpler; drawer was a Shortcuts-style "nice to have."
- **Fix:** Swap `HiddenItemsSection` for a `.sheet` with detents.

## Code Quality

### `try?` in `DatabaseClient.liveValue` setup
- **From:** Task 4
- **Status:** Using `try!` on `DatabaseQueue(path:)` and `AppDatabase(dbQueue:)`
- **Why:** Acceptable for MVP; documents directory is always available on iOS.
- **Fix:** Catch the error, report to Sentry (per CLAUDE.md's observability note), consider recovery strategy (e.g., delete + recreate on corruption).

### Synchronous DB calls in `HomeFeature.onAppear`
- **From:** Task 5
- **Status:** Synchronous — blocks main thread during seed + fetch
- **Why:** MVP has ~16 items; reads/writes are sub-millisecond.
- **Fix:** Migrate to `.run { send in ... }` with `await`-able DB client methods and an `itemsLoaded(...)` action. Becomes important if: fetch grows to joined queries, a loading state is needed, or seed-on-first-launch becomes slow.

### `testValue` uses `fatalError` vs `unimplemented`
- **From:** Task 4
- **Status:** Uses `fatalError("... not overridden in test")`
- **Why:** Both force tests to override; fatalError is simpler.
- **Fix:** Migrate to `unimplemented("DatabaseClient.fetchHomeItems")` from `XCTestDynamicOverlay` for better test-failure diagnostics (XCTFail vs crash).

### Add `previewValue` for `DatabaseClient`
- **From:** Task 4
- **Status:** Missing — SwiftUI previews will use `liveValue` (real on-disk DB)
- **Fix:** Add a `previewValue` backed by an in-memory `DatabaseQueue()` with seeded fixture data so previews render realistically and don't touch the user's on-device DB.

### `@ObservableState` on all-`let` state is a no-op
- **From:** Task 6
- **Status:** Present on `PlaceholderFeature.State`
- **Why:** Harmless; the macro does nothing for immutable fields.
- **Fix:** Remove `@ObservableState` from `PlaceholderFeature.State` (cosmetic).

### `HiddenItemCell` opacity applied per-layer
- **From:** Task 7
- **Status:** `.opacity(0.5)` on the `Circle()`, separate `.opacity(0.7)` on the symbol, separate `.opacity(0.5)` on the background. Visually dimmed as spec required but inconsistent implementation.
- **Fix:** Apply `.opacity(0.5)` to the whole `VStack` or pass a dimmed flag into a shared cell component.

### `persistCustomizations` rewrites every row on every mutation
- **From:** Task 5
- **Status:** O(n) writes per hide/show/move action
- **Why:** Fine for 16 items (sub-millisecond).
- **Fix:** Track which items actually changed sortOrder/isVisible and only write those. Only worth doing if the item count grows significantly.

## Repo Hygiene

### `.superpowers/brainstorm/` session files were committed
- **From:** Implementation phase
- **Status:** Committed in `bd3750da7` (Task 2 commit)
- **Why:** Files got staged transitively when `git add -A` was used in an earlier task; subsequent implementers couldn't cleanly un-stage without disrupting other work.
- **Fix:** Add `.superpowers/` to the parent repo's `.gitignore`, then `git rm -r --cached .superpowers/brainstorm/` in a follow-up commit.

### Generated `.xcodeproj` vs `Package.resolved` tracking
- **From:** Task 1 code review (Wren decided during the session)
- **Status:** Current setup per Wren's decision — gitignore `.xcodeproj`, track `Package.resolved`.
- **Verify:** Run `git check-ignore` on both paths before shipping to ensure the gitignore negation patterns are correct.

## Signing / Distribution

### No development team set
- **From:** Task 1 code review
- **Status:** No `DEVELOPMENT_TEAM` in `project.yml`
- **Why:** Fine for local simulator builds.
- **Fix:** Add via `.xcconfig` (not checked in) or env var before device/CI builds.

### No version numbers set
- **From:** Task 1 code review
- **Status:** `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION` unset
- **Fix:** Add explicit values to `project.yml` before distribution.
