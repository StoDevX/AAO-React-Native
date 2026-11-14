import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

private let catalog = try! JSONDecoder().decode(DataSetCatalog.self, from: Data(#"""
    {"groups": [], "sets": {
      "contact-info": {"title": "Important Contacts", "record": "Contact", "shape": "folder", "path": "contact-info", "schema": "contact-info", "titleField": "title", "sectionField": "category"},
      "faqs": {"title": "FAQs & Notices", "record": "FAQ", "shape": "list", "path": "faqs.yaml", "list": ["faqs"], "schema": "faqs", "titleField": "question"},
      "sources": {"title": "Sources", "record": "Source", "shape": "list", "path": "sources.yaml", "list": ["sources"], "schema": "sources", "titleField": "titles.und"}
    }}
    """#.utf8))

/// What an edit refreshes besides its own file: the record list, and the changed files' problems.
@MainActor
struct EditRefreshTests {
    private func set(_ name: String) -> DataSet { catalog.sets[name]! }

    @Test func retitlingAContactRelistsTheContacts() {
        #expect(AppModel.relists(after: [.set(["title"], .string("Public Safety"))], in: set("contact-info")))
        #expect(AppModel.relists(after: [.set(["category"], .string("Wellness"))], in: set("contact-info")))
    }

    @Test func aContactsPhoneNumberLeavesTheListAlone() {
        #expect(!AppModel.relists(after: [.set(["phoneNumber"], .string("5077863666"))], in: set("contact-info")))
    }

    @Test func anAnswerLeavesTheFAQsAlone() {
        #expect(!AppModel.relists(after: [.set(["faqs", 2, "answer"], .string("Upstairs"))], in: set("faqs")))
        #expect(AppModel.relists(after: [.set(["faqs", 2, "question"], .string("Where?"))], in: set("faqs")))
    }

    @Test func aNestedTitleRelists() {
        #expect(AppModel.relists(after: [.set(["sources", 0, "titles", "und"], .string("KSTO"))], in: set("sources")))
    }

    @Test func addingOrRemovingAListItemRelists() {
        #expect(AppModel.relists(after: [.delete(["faqs", 2])], in: set("faqs")))
    }

    @Test func aFieldShowsOnlyItsOwnProblems() {
        let phone = Problem(file: "a.yaml", message: "Phone Number should be a 10-digit phone number", path: ["phoneNumber"])
        let record = Problem(file: "a.yaml", message: "Phone Number or Button Link is missing", path: [])
        let link = Problem(file: "a.yaml", message: "Address is not in the expected form", path: ["links", 0, "url"])
        #expect(AppModel.fieldProblems(at: ["phoneNumber"], among: [phone, record, link]) == [phone])
    }

    /// A new contact's missing fields are one line above the form, each also marked at its field.
    @Test func missingFieldsAreSummedUpInOneLine() {
        let missing = ["Button Label", "Text", "Summary"].map { Problem(file: "a.yaml", message: "\($0) is missing", path: [.key($0)], missing: $0) }
        let other = Problem(file: "a.yaml", message: "Phone Number or Button Link is missing", path: [])
        let summary = RecordFormView.summary(of: [other] + missing)
        #expect(summary.fillIn == "Fill in Button Label, Text, and Summary")
        #expect(summary.others == [other])
    }

    @Test func noMissingFieldsNeedNoLine() {
        #expect(RecordFormView.summary(of: []).fillIn == nil)
    }

    @Test func anEditReplacesOnlyItsOwnFilesProblems() {
        let other = Problem(file: "b.yaml", message: "Title is missing", path: [])
        let old = Problem(file: "a.yaml", message: "Phone Number or Button Link is missing", path: [])
        let new = Problem(file: "a.yaml", message: "Title is missing", path: [])
        #expect(AppModel.problems([old, other], after: "a.yaml", found: [new], changed: ["a.yaml", "b.yaml"]) == [other, new])
    }

    /// An edit that puts a file back as it was leaves it out of the changed files, and its problems with it.
    @Test func aFileNoLongerChangedLosesItsProblems() {
        let old = Problem(file: "a.yaml", message: "Title is missing", path: [])
        #expect(AppModel.problems([old], after: "a.yaml", found: [old], changed: []) == [])
    }
}
