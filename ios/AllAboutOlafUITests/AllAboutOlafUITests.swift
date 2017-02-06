//
//  All_About_Olaf_UI_Tests.swift
//  All About Olaf UI Tests
//
//  Created by Hawken Rives on 11/14/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

import XCTest

class AllAboutOlafUITests: XCTestCase {
    override func setUp() {
        super.setUp()
        // In UI tests it is usually best to stop immediately when a failure
        // occurs.
        continueAfterFailure = false

        // UI tests must launch the application that they test. Doing this in
        // setup will make sure it happens for each test method.
        let app = XCUIApplication()
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
        snapshot("00MainMenuScreen")
    }

    func testOpenMenusScreen() {
        XCUIApplication().otherElements["   Menus"].tap()
        snapshot("01MenusScreenStavMenu")
    }

    func testOpenSisScreen() {
        XCUIApplication().otherElements["   SIS"].tap()
        snapshot("02SisScreen")
    }

    func testOpenBuildingHoursScreen() {
        XCUIApplication().otherElements["   Building Hours"].tap()
        snapshot("03BuildingHoursScreen")
    }

    func testOpenCalendarScreen() {
        XCUIApplication().otherElements["   Calendar"].tap()
        snapshot("04CalendarScreen")
    }

    func testOpenDirectoryScreen() {
        XCUIApplication().otherElements["   Directory"].tap()
        snapshot("05DirectoryScreen")
    }

    func testOpenStreamingMediaScreen() {
        XCUIApplication().otherElements["   Streaming Media"].tap()
        snapshot("06StreamingMediaScreen")
    }

    func testOpenNewsScreen() {
        XCUIApplication().otherElements["   News"].tap()
        snapshot("07NewsScreen")
    }

    func testOpenCampusMapScreen() {
        XCUIApplication().otherElements["   Campus Map"].tap()
        snapshot("08CampusMapScreen")
    }

    func testOpenImportantContactsScreen() {
        XCUIApplication().otherElements["   Important Contacts"].tap()
        snapshot("09ImportantContactsScreen")
    }

    func testOpenTransportationScreen() {
        XCUIApplication().otherElements["   Transportation"].tap()
        snapshot("10TransportationScreen")
    }

    func testOpenCampusDictionaryScreen() {
        XCUIApplication().otherElements["   Campus Dictionary"].tap()
        snapshot("11CampusDictionaryScreen")
    }

    func testOpenOlevilleScreen() {
        XCUIApplication().otherElements["   Oleville"].tap()
        snapshot("12OlevilleScreen")
    }

    func testOpenStudentOrgsScreen() {
        XCUIApplication().otherElements["   Student Orgs"].tap()
        snapshot("13StudentOrgsScreen")
    }
}
