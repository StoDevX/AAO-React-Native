import AppKit
import DataEditorKit
import Testing
@testable import DataEditor

/// What a colour chosen in the well becomes in each form a file writes colours in.
struct ColorWellTests {
    @Test func aChosenColourIsReadInTheFormsOwnSpace() {
        #expect(ColorWell.unit(of: NSColor(srgbRed: 1, green: 0, blue: 0.2, alpha: 1), for: .rgb(spaced: true)) == [1, 0, 0.2])
        #expect(ColorWell.unit(of: NSColor(displayP3Red: 0.5, green: 0.25, blue: 1, alpha: 1), for: .displayP3(places: 4)) == [0.5, 0.25, 1])
    }

    /// A colour read from the file and given back unchanged writes the same text.
    @Test(arguments: ["rgb(134, 198, 124)", "color(display-p3 0.9294 0.4863 0.5216)"])
    func aColourShownAndGivenBackIsUnchanged(text: String) throws {
        let value = try #require(ColorValue(.string(text)))
        let shown = ColorWell.nsColor(value)
        #expect(value.with(unit: ColorWell.unit(of: shown, for: value.form)).json() == .string(text))
    }
}
