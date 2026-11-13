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
        #expect(kinds["gradient"] == .gradient)
        #expect(kinds["category"] == .choice(["Safety", "Wellness"]))
        #expect(kinds["hidden"] == .toggle)
        #expect(kinds["dayparts"] == .map(value: .text))
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
}
