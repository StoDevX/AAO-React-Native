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

    /// A generated file can't be edited, whatever control asks: a right-click's menu included.
    @Test func aGeneratedFileRefusesAnEdit() async throws {
        let (model, data) = try await modelOnRepoData()
        let file = data.appending(path: "bus-times/3-red-line.yaml")
        let before = try String(contentsOf: file, encoding: .utf8)
        #expect(await !model.apply([.set(["notice"], .string("Changed"))], to: "bus-times/3-red-line.yaml"))
        #expect(try String(contentsOf: file, encoding: .utf8) == before)
    }

    /// A colour well dragged sends a stream of colours; the file ends on the last, not one the helper refused.
    @Test func aStreamOfChangesEndsOnTheLast() async throws {
        let (model, data) = try await modelOnRepoData()
        // in the order a drag sends them, each started before the one before has finished
        let changes = [10, 20, 30].map { red in
            Task { await model.applyLatest(to: eastQuad, at: ["accentColor", 0]) { _ in [.set(["accentColor", 0], .number(Double(red)))] } }
        }
        for change in changes { await change.value }
        let text = try String(contentsOf: data.appending(path: eastQuad), encoding: .utf8)
        #expect(text.contains("accentColor: [30, 87, 54]"), "\(text)")
    }

    /// A queued change is built from the file as it is when it runs: a token
    /// removed while another removal is still being written removes only itself.
    @Test func aQueuedChangeIsBuiltFromTheFileAsItIsWhenItRuns() async throws {
        let (model, data) = try await modelOnRepoData()
        let units: [PathKey] = [0, "units"]
        // the contributor removes 22005, then 15203, the second before the first is written
        let wanted: [[String]] = [["15203", "23040"], ["23040"]]
        let changes = wanted.map { tokens in
            Task {
                await model.applyLatest(to: "student-work-areas.yaml", at: units) { file in
                    TokenListField.ops(at: units, from: file[path: units]?.array?.compactMap(\.string) ?? [], to: tokens)
                }
            }
        }
        for change in changes { await change.value }
        let text = try String(contentsOf: data.appending(path: "student-work-areas.yaml"), encoding: .utf8)
        #expect(text.contains("  units:\n    - '23040' # Bon Appetit - Sto Cost Ctr Charg\n"), "\(text.prefix(1200))")
    }

    /// Two records' fields of one name are queued apart: neither change gives way to the other.
    @Test func theSameFieldInTwoRecordsQueuesApart() async throws {
        let (model, data) = try await modelOnRepoData()
        let changes = [(0, "Hello"), (1, "Balances")].map { index, question in
            Task {
                await model.applyLatest(to: "faqs.yaml", at: ["faqs", .index(index), "question"]) { _ in
                    [.set(["faqs", .index(index), "question"], .string(question))]
                }
            }
        }
        for change in changes { await change.value }
        let text = try String(contentsOf: data.appending(path: "faqs.yaml"), encoding: .utf8)
        #expect(text.contains("question: 'Hello'") && text.contains("question: 'Balances'"), "\(text.prefix(1500))")
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

    /// A document's save waits its turn: while an edit is in flight it is refused, not run beside it.
    @Test func savingADocumentIsRefusedWhileAnEditIsInFlight() async throws {
        let (model, _) = try await modelOnRepoData()
        let text = try #require(await model.readText("privacy.md"))
        let edit = Task { await model.apply([.set(["accentColor", 0], .number(1))], to: "webcams/2-east-quad.yaml") }
        while !model.editing { await Task.yield() }
        #expect(await !model.writeText("privacy.md", text + "\nMore.", expected: text))
        await edit.value
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
