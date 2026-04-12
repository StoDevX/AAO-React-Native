# Port Detox E2E Tests to XCUITest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Detox E2E test suite (53 tests, 18 files) with native XCUITest (Swift) so that end-to-end testing no longer depends on the Detox toolchain.

**Architecture:** Delete all Detox artifacts (`e2e/`, `detox.config.js`, `detox` optional dep). Create 18 new Swift XCUITest files (one per module) plus one shared helper, all in `ios/AllAboutOlafUITests/`. Update the Xcode project (`project.pbxproj`) to reference the new files. Add a `--reset-state` launch argument handler in `AppDelegate.swift` for tests that need a fresh AsyncStorage. Update the CI workflow (`check.yml`) to remove the Detox job and keep only the UITest job—removing the Detox dependency from the simulator discovery steps. The `ios-uitest` job currently reads `detox.config.js` to discover the simulator type and OS; this must be replaced with a standalone config or hardcoded values from the Xcode project.

**Tech Stack:** Swift / XCUITest, Xcode `project.pbxproj` edits, GitHub Actions YAML, React Native `AppDelegate.swift`

**Design spec:** `docs/superpowers/specs/2026-04-12-port-detox-to-xcuitest-design.md`

---

## File Structure

### New files (all in `ios/AllAboutOlafUITests/`)

| File | Responsibility |
|---|---|
| `XCUITestHelpers.swift` | `XCUIApplication` extension with `element(matching:)` helper |
| `ModuleHomeTests.swift` | Home screen tests (2 tests) |
| `ModuleBuildingHoursTests.swift` | Building Hours tests (2 tests) |
| `ModuleCalendarTests.swift` | Calendar tests (5 tests) |
| `ModuleCampusDictionaryTests.swift` | Campus Dictionary tests (2 tests) |
| `ModuleCampusMapTests.swift` | Campus Map tests (2 tests, 1 skipped) |
| `ModuleCourseCatalogTests.swift` | Course Catalog tests (2 tests) |
| `ModuleDirectoryTests.swift` | Directory tests (2 tests) |
| `ModuleImportantContactsTests.swift` | Important Contacts tests (2 tests) |
| `ModuleMenusTests.swift` | Menus tests (9 tests) |
| `ModuleMoreTests.swift` | More tests (2 tests) |
| `ModuleOlevilleTests.swift` | Oleville tests (2 tests, 1 skipped) |
| `ModuleSettingsTests.swift` | Settings tests (3 tests) |
| `ModuleSISTests.swift` | SIS tests (5 tests) |
| `ModuleStoPrintTests.swift` | stoPrint tests (2 tests, 1 skipped) |
| `ModuleStreamingMediaTests.swift` | Streaming Media tests (5 tests) |
| `ModuleStudentOrgsTests.swift` | Student Orgs tests (2 tests) |
| `ModuleTransportationTests.swift` | Transportation tests (7 tests, all skipped) |

### Modified files

| File | Change |
|---|---|
| `ios/AllAboutOlaf/AppDelegate.swift` | Add `#if DEBUG` block for `--reset-state` launch argument |
| `ios/AllAboutOlaf.xcodeproj/project.pbxproj` | Remove old `AllAboutOlafUITests.swift`, add 19 new Swift files |
| `.github/workflows/check.yml` | Remove `ios-detox` job, update `ios-uitest` to not depend on `detox.config.js`, update `ios-build` to drop the Detox build step, add sharding to `ios-uitest` |
| `package.json` | Remove `detox` from `optionalDependencies` |

### Deleted files

| File | Reason |
|---|---|
| `ios/AllAboutOlafUITests/AllAboutOlafUITests.swift` | Replaced by the 18 new module files |
| `e2e/` (entire directory — 18 `.spec.ts` files, `jest.config.js`, `init.js`) | Detox tests being replaced |
| `detox.config.js` | Detox configuration no longer needed |

---

## Task 1: Add `--reset-state` support to AppDelegate

This task adds the app-side support that the SIS "balances" tests need to clear persisted state between runs. It must be done first because later XCUITest files depend on it.

**Files:**
- Modify: `ios/AllAboutOlaf/AppDelegate.swift:8-14`

- [ ] **Step 1: Add the `--reset-state` handler**

Open `ios/AllAboutOlaf/AppDelegate.swift`. Inside `application(_:didFinishLaunchingWithOptions:)`, add the following block **before** the existing `self.moduleName = "AllAboutOlaf"` line:

```swift
override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
    #if DEBUG
    if ProcessInfo.processInfo.arguments.contains("--reset-state") {
        // Clear AsyncStorage
        if let libraryPath = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first {
            let asyncStoragePath = libraryPath.appendingPathComponent("Application Support/RCTAsyncLocalStorage_V1")
            try? FileManager.default.removeItem(at: asyncStoragePath)
        }
        // Clear UserDefaults
        if let bundleId = Bundle.main.bundleIdentifier {
            UserDefaults.standard.removePersistentDomain(forName: bundleId)
        }
    }
    #endif

    self.moduleName = "AllAboutOlaf"
    // ... rest of the method stays the same
```

The full method should read:

```swift
override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
    #if DEBUG
    if ProcessInfo.processInfo.arguments.contains("--reset-state") {
        if let libraryPath = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first {
            let asyncStoragePath = libraryPath.appendingPathComponent("Application Support/RCTAsyncLocalStorage_V1")
            try? FileManager.default.removeItem(at: asyncStoragePath)
        }
        if let bundleId = Bundle.main.bundleIdentifier {
            UserDefaults.standard.removePersistentDomain(forName: bundleId)
        }
    }
    #endif

    self.moduleName = "AllAboutOlaf"

    // set up the requests cacher
    let urlCache = URLCache(
        memoryCapacity: 4 * 1024 * 1024,  // 4 MiB
        diskCapacity: 20 * 1024 * 1024    // 20 MiB
    )
    URLCache.shared = urlCache

    // ignore vibrate/silent switch when playing audio
    try? AVAudioSession.sharedInstance().setCategory(.playback)

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
}
```

- [ ] **Step 2: Verify the change compiles (syntax check)**

Since we can't build iOS on this runner, verify the Swift syntax is valid by reading back the file and confirming the `#if DEBUG` / `#endif` pair is balanced and the method body is well-formed.

- [ ] **Step 3: Commit**

```bash
git add ios/AllAboutOlaf/AppDelegate.swift
git commit -m "feat(ios): add --reset-state launch argument for clearing test state"
```

---

## Task 2: Create XCUITestHelpers.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/XCUITestHelpers.swift`

- [ ] **Step 1: Write the helper file**

Create `ios/AllAboutOlafUITests/XCUITestHelpers.swift` with the following content:

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

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/XCUITestHelpers.swift
git commit -m "feat(ios): add XCUITest helpers extension"
```

---

## Task 3: Create ModuleHomeTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleHomeTests.swift`

Source Detox files: `e2e/module-home.spec.ts`, existing `AllAboutOlafUITests.swift` (`testHomeScreenRenders`)

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleHomeTests.swift`:

```swift
import XCTest

class ModuleHomeTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testShowsTheHomeScreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30),
                      "Home screen should be visible")
    }

    func testHomeScreenRenders() throws {
        let menus = app.buttons["Menus"]
        XCTAssertTrue(menus.waitForExistence(timeout: 30),
                      "Home screen should show Menus button")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleHomeTests.swift
git commit -m "feat(ios): add ModuleHomeTests XCUITest"
```

---

## Task 4: Create ModuleBuildingHoursTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleBuildingHoursTests.swift`

Source: `e2e/module-building-hours.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleBuildingHoursTests.swift`:

```swift
import XCTest

class ModuleBuildingHoursTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Building Hours"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasBuildingListVisibleByDefault() throws {
        app.staticTexts["Building Hours"].firstMatch.tap()

        let title = app.staticTexts["Building Hours"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Building Hours title should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleBuildingHoursTests.swift
git commit -m "feat(ios): add ModuleBuildingHoursTests XCUITest"
```

---

## Task 5: Create ModuleCalendarTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleCalendarTests.swift`

Source: `e2e/module-calendar.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleCalendarTests.swift`:

```swift
import XCTest

class ModuleCalendarTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Calendar"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasCalendarListVisibleByDefault() throws {
        app.staticTexts["Calendar"].firstMatch.tap()

        let title = app.staticTexts["Calendar"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Calendar title should be visible")
    }

    func testStOlafCalendarCanBeOpened() throws {
        app.staticTexts["Calendar"].firstMatch.tap()

        let tab = app.staticTexts["St. Olaf"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }

    func testOlevilleCalendarCanBeOpened() throws {
        app.staticTexts["Calendar"].firstMatch.tap()

        let tab = app.staticTexts["Oleville"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }

    func testNorthfieldCalendarCanBeOpened() throws {
        app.staticTexts["Calendar"].firstMatch.tap()

        let tab = app.staticTexts["Northfield"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleCalendarTests.swift
git commit -m "feat(ios): add ModuleCalendarTests XCUITest"
```

---

## Task 6: Create ModuleCampusDictionaryTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleCampusDictionaryTests.swift`

Source: `e2e/module-campus-dictionary.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleCampusDictionaryTests.swift`:

```swift
import XCTest

class ModuleCampusDictionaryTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Campus Dictionary"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasListVisible() throws {
        app.staticTexts["Campus Dictionary"].firstMatch.tap()

        let title = app.staticTexts["Campus Dictionary"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Campus Dictionary title should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleCampusDictionaryTests.swift
git commit -m "feat(ios): add ModuleCampusDictionaryTests XCUITest"
```

---

## Task 7: Create ModuleCampusMapTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleCampusMapTests.swift`

Source: `e2e/module-campus-map.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleCampusMapTests.swift`:

```swift
import XCTest

class ModuleCampusMapTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Campus Map"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testReturnsToHomescreenWhenClosed() throws {
        throw XCTSkip("Cannot return to home from SFViewController")

        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Campus Map"].firstMatch.tap()
        XCTAssertFalse(homescreen.exists)

        app.staticTexts["Done"].firstMatch.tap()
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleCampusMapTests.swift
git commit -m "feat(ios): add ModuleCampusMapTests XCUITest"
```

---

## Task 8: Create ModuleCourseCatalogTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleCourseCatalogTests.swift`

Source: `e2e/module-course-catalog.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleCourseCatalogTests.swift`:

```swift
import XCTest

class ModuleCourseCatalogTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Course Catalog"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasSearchViewVisibleByDefault() throws {
        app.staticTexts["Course Catalog"].firstMatch.tap()

        let title = app.staticTexts["Course Catalog"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Course Catalog title should be visible")

        let recent = app.staticTexts["Recent"].firstMatch
        XCTAssertTrue(recent.waitForExistence(timeout: 30),
                      "Recent section should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleCourseCatalogTests.swift
git commit -m "feat(ios): add ModuleCourseCatalogTests XCUITest"
```

---

## Task 9: Create ModuleDirectoryTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleDirectoryTests.swift`

Source: `e2e/module-directory.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleDirectoryTests.swift`:

```swift
import XCTest

class ModuleDirectoryTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Directory"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasSearchViewVisibleByDefault() throws {
        app.staticTexts["Directory"].firstMatch.tap()

        let title = app.staticTexts["Directory"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Directory title should be visible")

        let searchPrompt = app.staticTexts["Search the Directory"].firstMatch
        XCTAssertTrue(searchPrompt.waitForExistence(timeout: 30),
                      "Search the Directory prompt should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleDirectoryTests.swift
git commit -m "feat(ios): add ModuleDirectoryTests XCUITest"
```

---

## Task 10: Create ModuleImportantContactsTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleImportantContactsTests.swift`

Source: `e2e/module-important-contacts.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleImportantContactsTests.swift`:

```swift
import XCTest

class ModuleImportantContactsTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Important Contacts"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasContactsListVisibleByDefault() throws {
        app.staticTexts["Important Contacts"].firstMatch.tap()

        let title = app.staticTexts["Important Contacts"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Important Contacts title should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleImportantContactsTests.swift
git commit -m "feat(ios): add ModuleImportantContactsTests XCUITest"
```

---

## Task 11: Create ModuleMenusTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleMenusTests.swift`

Source: `e2e/module-menus.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleMenusTests.swift`:

```swift
import XCTest

class ModuleMenusTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    // MARK: - Navigation

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Menus"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasMenusListVisibleByDefault() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let title = app.staticTexts["Menus"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Menus title should be visible")
    }

    // MARK: - St. Olaf menus

    func testStavHallMenuCanBeOpened() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let stavHall = app.staticTexts["Stav Hall"].firstMatch
        XCTAssertTrue(stavHall.waitForExistence(timeout: 30))
        stavHall.tap()

        let specialsOnly = app.staticTexts["Specials Only"].firstMatch
        XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
    }

    func testTheCageMenuCanBeOpened() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let theCage = app.staticTexts["The Cage"].firstMatch
        XCTAssertTrue(theCage.waitForExistence(timeout: 30))
        theCage.tap()

        let specialsOnly = app.staticTexts["Specials Only"].firstMatch
        XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
    }

    func testThePauseMenuCanBeOpened() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let thePause = app.staticTexts["The Pause"].firstMatch
        XCTAssertTrue(thePause.waitForExistence(timeout: 30))
        thePause.tap()

        let specialsOnly = app.staticTexts["Specials Only"].firstMatch
        XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
    }

    // MARK: - Carleton menus

    func testBurtonMenuCanBeOpened() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let carleton = app.staticTexts["Carleton"].firstMatch
        XCTAssertTrue(carleton.waitForExistence(timeout: 30))
        carleton.tap()

        let burton = app.staticTexts["Burton"].firstMatch
        XCTAssertTrue(burton.waitForExistence(timeout: 30))
        burton.tap()

        let specialsOnly = app.staticTexts["Specials Only"].firstMatch
        XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
    }

    func testLDCMenuCanBeOpened() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let carleton = app.staticTexts["Carleton"].firstMatch
        XCTAssertTrue(carleton.waitForExistence(timeout: 30))
        carleton.tap()

        let ldc = app.staticTexts["LDC"].firstMatch
        XCTAssertTrue(ldc.waitForExistence(timeout: 30))
        ldc.tap()

        let specialsOnly = app.staticTexts["Specials Only"].firstMatch
        XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
    }

    func testWeitzCenterMenuCanBeOpened() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let carleton = app.staticTexts["Carleton"].firstMatch
        XCTAssertTrue(carleton.waitForExistence(timeout: 30))
        carleton.tap()

        let weitzCenter = app.staticTexts["Weitz Center"].firstMatch
        XCTAssertTrue(weitzCenter.waitForExistence(timeout: 30))
        weitzCenter.tap()

        let specialsOnly = app.staticTexts["Specials Only"].firstMatch
        XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
    }

    func testSaylesHillMenuCanBeOpened() throws {
        app.staticTexts["Menus"].firstMatch.tap()

        let carleton = app.staticTexts["Carleton"].firstMatch
        XCTAssertTrue(carleton.waitForExistence(timeout: 30))
        carleton.tap()

        let saylesHill = app.staticTexts["Sayles Hill"].firstMatch
        XCTAssertTrue(saylesHill.waitForExistence(timeout: 30))
        saylesHill.tap()

        let specialsOnly = app.staticTexts["Specials Only"].firstMatch
        XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleMenusTests.swift
git commit -m "feat(ios): add ModuleMenusTests XCUITest"
```

---

## Task 12: Create ModuleMoreTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleMoreTests.swift`

Source: `e2e/module-more.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleMoreTests.swift`:

```swift
import XCTest

class ModuleMoreTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["More"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasListVisible() throws {
        app.staticTexts["More"].firstMatch.tap()

        let title = app.staticTexts["More"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "More title should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleMoreTests.swift
git commit -m "feat(ios): add ModuleMoreTests XCUITest"
```

---

## Task 13: Create ModuleOlevilleTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleOlevilleTests.swift`

Source: `e2e/module-oleville.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleOlevilleTests.swift`:

```swift
import XCTest

class ModuleOlevilleTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Oleville"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testReturnsToHomescreenWhenClosed() throws {
        throw XCTSkip("Cannot return to home from SFViewController")

        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Oleville"].firstMatch.tap()
        XCTAssertFalse(homescreen.exists)

        app.staticTexts["Done"].firstMatch.tap()
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleOlevilleTests.swift
git commit -m "feat(ios): add ModuleOlevilleTests XCUITest"
```

---

## Task 14: Create ModuleSettingsTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleSettingsTests.swift`

Source: `e2e/module-settings.spec.ts`, existing `AllAboutOlafUITests.swift` (`testChangesAppIconToBigOleAndBack`)

The `button-open-settings` testID is a `Touchable` (which renders a native button), so we use `app.buttons["button-open-settings"]`. The `accessibilityLabel` is "Open Settings" but the `testID` is `button-open-settings` (see `modules/navigation-buttons/open-settings.tsx:20`).

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleSettingsTests.swift`:

```swift
import XCTest

class ModuleSettingsTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testShowsSettingsScreenAfterTap() throws {
        let settingsButton = app.buttons["button-open-settings"]
        XCTAssertTrue(settingsButton.waitForExistence(timeout: 30),
                      "Settings button should appear on home screen")
        settingsButton.tap()

        let signIn = app.staticTexts["Sign in to St. Olaf"].firstMatch
        XCTAssertTrue(signIn.waitForExistence(timeout: 30),
                      "Sign in to St. Olaf should be visible")
    }

    func testShowsHomeScreenAfterExitingSettings() throws {
        let settingsButton = app.buttons["button-open-settings"]
        XCTAssertTrue(settingsButton.waitForExistence(timeout: 30))
        settingsButton.tap()

        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertFalse(homescreen.exists)

        app.staticTexts["Done"].firstMatch.tap()

        XCTAssertTrue(homescreen.waitForExistence(timeout: 30),
                      "Home screen should be visible after exiting settings")
    }

    func testChangesAppIconToBigOleAndBack() throws {
        // Auto-dismiss the "You have changed the icon" system alert
        addUIInterruptionMonitor(withDescription: "Icon change alert") { alert in
            let okButton = alert.buttons["OK"]
            if okButton.exists {
                okButton.tap()
                return true
            }
            return false
        }

        // Wait for the home screen to load before navigating
        let settingsButton = app.buttons["button-open-settings"]
        XCTAssertTrue(settingsButton.waitForExistence(timeout: 30),
                      "Settings button should appear on home screen")
        settingsButton.tap()

        // Verify default icon is selected, tap Big Ole
        let defaultSelected = app.element(matching: "app-icon-cell-default-selected")
        XCTAssertTrue(defaultSelected.waitForExistence(timeout: 10),
                      "Default icon should be selected initially")
        app.element(matching: "app-icon-cell-icon_type_windmill").tap()

        // Interact with the app to trigger the interruption monitor
        app.tap()

        // Verify Big Ole is now selected
        let windmillSelected = app.element(matching: "app-icon-cell-icon_type_windmill-selected")
        XCTAssertTrue(windmillSelected.waitForExistence(timeout: 10),
                      "Windmill icon should be selected after tapping it")

        // Tap default to switch back
        app.element(matching: "app-icon-cell-default").tap()
        app.tap()

        // Verify default is selected again
        let defaultReselected = app.element(matching: "app-icon-cell-default-selected")
        XCTAssertTrue(defaultReselected.waitForExistence(timeout: 10),
                      "Default icon should be selected after switching back")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleSettingsTests.swift
git commit -m "feat(ios): add ModuleSettingsTests XCUITest"
```

---

## Task 15: Create ModuleSISTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleSISTests.swift`

Source: `e2e/module-sis.spec.ts`

The SIS "balances" tests use `device.launchApp({delete: true})` in Detox, which we replace with `app.launchArguments = ["--reset-state"]` (from Task 1). The SIS "re-open" test navigates back via "All About Olaf" back button text.

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleSISTests.swift`:

```swift
import XCTest

class ModuleSISTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["SIS"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    // MARK: - Balances (need fresh state)

    func testHasAcknowledgementVisibleByDefault() throws {
        // Relaunch with fresh state to clear any prior "I Agree" acceptance
        app.terminate()
        app.launchArguments = ["--reset-state"]
        app.launch()

        app.staticTexts["SIS"].firstMatch.tap()

        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertFalse(homescreen.exists)

        let iAgree = app.staticTexts["I Agree"].firstMatch
        XCTAssertTrue(iAgree.waitForExistence(timeout: 30),
                      "I Agree acknowledgement should be visible")
    }

    func testShowsBalancesAfterAcknowledgement() throws {
        app.terminate()
        app.launchArguments = ["--reset-state"]
        app.launch()

        app.staticTexts["SIS"].firstMatch.tap()

        let iAgree = app.staticTexts["I Agree"].firstMatch
        XCTAssertTrue(iAgree.waitForExistence(timeout: 30))
        iAgree.tap()

        XCTAssertFalse(iAgree.exists,
                       "I Agree should be hidden after tapping")

        let balances = app.staticTexts["BALANCES"].firstMatch
        XCTAssertTrue(balances.waitForExistence(timeout: 30),
                      "BALANCES should be visible")

        let mealPlan = app.staticTexts["MEAL PLAN"].firstMatch
        XCTAssertTrue(mealPlan.waitForExistence(timeout: 30),
                      "MEAL PLAN should be visible")
    }

    func testContinuesToShowBalancesAfterReopening() throws {
        app.terminate()
        app.launchArguments = ["--reset-state"]
        app.launch()

        app.staticTexts["SIS"].firstMatch.tap()

        let iAgree = app.staticTexts["I Agree"].firstMatch
        XCTAssertTrue(iAgree.waitForExistence(timeout: 30))
        iAgree.tap()

        XCTAssertFalse(iAgree.exists)

        let balances = app.staticTexts["BALANCES"].firstMatch
        XCTAssertTrue(balances.waitForExistence(timeout: 30))

        // Return to the home screen
        let backButton = app.staticTexts["All About Olaf"].firstMatch
        XCTAssertTrue(backButton.waitForExistence(timeout: 10))
        backButton.tap()

        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        // Navigate back into SIS
        app.staticTexts["SIS"].firstMatch.tap()
        XCTAssertFalse(homescreen.exists)
    }

    // MARK: - Tabs

    func testOpenJobsTabCanBeOpened() throws {
        app.staticTexts["SIS"].firstMatch.tap()

        let openJobs = app.staticTexts["Open Jobs"].firstMatch
        XCTAssertTrue(openJobs.waitForExistence(timeout: 30))
        openJobs.tap()

        let openJobsTitle = app.staticTexts["Open Jobs"].firstMatch
        XCTAssertTrue(openJobsTitle.waitForExistence(timeout: 30),
                      "Open Jobs should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleSISTests.swift
git commit -m "feat(ios): add ModuleSISTests XCUITest"
```

---

## Task 16: Create ModuleStoPrintTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleStoPrintTests.swift`

Source: `e2e/module-stoprint.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleStoPrintTests.swift`:

```swift
import XCTest

class ModuleStoPrintTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["stoPrint"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testSaysYouAreNotLoggedInByDefault() throws {
        throw XCTSkip("stoPrint API request hangs in CI")

        app.staticTexts["stoPrint"].firstMatch.tap()

        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertFalse(homescreen.exists)

        let notLoggedIn = app.staticTexts["You are not logged in"].firstMatch
        XCTAssertTrue(notLoggedIn.waitForExistence(timeout: 30))
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleStoPrintTests.swift
git commit -m "feat(ios): add ModuleStoPrintTests XCUITest"
```

---

## Task 17: Create ModuleStreamingMediaTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleStreamingMediaTests.swift`

Source: `e2e/module-streaming-media.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleStreamingMediaTests.swift`:

```swift
import XCTest

class ModuleStreamingMediaTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Streaming Media"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasStreamListVisibleByDefault() throws {
        app.staticTexts["Streaming Media"].firstMatch.tap()

        let streamList = app.element(matching: "stream-list")
        XCTAssertTrue(streamList.waitForExistence(timeout: 30),
                      "stream-list should be visible")
    }

    func testWebcamsTabCanBeOpened() throws {
        app.staticTexts["Streaming Media"].firstMatch.tap()

        let webcams = app.staticTexts["Webcams"].firstMatch
        XCTAssertTrue(webcams.waitForExistence(timeout: 30))
        webcams.tap()

        let eastQuad = app.staticTexts["East Quad"].firstMatch
        XCTAssertTrue(eastQuad.waitForExistence(timeout: 30),
                      "East Quad should be visible after tapping Webcams")
    }

    func testKSTOTabCanBeOpened() throws {
        app.staticTexts["Streaming Media"].firstMatch.tap()

        let ksto = app.staticTexts["KSTO"].firstMatch
        XCTAssertTrue(ksto.waitForExistence(timeout: 30))
        ksto.tap()

        let kstoTitle = app.staticTexts["KSTO 93.1 FM"].firstMatch
        XCTAssertTrue(kstoTitle.waitForExistence(timeout: 30),
                      "KSTO 93.1 FM should be visible")
    }

    func testKRLXTabCanBeOpened() throws {
        app.staticTexts["Streaming Media"].firstMatch.tap()

        let krlx = app.staticTexts["KRLX"].firstMatch
        XCTAssertTrue(krlx.waitForExistence(timeout: 30))
        krlx.tap()

        let krlxTitle = app.staticTexts["88.1 KRLX-FM"].firstMatch
        XCTAssertTrue(krlxTitle.waitForExistence(timeout: 30),
                      "88.1 KRLX-FM should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleStreamingMediaTests.swift
git commit -m "feat(ios): add ModuleStreamingMediaTests XCUITest"
```

---

## Task 18: Create ModuleStudentOrgsTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleStudentOrgsTests.swift`

Source: `e2e/module-student-orgs.spec.ts`

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleStudentOrgsTests.swift`:

```swift
import XCTest

class ModuleStudentOrgsTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Student Orgs"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasListVisible() throws {
        app.staticTexts["Student Orgs"].firstMatch.tap()

        let title = app.staticTexts["Student Orgs"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30),
                      "Student Orgs title should be visible")
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleStudentOrgsTests.swift
git commit -m "feat(ios): add ModuleStudentOrgsTests XCUITest"
```

---

## Task 19: Create ModuleTransportationTests.swift

**Files:**
- Create: `ios/AllAboutOlafUITests/ModuleTransportationTests.swift`

Source: `e2e/module-transportation.spec.ts` (all 7 tests skipped)

- [ ] **Step 1: Write the test file**

Create `ios/AllAboutOlafUITests/ModuleTransportationTests.swift`:

```swift
import XCTest

class ModuleTransportationTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testIsReachableFromHomescreen() throws {
        throw XCTSkip("Transportation screen crashes in CI")

        let homescreen = app.element(matching: "screen-homescreen")
        XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

        app.staticTexts["Transportation"].firstMatch.tap()

        XCTAssertFalse(homescreen.exists)
    }

    func testHasTransportationViewVisibleByDefault() throws {
        throw XCTSkip("Transportation screen crashes in CI")

        app.staticTexts["Transportation"].firstMatch.tap()

        let title = app.staticTexts["Transportation"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 30))
    }

    func testExpressBusTabCanBeOpened() throws {
        throw XCTSkip("Transportation screen crashes in CI")

        app.staticTexts["Transportation"].firstMatch.tap()

        let tab = app.staticTexts["Express Bus"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }

    func testRedLineTabCanBeOpened() throws {
        throw XCTSkip("Transportation screen crashes in CI")

        app.staticTexts["Transportation"].firstMatch.tap()

        let tab = app.staticTexts["Red Line"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }

    func testBlueLineTabCanBeOpened() throws {
        throw XCTSkip("Transportation screen crashes in CI")

        app.staticTexts["Transportation"].firstMatch.tap()

        let tab = app.staticTexts["Blue Line"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }

    func testOlesGoTabCanBeOpened() throws {
        throw XCTSkip("Transportation screen crashes in CI")

        app.staticTexts["Transportation"].firstMatch.tap()

        let tab = app.staticTexts["Oles Go"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }

    func testOtherModesTabCanBeOpened() throws {
        throw XCTSkip("Transportation screen crashes in CI")

        app.staticTexts["Transportation"].firstMatch.tap()

        let tab = app.staticTexts["Other Modes"].firstMatch
        XCTAssertTrue(tab.waitForExistence(timeout: 30))
        tab.tap()
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios/AllAboutOlafUITests/ModuleTransportationTests.swift
git commit -m "feat(ios): add ModuleTransportationTests XCUITest"
```

---

## Task 20: Update Xcode project to reference new Swift files

This is the most complex task. We need to edit `ios/AllAboutOlaf.xcodeproj/project.pbxproj` to:
1. Remove the old `AllAboutOlafUITests.swift` file reference and its build-file entry
2. Add 19 new `PBXFileReference` entries (one per new Swift file)
3. Add 19 new `PBXBuildFile` entries (one per file, linking to the UITests target)
4. Add all 19 file references to the `AllAboutOlafUITests` group's `children` array
5. Add all 19 build-file references to the UITests target's `PBXSourcesBuildPhase`

**Files:**
- Modify: `ios/AllAboutOlaf.xcodeproj/project.pbxproj`

- [ ] **Step 1: Generate UUIDs for each new file**

Each file needs two UUIDs: one for the `PBXFileReference` and one for the `PBXBuildFile`. Use 24-character uppercase hex strings. Here are the assignments (you may regenerate these, they just need to be unique within the file):

| File | FileRef UUID | BuildFile UUID |
|---|---|---|
| `XCUITestHelpers.swift` | `A10000000000000000000001` | `A20000000000000000000001` |
| `ModuleHomeTests.swift` | `A10000000000000000000002` | `A20000000000000000000002` |
| `ModuleBuildingHoursTests.swift` | `A10000000000000000000003` | `A20000000000000000000003` |
| `ModuleCalendarTests.swift` | `A10000000000000000000004` | `A20000000000000000000004` |
| `ModuleCampusDictionaryTests.swift` | `A10000000000000000000005` | `A20000000000000000000005` |
| `ModuleCampusMapTests.swift` | `A10000000000000000000006` | `A20000000000000000000006` |
| `ModuleCourseCatalogTests.swift` | `A10000000000000000000007` | `A20000000000000000000007` |
| `ModuleDirectoryTests.swift` | `A10000000000000000000008` | `A20000000000000000000008` |
| `ModuleImportantContactsTests.swift` | `A10000000000000000000009` | `A20000000000000000000009` |
| `ModuleMenusTests.swift` | `A1000000000000000000000A` | `A2000000000000000000000A` |
| `ModuleMoreTests.swift` | `A1000000000000000000000B` | `A2000000000000000000000B` |
| `ModuleOlevilleTests.swift` | `A1000000000000000000000C` | `A2000000000000000000000C` |
| `ModuleSettingsTests.swift` | `A1000000000000000000000D` | `A2000000000000000000000D` |
| `ModuleSISTests.swift` | `A1000000000000000000000E` | `A2000000000000000000000E` |
| `ModuleStoPrintTests.swift` | `A1000000000000000000000F` | `A2000000000000000000000F` |
| `ModuleStreamingMediaTests.swift` | `A10000000000000000000010` | `A20000000000000000000010` |
| `ModuleStudentOrgsTests.swift` | `A10000000000000000000011` | `A20000000000000000000011` |
| `ModuleTransportationTests.swift` | `A10000000000000000000012` | `A20000000000000000000012` |

- [ ] **Step 2: Edit the PBXBuildFile section**

Find the line:
```
		00D33BE21DDA58A8001E830E /* AllAboutOlafUITests.swift in Sources */ = {isa = PBXBuildFile; fileRef = 00D33BE11DDA58A8001E830E /* AllAboutOlafUITests.swift */; };
```

Replace it with:
```
		A20000000000000000000001 /* XCUITestHelpers.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000001 /* XCUITestHelpers.swift */; };
		A20000000000000000000002 /* ModuleHomeTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000002 /* ModuleHomeTests.swift */; };
		A20000000000000000000003 /* ModuleBuildingHoursTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000003 /* ModuleBuildingHoursTests.swift */; };
		A20000000000000000000004 /* ModuleCalendarTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000004 /* ModuleCalendarTests.swift */; };
		A20000000000000000000005 /* ModuleCampusDictionaryTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000005 /* ModuleCampusDictionaryTests.swift */; };
		A20000000000000000000006 /* ModuleCampusMapTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000006 /* ModuleCampusMapTests.swift */; };
		A20000000000000000000007 /* ModuleCourseCatalogTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000007 /* ModuleCourseCatalogTests.swift */; };
		A20000000000000000000008 /* ModuleDirectoryTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000008 /* ModuleDirectoryTests.swift */; };
		A20000000000000000000009 /* ModuleImportantContactsTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000009 /* ModuleImportantContactsTests.swift */; };
		A2000000000000000000000A /* ModuleMenusTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1000000000000000000000A /* ModuleMenusTests.swift */; };
		A2000000000000000000000B /* ModuleMoreTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1000000000000000000000B /* ModuleMoreTests.swift */; };
		A2000000000000000000000C /* ModuleOlevilleTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1000000000000000000000C /* ModuleOlevilleTests.swift */; };
		A2000000000000000000000D /* ModuleSettingsTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1000000000000000000000D /* ModuleSettingsTests.swift */; };
		A2000000000000000000000E /* ModuleSISTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1000000000000000000000E /* ModuleSISTests.swift */; };
		A2000000000000000000000F /* ModuleStoPrintTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1000000000000000000000F /* ModuleStoPrintTests.swift */; };
		A20000000000000000000010 /* ModuleStreamingMediaTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000010 /* ModuleStreamingMediaTests.swift */; };
		A20000000000000000000011 /* ModuleStudentOrgsTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000011 /* ModuleStudentOrgsTests.swift */; };
		A20000000000000000000012 /* ModuleTransportationTests.swift in Sources */ = {isa = PBXBuildFile; fileRef = A10000000000000000000012 /* ModuleTransportationTests.swift */; };
```

- [ ] **Step 3: Edit the PBXFileReference section**

Find the line:
```
		00D33BE11DDA58A8001E830E /* AllAboutOlafUITests.swift */ = {isa = PBXFileReference; indentWidth = 4; lastKnownFileType = sourcecode.swift; path = AllAboutOlafUITests.swift; sourceTree = "<group>"; };
```

Replace it with:
```
		A10000000000000000000001 /* XCUITestHelpers.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = XCUITestHelpers.swift; sourceTree = "<group>"; };
		A10000000000000000000002 /* ModuleHomeTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleHomeTests.swift; sourceTree = "<group>"; };
		A10000000000000000000003 /* ModuleBuildingHoursTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleBuildingHoursTests.swift; sourceTree = "<group>"; };
		A10000000000000000000004 /* ModuleCalendarTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleCalendarTests.swift; sourceTree = "<group>"; };
		A10000000000000000000005 /* ModuleCampusDictionaryTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleCampusDictionaryTests.swift; sourceTree = "<group>"; };
		A10000000000000000000006 /* ModuleCampusMapTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleCampusMapTests.swift; sourceTree = "<group>"; };
		A10000000000000000000007 /* ModuleCourseCatalogTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleCourseCatalogTests.swift; sourceTree = "<group>"; };
		A10000000000000000000008 /* ModuleDirectoryTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleDirectoryTests.swift; sourceTree = "<group>"; };
		A10000000000000000000009 /* ModuleImportantContactsTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleImportantContactsTests.swift; sourceTree = "<group>"; };
		A1000000000000000000000A /* ModuleMenusTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleMenusTests.swift; sourceTree = "<group>"; };
		A1000000000000000000000B /* ModuleMoreTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleMoreTests.swift; sourceTree = "<group>"; };
		A1000000000000000000000C /* ModuleOlevilleTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleOlevilleTests.swift; sourceTree = "<group>"; };
		A1000000000000000000000D /* ModuleSettingsTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleSettingsTests.swift; sourceTree = "<group>"; };
		A1000000000000000000000E /* ModuleSISTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleSISTests.swift; sourceTree = "<group>"; };
		A1000000000000000000000F /* ModuleStoPrintTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleStoPrintTests.swift; sourceTree = "<group>"; };
		A10000000000000000000010 /* ModuleStreamingMediaTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleStreamingMediaTests.swift; sourceTree = "<group>"; };
		A10000000000000000000011 /* ModuleStudentOrgsTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleStudentOrgsTests.swift; sourceTree = "<group>"; };
		A10000000000000000000012 /* ModuleTransportationTests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModuleTransportationTests.swift; sourceTree = "<group>"; };
```

- [ ] **Step 4: Edit the AllAboutOlafUITests group children**

Find the group section (around line 440-446):
```
			children = (
				00D33BE11DDA58A8001E830E /* AllAboutOlafUITests.swift */,
				00D33BE41DDA58A8001E830E /* Info.plist */,
			);
			path = AllAboutOlafUITests;
```

Replace with:
```
			children = (
				A10000000000000000000001 /* XCUITestHelpers.swift */,
				A10000000000000000000002 /* ModuleHomeTests.swift */,
				A10000000000000000000003 /* ModuleBuildingHoursTests.swift */,
				A10000000000000000000004 /* ModuleCalendarTests.swift */,
				A10000000000000000000005 /* ModuleCampusDictionaryTests.swift */,
				A10000000000000000000006 /* ModuleCampusMapTests.swift */,
				A10000000000000000000007 /* ModuleCourseCatalogTests.swift */,
				A10000000000000000000008 /* ModuleDirectoryTests.swift */,
				A10000000000000000000009 /* ModuleImportantContactsTests.swift */,
				A1000000000000000000000A /* ModuleMenusTests.swift */,
				A1000000000000000000000B /* ModuleMoreTests.swift */,
				A1000000000000000000000C /* ModuleOlevilleTests.swift */,
				A1000000000000000000000D /* ModuleSettingsTests.swift */,
				A1000000000000000000000E /* ModuleSISTests.swift */,
				A1000000000000000000000F /* ModuleStoPrintTests.swift */,
				A10000000000000000000010 /* ModuleStreamingMediaTests.swift */,
				A10000000000000000000011 /* ModuleStudentOrgsTests.swift */,
				A10000000000000000000012 /* ModuleTransportationTests.swift */,
				00D33BE41DDA58A8001E830E /* Info.plist */,
			);
			path = AllAboutOlafUITests;
```

- [ ] **Step 5: Edit the PBXSourcesBuildPhase for UITests**

Find the sources build phase (around line 1260):
```
				00D33BE21DDA58A8001E830E /* AllAboutOlafUITests.swift in Sources */,
```

Replace with:
```
				A20000000000000000000001 /* XCUITestHelpers.swift in Sources */,
				A20000000000000000000002 /* ModuleHomeTests.swift in Sources */,
				A20000000000000000000003 /* ModuleBuildingHoursTests.swift in Sources */,
				A20000000000000000000004 /* ModuleCalendarTests.swift in Sources */,
				A20000000000000000000005 /* ModuleCampusDictionaryTests.swift in Sources */,
				A20000000000000000000006 /* ModuleCampusMapTests.swift in Sources */,
				A20000000000000000000007 /* ModuleCourseCatalogTests.swift in Sources */,
				A20000000000000000000008 /* ModuleDirectoryTests.swift in Sources */,
				A20000000000000000000009 /* ModuleImportantContactsTests.swift in Sources */,
				A2000000000000000000000A /* ModuleMenusTests.swift in Sources */,
				A2000000000000000000000B /* ModuleMoreTests.swift in Sources */,
				A2000000000000000000000C /* ModuleOlevilleTests.swift in Sources */,
				A2000000000000000000000D /* ModuleSettingsTests.swift in Sources */,
				A2000000000000000000000E /* ModuleSISTests.swift in Sources */,
				A2000000000000000000000F /* ModuleStoPrintTests.swift in Sources */,
				A20000000000000000000010 /* ModuleStreamingMediaTests.swift in Sources */,
				A20000000000000000000011 /* ModuleStudentOrgsTests.swift in Sources */,
				A20000000000000000000012 /* ModuleTransportationTests.swift in Sources */,
```

- [ ] **Step 6: Delete AllAboutOlafUITests.swift**

```bash
rm ios/AllAboutOlafUITests/AllAboutOlafUITests.swift
```

- [ ] **Step 7: Verify project.pbxproj is well-formed**

```bash
# Check that old UUID is gone
grep -c '00D33BE1\|00D33BE2' ios/AllAboutOlaf.xcodeproj/project.pbxproj
# Expected: 0

# Check that all new UUIDs are present
grep -c 'A10000000000000000000001\|A20000000000000000000001' ios/AllAboutOlaf.xcodeproj/project.pbxproj
# Expected: at least 3 (fileref, buildfile, group children)

# Count new file references
grep -c 'A1000000000000000000' ios/AllAboutOlaf.xcodeproj/project.pbxproj
# Expected: 36 (18 file refs in PBXFileReference + 18 in group children)

# Count new build files
grep -c 'A2000000000000000000' ios/AllAboutOlaf.xcodeproj/project.pbxproj
# Expected: 36 (18 in PBXBuildFile + 18 in PBXSourcesBuildPhase)
```

- [ ] **Step 8: Commit**

```bash
git add ios/AllAboutOlaf.xcodeproj/project.pbxproj
git add -u ios/AllAboutOlafUITests/AllAboutOlafUITests.swift
git commit -m "refactor(ios): update pbxproj to use new XCUITest files"
```

---

## Task 21: Delete Detox artifacts

**Files:**
- Delete: `e2e/` (entire directory)
- Delete: `detox.config.js`
- Modify: `package.json` (remove `detox` from `optionalDependencies`)

- [ ] **Step 1: Remove the e2e directory and detox.config.js**

```bash
rm -rf e2e/
rm detox.config.js
```

- [ ] **Step 2: Remove detox from package.json**

Open `package.json` and delete the entire `optionalDependencies` block:

```json
  "optionalDependencies": {
    "detox": "20.50.1"
  }
```

If `optionalDependencies` contains only `detox`, remove the entire key. If other packages exist, only remove the `detox` line.

- [ ] **Step 3: Run npm install to update the lockfile**

```bash
npm install
```

This will remove `detox` (and its transitive deps) from `package-lock.json`.

- [ ] **Step 4: Verify**

```bash
# detox should be gone from package.json
grep -c detox package.json
# Expected: 0

# detox.config.js should not exist
test -f detox.config.js && echo "FAIL: still exists" || echo "OK: removed"
# Expected: OK: removed

# e2e directory should not exist
test -d e2e && echo "FAIL: still exists" || echo "OK: removed"
# Expected: OK: removed
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Detox artifacts (e2e/, detox.config.js, optional dep)"
```

---

## Task 22: Update CI workflow

This task updates `.github/workflows/check.yml` to:
1. Remove the `ios-detox` job entirely
2. Update `ios-build` to remove the Detox build step (the `npx detox build` step) — the `xcodebuild build-for-testing` step already builds both the app and UITest bundle
3. Update `ios-uitest` to not depend on `detox.config.js` for simulator discovery — hardcode the device type and deployment target from the Xcode project instead
4. Rename all `ci/skip-detox` label references to `ci/skip-e2e`
5. Add sharding to the `ios-uitest` job (optional, can be deferred)

**Files:**
- Modify: `.github/workflows/check.yml`

- [ ] **Step 1: Remove the Detox build step from `ios-build`**

In the `ios-build` job, find the step that runs `npx detox build`:

```yaml
      - name: Build the iOS app
        if: ${{ steps.app-cache.outputs.cache-matched-key == '' && !contains(github.event.pull_request.labels.*.name, 'ci/skip-detox') }}
        env:
          SKIP_BUNDLING: 'true'
          CODE_SIGNING_DISABLED: 'true'
          USE_CCACHE: '1'
        run: npx detox build e2e --configuration ios.sim.release
```

Remove this step entirely. The `xcodebuild build-for-testing` step that follows already builds the full app + UITest bundle.

- [ ] **Step 2: Update label references**

Throughout the file, replace all occurrences of `ci/skip-detox` with `ci/skip-e2e`. These appear in `if:` conditions on `ios-build`, `ios-uitest`.

- [ ] **Step 3: Remove the `ios-detox` job**

Delete the entire `ios-detox` job (lines 233–365 approximately). This is the job with `name: Detox E2E for iOS (${{ matrix.shard }}/${{ strategy.job-total }})`.

- [ ] **Step 4: Update `ios-uitest` simulator discovery**

The `ios-uitest` job currently reads `detox.config.js` to get device type and OS version. Replace the `Discover simulator device` step with one that reads directly from the Xcode project:

Replace:
```yaml
      - name: Discover simulator device
        id: detox-device
        run: |
          set -o pipefail
          node -e 'let c = require("./detox.config.js"); console.log(JSON.stringify(c));' > detox-config.json
          jq -r '"type=\(.devices["ios.simulator"].device.type)"' < detox-config.json | tee -a "$GITHUB_OUTPUT"
          jq -r '"os=\(.devices["ios.simulator"].device.os | gsub("\\."; "-"))"' < detox-config.json | tee -a "$GITHUB_OUTPUT"
```

With:
```yaml
      - name: Discover simulator device
        id: detox-device
        run: |
          set -o pipefail
          # Read deployment target from pbxproj
          OS_VERSION=$(grep -m1 'IPHONEOS_DEPLOYMENT_TARGET' ios/AllAboutOlaf.xcodeproj/project.pbxproj | sed 's/.*= \(.*\);/\1/' | tr -d '[:space:]')
          echo "type=iPhone 16 Pro" | tee -a "$GITHUB_OUTPUT"
          echo "os=${OS_VERSION//./-}" | tee -a "$GITHUB_OUTPUT"
```

Note: The device type "iPhone 16 Pro" comes from `detox.config.js`'s `iPhoneSimulatorDevice` constant. This is now hardcoded here. If the device type needs to change in the future, update this step.

- [ ] **Step 5: Remove `npm ci` from `ios-uitest`**

Since we no longer need `detox.config.js` (and therefore don't need `node_modules`), the `npm ci` step and `mise-action` step in `ios-uitest` can be removed. The `ios-uitest` job only needs: checkout, cache restore, simulator boot, and `xcodebuild test-without-building`.

Remove these steps from `ios-uitest`:
```yaml
      - uses: jdx/mise-action@1648a7812b9aeae629881980618f079932869151 # v4.0.1

      - run: npm ci
```

- [ ] **Step 6: Add `permissions: contents: read` to the workflow**

Add a top-level `permissions` block to address the CodeQL alert:

```yaml
permissions:
  contents: read
```

Add this right after the `on:` block and before `concurrency:`.

- [ ] **Step 7: Verify the workflow YAML is valid**

```bash
# Basic YAML syntax check
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/check.yml'))"
# Expected: no error

# Verify ios-detox is gone
grep -c 'ios-detox' .github/workflows/check.yml
# Expected: 0

# Verify detox.config.js is not referenced
grep -c 'detox.config.js' .github/workflows/check.yml
# Expected: 0

# Verify detox build step is gone
grep -c 'npx detox' .github/workflows/check.yml
# Expected: 0
```

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/check.yml
git commit -m "ci: remove Detox jobs, update ios-uitest to standalone simulator discovery"
```

---

## Task 23: Final verification and cleanup

- [ ] **Step 1: Verify all new Swift files exist**

```bash
ls -la ios/AllAboutOlafUITests/*.swift
# Expected: 19 files (XCUITestHelpers + 18 module test files)
```

- [ ] **Step 2: Verify no Detox references remain**

```bash
# Check for any stray detox references in source
grep -ri 'detox' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' --include='*.yml' --include='*.yaml' --include='*.swift' . | grep -v node_modules | grep -v '.git/' | grep -v 'package-lock.json'
# Expected: no matches (or only in documentation/plan files)
```

- [ ] **Step 3: Run TS/lint checks for package.json changes**

```bash
mise run agent:pre-commit
```

- [ ] **Step 4: Count tests to verify completeness**

```bash
# Count test methods across all XCUITest files
grep -c 'func test' ios/AllAboutOlafUITests/*.swift | tail -1
# Expected: 53 total (matching the 53 Detox tests: 46 active + 7 skipped → 43 active + 10 skipped in XCUITest)
```

Breakdown:
- ModuleHomeTests: 2
- ModuleBuildingHoursTests: 2
- ModuleCalendarTests: 5
- ModuleCampusDictionaryTests: 2
- ModuleCampusMapTests: 2 (1 skipped)
- ModuleCourseCatalogTests: 2
- ModuleDirectoryTests: 2
- ModuleImportantContactsTests: 2
- ModuleMenusTests: 9
- ModuleMoreTests: 2
- ModuleOlevilleTests: 2 (1 skipped)
- ModuleSettingsTests: 3
- ModuleSISTests: 5
- ModuleStoPrintTests: 2 (1 skipped)
- ModuleStreamingMediaTests: 5
- ModuleStudentOrgsTests: 2
- ModuleTransportationTests: 7 (all skipped)
**Total: 56** (includes 2 from existing XCUITests + 1 new home test = 53 Detox + 2 existing - 1 duplicate + 2 new from settings = 56)

Wait — let me recount based on the design spec:
- 53 Detox tests (46 active, 7 skipped)
- 2 existing XCUITests being relocated (testHomeScreenRenders, testChangesAppIconToBigOleAndBack)
- Net total: 53 unique tests + 2 existing = 55, but testHomeScreenRenders overlaps with a Detox test → 54 unique, but the design spec says 56 total

Let me just count by file as defined:
2 + 2 + 5 + 2 + 2 + 2 + 2 + 2 + 9 + 2 + 2 + 3 + 5 + 2 + 5 + 2 + 7 = **56 test methods**

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -A
git status
# If clean, nothing to commit. If changes, commit:
git commit -m "chore: final cleanup after Detox-to-XCUITest migration"
```
