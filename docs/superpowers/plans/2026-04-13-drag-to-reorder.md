# Drag-to-Reorder Home Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-to-reorder UI gesture for home grid items while in edit mode.

**Architecture:** Make `HomeItem` conform to `Transferable`. Attach `.draggable(item)` + `.dropDestination(for: HomeItem.self)` to each cell when in edit mode. Drop handler computes source and target indices, sends existing `.moveItem(fromOffsets:toOffset:)` action to the reducer.

**Tech Stack:** SwiftUI (iOS 16+ Transferable API), TCA (existing reducer action).

**Spec reference:** `aaa/FOLLOWUPS.md` — "Drag-to-reorder grid items"

---

### Task 1: Make `HomeItem` Transferable

**Files:**
- Modify: `aaa/AllAboutAnything/Database/HomeItem.swift`

- [ ] **Step 1: Add Transferable conformance**

Append to `aaa/AllAboutAnything/Database/HomeItem.swift`:

```swift
import CoreTransferable

extension HomeItem: Transferable {
    static var transferRepresentation: some TransferRepresentation {
        CodableRepresentation(contentType: .data)
    }
}
```

`HomeItem` already conforms to `Codable`, so `CodableRepresentation` works without extra code.

- [ ] **Step 2: Verify build**

Run:
```bash
cd aaa && xcodegen generate && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' -quiet
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Commit**

```bash
git add aaa/AllAboutAnything/Database/HomeItem.swift
git commit -m "feat(aaa): make HomeItem Transferable for drag-and-drop"
```

---

### Task 2: Wire drag + drop to grid cells

**Files:**
- Modify: `aaa/AllAboutAnything/Features/Home/HomeGridView.swift`

- [ ] **Step 1: Replace the ForEach body to attach draggable and dropDestination**

In `aaa/AllAboutAnything/Features/Home/HomeGridView.swift`, replace the existing `ForEach(store.gridItems) { item in ... }` block with this:

```swift
ForEach(store.gridItems) { item in
    if store.isEditing {
        Button { store.send(.hideItem(id: item.id)) } label: {
            HomeItemCell(item: item, isEditing: true)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Hide \(item.title)")
        .draggable(item)
        .dropDestination(for: HomeItem.self) { dropped, _ in
            guard let droppedItem = dropped.first,
                  let source = store.gridItems.firstIndex(where: { $0.id == droppedItem.id }),
                  let target = store.gridItems.firstIndex(where: { $0.id == item.id }),
                  source != target
            else { return false }

            let adjustedTarget = source < target ? target + 1 : target
            store.send(.moveItem(fromOffsets: IndexSet(integer: source), toOffset: adjustedTarget))
            return true
        }
    } else {
        Button { store.send(.itemTapped(id: item.id)) } label: {
            HomeItemCell(item: item, isEditing: false)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(item.title)
    }
}
```

The `.draggable` and `.dropDestination` modifiers attach only in edit mode. The non-editing branch is unchanged.

The `adjustedTarget` correction handles SwiftUI's `move(fromOffsets:toOffset:)` semantics: the offset is interpreted against the original array, so dropping an item onto a position *after* its source requires incrementing by 1 to land in the intended slot.

- [ ] **Step 2: Verify build and run tests**

```bash
cd aaa && xcodegen generate && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' 2>&1 | tail -5
```

Expected: `Test run with 19 tests in 0 suites passed`. No test regressions (the reducer's `moveItem` is already covered).

- [ ] **Step 3: Manual verification on simulator**

Launch the app on the iPhone 16 simulator. Enter edit mode. Long-press any cell and drag it onto another cell. The dragged cell should swap positions with the target. Quit and relaunch — the new order should persist.

If drag doesn't activate: verify that `.draggable` is outside any nested `Button` (it is — it's on the Button itself).

- [ ] **Step 4: Commit**

```bash
git add aaa/AllAboutAnything/Features/Home/HomeGridView.swift
git commit -m "feat(aaa): add drag-to-reorder gesture for home grid in edit mode"
```

---

### Task 3: Update FOLLOWUPS

**Files:**
- Modify: `aaa/FOLLOWUPS.md`

- [ ] **Step 1: Remove the drag-to-reorder entry**

Delete the "Drag-to-reorder grid items" section from `aaa/FOLLOWUPS.md` (it's the first entry under "UX / Features").

- [ ] **Step 2: Commit**

```bash
git add aaa/FOLLOWUPS.md
git commit -m "docs(aaa): remove completed drag-to-reorder followup"
```
