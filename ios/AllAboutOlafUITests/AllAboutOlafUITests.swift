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
        sleep(15)
        snapshot("00MainMenuScreen")
    }

    func testOpenMenusScreen() {
        XCUIApplication().otherElements["   Menus"].tap()
        sleep(5)
        snapshot("01MenusScreenStavMenu")
    }

    func testOpenSisScreen() {
        XCUIApplication().otherElements["   SIS"].tap()
        sleep(1)
        snapshot("02SisScreen")
    }

    func testOpenBuildingHoursScreen() {
        XCUIApplication().otherElements["   Building Hours"].tap()
        sleep(1)
        snapshot("03BuildingHoursScreen")
    }

    func testOpenCalendarScreen() {
        XCUIApplication().otherElements["   Calendar"].tap()
        sleep(5)
        snapshot("04CalendarScreen")
    }

    func testOpenDirectoryScreen() {
        XCUIApplication().otherElements["   Directory"].tap()
        sleep(5)
        snapshot("05DirectoryScreen")
    }

    func testOpenStreamingMediaScreen() {
        XCUIApplication().otherElements["   Streaming Media"].tap()
        sleep(1)
        snapshot("06StreamingMediaScreen")
    }

    func testOpenNewsScreen() {
        XCUIApplication().otherElements["   News"].tap()
        sleep(5)
        snapshot("07NewsScreen")
    }

    func testOpenCampusMapScreen() {
        XCUIApplication().otherElements["   Campus Map"].tap()
        sleep(5)
        snapshot("08CampusMapScreen")
    }

    func testOpenImportantContactsScreen() {
        XCUIApplication().otherElements["   Important Contacts"].tap()
        sleep(1)
        snapshot("09ImportantContactsScreen")
    }

    func testOpenTransportationScreen() {
        XCUIApplication().otherElements["   Transportation"].tap()
        sleep(1)
        snapshot("10TransportationScreen")
    }

    func testOpenCampusDictionaryScreen() {
        XCUIApplication().otherElements["   Campus Dictionary"].tap()
        sleep(1)
        snapshot("11CampusDictionaryScreen")
    }

    func testOpenOlevilleScreen() {
        XCUIApplication().otherElements["   Oleville"].tap()
        sleep(10)
        snapshot("12OlevilleScreen")
    }

    func testOpenStudentOrgsScreen() {
        XCUIApplication().otherElements["   Student Orgs"].tap()
        sleep(5)
        snapshot("13StudentOrgsScreen")
    }
}
