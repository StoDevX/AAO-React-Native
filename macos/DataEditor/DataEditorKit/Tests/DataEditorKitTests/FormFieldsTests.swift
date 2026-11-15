import Foundation
import Testing
@testable import DataEditorKit

/// A record schema shaped as the helper sends the contact schema: inlined, with titles, hints and `propertyOrder`.
private let contactSchema = """
    {
      "type": "object",
      "required": ["title", "text"],
      "oneOf": [{"required": ["phoneNumber"]}, {"required": ["buttonLink"]}],
      "propertyOrder": ["title", "phoneNumber", "buttonLink", "category", "text", "icon", "gradient", "hidden", "updatedAt", "timezone", "links", "dayparts"],
      "properties": {
        "title": {"type": "string", "title": "Title"},
        "phoneNumber": {"type": "string", "title": "Phone Number", "editor": "phone", "pattern": "^\\\\d{10,11}$"},
        "buttonLink": {"type": "string", "title": "Button Link", "editor": "url"},
        "category": {"title": "Category", "enum": ["Safety", "Wellness"]},
        "text": {"type": "string", "title": "Text", "editor": "markdown", "description": "Shown under the button"},
        "icon": {"type": "string", "title": "Icon", "editor": "symbol"},
        "gradient": {"title": "Color", "editor": "gradient", "oneOf": [{"type": "string"}, {"type": "array"}]},
        "hidden": {"type": "boolean", "title": "Hidden"},
        "updatedAt": {"type": "string", "title": "Updated", "editor": "hidden"},
        "timezone": {"const": "America/Chicago", "title": "Timezone"},
        "links": {"type": "array", "title": "Links", "items": {"type": "object", "title": "Link", "propertyOrder": ["url"], "properties": {"url": {"type": "string", "title": "Address", "editor": "url"}}}},
        "dayparts": {"type": "object", "title": "Meal Sections", "additionalProperties": {"type": "string"}}
      }
    }
    """

private func fields() throws -> [FormField] {
    formFields(schema: try JSONDecoder().decode(JSONValue.self, from: Data(contactSchema.utf8)))
}

struct FormFieldsTests {
    @Test func followsTheSchemasOrder() throws {
        #expect(try fields().map(\.title) == ["Title", "Phone Number or Button Link", "Category", "Text", "Icon", "Color", "Hidden", "Links", "Meal Sections"])
    }

    @Test func drawsEachFieldByItsHint() throws {
        let kinds = Dictionary(uniqueKeysWithValues: try fields().map { ($0.key, $0.kind) })
        #expect(kinds["text"] == .markdown)
        #expect(kinds["icon"] == .symbol)
        #expect(kinds["gradient"] == .gradient(names: []))
        #expect(kinds["category"] == .choice(["Safety", "Wellness"]))
        #expect(kinds["hidden"] == .toggle)
        #expect(kinds["dayparts"] == .map(value: .text))
    }

    /// The kind of a lone field whose schema is `json`.
    private func kind(_ json: String) throws -> FieldKind {
        let property = try JSONDecoder().decode(JSONValue.self, from: Data(json.utf8))
        return try #require(formFields(schema: .object(["properties": .object(["f": property])])).first).kind
    }

    @Test func aGradientOffersItsNames() throws {
        #expect(try kind(#"{"enum":["red","blue"],"editor":"gradient"}"#) == .gradient(names: ["red", "blue"]))
        // a custom gradient is the second choice; the names are the first
        #expect(try kind(#"{"editor":"gradient","oneOf":[{"enum":["red"]},{"type":"array"}]}"#) == .gradient(names: ["red"]))
    }

    @Test func aFormatPicksItsControl() throws {
        #expect(try kind(#"{"type":"string","format":"date-time"}"#) == .dateTime)
        #expect(try kind(#"{"type":"string","format":"date"}"#) == .date)
        #expect(try kind(#"{"type":"string","format":"email"}"#) == .email)
        #expect(try kind(#"{"type":"string","format":"uri"}"#) == .url)
        #expect(try kind(#"{"type":"string","format":"uri-reference"}"#) == .url)
    }

    @Test func aTimeAndDaysHaveTheirOwnControls() throws {
        #expect(try kind(#"{"type":"string","editor":"time"}"#) == .time)
        #expect(try kind(#"{"type":"array","items":{"enum":["Mo","Tu"]},"editor":"days"}"#) == .days)
    }

    @Test func aReferenceIsChosenFromThePlaceItNames() throws {
        #expect(try kind(#"{"type":"string","x-choices":"/stationMenus/*/label"}"#) == .reference(pointer: "/stationMenus/*/label"))
    }

    /// A set of names, or names chosen from elsewhere, are tokens; a list of sentences stays a list.
    @Test func aSetOfNamesIsTokens() throws {
        #expect(try kind(#"{"type":"array","uniqueItems":true,"items":{"type":"string"}}"#) == .tokens(choices: nil))
        #expect(try kind(#"{"type":"array","items":{"type":"string","x-choices":"1/coordinates"}}"#) == .tokens(choices: "1/coordinates"))
        #expect(try kind(#"{"type":"array","items":{"type":"string"}}"#) == .list(item: .text, itemTitle: "f"))
    }

    @Test func threeNumbersTaggedAsAColourAreAColour() throws {
        #expect(try kind(#"{"type":"array","items":[{"type":"number"},{"type":"number"},{"type":"number"}],"editor":"color"}"#) == .color(triple: true))
    }

    @Test func twoNumbersTaggedAsACoordinateAreOne() throws {
        #expect(try kind(#"{"type":"array","items":[{"type":"number"},{"type":"number"}],"editor":"coordinate"}"#) == .coordinate)
    }

    @Test func aColourWrittenAsTextIsOne() throws {
        #expect(try kind(#"{"type":"string","editor":"color"}"#) == .color(triple: false))
    }

    @Test func aListOfGroupsStaysAList() throws {
        #expect(try kind(#"{"type":"array","items":{"type":"object","properties":{}}}"#) == .list(item: .object([]), itemTitle: "f"))
    }

    @Test func offersAPhoneNumberOrALinkAsOneChoice() throws {
        let choice = try #require(try fields().first { if case .oneOf = $0.kind { true } else { false } })
        guard case .oneOf(let alternatives) = choice.kind else { return }
        #expect(alternatives.map(\.label) == ["Phone Number", "Button Link"])
        #expect(alternatives.map { $0.fields.map(\.kind) } == [[.phone], [.url]])
    }

    @Test func leavesOutHiddenAndFixedFields() throws {
        let keys = try fields().map(\.key)
        #expect(!keys.contains("updatedAt"))
        #expect(!keys.contains("timezone"))
    }

    @Test func drawsAListOfObjectsAsSubforms() throws {
        let links = try #require(try fields().first { $0.key == "links" })
        #expect(links.kind == .list(item: .object([FormField(key: "url", title: "Address", help: nil, kind: .url, required: false)]), itemTitle: "Link"))
    }

    @Test func marksRequiredFieldsAndKeepsHelp() throws {
        let text = try #require(try fields().first { $0.key == "text" })
        #expect(text.required)
        #expect(text.help == "Shown under the button")
    }

    @Test func clearingAnOptionalFieldDeletesIt() {
        #expect(fieldOps(at: ["faqs", 0], key: "bannerCta", old: .string("Read more"), new: .string(""), required: false)
            == [.delete(["faqs", 0, "bannerCta"])])
    }

    @Test func clearingARequiredFieldKeepsItEmpty() {
        #expect(fieldOps(at: [], key: "title", old: .string("PubSafe"), new: .string(""), required: true)
            == [.set(["title"], .string(""))])
    }

    @Test func anUnchangedFieldSendsNothing() {
        #expect(fieldOps(at: [], key: "title", old: .string("PubSafe"), new: .string("PubSafe"), required: true).isEmpty)
    }

    /// Webcams' accent colour lists its three components as a tuple, one schema per place.
    @Test func drawsATuplesItemsByTheirOwnSchema() throws {
        let schema = try JSONDecoder().decode(JSONValue.self, from: Data(#"{"type": "object", "properties": {"accentColor": {"type": "array", "title": "Accent Color", "items": [{"type": "number"}, {"type": "number"}, {"type": "number"}]}}}"#.utf8))
        #expect(formFields(schema: schema).first?.kind == .list(item: .number, itemTitle: "Accent Color"))
    }

    /// A number is shown, and compared with what was typed, as its digits.
    @Test func showsAWholeNumberWithoutAFraction() {
        #expect(JSONValue.number(12).fieldText == "12")
        #expect(JSONValue.number(12.5).fieldText == "12.5")
        #expect(JSONValue.string("PubSafe").fieldText == "PubSafe")
        #expect(JSONValue.bool(true).fieldText == "true")
        #expect(JSONValue.null.fieldText == "")
    }
}
