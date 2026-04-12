import XCTest

class AllAboutOlafUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    /// Find an element by its accessibility identifier regardless of element type.
    /// React Native testID maps to accessibilityIdentifier, but the XCUITest
    /// element type varies depending on the component (button, other, cell, etc.).
    private func element(matching identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    func testHomeScreenRenders() throws {
        app.launch()
        let menus = app.buttons["Menus"]
        XCTAssertTrue(menus.waitForExistence(timeout: 30),
                      "Home screen should show Menus button")
    }

    func testChangesAppIconToBigOleAndBack() throws {
        app.launch()

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
        let defaultSelected = element(matching: "app-icon-cell-default-selected")
        XCTAssertTrue(defaultSelected.waitForExistence(timeout: 10),
                      "Default icon should be selected initially")
        element(matching: "app-icon-cell-icon_type_windmill").tap()

        // Interact with the app to trigger the interruption monitor
        app.tap()

        // Verify Big Ole is now selected
        let windmillSelected = element(matching: "app-icon-cell-icon_type_windmill-selected")
        XCTAssertTrue(windmillSelected.waitForExistence(timeout: 10),
                      "Windmill icon should be selected after tapping it")

        // Tap default to switch back
        element(matching: "app-icon-cell-default").tap()
        app.tap()

        // Verify default is selected again
        let defaultReselected = element(matching: "app-icon-cell-default-selected")
        XCTAssertTrue(defaultReselected.waitForExistence(timeout: 10),
                      "Default icon should be selected after switching back")
    }
}
