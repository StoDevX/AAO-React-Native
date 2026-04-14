# URL Destinations In-App Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user taps a home item with a URL destination (Campus Map, Oleville), open that URL in an in-app `SFSafariViewController` instead of the placeholder screen.

**Architecture:** Add a new `browser(URL)` case to `AppFeature.Path`. Create a `SafariBrowserView` that wraps `SFSafariViewController` via `UIViewControllerRepresentable`. Update `AppFeature`'s `.itemTapped` handler to push `.browser(url)` for URL items instead of `.placeholder(...)`. Update the `NavigationStack` destination switch in `AllAboutAnythingApp` to show `SafariBrowserView` for the browser case.

**Tech Stack:** SwiftUI, SafariServices (`SFSafariViewController`), TCA stack navigation.

**Spec reference:** `aaa/FOLLOWUPS.md` — "URL destinations open in-app browser"

---

### Task 1: SafariBrowserView (UIViewControllerRepresentable wrapper)

**Files:**
- Create: `aaa/AllAboutAnything/Features/Browser/SafariBrowserView.swift`

- [ ] **Step 1: Implement the wrapper**

Create `aaa/AllAboutAnything/Features/Browser/SafariBrowserView.swift`:

```swift
import SafariServices
import SwiftUI

struct SafariBrowserView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        let controller = SFSafariViewController(url: url)
        controller.dismissButtonStyle = .close
        return controller
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {
        // SFSafariViewController does not support URL updates after creation.
        // If the parent swaps the url, SwiftUI will rebuild the representable.
    }
}
```

- [ ] **Step 2: Verify build**

```bash
cd aaa && xcodegen generate && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' -quiet
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Commit**

```bash
git add aaa/AllAboutAnything/Features/Browser/SafariBrowserView.swift
git commit -m "feat(aaa): add SafariBrowserView wrapping SFSafariViewController"
```

---

### Task 2: Add `browser(URL)` case to `AppFeature.Path` + update routing

**Files:**
- Modify: `aaa/AllAboutAnything/App/AppFeature.swift`
- Modify: `aaa/AllAboutAnythingTests/AppFeatureTests.swift`

Follow TDD.

- [ ] **Step 1: Update the existing URL-destination test to expect `.browser`**

In `aaa/AllAboutAnythingTests/AppFeatureTests.swift`, replace the existing `itemTappedPushesPlaceholderForUrlDestination` test with:

```swift
@MainActor
@Test func itemTappedPushesBrowserForUrlDestination() async {
    let itemB = HomeItem(
        id: "b",
        title: "B",
        sfSymbol: "link",
        tintColor: "#111",
        destinationView: nil,
        destinationUrl: "https://example.com"
    )

    var homeState = HomeFeature.State()
    homeState.gridItems = [itemB]

    let store = TestStore(initialState: AppFeature.State(home: homeState)) {
        AppFeature()
    } withDependencies: {
        $0.databaseClient.updateCustomization = { _, _, _ in }
    }

    await store.send(\.home.itemTapped, "b") {
        $0.path[id: 0] = .browser(URL(string: "https://example.com")!)
    }
}
```

- [ ] **Step 2: Run tests — verify the renamed test fails**

```bash
cd aaa && xcodegen generate && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' 2>&1 | tail -10
```

Expected: FAIL — `.browser` case doesn't exist on `Path`.

- [ ] **Step 3: Add `browser` case to `AppFeature.Path` and update routing**

In `aaa/AllAboutAnything/App/AppFeature.swift`:

Change the `Path` enum:

```swift
@Reducer
enum Path {
    case placeholder(PlaceholderFeature)
    case browser(URL)
}
```

Then `.browser(URL)` as an `associatedValue` in a `@Reducer enum` needs its own reducer. Since browser has no state beyond the URL, use a stub reducer:

Actually, `@Reducer enum` requires each case to embed another Reducer type. A plain associated value of `URL` won't compile. Create a trivial reducer for the browser:

First, above the `AppFeature` struct, add:

```swift
@Reducer
struct BrowserFeature {
    @ObservableState
    struct State: Equatable {
        let url: URL
    }

    enum Action: Equatable {}

    var body: some ReducerOf<Self> {
        EmptyReducer()
    }
}
```

Then update the `Path` enum:

```swift
@Reducer
enum Path {
    case placeholder(PlaceholderFeature)
    case browser(BrowserFeature)
}
```

Now update `.itemTapped` routing in the reducer body to push `.browser(BrowserFeature.State(url:))`:

```swift
case let .home(.itemTapped(id)):
    guard !state.home.isEditing,
          let item = state.home.gridItems[id: id] else {
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
            state.path.append(.browser(BrowserFeature.State(url: url)))
        } else {
            reportIssue("HomeItem \(item.id) has invalid destinationUrl: \(urlString)")
        }
    } else {
        reportIssue("HomeItem \(item.id) has no destination (both view and url are nil)")
    }
    return .none
```

- [ ] **Step 4: Update the test to use `BrowserFeature.State`**

The test written in Step 1 expected `.browser(URL(string: ...)!)`. Update it to match the new State type:

```swift
await store.send(\.home.itemTapped, "b") {
    $0.path[id: 0] = .browser(BrowserFeature.State(url: URL(string: "https://example.com")!))
}
```

Also update `BrowserFeature.State` to include an `Equatable` conformance on the Path state if needed (`extension AppFeature.Path.State: Equatable {}` is already in the file — verify it still applies to both cases).

- [ ] **Step 5: Run tests — verify pass**

```bash
cd aaa && xcodegen generate && xcodebuild test -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' 2>&1 | tail -5
```

Expected: `Test run with 19 tests in 0 suites passed`.

- [ ] **Step 6: Commit**

```bash
git add aaa/AllAboutAnything/App/AppFeature.swift aaa/AllAboutAnythingTests/AppFeatureTests.swift
git commit -m "feat(aaa): route URL home items to BrowserFeature path case"
```

---

### Task 3: Render SafariBrowserView in the nav stack

**Files:**
- Modify: `aaa/AllAboutAnything/AllAboutAnythingApp.swift`

- [ ] **Step 1: Add the browser case to the destination switch**

In `aaa/AllAboutAnything/AllAboutAnythingApp.swift`, update the `NavigationStack`'s `destination:` switch:

```swift
} destination: { store in
    switch store.case {
    case let .placeholder(store):
        PlaceholderView(store: store)
    case let .browser(store):
        SafariBrowserView(url: store.url)
            .ignoresSafeArea()
            .navigationBarBackButtonHidden(true)
    }
}
```

`SFSafariViewController` has its own close/done button, so hiding the navigation back button avoids a double UI. `ignoresSafeArea` lets Safari fill the screen.

- [ ] **Step 2: Verify build**

```bash
cd aaa && xcodegen generate && xcodebuild build -project AllAboutAnything.xcodeproj -scheme AllAboutAnything -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5' -quiet
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 3: Manual verification**

Launch on simulator. Tap "Campus Map" (URL destination). Expected: an in-app Safari view opens showing the campus map URL. Tap Done/Close to dismiss. Verify Oleville (the other URL item) also works.

- [ ] **Step 4: Commit**

```bash
git add aaa/AllAboutAnything/AllAboutAnythingApp.swift
git commit -m "feat(aaa): present SafariBrowserView for browser path destinations"
```

---

### Task 4: Update FOLLOWUPS

**Files:**
- Modify: `aaa/FOLLOWUPS.md`

- [ ] **Step 1: Remove the URL destinations entry**

Delete the "URL destinations open in-app browser" section from `aaa/FOLLOWUPS.md`.

- [ ] **Step 2: Commit**

```bash
git add aaa/FOLLOWUPS.md
git commit -m "docs(aaa): remove completed URL-browser followup"
```
