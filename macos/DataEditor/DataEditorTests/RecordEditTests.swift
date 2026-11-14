import DataEditorKit
import Foundation
import Observation
import Testing
@testable import DataEditor

/// Edits made through the model, to the repo's data, by the helper built from the checkout.
@MainActor
struct RecordEditTests {
    private let eastQuad = "webcams/2-east-quad.yaml"

    /// East Quad's accent colour starts [82, 87, 54].
    @Test func aTypedNumberIsSavedOverTheNumberItReplaces() async throws {
        let (model, data) = try await modelOnRepoData()
        let outcome = await model.applyDraft(.set(["accentColor", 0], .number(90)), to: eastQuad, replacing: "82", schedule: nil)
        #expect(outcome == .saved)
        let text = try String(contentsOf: data.appending(path: eastQuad), encoding: .utf8)
        #expect(text.contains("accentColor: [90, 87, 54]"))
    }

    /// The KSTO scrape leaves alone a file stamped after the post, so a reorder is stamped as an edit is.
    @Test func movingKSTOShowsStampsTheSchedule() async throws {
        let (model, data) = try await modelOnRepoData()
        let file = data.appending(path: "ksto-schedule.yaml")
        let count = try String(contentsOf: file, encoding: .utf8).matches(of: /\n  - day:/).count
        let before = Date()
        await model.moveItems(in: "ksto-schedule.yaml", path: ["shows"],
                              order: [.index(1), .index(0)] + (2..<count).map { .index($0) })
        let text = try String(contentsOf: file, encoding: .utf8)
        let stamp = try #require(text.firstMatch(of: /updated: '(.*)'/)?.1)
        let stamped = try #require(try? Date(String(stamp), strategy: .iso8601))
        #expect(stamped >= before.addingTimeInterval(-1))
    }

    /// A field outside the hours editor has no schedule to blame.
    @Test func aDraftLetGoOutsideASchedulesSaysTheFieldChanged() async throws {
        let (model, _) = try await modelOnRepoData()
        let outcome = await model.applyDraft(.set(["faqs", 0, "question"], .string("Where?")), to: "faqs.yaml",
                                             replacing: "not what it holds", schedule: nil)
        guard case .letGo = outcome else { Issue.record("the draft was \(outcome)"); return }
        #expect(model.draftNotices.map(\.message) == ["“Where?” wasn't saved because the field changed while you typed."])
    }

    /// Every FAQ is in faqs.yaml, so the new one's file is the file already open.
    @Test func aNewRecordInTheOpenFileShowsInItsForm() async throws {
        let (model, _) = try await modelOnRepoData()
        await model.choose(.record(set: "faqs", RecordRef(file: "faqs.yaml", path: ["faqs", 0])))
        await model.createRecord(in: "faqs", title: "Where is the lost and found?", section: nil)
        guard case .record(_, let created) = model.item else { Issue.record("no record chosen"); return }
        #expect(model.value?[path: created.path]?["question"]?.string == "Where is the lost and found?")
    }

    /// An update waits for `editing` to end before it saves the edits, so adding,
    /// removing or moving a record counts as editing while the helper writes.
    @Test func addingARecordCountsAsEditing() async throws {
        let (model, _) = try await modelOnRepoData()
        await model.choose(.set("faqs"))
        #expect(await countsAsEditing(model) {
            await model.createRecord(in: "faqs", title: "Where is the lost and found?", section: nil)
        })
    }

    @Test func savingADocumentCountsAsEditing() async throws {
        let (model, _) = try await modelOnRepoData()
        let text = try #require(await model.readText("privacy.md"))
        var saved = false
        #expect(await countsAsEditing(model) {
            saved = await model.writeText("privacy.md", text + "\nOne more line.\n", expected: text)
        })
        #expect(saved)
    }

    /// What master brings, or a file put back as master has it, may describe the sets anew.
    @Test func theSetsAreReadAgainWhenTheFilesChange() async throws {
        let (model, data) = try await modelOnRepoData()
        try retitle(data.deletingLastPathComponent().appending(path: "base/data/_datasets.yaml"),
                    from: "title: FAQs & Notices", to: "title: Questions")
        await model.revert("_datasets.yaml")
        #expect(model.catalog?.sets["faqs"]?.title == "Questions")
    }

    @Test func aSchemaIsReadAgainWhenTheFilesChange() async throws {
        let (model, data) = try await modelOnRepoData()
        _ = await model.schema(for: "faqs")
        try retitle(data.deletingLastPathComponent().appending(path: "base/data/_schemas/faqs.yaml"),
                    from: "title: Question", to: "title: Asked")
        await model.revert("_schemas/faqs.yaml")
        #expect(await model.schema(for: "faqs")?["properties"]?["question"]?["title"]?.string == "Asked")
    }

    /// The privacy policy closed with text that would not save, as the file
    /// changed since it was read, comes back with the text when it opens again.
    @Test func aDocumentsTextThatWouldNotSaveIsKept() async throws {
        let (model, _) = try await modelOnRepoData()
        let text = try #require(await model.readText("privacy.md"))
        await model.leaveDocument("privacy.md", text: text + "\nOne more line.\n", expected: "what it held before")
        #expect(model.draftNotices.map(\.file) == ["privacy.md"])
        #expect(model.takeKeptDocument("privacy.md")
            == KeptDocument(text: text + "\nOne more line.\n", readAs: "what it held before"))
        #expect(model.takeKeptDocument("privacy.md") == nil)
    }

    /// Kept text saved against the file it was typed over, not the file as it is now,
    /// is refused, so a change the file had meanwhile is never written over unseen.
    @Test func keptTextDoesNotSaveOverTheFilesNewerChange() async throws {
        let (model, _) = try await modelOnRepoData()
        let text = try #require(await model.readText("privacy.md"))
        await model.leaveDocument("privacy.md", text: text + "\nOne more line.\n", expected: "what it held before")
        let kept = try #require(model.takeKeptDocument("privacy.md"))
        #expect(await !model.writeText("privacy.md", kept.text, expected: kept.readAs))
        #expect(await model.readText("privacy.md") == text)
    }

    @Test func aDocumentsTextThatSavesIsNotKept() async throws {
        let (model, _) = try await modelOnRepoData()
        let text = try #require(await model.readText("privacy.md"))
        await model.leaveDocument("privacy.md", text: text + "\nOne more line.\n", expected: text)
        #expect(model.draftNotices.isEmpty)
        #expect(model.takeKeptDocument("privacy.md") == nil)
        #expect(await model.readText("privacy.md") == text + "\nOne more line.\n")
    }

    /// Text kept from a document is an edit, so reverting the document lets it
    /// go, and the notice promising it back goes with it.
    @Test func revertingADocumentDropsItsKeptText() async throws {
        let (model, _) = try await modelOnRepoData()
        let text = try #require(await model.readText("privacy.md"))
        await model.leaveDocument("privacy.md", text: text + "\nOne more line.\n", expected: "what it held before")
        await model.revert("privacy.md")
        #expect(model.takeKeptDocument("privacy.md") == nil)
        #expect(model.draftNotices.isEmpty)
    }

    @Test func discardingEverythingDropsKeptText() async throws {
        let (model, _) = try await modelOnRepoData()
        let text = try #require(await model.readText("privacy.md"))
        await model.leaveDocument("privacy.md", text: text + "\nOne more line.\n", expected: "what it held before")
        await model.discardAll()
        #expect(model.takeKeptDocument("privacy.md") == nil)
        #expect(model.draftNotices.isEmpty)
    }

    /// Choosing a set waits for its records; a choice made meanwhile is the newer, and wins.
    @Test func aChoiceMadeWhileASetsRecordsLoadWins() async throws {
        let (model, _) = try await modelOnRepoData()
        let first = Task { await model.choose(.set("faqs")) }
        while model.chosenSet != "faqs" { await Task.yield() }
        await model.choose(.overview)
        await first.value
        #expect(model.item == .overview)
    }

    private func retitle(_ file: URL, from: String, to: String) throws {
        let text = try String(contentsOf: file, encoding: .utf8)
        #expect(text.contains(from))
        try text.replacingOccurrences(of: from, with: to).write(to: file, atomically: true, encoding: .utf8)
    }

    /// Whether `model` began editing while `work` ran, however briefly.
    private func countsAsEditing(_ model: AppModel, during work: () async -> Void) async -> Bool {
        final class Seen: @unchecked Sendable { var editing = false }
        let seen = Seen()
        withObservationTracking { _ = model.editing } onChange: { seen.editing = true }
        await work()
        return seen.editing
    }
}
