import Foundation
import Testing
@testable import DataEditorKit

private func json(_ text: String) -> JSONValue {
    try! JSONDecoder().decode(JSONValue.self, from: Data(text.utf8))
}

struct ColorValueTests {
    @Test(arguments: [
        #""rgb(134, 198, 124)""#,
        #""rgb(0,0,0)""#,
        #""color(display-p3 0.9294 0.4863 0.5216)""#,
        #""color(display-p3 0.902 0.3882 0.4118)""#,
        "[82, 87, 54]",
        ##""#E4A01B""##,
        ##""#fff""##,
    ])
    func writesAColourBackAsTheFileHadIt(text: String) throws {
        let value = json(text)
        #expect(try #require(ColorValue(value)).json() == value)
    }

    @Test func readsNoColourFromANameOrHex() {
        #expect(ColorValue(.string("blue")) == nil)
        #expect(ColorValue(json("[1, 2]")) == nil)
    }

    /// A component past what its form allows, which the schema does not bound, is no colour to draw.
    @Test func readsNoColourFromComponentsOutOfRange() {
        #expect(ColorValue(json("[1e20, 0, 0]")) == nil)
        #expect(ColorValue(json("[-1, 0, 0]")) == nil)
        #expect(ColorValue(.string("rgb(300, 0, 0)")) == nil)
        #expect(ColorValue(.string("color(display-p3 1.5 0 0)")) == nil)
    }

    @Test func aChangedColourKeepsItsForm() throws {
        let bar = try #require(ColorValue(.string("rgb(134, 198, 124)")))
        #expect(bar.with(unit: [1, 0, 0.5]).json() == .string("rgb(255, 0, 128)"))
        let accent = try #require(ColorValue(json("[82, 87, 54]")))
        #expect(accent.with(unit: [1, 0, 0]).json() == json("[255, 0, 0]"))
        let p3 = try #require(ColorValue(.string("color(display-p3 0.9294 0.4863 0.5216)")))
        #expect(p3.with(unit: [0.5, 0.25, 1]).json() == .string("color(display-p3 0.5 0.25 1)"))
    }

    /// Oles Go's bar is written in hex, which stays hex, its letters in the case the file used.
    @Test func aChangedHexColourStaysHex() throws {
        let bar = try #require(ColorValue(.string("#E4A01B")))
        #expect(bar.with(unit: [1, 0, 0.5]).json() == .string("#FF0080"))
        #expect(try #require(ColorValue(.string("#e4a01b"))).with(unit: [1, 0, 0.5]).json() == .string("#ff0080"))
    }

    @Test func givesItsComponentsBetweenZeroAndOne() throws {
        #expect(try #require(ColorValue(.string("rgb(255, 0, 51)"))).unit == [1, 0, 0.2])
    }
}

struct PhoneNumberTests {
    @Test func showsTenDigitsAsAPhoneNumber() {
        #expect(PhoneNumber.display("5077863666") == "(507) 786-3666")
        #expect(PhoneNumber.display("15077863666") == "15077863666")
    }

    @Test func savesOnlyTheDigits() {
        #expect(PhoneNumber.digits("(507) 786-3666") == "5077863666")
    }
}

struct ChoicesTests {
    private let pause = json(#"{"stationMenus":[{"label":"Pizza"},{"label":"Pita"},{"label":"Pizza"}],"foodItems":[{"station":"Pizza"}]}"#)
    private let express = json(#"{"schedules":[{"coordinates":{"St. Olaf College":[1,2],"Library":[3,4]},"stops":["Library"]}]}"#)

    @Test func findsTheValuesAPointerNames() {
        #expect(choices("/stationMenus/*/label", in: pause, at: ["foodItems", 0, "station"]) == ["Pizza", "Pita"])
    }

    /// `1/coordinates` from a stop climbs out of the stops to its schedule.
    @Test func climbsFromTheFieldForARelativePointer() {
        #expect(choices("1/coordinates", in: express, at: ["schedules", 0, "stops", 0]) == ["Library", "St. Olaf College"])
    }

    @Test func findsNothingWhereThePointerLeadsNowhere() {
        #expect(choices("/nowhere/*/label", in: pause, at: []) == [])
    }
}
