# UITests

XCUITests against the real app on a simulator. This is where anything about
appearance or interaction is tested — tint, spacing, truncation, tap targets,
menu and sheet presentation, safe areas, gestures — because Jest has no layout
pass and cannot see any of it.

**To run these, use the `run-uitests` skill.** It covers the build/run commands,
proving a test red before trusting it, and pulling screenshots out of a result
bundle. To drive the app by hand instead of asserting on it, see
`run-on-simulator`.

## Layout

| Path | What it holds |
| --- | --- |
| `Module*Tests.swift` | One test class per feature, subclassing `UITestCase` |
| `Screens/*.swift` | One screen object per screen, conforming to `Screen` |
| `Screen.swift` | The `Screen` protocol and the helpers every screen inherits |
| `UITestCase.swift` | Base class: launch arguments, fresh state, `app` |
| `TestIdentifiers.swift` | Every identifier and label string, shared with the app |
| `XCUITestHelpers.swift` | `XCUIApplication`/`XCUIElement` query extensions |

## Conventions

**Screen objects hold the queries; tests hold the intent.** A test should read
as a chain of named steps, with no `app.buttons[...]` in it:

```swift
func testCancelledSwipeBackKeepsTheQuery() throws {
    DirectoryScreen(app: app)
        .navigate()
        .search(for: "olaf")
        .cancelSwipeBack()
        .verifySearchText("olaf")
}
```

Screen methods are `@discardableResult` and return `Self`. Assertions live in
the screen object with a message saying what should have been true.

**Identifiers go in `TestIdentifiers.swift`, never inline.** React Native's
`testID` maps to `accessibilityIdentifier` on iOS, and the app reads the same
struct, so a literal in a test is drift waiting to happen.

**Query by identifier, not by element type.** The XCUITest type a React Native
component lands as varies — button, other, cell — so prefer
`app.element(matching:)` from `XCUITestHelpers.swift`. Pressable-wrapped rows
often carry a concatenated label, which is what `elementWithLabel(startingWith:)`
is for — but it is prefix matching, so a later row named as an extension of an
earlier one will match both.

**A `Stack.SearchBar` is `app.searchFields.firstMatch`**, wherever the screen
puts it — the bottom-toolbar placement most screens use here is reached the same
way as a header one. `searchField.value as? String` returns the placeholder, not
`nil`, when the field is empty. The SwiftUI `TextField` on the Carleton map is
the exception: that one is `app.textFields[...]`.

**Retry a dropped tap; do not lengthen the timeout.** A row is hittable as soon
as its host mounts, but its action has to reach JavaScript — a tap synthesized
in between lands natively and does nothing. Waiting longer never fixes a tap
that was dropped, so tap again. `navigateFromHome` is the pattern.

**Assert the precondition before the action.** Read a field's text back after
typing it; confirm a row exists before tapping. A test that silently did nothing
otherwise passes exactly like one that worked.

## Two things that will catch you out

**A new `.swift` file needs `mise run prebuild`.**
`plugins/with-xcuitest-target.ts` walks this directory at prebuild time and
writes one `PBXFileReference` per file, so a file added afterwards is invisible
to the build and nothing warns you. Editing an existing file is fine.

**Every test cold-launches the app** with `--uitesting` and `--reset-state`, so
UserDefaults and AsyncStorage start empty each time. Anything a test needs
turned on — dev mode, a persisted setting — it has to turn on itself.
