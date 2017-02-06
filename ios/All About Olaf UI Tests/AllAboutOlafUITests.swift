//
//  All_About_Olaf_UI_Tests.swift
//  All About Olaf UI Tests
//
//  Created by Hawken Rives on 11/14/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

import XCTest

class All_About_Olaf_UI_Tests: XCTestCase {
        
    override func setUp() {
        super.setUp()
        
        // Put setup code here. This method is called before the invocation of each test method in the class.
        
        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false
        // UI tests must launch the application that they test. Doing this in setup will make sure it happens for each test method.
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.

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
        // Use recording to get started writing UI tests.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
    XCUIApplication().otherElements["    Menus   SIS   Building Hours   Calendar   Directory   Streaming Media   News   Campus Map   Important Contacts   Transportation   Campus Dictionary   Oleville"].otherElements["  Menus"].tap()

        snapshot("01MenusScreenStavMenu")
    }
    
}
