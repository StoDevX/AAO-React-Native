# Port Detox E2E Tests to XCUITest

## Overview

Replace the Detox end-to-end test suite with native Xcode UITests (XCUITest). The Detox suite has 53 tests (46 active, 7 skipped) across 18 module files. The XCUITest target already exists with 2 tests that will be reorganized into the new structure.

## File Structure

Delete `AllAboutOlafUITests.swift`. Create 18 new Swift files in `ios/AllAboutOlafUITests/`, one per module, plus one shared helper file. Each file contains one `XCTestCase` subclass.

New files:

| Swift file | Class | Source Detox file |
|---|---|---|
| `XCUITestHelpers.swift` | (extension on `XCUIApplication`) | n/a |
| `ModuleHomeTests.swift` | `ModuleHomeTests` | `module-home.spec.ts` |
| `ModuleBuildingHoursTests.swift` | `ModuleBuildingHoursTests` | `module-building-hours.spec.ts` |
| `ModuleCalendarTests.swift` | `ModuleCalendarTests` | `module-calendar.spec.ts` |
| `ModuleCampusDictionaryTests.swift` | `ModuleCampusDictionaryTests` | `module-campus-dictionary.spec.ts` |
| `ModuleCampusMapTests.swift` | `ModuleCampusMapTests` | `module-campus-map.spec.ts` |
| `ModuleCourseCatalogTests.swift` | `ModuleCourseCatalogTests` | `module-course-catalog.spec.ts` |
| `ModuleDirectoryTests.swift` | `ModuleDirectoryTests` | `module-directory.spec.ts` |
| `ModuleImportantContactsTests.swift` | `ModuleImportantContactsTests` | `module-important-contacts.spec.ts` |
| `ModuleMenusTests.swift` | `ModuleMenusTests` | `module-menus.spec.ts` |
| `ModuleMoreTests.swift` | `ModuleMoreTests` | `module-more.spec.ts` |
| `ModuleOlevilleTests.swift` | `ModuleOlevilleTests` | `module-oleville.spec.ts` |
| `ModuleSettingsTests.swift` | `ModuleSettingsTests` | `module-settings.spec.ts` |
| `ModuleSISTests.swift` | `ModuleSISTests` | `module-sis.spec.ts` |
| `ModuleStoPrintTests.swift` | `ModuleStoPrintTests` | `module-stoprint.spec.ts` |
| `ModuleStreamingMediaTests.swift` | `ModuleStreamingMediaTests` | `module-streaming-media.spec.ts` |
| `ModuleStudentOrgsTests.swift` | `ModuleStudentOrgsTests` | `module-student-orgs.spec.ts` |
| `ModuleTransportationTests.swift` | `ModuleTransportationTests` | `module-transportation.spec.ts` |

Existing tests move into the new files:
- `testHomeScreenRenders` from `AllAboutOlafUITests` -> `ModuleHomeTests`
- `testChangesAppIconToBigOleAndBack` from `AllAboutOlafUITests` -> `ModuleSettingsTests`

## Shared Helper

`XCUITestHelpers.swift` provides an extension on `XCUIApplication`:

```swift
import XCTest

extension XCUIApplication {
    /// Find an element by its accessibility identifier regardless of element type.
    /// React Native testID maps to accessibilityIdentifier, but the XCUITest
    /// element type varies depending on the component (button, other, cell, etc.).
    func element(matching identifier: String) -> XCUIElement {
        descendants(matching: .any)[identifier].firstMatch
    }
}
```

## API Mapping

| Detox | XCUITest |
|---|---|
| `device.launchApp()` | `app.launch()` in `setUpWithError()` |
| `device.launchApp({delete: true})` | `app.terminate(); app.launch()` in the specific test method |
| `device.reloadReactNative()` | No-op; no between-test reset by default |
| `by.id(id)` | `app.element(matching: id)` (custom helper) |
| `by.text(text)` | `app.staticTexts[text].firstMatch` |
| `element(matcher).tap()` | `element.tap()` |
| `expect(el).toBeVisible()` | `XCTAssertTrue(el.waitForExistence(timeout: 30))` |
| `expect(el).not.toBeVisible()` | `XCTAssertFalse(el.exists)` |
| `xit(...)` / `xtest(...)` | `throw XCTSkip("reason")` at start of test method |
| `test.each` | Individual test methods per variant |

## Test Lifecycle

Each `XCTestCase` subclass:

```swift
override func setUpWithError() throws {
    continueAfterFailure = false
    app = XCUIApplication()
    app.launch()
}
```

- **Per-class**: `setUpWithError()` launches the app once before each test method.
- **Per-test**: No special reset. XCUITest calls `setUpWithError()` before each test method, which relaunches the app.
- **Fresh state tests**: The SIS `balances` tests need fresh app state. These test methods call `app.terminate()` and `app.launch()` explicitly (XCUITest does not support deleting app data directly, but a fresh launch resets the JS bundle state in the same way `reloadReactNative` does for these tests).

Note: XCUITest's default behavior calls `setUpWithError()` before each test method, so `app.launch()` there effectively gives us a fresh launch per test. This is slightly different from Detox's "launch once, reload RN between tests" but is actually more isolated and reliable.

## Skip Markers

Skipped tests use `throw XCTSkip("reason")` at the start of the test body:

| Test | Skip reason |
|---|---|
| `ModuleCampusMapTests.testReturnsToHomescreenWhenClosed` | "Cannot return to home from SFViewController" |
| `ModuleOlevilleTests.testReturnsToHomescreenWhenClosed` | "Cannot return to home from SFViewController" |
| `ModuleStoPrintTests.testSaysYouAreNotLoggedInByDefault` | "stoPrint API request hangs in CI" |
| `ModuleTransportationTests.testIsReachableFromHomescreen` | "Transportation screen crashes in CI" |
| `ModuleTransportationTests.testHasTransportationViewVisibleByDefault` | "Transportation screen crashes in CI" |
| `ModuleTransportationTests.testExpressBusTabCanBeOpened` | "Transportation screen crashes in CI" |
| `ModuleTransportationTests.testRedLineTabCanBeOpened` | "Transportation screen crashes in CI" |
| `ModuleTransportationTests.testBlueLineTabCanBeOpened` | "Transportation screen crashes in CI" |
| `ModuleTransportationTests.testOlesGoTabCanBeOpened` | "Transportation screen crashes in CI" |
| `ModuleTransportationTests.testOtherModesTabCanBeOpened` | "Transportation screen crashes in CI" |

## Test-by-Test Port

### ModuleHomeTests (2 tests)

1. `testShowsTheHomeScreen` - Verify `screen-homescreen` is visible. (From Detox)
2. `testHomeScreenRenders` - Verify Menus button exists on home screen. (From existing XCUITest, uses `app.buttons["Menus"]` with 30s timeout)

### ModuleBuildingHoursTests (2 tests)

1. `testIsReachableFromHomescreen` - Tap "Building Hours", verify homescreen gone.
2. `testHasBuildingListVisibleByDefault` - Tap "Building Hours", verify "Building Hours" text visible.

### ModuleCalendarTests (5 tests)

1. `testIsReachableFromHomescreen` - Tap "Calendar", verify homescreen gone.
2. `testHasCalendarListVisibleByDefault` - Tap "Calendar", verify "Calendar" text visible.
3. `testStOlafCalendarCanBeOpened` - Tap "Calendar", then tap "St. Olaf".
4. `testOlevilleCalendarCanBeOpened` - Tap "Calendar", then tap "Oleville".
5. `testNorthfieldCalendarCanBeOpened` - Tap "Calendar", then tap "Northfield".

### ModuleCampusDictionaryTests (2 tests)

1. `testIsReachableFromHomescreen` - Tap "Campus Dictionary", verify homescreen gone.
2. `testHasListVisible` - Tap "Campus Dictionary", verify "Campus Dictionary" text visible.

### ModuleCampusMapTests (2 tests, 1 skipped)

1. `testIsReachableFromHomescreen` - Tap "Campus Map", verify homescreen gone.
2. `testReturnsToHomescreenWhenClosed` - **SKIPPED**: "Cannot return to home from SFViewController". Tap "Campus Map", tap "Done", verify homescreen.

### ModuleCourseCatalogTests (2 tests)

1. `testIsReachableFromHomescreen` - Tap "Course Catalog", verify homescreen gone.
2. `testHasSearchViewVisibleByDefault` - Tap "Course Catalog", verify "Course Catalog" and "Recent" visible.

### ModuleDirectoryTests (2 tests)

1. `testIsReachableFromHomescreen` - Tap "Directory", verify homescreen gone.
2. `testHasSearchViewVisibleByDefault` - Tap "Directory", verify "Directory" and "Search the Directory" visible.

### ModuleImportantContactsTests (2 tests)

1. `testIsReachableFromHomescreen` - Tap "Important Contacts", verify homescreen gone.
2. `testHasContactsListVisibleByDefault` - Tap "Important Contacts", verify "Important Contacts" text visible.

### ModuleMenusTests (9 tests)

1. `testIsReachableFromHomescreen` - Tap "Menus", verify homescreen gone.
2. `testHasMenusListVisibleByDefault` - Tap "Menus", verify "Menus" text visible.
3. `testStavHallMenuCanBeOpened` - Tap "Menus", tap "Stav Hall", verify "Specials Only".
4. `testTheCageMenuCanBeOpened` - Tap "Menus", tap "The Cage", verify "Specials Only".
5. `testThePauseMenuCanBeOpened` - Tap "Menus", tap "The Pause", verify "Specials Only".
6. `testBurtonMenuCanBeOpened` - Tap "Menus", tap "Carleton", tap "Burton", verify "Specials Only".
7. `testLDCMenuCanBeOpened` - Tap "Menus", tap "Carleton", tap "LDC", verify "Specials Only".
8. `testWeitzCenterMenuCanBeOpened` - Tap "Menus", tap "Carleton", tap "Weitz Center", verify "Specials Only".
9. `testSaylesHillMenuCanBeOpened` - Tap "Menus", tap "Carleton", tap "Sayles Hill", verify "Specials Only".

### ModuleMoreTests (2 tests)

1. `testIsReachableFromHomescreen` - Tap "More", verify homescreen gone.
2. `testHasListVisible` - Tap "More", verify "More" text visible.

### ModuleOlevilleTests (2 tests, 1 skipped)

1. `testIsReachableFromHomescreen` - Tap "Oleville", verify homescreen gone.
2. `testReturnsToHomescreenWhenClosed` - **SKIPPED**: "Cannot return to home from SFViewController". Tap "Oleville", tap "Done", verify homescreen.

### ModuleSettingsTests (3 tests)

1. `testShowsSettingsScreenAfterTap` - Tap `button-open-settings`, verify "Sign in to St. Olaf" visible.
2. `testShowsHomeScreenAfterExitingSettings` - Tap `button-open-settings`, tap "Done", verify homescreen.
3. `testChangesAppIconToBigOleAndBack` - (From existing XCUITest) Navigate to settings, verify default icon selected, tap Big Ole icon, verify selection changed, switch back, verify default selected again. Includes system alert handling.

### ModuleSISTests (5 tests)

1. `testIsReachableFromHomescreen` - Tap "SIS", verify homescreen gone.
2. `testHasAcknowledgementVisibleByDefault` - Fresh launch, tap "SIS", verify "I Agree" visible.
3. `testShowsBalancesAfterAcknowledgement` - Fresh launch, tap "SIS", tap "I Agree", verify "BALANCES" and "MEAL PLAN" visible.
4. `testContinuesToShowBalancesAfterReopening` - Fresh launch, tap "SIS", tap "I Agree", go back, re-enter SIS, verify still showing balances.
5. `testOpenJobsTabCanBeOpened` - Tap "SIS", tap "Open Jobs", verify "Open Jobs" visible.

### ModuleStoPrintTests (2 tests, 1 skipped)

1. `testIsReachableFromHomescreen` - Tap "stoPrint", verify homescreen gone.
2. `testSaysYouAreNotLoggedInByDefault` - **SKIPPED**: "stoPrint API request hangs in CI". Tap "stoPrint", verify "You are not logged in" visible.

### ModuleStreamingMediaTests (5 tests)

1. `testIsReachableFromHomescreen` - Tap "Streaming Media", verify homescreen gone.
2. `testHasStreamListVisibleByDefault` - Tap "Streaming Media", verify `stream-list` ID visible.
3. `testWebcamsTabCanBeOpened` - Tap "Streaming Media", tap "Webcams", verify "East Quad".
4. `testKSTOTabCanBeOpened` - Tap "Streaming Media", tap "KSTO", verify "KSTO 93.1 FM".
5. `testKRLXTabCanBeOpened` - Tap "Streaming Media", tap "KRLX", verify "88.1 KRLX-FM".

### ModuleStudentOrgsTests (2 tests)

1. `testIsReachableFromHomescreen` - Tap "Student Orgs", verify homescreen gone.
2. `testHasListVisible` - Tap "Student Orgs", verify "Student Orgs" text visible.

### ModuleTransportationTests (7 tests, all skipped)

All skipped with: "Transportation screen crashes in CI"

1. `testIsReachableFromHomescreen` - Tap "Transportation", verify homescreen gone.
2. `testHasTransportationViewVisibleByDefault` - Tap "Transportation", verify "Transportation" text visible.
3. `testExpressBusTabCanBeOpened` - Tap "Transportation", tap "Express Bus".
4. `testRedLineTabCanBeOpened` - Tap "Transportation", tap "Red Line".
5. `testBlueLineTabCanBeOpened` - Tap "Transportation", tap "Blue Line".
6. `testOlesGoTabCanBeOpened` - Tap "Transportation", tap "Oles Go".
7. `testOtherModesTabCanBeOpened` - Tap "Transportation", tap "Other Modes".

## Deletions

Remove all Detox artifacts:

- `e2e/` directory (all 18 spec files, `jest.config.js`, `init.js`)
- `detox.config.js`
- `detox` optional dependency from `package.json`

## Xcode Project Changes

- Remove `AllAboutOlafUITests.swift` from the `AllAboutOlafUITests` target in `project.pbxproj`
- Add all 19 new Swift files to the `AllAboutOlafUITests` target in `project.pbxproj`
- No changes to schemes, build settings, or Info.plist

## What Stays Unchanged

- The `AllAboutOlafUITests` target and its build configuration
- The `Info.plist` and bridging header
- The Xcode scheme test configuration
- All React Native source code and accessibility identifiers
