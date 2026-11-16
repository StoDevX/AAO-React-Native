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

struct ItemNameTests {
    private func item(_ json: String) throws -> JSONValue { try JSONDecoder().decode(JSONValue.self, from: Data(json.utf8)) }

    @Test func anItemIsCalledByItsNameTitleOrLabel() throws {
        #expect(itemName(try item(#"{"label":"Pizza","station":"Pizza"}"#)) == "Pizza")
        #expect(itemName(try item(#"{"day":"monday","title":"The Spotlight"}"#)) == "The Spotlight")
        #expect(itemName(try item(#"{"name":"1st floor","entries":[]}"#)) == "1st floor")
    }

    @Test func anItemWithoutOneHasNone() throws {
        #expect(itemName(try item(#"{"categories":["parking"],"icon":"parkingsign"}"#)) == nil)
        #expect(itemName(try item(#"{"label":"  "}"#)) == nil)
        #expect(itemName(try item(#""just a name""#)) == nil)
    }
}

struct MarkdownPreviewTests {
    @Test func plainTextHasNoPreview() {
        #expect(markdownPreview("The Center supports advisors.\n\nAcademic Peer Advisors assist the Center.") == nil)
    }

    @Test func markdownIsPreviewedWithItsParagraphsKept() throws {
        let preview = try #require(markdownPreview("Email [us](mailto:a@example.com).\n\nOr call."))
        #expect(String(preview.characters) == "Email us.\n\nOr call.")
    }
}

struct ArticleTests {
    @Test func aNounTakesTheArticleItsSoundWants() {
        #expect(withArticle("Option") == "an Option")
        #expect(withArticle("Area") == "an Area")
        #expect(withArticle("Building") == "a Building")
        // an initialism is said letter by letter: eff, kay
        #expect(withArticle("FAQ") == "an FAQ")
        #expect(withArticle("KSTO Schedule") == "a KSTO Schedule")
    }
}

struct BreakDatesTests {
    private let us = Locale(identifier: "en_US")

    /// thin spaces either side of the dash, as Foundation writes a range
    @Test func aBreaksDaysAreWrittenAsARange() {
        #expect(breakDates(start: "2026-10-10", end: "2026-10-13", locale: us) == "Oct 10\u{2009}–\u{2009}13, 2026")
        #expect(breakDates(start: "2026-12-23", end: "2027-01-03", locale: us) == "Dec 23, 2026\u{2009}–\u{2009}Jan 3, 2027")
    }

    @Test func aOneDayBreakIsItsDay() {
        #expect(breakDates(start: "2027-03-28", end: "2027-03-28", locale: us) == "Mar 28, 2027")
    }

    /// A break whose end is before its start, as a typo makes it, is written as the file holds it.
    @Test func daysThatRunBackwardsAreWrittenAsTheyAre() {
        #expect(breakDates(start: "2026-10-13", end: "2026-10-10", locale: us) == "2026-10-13 – 2026-10-10")
    }

    @Test func datesItCannotReadAreWrittenAsTheyAre() {
        #expect(breakDates(start: "", end: "", locale: us) == "")
        #expect(breakDates(start: "soon", end: "2027-01-03", locale: us) == "soon – 2027-01-03")
    }
}

struct SingularTests {
    /// A list's item is called by the singular of the list's title: Add Station, not Add Stations.
    @Test func aListsTitleNamesOneOfItsItems() {
        #expect(singular("Stations") == "Station")
        #expect(singular("Food Items") == "Food Item")
        #expect(singular("Categories") == "Category")
        #expect(singular("Entries") == "Entry")
        #expect(singular("Times") == "Time")
        #expect(singular("Campuses") == "Campus")
    }

    /// A title already singular, or ending in a double s, is left as it is.
    @Test func aSingularTitleStays() {
        #expect(singular("Skip") == "Skip")
        #expect(singular("Address") == "Address")
        #expect(singular("Campus") == "Campus")
    }
}
