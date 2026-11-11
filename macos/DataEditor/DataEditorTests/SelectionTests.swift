import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SelectionTests {
    private let cage = "building-hours/1-1-cage.yaml"

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
        await model.choose(ChangesetItem.building(file: cage))
        #expect(model.item == .building(file: cage))
        #expect(model.selection == cage)
    }

    @Test func choosingAChangesetOpensItsOverview() async {
        let model = model()
        await model.choose(ChangesetItem.building(file: cage))
        await model.choose(Changeset.pullRequest(number: 7))
        #expect(model.changeset == .pullRequest(number: 7))
        #expect(model.item == .overview)
    }

    /// Either column would take the text field's place, and its text with it.
    @Test func aDraftThatWontSaveKeepsTheEditorOnScreen() async {
        let saves = DraftSaves()
        let model = model(saves)
        await model.choose(ChangesetItem.building(file: cage))
        saves.succeed = false
        await model.choose(Changeset.pullRequest(number: 7))
        #expect(model.changeset == .current)
        await model.choose(ChangesetItem.overview)
        #expect(model.item == .building(file: cage))
    }

    /// A choice made while an earlier one waits for the text to save replaces it.
    @Test func theNewestChoiceWins() async {
        let model = AppModel(support: FileManager.default.temporaryDirectory.appending(path: "choice \(UUID().uuidString)"))
        model.registerDraftSaver(UUID()) {
            try? await Task.sleep(for: .milliseconds(200))
            return true
        }
        async let first: Void = model.choose(Changeset.pullRequest(number: 7))
        try? await Task.sleep(for: .milliseconds(20))
        await model.choose(Changeset.current)
        await first
        #expect(model.changeset == .current)
    }
}
