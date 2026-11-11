import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SidebarChoiceTests {
    private let cage = "building-hours/1-1-cage.yaml"

    /// A model on a folder of its own, with The Cage selected and one text field whose save gives `saved`.
    private func model(draftSaves saved: Bool) -> AppModel {
        let folder = FileManager.default.temporaryDirectory.appending(path: "choice \(UUID().uuidString)")
        let model = AppModel(support: folder)
        model.selection = cage
        model.registerDraftSaver(UUID()) { saved }
        return model
    }

    @Test func showsAPullRequestOnceTheTypedTextIsSaved() async {
        let model = model(draftSaves: true)
        await model.choose(.pullRequest(number: 9))
        #expect(model.sidebarSelection == .pullRequest(number: 9))
    }

    /// The pull request would take the field's place, and its text with it.
    @Test func staysOnTheBuildingWhileTypedTextIsNotSaved() async {
        let model = model(draftSaves: false)
        await model.choose(.pullRequest(number: 9))
        #expect(model.sidebarSelection == .building(file: cage))
    }
}
