import XCTest

class AllAboutOlafUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
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
        XCTAssertTrue(app.cells["app-icon-cell-default-selected"]
            .waitForExistence(timeout: 10))
        app.cells["app-icon-cell-icon_type_windmill"].tap()

        // Interact with the app to trigger the interruption monitor
        app.tap()

        // Verify Big Ole is now selected
        XCTAssertTrue(app.cells["app-icon-cell-icon_type_windmill-selected"]
            .waitForExistence(timeout: 10))

        // Tap default to switch back
        app.cells["app-icon-cell-default"].tap()
        app.tap()

        // Verify default is selected again
        XCTAssertTrue(app.cells["app-icon-cell-default-selected"]
            .waitForExistence(timeout: 10))
    }
}
