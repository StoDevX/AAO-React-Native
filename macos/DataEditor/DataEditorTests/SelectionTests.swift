import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SelectionTests {
    private let cage = "building-hours/1-1-cage.yaml"
    private var cageRecord: ChangesetItem { .record(set: "building-hours", RecordRef(file: cage, path: [])) }

    /// Whether the text field's next save succeeds; a test changes it to stand for text that will not save.
    private final class DraftSaves { var succeed = true }

    /// A model on a folder of its own with one text field, whose saves succeed as `saves` says.
    private func model(_ saves: DraftSaves = DraftSaves()) -> AppModel {
        let folder = FileManager.default.temporaryDirectory.appending(path: "choice \(UUID().uuidString)")
        let model = AppModel(support: folder)
        model.registerDraftSaver(UUID()) { saves.succeed }
        return model
    }

    @Test func choosingABuildingOpensItsFile() async {
        let model = model()
        await model.choose(cageRecord)
        #expect(model.item == cageRecord)
        #expect(model.selection == cage)
        #expect(model.chosenSet == "building-hours")
    }

    @Test func choosingASetShowsItsRecordsWithoutOpeningOne() async {
        let model = model()
        await model.choose(.set("contact-info"))
        #expect(model.item == .set("contact-info"))
        #expect(model.chosenSet == "contact-info")
        #expect(model.selection == nil)
    }

    /// FAQ 1 becomes FAQ 0 when FAQ 0 is removed, and the form stays on it.
    @Test func selectionFollowsARecordAfterAnEarlierOneIsRemoved() {
        let before = [faq(0, "Say hello to us"), faq(1, "Why can't I log in?")]
        let after = [faq(0, "Why can't I log in?")]
        #expect(AppModel.follow(RecordRef(file: "faqs.yaml", path: ["faqs", 1]), before: before, after: after)
            == RecordRef(file: "faqs.yaml", path: ["faqs", 0]))
    }

    @Test func selectionFallsBackWhenTheRecordIsGone() {
        let before = [faq(0, "Say hello to us"), faq(1, "Why can't I log in?")]
        let after = [faq(0, "Why can't I log in?")]
        #expect(AppModel.follow(RecordRef(file: "faqs.yaml", path: ["faqs", 0]), before: before, after: after) == nil)
    }

    private func faq(_ index: Int, _ title: String) -> RecordSummary {
        RecordSummary(set: "faqs", ref: RecordRef(file: "faqs.yaml", path: ["faqs", .index(index)]), title: title,
                      subtitle: nil, section: nil, editable: true)
    }

    /// The Overview would take the text field's place, and its text with it.
    @Test func aDraftThatWontSaveKeepsTheEditorOnScreen() async {
        let saves = DraftSaves()
        let model = model(saves)
        await model.choose(cageRecord)
        saves.succeed = false
        await model.choose(ChangesetItem.overview)
        #expect(model.item == cageRecord)
    }

    /// A choice made while an earlier one waits for the text to save replaces it.
    @Test func theNewestChoiceWins() async {
        let model = AppModel(support: FileManager.default.temporaryDirectory.appending(path: "choice \(UUID().uuidString)"))
        model.registerDraftSaver(UUID()) {
            try? await Task.sleep(for: .milliseconds(200))
            return true
        }
        async let first: Void = model.choose(cageRecord)
        try? await Task.sleep(for: .milliseconds(20))
        await model.choose(ChangesetItem.overview)
        await first
        #expect(model.item == .overview)
    }
}
