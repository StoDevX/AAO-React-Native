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
| `Module*Tests.swift` | One test class per feature, subclassing `UITestCaseUnbooted` when the first step opens a route by URL (which launches the app), or `UITestCase` when the test starts on the home screen |
| `Screens/*.swift` | One screen object per screen, conforming to `Screen` |
| `Screen.swift` | The `Screen` protocol and the helpers every screen inherits |
| `UITestCase.swift` | Base class: launch arguments, fresh state, `app` |
| `TestIdentifiers.swift` | Every identifier and label string, shared with the app |
| `XCUITestHelpers.swift` | `XCUIApplication`/`XCUIElement` query extensions |
| `Chaos/` | The chaos monkey (`mise run chaos`), its oracles, its canaries, and the generated route list; its `README.md` is the guide |

## Conventions

**Screen objects hold the queries; tests hold the intent.** A test should read
as a chain of named steps, with no `app.buttons[...]` in it:

```swift
func testACategoryNarrowsTheListAndResetBringsItBack() throws {
    CalendarScreen(app: app)
        .navigate()
        .verifyRowPresent(TestIdentifiers.Calendar.unfilteredDayRow)
        .openPicker()
        .openSubmenu(TestIdentifiers.Calendar.categoryMenu)
        .tapMenuItem(TestIdentifiers.Calendar.categories[0])
        .dismissMenu()
        .verifyRowAbsent(TestIdentifiers.Calendar.unfilteredDayRow)
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
`nil`, when the field is empty. The map's field is a `UISearchBar`
inside an `@expo/ui` sheet, so it is `app.searchFields[...]` too. Its cancel
button carries no identifier and, on iOS 26, the label `Close` — which the
building card's own dismiss button also has — so query it inside the bar rather
than across the whole screen.

**Retry a dropped tap; do not lengthen the timeout.** A row is hittable as soon
as its host mounts, but its action has to reach JavaScript — a tap synthesized
in between lands natively and does nothing. Waiting longer never fixes a tap
that was dropped, so tap again: `tap(_:until:named:)` in `Screen.swift` taps
until a marker appears — the next screen, or the control's new label — and
retries only while the element can still be hit. A native menu item's tap is
UIKit's to deliver, so it needs no retry.

**A screen's `navigate()` opens its route by URL,** through
`open(route:mountedWhen:)`, and waits for the screen's `mounted` element --
something only that screen draws. The wait is not optional: a relaunched app
has no home screen while it is still blank, so "Home has gone" is true before
anything has mounted. `XCUIApplication.open(_:)` relaunches an already running
app, so a URL always takes the cold-launch path. To relaunch mid-test
with state kept, call `keepStateForNextLaunch(adding:)` and then `navigate()`;
set launch arguments on `app` before the first `navigate()` for anything the
first launch needs, such as a text size.

**The home tiles and Home's ⋯ menu are tapped by `ModuleHomeTests`,** which
checks each against its screen's `mounted` element. A new menu item goes in
`testEveryHomeMenuItemOpensItsScreen`'s list, and a new tile in the list of the
test that covers its place in the grid: `testTheUpperTilesOpenTheirScreens` or
`testTheLowerTilesOpenTheirScreens`.

**Assert the precondition before the action.** Read a field's text back after
typing it; confirm a row exists before tapping. A test that silently did nothing
otherwise passes exactly like one that worked.

## What earns a slot

Every test cold-launches the app. On CI, launching and tapping through the
home screen took a median 23 seconds before the screen under test was up —
**roughly 1% of a 45-minute shard**. Opening the route by URL skips the home
screen's share of that. Three shards is
a ceiling, not a preference: this is a public repo on a free org plan, so
GitHub allows 5 concurrent macOS jobs and a merge group already needs 4. The
only lever on the suite's wall-clock is how many tests are in it.

So:

**A UITest earns a slot when you can name a defect in *our* code that makes it
go red.** Not "it covers a screen". Not "someone might want the screenshot". A
specific wrong thing we could ship, which this test turns red.

Four disqualifiers, each of which has removed a test here:

1. **The assertion does not discriminate.** The test passes identically in both
   states it exists to tell apart. `testDayDotContrastInDarkMode` set the
   appearance to dark, the app did not follow, and its assertions passed either
   way — it photographed a light screen, called it dark, and could not fail at
   the one thing it was for.
2. **Reachability is already asserted elsewhere.**
   `ModuleHomeTests` taps every tile, and `navigate()` asserts its
   screen mounted. A capture-only test is therefore a second copy of both at
   the price of a full cold launch.
3. **The defect would be in iOS or a library, not in us.**
   `testAddToCalendarSurvivesReopeningTheSheet` asserted that
   react-native-screens reuses a navigation controller, which is not ours to
   hold.
4. **Another test in the same class does everything this one does, and more.**

And the clause that settles screenshots:

**A screenshot is not an assertion.** It is a review artifact with a shelf
life. It earns its cold launch while a migration is under review and stops
earning it the day that migration merges. The question for keeping one is not
"did this help when I built it?" but **"could a refactor break this, and would
the test go red when it did?"** If the answer to the second half is no, delete
it.

A reachability test is still worth keeping when it is a class's *only* test —
"the screen crashes on mount" is a real defect and nothing else catches it.

## Two things that will catch you out

**A new `.swift` file needs `mise run prebuild`.**
`plugins/with-xcuitest-target.ts` walks this directory at prebuild time and
writes one `PBXFileReference` per file, so a file added afterwards is invisible
to the build and nothing warns you. Editing an existing file is fine.

**Every test cold-launches the app** with `--uitesting` and `--reset-state`, so
UserDefaults and AsyncStorage start empty each time. Anything a test needs
turned on — dev mode, a persisted setting — it has to turn on itself.

## Checking VoiceOver

`XCUIDevice.shared.voiceOverService` (iOS 27) runs real VoiceOver inside an
XCUITest on the simulator, and reports what it says. Use it to check a change
that alters what VoiceOver reads — a merged text view, a hidden caption, a new
heading — **as a local check, not a committed test.** Turning VoiceOver on and
off costs about 7.5 seconds and each step about half a second, which no test
here earns; write the test, run it, report what it heard, and leave it out of
the branch.

- `enable()` and `disable()` throw. `currentSpeech()`, `moveForward()`,
  `moveBackward()`, `moveIn()` and `moveOut()` each return an `Output` whose
  `utterance` is what VoiceOver said, traits and hints included:
  `"SEPTEMBER 30, 2026 · 25 STORIES Heading"`, `"All News Button"`.
- The class is `@MainActor` and iOS 27 only, so the test method needs
  `@MainActor @available(iOS 27.0, *)`.
- **An utterance stops at 64 characters.** Compare the start of a long label,
  not the whole of it.
- **VoiceOver stays on if `disable()` never runs**, and every tap in the tests
  after it then does nothing. Call it from `tearDownWithError`.
- There is no rotor: to reach a heading or a link, step to it.
