//
//  All_About_Olaf_UI_Tests.swift
//  All About Olaf UI Tests
//
//  Created by Hawken Rives on 11/14/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

import XCTest

class AllAboutOlafUITests: XCTestCase {
    var app = XCUIApplication()

    override func setUp() {
        super.setUp()
        // In UI tests it is usually best to stop immediately when a failure
        // occurs.
        continueAfterFailure = false

        // UI tests must launch the application that they test. Doing this in
        // setup will make sure it happens for each test method.
        setupSnapshot(app)
        app.launch()

        // In UI tests it’s important to set the initial state - such as
        // interface orientation - required for your tests before they run.
        // The setUp method is a good place to do this.
        XCUIDevice.shared().orientation = .portrait
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }

    func testMainMenuScreen() {
        sleep(1)
        snapshot("00MainMenuScreen")
    }

    func testOpenMenusScreen() {
        app.buttons["Menus"].tap()
        sleep(5)
        snapshot("01MenusScreenStavMenu")
    }

    func testOpenSisScreen() {
        app.buttons["SIS"].tap()
        sleep(1)
        snapshot("02SisScreen")
    }

    func testOpenBuildingHoursScreen() {
        app.buttons["Building Hours"].tap()
        sleep(1)
        snapshot("03BuildingHoursScreen")
    }

    func testOpenWebcamsScreen() {
        app.buttons["Streaming Media"].tap()
        app.otherElements["  Webcams"].tap()
        sleep(1)
        snapshot("04WebcamsScreen")
    }

    func testOpenCalendarScreen() {
        app.buttons["Calendar"].tap()
        sleep(5)
        snapshot("05CalendarScreen")
    }

    func testOpenDirectoryScreen() {
        app.buttons["Directory"].tap()
        sleep(5)
        snapshot("06DirectoryScreen")
    }

    func testOpenStreamingMediaScreen() {
        app.buttons["Streaming Media"].tap()
        sleep(1)
        snapshot("07StreamingMediaScreen")
    }

    func testOpenNewsScreen() {
        app.buttons["News"].tap()
        sleep(5)
        snapshot("08NewsScreen")
    }

    func testOpenCampusMapScreen() {
        app.buttons["Campus Map"].tap()
                
        sleep(5)
        snapshot("09CampusMapScreen")
    }

    func testOpenImportantContactsScreen() {
        app.buttons["Important Contacts"].tap()
        sleep(1)
        snapshot("10ImportantContactsScreen")
    }

    func testOpenTransportationScreen() {
        app.buttons["Transportation"].tap()
        sleep(1)
        snapshot("11TransportationScreen")
    }

    func testOpenCampusDictionaryScreen() {
        app.buttons["Campus Dictionary"].tap()
        sleep(1)
        snapshot("12CampusDictionaryScreen")
    }

    func testOpenStudentOrgsScreen() {
        app.buttons["Student Orgs"].tap()
        sleep(5)
        snapshot("13StudentOrgsScreen")
    }
}
