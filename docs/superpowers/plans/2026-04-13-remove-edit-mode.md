# Remove Edit Mode, Add Context Menu + Toolbar Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the Edit-mode toggle on the home grid. Replace "tap-to-hide while editing" with a long-press `.contextMenu` action. Split the single "Edit" toolbar button into two buttons: a `+` that opens the hidden-items drawer, and a `gear` that pushes a (placeholder) Settings screen.

**Architecture:** Drop `isEditing` from `HomeFeature.State`; add `isShowingHiddenItems` bound to the sheet. Hide is always available via `.contextMenu` on each cell. `HomeItemCell`'s `isEditing` parameter is removed (cells render one way, always). Settings is a new `SettingsFeature` reducer + `SettingsView`, pushed onto the existing TCA `StackState` via a new `AppFeature.Path.settings` case. A new `HomeFeature.Action.settingsTapped` is observed by `AppFeature` to append the path entry.

**Tech Stack:** SwiftUI (iOS 17+ `ContentUnavailableView`), TCA (`@Reducer`, `@ObservableState`, `StackState`).

**Spec:** Verbal design agreed in brainstorm on 2026-04-13. Key points:

- Remove `HomeFeature.isEditing` + `.toggleEditMode` action.
- Add `HomeFeature.isShowingHiddenItems` + actions `.plusButtonTapped`, `.setHiddenItemsPresented(Bool)`, `.settingsTapped`.
- `HomeItemCell` becomes parameter-free except for `item: HomeItem`.
- `HomeGridView` cells get `.contextMenu { Button("Hide \(item.title)", systemImage: "eye.slash") { ... } }`. Tap still dispatches `.itemTapped(id:)`.
- Toolbar: two `topBarTrailing` items — `plus` → `.plusButtonTapped`, `gear` → `.settingsTapped`.
- Sheet binding switches from `store.isEditing` to `store.isShowingHiddenItems`. Detents unchanged: `[.height(80), .medium, .large]`, selection bound to `@State drawerDetent`.
- `AppFeature` removes the `!state.home.isEditing` guard on `.itemTapped` (no more edit mode). Observes `.home(.settingsTapped)` and appends `.settings(SettingsFeature.State())` to `path`.
- New `SettingsFeature` (empty reducer) + `SettingsView` (ContentUnavailableView placeholder).

---

## File Structure

**Create:**
- `aaa/AllAboutAnything/Features/Settings/SettingsFeature.swift` — TCA reducer, empty state/action shell matching `PlaceholderFeature` pattern
- `aaa/AllAboutAnything/Features/Settings/SettingsView.swift` — `ContentUnavailableView` placeholder

**Modify:**
- `aaa/AllAboutAnything/Features/Home/HomeFeature.swift` — state/action refactor
- `aaa/AllAboutAnything/Features/Home/HomeGridView.swift` — context menu, toolbar split, sheet binding
- `aaa/AllAboutAnything/Features/Home/HomeItemCell.swift` — remove `isEditing` parameter
- `aaa/AllAboutAnything/App/AppFeature.swift` — add `.settings` Path case, remove `isEditing` guard, handle `.settingsTapped`
- `aaa/AllAboutAnythingTests/HomeFeatureTests.swift` — replace `toggleEditMode` test with drawer-binding test; add `settingsTapped` test
- `aaa/AllAboutAnythingTests/AppFeatureTests.swift` — add coverage for settings path append; any tests that relied on `isEditing` get updated

---

### Task 1: Refactor `HomeFeature` state and actions

**Files:**
- Modify: `aaa/AllAboutAnything/Features/Home/HomeFeature.swift`

- [ ] **Step 1: Replace state and actions**

Rewrite `aaa/AllAboutAnything/Features/Home/HomeFeature.swift` to:

```swift
import ComposableArchitecture
import Foundation

@Reducer
struct HomeFeature {
	@ObservableState
	struct State: Equatable {
		var gridItems: IdentifiedArrayOf<HomeItem> = []
		var hiddenItems: IdentifiedArrayOf<HomeItem> = []
		var isShowingHiddenItems = false
	}

	enum Action: Equatable {
		case onAppear
		case moveItem(fromOffsets: IndexSet, toOffset: Int)
		case hideItem(id: String)
		case showItem(id: String)
		case itemTapped(id: String)
		case plusButtonTapped
		case setHiddenItemsPresented(Bool)
		case settingsTapped
	}

	@Dependency(\.databaseClient) var databaseClient

	var body: some ReducerOf<Self> {
		Reduce { state, action in
			switch action {
			case .onAppear:
				do {
					try databaseClient.seedIfNeeded()
				} catch {
					reportIssue("Failed to seed database: \(error)")
				}
				let allItems: [HomeItemWithCustomization]
				do {
					allItems = try databaseClient.fetchHomeItems()
				} catch {
					reportIssue("Failed to fetch home items: \(error)")
					allItems = []
				}

				let visible = allItems.filter { $0.customization?.isVisible != false }
				let hidden = allItems.filter { $0.customization?.isVisible == false }

				state.gridItems = IdentifiedArrayOf(uniqueElements: visible.map(\.item))
				state.hiddenItems = IdentifiedArrayOf(uniqueElements: hidden.map(\.item))
				return .none

			case let .moveItem(fromOffsets, toOffset):
				state.gridItems.move(fromOffsets: fromOffsets, toOffset: toOffset)
				persistCustomizations(state: state)
				return .none

			case let .hideItem(id):
				if let item = state.gridItems[id: id] {
					state.gridItems.remove(id: id)
					state.hiddenItems.append(item)
					persistCustomizations(state: state)
				}
				return .none

			case let .showItem(id):
				if let item = state.hiddenItems[id: id] {
					state.hiddenItems.remove(id: id)
					state.gridItems.append(item)
					persistCustomizations(state: state)
				}
				return .none

			case .itemTapped:
				// Navigation handled by parent AppFeature
				return .none

			case .plusButtonTapped:
				state.isShowingHiddenItems = true
				return .none

			case let .setHiddenItemsPresented(isPresented):
				state.isShowingHiddenItems = isPresented
				return .none

			case .settingsTapped:
				// Navigation handled by parent AppFeature
				return .none
			}
		}
	}

	private func persistCustomizations(state: State) {
		for (index, item) in state.gridItems.enumerated() {
			do {
				try databaseClient.updateCustomization(item.id, index, true)
			} catch {
				reportIssue("Failed to persist customization for \(item.id): \(error)")
			}
		}
		for (index, item) in state.hiddenItems.enumerated() {
			do {
				try databaseClient.updateCustomization(item.id, index, false)
			} catch {
				reportIssue("Failed to persist customization for \(item.id): \(error)")
			}
		}
	}
}
```

Key changes: `isEditing` → `isShowingHiddenItems`; `toggleEditMode` gone; three new actions (`plusButtonTapped`, `setHiddenItemsPresented`, `settingsTapped`). Uses tab indent (match repo convention).

- [ ] **Step 2: Do not build yet — tests and callers still reference old API**

Build will fail because `HomeGridView`, `AppFeature`, and `HomeFeatureTests` still reference `isEditing`/`toggleEditMode`. Subsequent tasks fix all three. Do not commit yet — this task's changes commit together with Task 2 to keep the tree bisectable.

---

### Task 2: Update `HomeFeatureTests` to match new state/actions

**Files:**
- Modify: `aaa/AllAboutAnythingTests/HomeFeatureTests.swift`

- [ ] **Step 1: Replace `toggleEditMode` test with drawer-binding tests and add `settingsTapped` test**

In `aaa/AllAboutAnythingTests/HomeFeatureTests.swift`, replace the `toggleEditMode` test (lines 42–58) with:

```swift
@Test @MainActor func plusButtonOpensHiddenItemsSheet() async {
	let store = TestStore(initialState: HomeFeature.State()) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.seedIfNeeded = {}
		$0.databaseClient.fetchHomeItems = { [] }
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(.plusButtonTapped) {
		$0.isShowingHiddenItems = true
	}
}

@Test @MainActor func setHiddenItemsPresentedUpdatesFlag() async {
	var state = HomeFeature.State()
	state.isShowingHiddenItems = true

	let store = TestStore(initialState: state) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.seedIfNeeded = {}
		$0.databaseClient.fetchHomeItems = { [] }
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(.setHiddenItemsPresented(false)) {
		$0.isShowingHiddenItems = false
	}
}

@Test @MainActor func settingsTappedIsNoOpInHomeFeature() async {
	let store = TestStore(initialState: HomeFeature.State()) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.seedIfNeeded = {}
		$0.databaseClient.fetchHomeItems = { [] }
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	// Navigation is handled by AppFeature; HomeFeature should not mutate state.
	await store.send(.settingsTapped)
}
```

These tests replace the single `toggleEditMode` test (net +2 tests: 3 new vs 1 removed).

- [ ] **Step 2: Do not build/test yet — `HomeGridView` and `AppFeature` still reference old API**

Hold commits until Task 4 so the tree stays green after the first build.

---

### Task 3: Remove `isEditing` parameter from `HomeItemCell`

**Files:**
- Modify: `aaa/AllAboutAnything/Features/Home/HomeItemCell.swift`

- [ ] **Step 1: Replace file contents**

Overwrite `aaa/AllAboutAnything/Features/Home/HomeItemCell.swift` with:

```swift
import SwiftUI

struct HomeItemCell: View {
	let item: HomeItem

	var body: some View {
		VStack(spacing: 8) {
			Circle()
				.fill(Color(hex: item.tintColor))
				.frame(width: 48, height: 48)
				.overlay {
					Image(systemName: item.sfSymbol)
						.font(.system(size: 22))
						.foregroundStyle(.white)
						.accessibilityHidden(true)
				}

			Text(item.title)
				.font(.caption)
				.foregroundStyle(.primary)
				.lineLimit(1)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 12)
		.background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
	}
}
```

Removed: the `isEditing: Bool` parameter and the `minus.circle.fill` overlay that appeared in edit mode. The outer `ZStack(alignment: .topLeading)` that wrapped just the circle + overlay is no longer needed — reduced to a bare `Circle().overlay { ... }`.

- [ ] **Step 2: Do not build yet — `HomeGridView` still passes `isEditing:` argument**

Task 4 fixes it.

---

### Task 4: Rewire `HomeGridView` — context menu, toolbar split, drawer binding

**Files:**
- Modify: `aaa/AllAboutAnything/Features/Home/HomeGridView.swift`

- [ ] **Step 1: Replace file contents**

Overwrite `aaa/AllAboutAnything/Features/Home/HomeGridView.swift` with:

```swift
import ComposableArchitecture
import SwiftUI

struct HomeGridView: View {
	let store: StoreOf<HomeFeature>

	@State private var drawerDetent: PresentationDetent = .medium

	private let columns = [
		GridItem(.flexible()),
		GridItem(.flexible()),
	]

	var body: some View {
		ScrollView {
			LazyVGrid(columns: columns, spacing: 12) {
				ForEach(store.gridItems) { item in
					Button {
						store.send(.itemTapped(id: item.id))
					} label: {
						HomeItemCell(item: item)
					}
					.buttonStyle(.plain)
					.accessibilityLabel(item.title)
					.contextMenu {
						Button("Hide \(item.title)", systemImage: "eye.slash") {
							store.send(.hideItem(id: item.id))
						}
					}
				}
			}
			.padding()
		}
		.navigationTitle("All About Anything")
		.toolbar {
			ToolbarItem(placement: .topBarTrailing) {
				Button {
					store.send(.plusButtonTapped)
				} label: {
					Image(systemName: "plus")
				}
				.accessibilityLabel("Add items")
			}
			ToolbarItem(placement: .topBarTrailing) {
				Button {
					store.send(.settingsTapped)
				} label: {
					Image(systemName: "gear")
				}
				.accessibilityLabel("Settings")
			}
		}
		.onAppear { store.send(.onAppear) }
		.sheet(
			isPresented: Binding(
				get: { store.isShowingHiddenItems },
				set: { store.send(.setHiddenItemsPresented($0)) }
			)
		) {
			HiddenItemsDrawerView(items: store.hiddenItems) { id in
				store.send(.showItem(id: id))
			}
			.presentationDetents([.height(80), .medium, .large], selection: $drawerDetent)
			.presentationBackgroundInteraction(.enabled(upThrough: .medium))
		}
	}
}
```

Changes vs. prior version:

- Removed the `if store.isEditing { hide-button } else { tap-button }` branch — cells always dispatch `.itemTapped`.
- Added `.contextMenu { Button("Hide \(item.title)", systemImage: "eye.slash") { ... } }`.
- Replaced single `Edit/Done` toolbar item with two `topBarTrailing` items (`plus`, `gear`) dispatching `.plusButtonTapped` and `.settingsTapped`.
- Sheet binding simplified: `get` reads `isShowingHiddenItems`, `set` dispatches `.setHiddenItemsPresented($0)` on every transition (including true→true no-ops, which are fine — the reducer just writes the same value).
- Detents and background-interaction line unchanged from the current three-state drawer.

- [ ] **Step 2: Do not build yet — `AppFeature` still references `state.home.isEditing`**

Task 5 completes the chain.

---

### Task 5: Update `AppFeature` — add `settings` Path case, remove edit-mode guard, handle `settingsTapped`

**Files:**
- Create: `aaa/AllAboutAnything/Features/Settings/SettingsFeature.swift`
- Create: `aaa/AllAboutAnything/Features/Settings/SettingsView.swift`
- Modify: `aaa/AllAboutAnything/App/AppFeature.swift`

- [ ] **Step 1: Create `SettingsFeature`**

Create `aaa/AllAboutAnything/Features/Settings/SettingsFeature.swift`:

```swift
import ComposableArchitecture
import Foundation

@Reducer
struct SettingsFeature {
	@ObservableState
	struct State: Equatable {}

	enum Action: Equatable {}

	var body: some ReducerOf<Self> {
		EmptyReducer()
	}
}
```

- [ ] **Step 2: Create `SettingsView`**

Create `aaa/AllAboutAnything/Features/Settings/SettingsView.swift`:

```swift
import ComposableArchitecture
import SwiftUI

struct SettingsView: View {
	let store: StoreOf<SettingsFeature>

	var body: some View {
		ContentUnavailableView(
			"Settings",
			systemImage: "gear",
			description: Text("Coming soon")
		)
		.navigationTitle("Settings")
		.navigationBarTitleDisplayMode(.inline)
	}
}
```

- [ ] **Step 3: Update `AppFeature.swift`**

Overwrite `aaa/AllAboutAnything/App/AppFeature.swift` with:

```swift
import ComposableArchitecture
import Foundation

@Reducer
struct BrowserFeature {
	@ObservableState
	struct State: Equatable {
		let url: URL
	}

	enum Action: Equatable {
		case doneTapped
	}

	@Dependency(\.dismiss) var dismiss

	var body: some ReducerOf<Self> {
		Reduce { _, action in
			switch action {
			case .doneTapped:
				return .run { _ in await dismiss() }
			}
		}
	}
}

@Reducer
struct AppFeature {
	@ObservableState
	struct State: Equatable {
		var home = HomeFeature.State()
		var path = StackState<Path.State>()
		@Presents var browser: BrowserFeature.State?
	}

	enum Action {
		case home(HomeFeature.Action)
		case path(StackActionOf<Path>)
		case browser(PresentationAction<BrowserFeature.Action>)
	}

	@Reducer
	enum Path {
		case placeholder(PlaceholderFeature)
		case settings(SettingsFeature)
	}

	var body: some ReducerOf<Self> {
		Scope(state: \.home, action: \.home) {
			HomeFeature()
		}

		Reduce { state, action in
			switch action {
			case let .home(.itemTapped(id)):
				guard let item = state.home.gridItems[id: id] else {
					return .none
				}

				if item.destinationView != nil {
					state.path.append(.placeholder(
						PlaceholderFeature.State(
							title: item.title,
							sfSymbol: item.sfSymbol,
							tintColor: item.tintColor
						)
					))
				} else if let urlString = item.destinationUrl {
					if let url = URL(string: urlString) {
						state.browser = BrowserFeature.State(url: url)
					} else {
						reportIssue("HomeItem \(item.id) has invalid destinationUrl: \(urlString)")
					}
				} else {
					reportIssue("HomeItem \(item.id) has no destination (both view and url are nil)")
				}
				return .none

			case .home(.settingsTapped):
				state.path.append(.settings(SettingsFeature.State()))
				return .none

			case .home, .path, .browser:
				return .none
			}
		}
		.forEach(\.path, action: \.path)
		.ifLet(\.$browser, action: \.browser) {
			BrowserFeature()
		}
	}
}

extension AppFeature.Path.State: Equatable {}
```

Key deltas vs. prior version:

- `Path` enum gains `case settings(SettingsFeature)`.
- Removed the `!state.home.isEditing` guard on `.itemTapped` (no more edit mode).
- New `case .home(.settingsTapped)` appends the Settings path entry.

Note: the root `AppView` (wherever it lives) needs a `switch` branch to render `SettingsView` for the new path case — find and update it in the next step.

- [ ] **Step 4: Update `AppView` to render the `settings` path case**

Run to locate the view:

```bash
grep -rn "case .placeholder" aaa/AllAboutAnything --include='*.swift'
```

Expected: one or two `.swift` files branching on the path state. Add a parallel branch that renders `SettingsView(store: store)`.

For example, if the existing switch looks like:

```swift
switch store.case {
case let .placeholder(store):
	PlaceholderView(store: store)
}
```

Extend to:

```swift
switch store.case {
case let .placeholder(store):
	PlaceholderView(store: store)
case let .settings(store):
	SettingsView(store: store)
}
```

The exact file/syntax depends on the existing AppView implementation. Read it, match its pattern, add the case. If the switch is `@exhaustive` and Swift complains about missing cases after your Path edit, that's the hint to update it.

- [ ] **Step 5: Regenerate Xcode project, build, run tests**

```bash
cd aaa && xcodegen generate && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' 2>&1 | tail -20
```

Expected: `BUILD SUCCEEDED` and `Test run with 21 tests in 0 suites passed` (19 original - 1 removed `toggleEditMode` + 3 new tests = 21; adjust expectation if the AppFeature test additions in Task 6 also land here).

If the build fails on the AppView `switch`, re-inspect Step 4. If a test fails because `AppFeatureTests` referenced `isEditing`, see Task 6 — you may need to interleave.

- [ ] **Step 6: Commit**

```bash
git add aaa/AllAboutAnything/Features/Home/HomeFeature.swift \
	aaa/AllAboutAnything/Features/Home/HomeGridView.swift \
	aaa/AllAboutAnything/Features/Home/HomeItemCell.swift \
	aaa/AllAboutAnything/Features/Settings/SettingsFeature.swift \
	aaa/AllAboutAnything/Features/Settings/SettingsView.swift \
	aaa/AllAboutAnything/App/AppFeature.swift \
	aaa/AllAboutAnythingTests/HomeFeatureTests.swift
# plus whatever AppView file you touched in Step 4
git add aaa/AllAboutAnything.xcodeproj/project.pbxproj
git commit -m "feat(aaa): replace edit mode with context menu and toolbar split"
```

This is a deliberately large commit because tasks 1–5 are mutually dependent — the tree only compiles after all five land.

---

### Task 6: Update `AppFeatureTests`

**Files:**
- Modify: `aaa/AllAboutAnythingTests/AppFeatureTests.swift`

- [ ] **Step 1: Read the current AppFeatureTests**

```bash
cat aaa/AllAboutAnythingTests/AppFeatureTests.swift
```

Identify any tests that set `home.isEditing = true` or otherwise depend on edit mode gating. Those need updating — post-refactor, there is no `isEditing`, so the "edit mode blocks navigation" test (if it exists) no longer applies and should be removed.

- [ ] **Step 2: Remove any obsolete `isEditing` tests and add a `settingsTapped` test**

Remove any test that relies on `state.home.isEditing = true`. Add this test:

```swift
@Test @MainActor func settingsTappedAppendsSettingsPath() async {
	let store = TestStore(initialState: AppFeature.State()) {
		AppFeature()
	}

	await store.send(.home(.settingsTapped)) {
		$0.path.append(.settings(SettingsFeature.State()))
	}
}
```

Place it alongside the existing path-related tests. Match whatever imports and style the surrounding tests use. If there's no dedicated home-action path test, follow the pattern of existing navigation tests.

- [ ] **Step 3: Run tests**

```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' 2>&1 | tail -10
```

Expected: all tests pass. If the `itemTapped` test had an `isEditing = true` setup asserting the tap was ignored, that test is now obsolete (tap is always handled). Delete it rather than rewrite it — no edit mode, no guard to test.

- [ ] **Step 4: Commit**

```bash
git add aaa/AllAboutAnythingTests/AppFeatureTests.swift
git commit -m "test(aaa): update AppFeature tests for edit-mode removal"
```

---

### Task 7: Manual verification

- [ ] **Step 1: Build and launch on simulator**

```bash
cd aaa && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' -quiet
```

Launch the app. No `Edit` button anywhere in the toolbar — instead, a `+` and a `gear`.

- [ ] **Step 2: Verify context-menu hide**

Long-press any grid cell. A context menu appears with `Hide <Item Title>`. Tap it. The item disappears from the grid.

- [ ] **Step 3: Verify `+` opens drawer**

Tap `+`. Drawer opens at medium detent. Verify all three detents work (drag to `.height(80)` collapsed peek, `.medium`, `.large`). Tap `+` on a hidden item to restore it. Swipe drawer down to dismiss.

- [ ] **Step 4: Verify `gear` pushes Settings**

Tap `gear`. A `Settings` screen pushes onto the stack with the "Coming soon" placeholder. Back button returns to the home grid.

- [ ] **Step 5: Verify tap still navigates**

Tap any non-hidden grid cell. It pushes the appropriate destination (placeholder screen or in-app browser) as before — no edit-mode interception.

- [ ] **Step 6: Persistence sanity check**

Hide an item, quit the app, relaunch. The hidden item stays hidden. Unhide it via the drawer, quit, relaunch. It returns to the grid in its restored position.

No commit for this task (manual verification only).

---

### Task 8: Update FOLLOWUPS and note drag-to-reorder simplification

**Files:**
- Modify: `aaa/FOLLOWUPS.md`
- Modify: `docs/superpowers/plans/2026-04-13-drag-to-reorder.md`

- [ ] **Step 1: Update the drag-to-reorder plan**

The existing drag-to-reorder plan at `docs/superpowers/plans/2026-04-13-drag-to-reorder.md` is gated on `store.isEditing`, which no longer exists. Open that plan and either:

a) Add a banner at the top noting the plan is outdated post-edit-mode-removal and needs a rewrite, **or**
b) Rewrite it inline to drop the `if store.isEditing { ... }` branch — `.draggable` and `.dropDestination` attach to every cell unconditionally.

Pick (a) for minimal scope creep. Append to the plan's header, above the first `---`:

```markdown
> **⚠️ OUTDATED — 2026-04-13:** This plan was written against a now-removed `isEditing` state. Post the edit-mode removal (see `2026-04-13-remove-edit-mode.md`), drag-and-drop should attach unconditionally to every cell, not gated on edit mode. Rewrite before executing.
```

- [ ] **Step 2: Verify FOLLOWUPS.md still points at the correct plan**

```bash
grep -n "drag" aaa/FOLLOWUPS.md
```

The existing line for drag-to-reorder should remain — the feature is still planned, just with a revised approach.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-04-13-drag-to-reorder.md
git commit -m "docs(aaa): flag drag-to-reorder plan as outdated post-edit-mode-removal"
```

---

## Self-Review Notes

- Spec coverage: every agreed-on design point (state rename, new actions, context menu, toolbar split, sheet binding, settings scaffold, removed `isEditing` guard, `HomeItemCell` cleanup) has a corresponding task.
- Placeholder scan: Task 5 Step 4 and Task 6 Step 1 both require the implementer to *read* existing code before modifying it — this is intentional, not a placeholder. The exact file paths/patterns aren't known from this context.
- Type consistency: `isShowingHiddenItems` used everywhere (state, binding, tests). Action names consistent across reducer, view, and tests (`plusButtonTapped`, `setHiddenItemsPresented`, `settingsTapped`). `SettingsFeature.State` / `SettingsFeature.Action` match their usage in `AppFeature.Path`.
