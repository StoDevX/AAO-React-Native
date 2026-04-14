# Bottom-Sheet Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline "Hidden" items section with a pull-up bottom sheet (Shortcuts-app style) that appears when the user enters edit mode.

**Architecture:** Move the hidden-items grid into a `.sheet(isPresented:)` modifier attached to `HomeGridView`. The sheet is tied to `isEditing` state — appears automatically when edit mode is entered, dismisses when edit mode exits. Uses `.presentationDetents([.medium, .large])` for user-adjustable size.

**Tech Stack:** SwiftUI (iOS 16+ sheet detents), TCA.

**Spec reference:** `aaa/FOLLOWUPS.md` — "Bottom-sheet drawer for hidden items"

---

### Task 1: Extract a reusable HiddenItemsDrawerView

**Files:**
- Modify: `aaa/AllAboutAnything/Features/Home/HiddenItemsSection.swift` (rename and restructure)
- Create: `aaa/AllAboutAnything/Features/Home/HiddenItemsDrawerView.swift`

- [ ] **Step 1: Create the new drawer view**

Create `aaa/AllAboutAnything/Features/Home/HiddenItemsDrawerView.swift`:

```swift
import ComposableArchitecture
import SwiftUI

struct HiddenItemsDrawerView: View {
    let items: IdentifiedArrayOf<HomeItem>
    let onShow: (String) -> Void

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                if items.isEmpty {
                    ContentUnavailableView(
                        "No Hidden Items",
                        systemImage: "eye.slash",
                        description: Text("Items you hide from the main grid will appear here.")
                    )
                    .padding(.top, 60)
                } else {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(items) { item in
                            Button { onShow(item.id) } label: {
                                HiddenDrawerCell(item: item)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Show \(item.title)")
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Hidden Items")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

private struct HiddenDrawerCell: View {
    let item: HomeItem

    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .topLeading) {
                Circle()
                    .fill(Color(hex: item.tintColor))
                    .frame(width: 48, height: 48)
                    .overlay {
                        Image(systemName: item.sfSymbol)
                            .font(.system(size: 22))
                            .foregroundStyle(.white)
                            .accessibilityHidden(true)
                    }

                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(.white, .green)
                    .offset(x: -6, y: -6)
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

Key differences from `HiddenItemsSection`:
- Wrapped in its own `NavigationStack` for the "Hidden Items" title
- `ContentUnavailableView` for the empty state (iOS 17+)
- No divider — the sheet itself is the visual separator
- Full-opacity cells — the sheet presentation is the visual cue, no need for dimming

- [ ] **Step 2: Delete the old `HiddenItemsSection.swift`**

```bash
git rm aaa/AllAboutAnything/Features/Home/HiddenItemsSection.swift
```

- [ ] **Step 3: Commit**

```bash
git add aaa/AllAboutAnything/Features/Home/HiddenItemsDrawerView.swift
git commit -m "feat(aaa): add HiddenItemsDrawerView for sheet-based hidden items UI"
```

---

### Task 2: Present the drawer as a sheet bound to edit mode

**Files:**
- Modify: `aaa/AllAboutAnything/Features/Home/HomeGridView.swift`

- [ ] **Step 1: Replace inline HiddenItemsSection with a sheet**

In `HomeGridView.swift`:

Remove the inline hidden items block from the VStack:

```swift
if store.isEditing {
    HiddenItemsSection(items: store.hiddenItems) { id in
        store.send(.showItem(id: id))
    }
}
```

And replace the ScrollView body with just the grid (no inline hidden section), then attach a `.sheet` modifier bound to the edit-mode state:

```swift
var body: some View {
    ScrollView {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(store.gridItems) { item in
                // ... existing cell content unchanged
            }
        }
        .padding()
    }
    .navigationTitle("All About Anything")
    .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
            Button(store.isEditing ? "Done" : "Edit") {
                store.send(.toggleEditMode)
            }
        }
    }
    .onAppear { store.send(.onAppear) }
    .sheet(
        isPresented: Binding(
            get: { store.isEditing },
            set: { isPresented in
                if !isPresented && store.isEditing {
                    store.send(.toggleEditMode)
                }
            }
        )
    ) {
        HiddenItemsDrawerView(items: store.hiddenItems) { id in
            store.send(.showItem(id: id))
        }
        .presentationDetents([.medium, .large])
        .presentationBackgroundInteraction(.enabled(upThrough: .medium))
    }
}
```

The `Binding` is manual because TCA's `@ObservableState` doesn't automatically create bindings for reducer-managed flags. Setting `isPresented` back to `false` (e.g., by swiping down) dispatches `.toggleEditMode`, keeping the store state in sync.

`.presentationBackgroundInteraction(.enabled(upThrough: .medium))` lets the user interact with the grid beneath the sheet when it's at medium detent — important so they can long-press items on the grid while the sheet is showing (once drag-to-reorder exists).

- [ ] **Step 2: Verify build**

```bash
cd aaa && xcodegen generate && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' -quiet
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Run tests**

```bash
cd aaa && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' 2>&1 | tail -5
```

Expected: `Test run with 19 tests in 0 suites passed`. This is a pure view change — reducer behavior is unchanged.

- [ ] **Step 4: Manual verification**

Launch on simulator:
- Tap "Edit" — sheet pulls up from the bottom with "Hidden Items" title. If empty, shows ContentUnavailableView.
- Hide a grid item — it disappears from the grid; tap a blank area on the sheet to see it appear (note: state update may need the sheet to re-render; verify this works)
- Swipe the sheet's detent bar up — detent grows to `.large`
- Tap "+" on a hidden item — it returns to the main grid
- Swipe the sheet down to dismiss — edit mode exits (toolbar reverts to "Edit")
- Tap "Done" in the toolbar while the sheet is up — sheet dismisses, edit mode exits

If "hide an item and see it appear in the sheet" doesn't work because the sheet is presenting a stale snapshot of `hiddenItems`, verify that the `HiddenItemsDrawerView(items: store.hiddenItems, ...)` reads the current store state each time SwiftUI redraws the sheet content (it should, since `store` is `@Observable`).

- [ ] **Step 5: Commit**

```bash
git add aaa/AllAboutAnything/Features/Home/HomeGridView.swift
git commit -m "feat(aaa): present hidden items as a bottom sheet in edit mode"
```

---

### Task 3: Update FOLLOWUPS

**Files:**
- Modify: `aaa/FOLLOWUPS.md`

- [ ] **Step 1: Remove the bottom-sheet entry**

Delete the "Bottom-sheet drawer for hidden items" section from `aaa/FOLLOWUPS.md`.

- [ ] **Step 2: Commit**

```bash
git add aaa/FOLLOWUPS.md
git commit -m "docs(aaa): remove completed bottom-sheet-drawer followup"
```
