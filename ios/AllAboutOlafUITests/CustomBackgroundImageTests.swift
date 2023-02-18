//
//  CustomBackgroundImageTests.swift
//  AllAboutOlafUITests
//
//  Created by Drew Volz on 2/17/23.
//

import XCTest
import SnapshotTesting

final class CustomBackgroundImageTests: XCTestCase {
    var app = XCUIApplication()

    override func setUp() {
        super.setUp()

        continueAfterFailure = false
        setupSnapshot(app)
        app.launch()
        XCUIDevice.shared.orientation = .portrait
    }

    override func tearDown() {
        super.tearDown()
    }

    #if os(iOS)
    func testCustomBackgroundImage() {
        XCTAssertTrue(app.buttons["button-open-settings"].isHittable)

        // open settings
        app.buttons["button-open-settings"].tap()
        app.buttons["Settings"].tap()

        // open the custom backgrounds component library
        app.otherElements["component-library-button"].tap()
        app.otherElements["background-library-button"].tap()

        // tap the right bar button and open the photo library
        app.buttons["button-open-settings"].tap()
        app.buttons["Change Background"].tap()

        // ensure we are on the photos tab
        XCTAssertTrue(app.buttons["Photos"].isHittable)
        app.buttons["Photos"].tap()

        // get the scrollable photos
        let photoPredicate = NSPredicate(format: "label BEGINSWITH 'Photo'")
        let imageElements = app.scrollViews.otherElements.images.containing(photoPredicate)

        // select the second photo in the image library (the first strangely does not load)
        let secondImage = 1
        imageElements.element(boundBy: secondImage).tap()

        // screenshot the changed state
        sleep(2)
        let image = app.images.firstMatch.screenshot().image
        assertSnapshot(matching: image, as: .image, named: "custom-background")
    }
    #endif
}
