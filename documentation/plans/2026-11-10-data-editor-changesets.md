# Data editor changesets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the data editor's window three columns — changesets, buildings with an Overview, detail — and move everything the Changes sheet showed onto the Overview page.

**Architecture:** The decisions (which columns show what, which Overview parts apply, when a past pull request is fetched, how a patch reads) are plain Swift values and functions with unit tests. `AppModel` holds the two selections and the pull request records with their saved diffs. The views only draw those decisions. The kit gains a read of a pull request's files.

**Tech Stack:** Swift 6, SwiftUI on macOS 27, Swift Testing, XCUITest, xcodegen.

**Spec:** `documentation/specs/2026-11-10-data-editor-changesets-design.md`

## Global Constraints

- macOS 27 or later, arm64 only. The project is generated: run `mise run xcodegen` after adding files; never commit `DataEditor.xcodeproj`. Folders are synchronized, so a new `.swift` file needs no `project.yml` edit.
- Signing goes on the command line only, never into a file: `CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY=BE416F3F414B08AF28222E07AF4AABE04A3C6C1B DEVELOPMENT_TEAM=LH2SQN7RTQ PROVISIONING_PROFILE_SPECIFIER=`. Never `-allowProvisioningUpdates`.
- The app test command, from the repo root (the derived-data path must contain a space):
  ```
  mise run xcodegen && TEST_RUNNER_DATA_EDITOR_NODE="$(mise which node)" xcodebuild test -project macos/DataEditor/DataEditor.xcodeproj -scheme DataEditor -destination 'platform=macOS,arch=arm64' -derivedDataPath "<scratch folder with a space>" CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY=BE416F3F414B08AF28222E07AF4AABE04A3C6C1B DEVELOPMENT_TEAM=LH2SQN7RTQ PROVISIONING_PROFILE_SPECIFIER=
  ```
  Add `-only-testing:DataEditorTests/<Suite>` to run one suite. The kit: `swift test --package-path macos/DataEditor/DataEditorKit`.
- UI tests reach no server: `AppModel.runsUnderUITests` gates every GitHub call.
- AGENTS.md's Testing section binds: no tests of mocks, platform behaviour, config, or appearance in Jest-like unit tests; appearance is checked by screenshot.
- Interface copy says only what a contributor needs (no captions restating a label, no hints pre-empting a worry). The strings in this plan are final.
- `///` on declarations, `//` inside bodies; comments say what and why. No warnings from our code.
- `mise run agent:pre-commit` from the repo root before each commit; don't commit if it fails; never skip hooks. Commit subjects imperative, capitalised, no prefix, no trailing full stop, ending with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A conflict with no edits.** A conflicted file alone must give a non-empty Overview with the conflict, never "No changes" beneath it. Test in Task 4.
2. **Leaving a field whose text won't save.** Choosing anything in column 1 or 2 must leave the editor on screen with the text. Test in Task 3.
3. **Offline, a past pull request.** Its saved diffs show with "Last checked {date}" and no error; with nothing saved, the Try Again message. Test in Task 2.
4. **A past pull request that changed a file the workspace no longer lists** (a building renamed or removed upstream). Column 2 lists it by its file name; nothing crashes. Test in Task 4 (`changesetBuildings`).
5. **The open pull request merged while the app runs.** The Overview's pull request part shows Merged and Get the Latest Data; Submit's title turns to "Submit for Review…". Test in Task 4.

---

## File map

| File | Responsibility |
|---|---|
| `DataEditorKit/Sources/DataEditorKit/DiffRow.swift` (new) | `DiffRow`, `diffRows`, `parsePatch` — moved from `ChangesView.swift`, made `Codable` |
| `DataEditorKit/Sources/DataEditorKit/GitHubSubmitter.swift` | `files(of:)`, an anonymous read |
| `DataEditor/SubmissionHistory.swift` | records gain saved diffs, when they were checked, whether they are final |
| `DataEditor/Changeset.swift` (new) | the two selections, the Overview's parts, the preview line, column 2's buildings |
| `DataEditor/AppModel.swift` | holds the selections, saves diffs on submit, fetches a past pull request's diffs |
| `DataEditor/ChangesetList.swift` (new) | column 1 |
| `DataEditor/BuildingList.swift` | column 2 |
| `DataEditor/OverviewView.swift` (new) | Current changes' Overview, built from what `ChangesView.swift` drew |
| `DataEditor/PullRequestDetailView.swift` | a past pull request's Overview and a building's read-only diff |
| `DataEditor/DiffView.swift` (new) | `DiffView` and `ConflictRow`, moved out of `ChangesView.swift` |
| `DataEditor/ContentView.swift` | three columns; no Changes button or sheet |
| `DataEditor/ChangesView.swift` | deleted once empty; `SubmitControl` moves to `OverviewView.swift` |

---

### Task 1: Diff rows in the kit, a patch parser and a pull request's files

**Files:**
- Create: `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/DiffRow.swift`
- Modify: `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/LineDiff.swift` (make `DiffLine` and its `Kind` `Codable`)
- Modify: `macos/DataEditor/DataEditorKit/Sources/DataEditorKit/GitHubSubmitter.swift`, `ChangeSubmitter.swift`
- Modify: `macos/DataEditor/DataEditor/ChangesView.swift` (delete `DiffRow` and `diffRows`, now in the kit)
- Test: `macos/DataEditor/DataEditorKit/Tests/DataEditorKitTests/PatchTests.swift`, `GitHubSubmitterTests.swift`; move the `diffRows` tests from `DataEditorTests/ChangesViewTests.swift` to `PatchTests.swift`

**Interfaces:**
- Produces:
  - `public enum DiffRow: Hashable, Codable, Sendable { case line(DiffLine); case gap }`
  - `public func diffRows(_ lines: [DiffLine], context: Int = 3) -> [DiffRow]` (context rises from 2 to 3 to match GitHub's patches)
  - `public func parsePatch(_ patch: String) -> [DiffRow]`
  - `public struct PullRequestFile: Hashable, Sendable { public let path: String; public let rows: [DiffRow]? }` — `rows` nil when GitHub sent no patch
  - `ChangeSubmitter.files(of: Submission) async throws -> [PullRequestFile]`

- [ ] **Step 1: Write the failing parser tests**

```swift
import Testing
@testable import DataEditorKit

@Suite struct PatchTests {
    @Test func readsAHunk() {
        let patch = """
        @@ -3,3 +3,3 @@ schedule:
           hours:
        -    - {days: [Mo], from: '7:30am', to: '8:00pm'}
        +    - {days: [Mo], from: '7:30am', to: '9:00pm'}
        """
        #expect(parsePatch(patch) == [
            .line(DiffLine(kind: .same, text: "  hours:")),
            .line(DiffLine(kind: .removed, text: "    - {days: [Mo], from: '7:30am', to: '8:00pm'}")),
            .line(DiffLine(kind: .added, text: "    - {days: [Mo], from: '7:30am', to: '9:00pm'}")),
        ])
    }

    @Test func putsAGapBetweenHunks() {
        let patch = "@@ -1,1 +1,1 @@\n-a\n+b\n@@ -9,1 +9,1 @@\n-c\n+d"
        #expect(parsePatch(patch) == [
            .line(DiffLine(kind: .removed, text: "a")), .line(DiffLine(kind: .added, text: "b")),
            .gap,
            .line(DiffLine(kind: .removed, text: "c")), .line(DiffLine(kind: .added, text: "d")),
        ])
    }

    @Test func skipsTheNoNewlineMarker() {
        #expect(parsePatch("@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+a\n") == [
            .line(DiffLine(kind: .removed, text: "a")), .line(DiffLine(kind: .added, text: "a")),
        ])
    }

    @Test func readsAnEmptyPatchAsNoRows() { #expect(parsePatch("") == []) }
}
```

- [ ] **Step 2: Run them and see them fail** — `swift test --package-path macos/DataEditor/DataEditorKit --filter PatchTests`. Expected: build fails, `parsePatch` not found.

- [ ] **Step 3: Write `DiffRow.swift`**

```swift
import Foundation

/// A row of a file's diff: a line, or the unchanged lines left out between two changes.
public enum DiffRow: Hashable, Codable, Sendable {
    case line(DiffLine)
    case gap
}

/// The changed lines of a diff with up to `context` unchanged lines around
/// each, so a reader can tell which schedule a line belongs to. Three, as
/// GitHub's patches have, so a saved diff and a fetched one read alike.
public func diffRows(_ lines: [DiffLine], context: Int = 3) -> [DiffRow] {
    var kept = Set<Int>()
    for index in lines.indices where lines[index].kind != .same {
        kept.formUnion(max(0, index - context)...min(lines.count - 1, index + context))
    }
    var rows: [DiffRow] = []
    var previous: Int?
    for index in kept.sorted() {
        if let previous, index > previous + 1 { rows.append(.gap) }
        rows.append(.line(lines[index]))
        previous = index
    }
    return rows
}

/// The rows of a unified diff's hunks, as GitHub sends a file's `patch`: a
/// gap between two hunks, and no row for a hunk header or for the marker
/// that the file has no final newline.
public func parsePatch(_ patch: String) -> [DiffRow] {
    var rows: [DiffRow] = []
    var seenHunk = false
    for line in patch.split(separator: "\n", omittingEmptySubsequences: false) {
        if line.hasPrefix("@@") {
            if seenHunk { rows.append(.gap) }
            seenHunk = true
            continue
        }
        guard seenHunk, let first = line.first, first != "\\" else { continue }
        let text = String(line.dropFirst())
        switch first {
        case "+": rows.append(.line(DiffLine(kind: .added, text: text)))
        case "-": rows.append(.line(DiffLine(kind: .removed, text: text)))
        case " ": rows.append(.line(DiffLine(kind: .same, text: text)))
        default: continue
        }
    }
    return rows
}
```

Make `DiffLine` and `DiffLine.Kind` `Codable`. Delete `DiffRow` and `diffRows` from `ChangesView.swift`, and move their tests into `PatchTests`, expecting three lines of context where they expected two.

- [ ] **Step 4: Run them and see them pass.**

- [ ] **Step 5: Write the failing fetch tests** in `GitHubSubmitterTests.swift`, with the `URLProtocol` stub the file already uses:
  - `filesOfAPullRequest`: a stubbed `GET /repos/StoDevX/AAO-React-Native/pulls/7/files?per_page=100` answering `[{"filename": "data/building-hours/1-1-cage.yaml", "patch": "@@ -1 +1 @@\n-a\n+b"}, {"filename": "data/building-hours/2-1-big.yaml"}]` gives two `PullRequestFile`s, the first with the parsed rows, the second with `rows == nil`.
  - `filesNeedNoSignIn`: with an empty token store, the request is still sent and carries no `Authorization` header.
  - `filesReportsGone`: a 404 throws a `SubmitError` whose `isGone` is true.

- [ ] **Step 6: Run them and see them fail.**

- [ ] **Step 7: Implement.** In `GitHubSubmitter`, give `send` an `anonymous: Bool = false` parameter: when true, a missing token sends no `Authorization` header instead of throwing `signInRequired`, and a present token is still sent (it raises the rate limit). Then:

```swift
    /// The files a pull request changes, with GitHub's patch of each. Needs
    /// no sign-in: the repository is public.
    public func files(of submission: Submission) async throws -> [PullRequestFile] {
        let value = try await send("GET", "/repos/\(repo.fullName)/pulls/\(submission.number)/files?per_page=100", anonymous: true)
        return (value.array ?? []).compactMap { file in
            guard let path = file["filename"]?.string else { return nil }
            return PullRequestFile(path: path, rows: file["patch"]?.string.map(parsePatch))
        }
    }
```

Add `files(of:)` to `ChangeSubmitter` and `PullRequestFile` to `ChangeSubmitter.swift`. Check `JSONValue` has `array`; if not, add `public var array: [JSONValue]?` beside `string`, with a test in its existing suite.

- [ ] **Step 8: Run the kit tests and the app's unit tests; all pass.**

- [ ] **Step 9: Commit** — "Read a pull request's files, and diffs as GitHub writes them".

---

### Task 2: Saved diffs on each pull request record

**Files:**
- Modify: `macos/DataEditor/DataEditor/SubmissionHistory.swift`, `AppModel.swift`
- Test: `macos/DataEditor/DataEditorTests/SubmissionHistoryTests.swift`

**Interfaces:**
- Consumes: `DiffRow`, `diffRows`, `PullRequestFile`, `ChangeSubmitter.files(of:)` (Task 1).
- Produces on `SubmissionRecord` (all new fields optional or defaulted, so a history written before decodes):
  - `var diffs: [String: [DiffRow]]?` — by `data/`-relative file, nil until saved; a file whose value is `[]` and is in `tooLarge` had no patch
  - `var tooLarge: Set<String>` (default `[]`)
  - `var checked: Date?` — when GitHub last sent the diffs
  - `var isFinal: Bool` (default `false`) — fetched after it finished, so never fetched again
  - `var needsFetch: Bool { !isFinal }`
- Produces on `SubmissionHistory`:
  - `mutating func saveDiffs(_ diffs: [String: [DiffRow]], for number: Int)` — sets `diffs`, clears `tooLarge` and `checked`
  - `mutating func take(files: [PullRequestFile], fetched: Date, for number: Int)` — replaces `diffs` and `tooLarge`, sets `checked`, and sets `isFinal` when the record `isFinished`
- Produces on `AppModel`:
  - `private(set) var diffLoad: [Int: DiffLoad]` with `enum DiffLoad: Equatable { case loading, failed, gone }`
  - `func loadDiffs(of number: Int) async`

- [ ] **Step 1: Write the failing tests**

```swift
    @Test func savedDiffsReplaceTheLastAndForgetTheCheck() {
        var history = SubmissionHistory()
        history.add(record(number: 7))
        history.take(files: [PullRequestFile(path: "data/building-hours/1-1-cage.yaml", rows: [.gap])], fetched: .now, for: 7)
        history.saveDiffs(["building-hours/1-1-cage.yaml": [.line(DiffLine(kind: .added, text: "a"))]], for: 7)
        #expect(history.records[0].diffs == ["building-hours/1-1-cage.yaml": [.line(DiffLine(kind: .added, text: "a"))]])
        #expect(history.records[0].checked == nil)
    }

    @Test func aFetchNamesFilesAsTheWorkspaceDoesAndMarksTheTooLarge() {
        var history = SubmissionHistory()
        history.add(record(number: 7))
        history.take(files: [PullRequestFile(path: "data/building-hours/2-1-big.yaml", rows: nil)], fetched: .now, for: 7)
        #expect(history.records[0].diffs == ["building-hours/2-1-big.yaml": []])
        #expect(history.records[0].tooLarge == ["building-hours/2-1-big.yaml"])
    }

    @Test func aFinishedPullRequestIsFetchedOnceMore() {
        var history = SubmissionHistory()
        var merged = record(number: 7)
        merged.state = .merged
        history.add(merged)
        #expect(history.records[0].needsFetch)
        history.take(files: [], fetched: .now, for: 7)
        #expect(!history.records[0].needsFetch)
    }

    @Test func anOpenPullRequestKeepsBeingFetched() {
        var history = SubmissionHistory()
        history.add(record(number: 7))
        history.take(files: [], fetched: .now, for: 7)
        #expect(history.records[0].needsFetch)
    }

    @Test func aHistoryWrittenBeforeDiffsStillReads() throws {
        // the shape `submissions.json` had before records kept diffs
        let file = scratch.appending(path: "submissions.json")
        try Data(#"[{"submission":{"number":7,"url":"https://github.com/StoDevX/AAO-React-Native/pull/7","owner":"me","branch":"b","base":"c","paths":[]},"summary":"s","submitted":"2026-11-10T12:00:00Z"}]"#.utf8).write(to: file)
        let loaded = SubmissionHistory.load(from: file)
        #expect(loaded.history.records.map(\.id) == [7])
        #expect(loaded.setAside == nil)
    }
```

`record(number:)` and `scratch` are the helpers the suite already has; add them if it does not (a scratch folder under `FileManager.default.temporaryDirectory` whose name contains a space).

- [ ] **Step 2: Run and see them fail** — `-only-testing:DataEditorTests/SubmissionHistoryTests`.

- [ ] **Step 3: Implement** the fields and the two methods. Decode the new fields with `decodeIfPresent`, defaulting as listed. `take(files:)` strips the `data/` prefix the way `changedFiles` does; reuse one private function for both.

- [ ] **Step 4: Save diffs at submit.** In `AppModel.submit(summary:)`, after a submission or update succeeds and the record is added or replaced, call `submissions.saveDiffs(Dictionary(uniqueKeysWithValues: changedFiles.map { ($0, diffRows(diff(for: $0))) }), for: number)`.

- [ ] **Step 5: Fetch on demand.** Write `loadDiffs(of:)`:

```swift
    /// Asks GitHub for pull request `number`'s files, unless it is final.
    /// What GitHub sends replaces the saved diffs; a failure keeps them, and
    /// `diffLoad` says which failure. UI tests reach no server.
    func loadDiffs(of number: Int) async {
        guard !runsUnderUITests, diffLoad[number] != .loading,
              let record = submissions.records.first(where: { $0.id == number }), record.needsFetch else { return }
        diffLoad[number] = .loading
        do {
            let files = try await submitter.files(of: record.submission)
            submissions.take(files: files, fetched: .now, for: number)
            diffLoad[number] = nil
        } catch {
            diffLoad[number] = (error as? SubmitError)?.isGone == true ? .gone : .failed
        }
    }
```

`submitter` is the `ChangeSubmitter` `submit` already uses; if it is built inside `submit`, lift it to a stored property built the same way.

- [ ] **Step 6: Run the suite and see it pass; run all unit tests.**

- [ ] **Step 7: Commit** — "Keep each pull request's diffs, saved at submit and refreshed from GitHub".

---

### Task 3: The two selections

**Files:**
- Create: `macos/DataEditor/DataEditor/Changeset.swift`
- Modify: `macos/DataEditor/DataEditor/AppModel.swift` (replace `SidebarItem`, `sidebarSelection`, `latestChoice`, `shownPullRequest`, `choose(_:)`)
- Test: `macos/DataEditor/DataEditorTests/SidebarChoiceTests.swift` (rename the suite `SelectionTests`, file `SelectionTests.swift`)

**Interfaces:**
- Produces in `Changeset.swift`:
  - `enum Changeset: Hashable { case current; case pullRequest(number: Int) }`
  - `enum ChangesetItem: Hashable { case overview; case building(file: String) }`
- Produces on `AppModel`:
  - `private(set) var changeset: Changeset = .current`
  - `private(set) var item: ChangesetItem = .overview`
  - `func choose(_ changeset: Changeset) async` — saves drafts; on failure changes nothing; else sets `changeset`, sets `item = .overview`, and for a pull request starts `loadDiffs(of:)`
  - `func choose(_ item: ChangesetItem) async` — saves drafts; on failure changes nothing; else sets `item`, and for `.building(file)` under `.current` calls `select(file)` (which loads it unless already open)
  - `selection` (the open file) stays as it is; `choose` drives it.

The newest choice wins, as `latestChoice` makes it today: a choice made while an earlier one waits for drafts to save replaces it.

- [ ] **Step 1: Write the failing tests.** Build the model the way the existing suite does (an `AppModel` on a scratch support folder, with no helper). Register a draft saver that returns `false` to stand for text that will not save.

```swift
    @Test func aDraftThatWontSaveKeepsTheEditorOnScreen() async {
        let model = makeModel()
        await model.choose(ChangesetItem.building(file: "building-hours/1-1-cage.yaml"))
        let field = UUID()
        model.registerDraftSaver(field) { false }
        await model.choose(Changeset.pullRequest(number: 7))
        #expect(model.changeset == .current)
        await model.choose(ChangesetItem.overview)
        #expect(model.item == .building(file: "building-hours/1-1-cage.yaml"))
    }

    @Test func choosingAChangesetOpensItsOverview() async {
        let model = makeModel()
        await model.choose(ChangesetItem.building(file: "building-hours/1-1-cage.yaml"))
        await model.choose(Changeset.pullRequest(number: 7))
        #expect(model.changeset == .pullRequest(number: 7))
        #expect(model.item == .overview)
    }

    @Test func theNewestChoiceWins() async {
        let model = makeModel()
        let field = UUID()
        // the first save takes a moment, during which a second choice arrives
        model.registerDraftSaver(field) { try? await Task.sleep(for: .milliseconds(100)); return true }
        async let first: Void = model.choose(ChangesetItem.building(file: "a.yaml"))
        try? await Task.sleep(for: .milliseconds(10))
        await model.choose(ChangesetItem.overview)
        await first
        #expect(model.item == .overview)
    }
```

Keep every test in the old `SidebarChoiceTests` that still holds, rewritten for the new calls.

- [ ] **Step 2: Run and see them fail.**

- [ ] **Step 3: Implement** in `Changeset.swift` and `AppModel`. Remove `SidebarItem`, `sidebarSelection`, `shownPullRequest` and the old `choose`. Make the build compile by pointing `BuildingList` and `ContentView` at the new properties; their full rework is Task 5, so keep the views' changes to what compiles.

- [ ] **Step 4: Run all unit tests; they pass.**

- [ ] **Step 5: Commit** — "Choose a changeset and one of its buildings, never past unsaved text".

---

### Task 4: What the Overview and column 2 show

**Files:**
- Modify: `macos/DataEditor/DataEditor/Changeset.swift`, `AppModel.swift` (`shownProblems`)
- Test: `macos/DataEditor/DataEditorTests/OverviewTests.swift` (new)

**Interfaces:**
- Consumes: `SubmissionRecord`, `SubmissionState`, `Problem`, `BuildingSummary`.
- Produces in `Changeset.swift`:

```swift
/// What the Overview of Current changes shows, in order. Each part is
/// there only when it applies.
struct OverviewParts: Equatable {
    /// the pull request a new submission updates or that just finished
    var pullRequest: SubmissionRecord?
    var newerData: Bool
    var conflicts: [String]
    var preview: PreviewLine?
    var problems: [Problem]
    var changed: [String]
    /// "No changes" in place of the conflict and file parts
    var isEmpty: Bool { conflicts.isEmpty && changed.isEmpty }
}

/// The Overview's line about the phone preview.
enum PreviewLine: Equatable {
    case upToDate
    /// the build stopped at this file
    case stopsAt(file: String)
}
```

  - `static func OverviewParts.make(history: SubmissionHistory, newerCommit: String?, conflicts: [String], changedFiles: [String], buildProblems: [Problem], hasBuilt: Bool) -> OverviewParts`
    - `pullRequest`: `history.current`, or else the newest record if it finished and is newer than none other (`history.records.first` when `isFinished`), so a merge shows Merged and Get the Latest Data until the next submission
    - `preview`: nil before any build (`!hasBuilt`); `.stopsAt(file:)` naming the first build problem's file; else `.upToDate`
    - `problems`: `buildProblems`
    - `changed`: `changedFiles`
  - `func PreviewLine.text(buildings: [BuildingSummary]) -> String` — "The preview is up to date" / "The preview stops at {building name, or the file when unknown}"
  - `static func changesetBuildings(_ changeset: Changeset, all: [BuildingSummary], history: SubmissionHistory) -> [BuildingSummary]` — every building for `.current`; for a pull request, its `changedFiles` in order, each as its `BuildingSummary` when listed, else a `BuildingSummary` whose name is the file name and whose category is empty
- Changes on `AppModel`: `shownProblems` becomes the open file's problems only: `plainProblems(problems + buildProblems.filter { $0.file == documentFile })`, deduplicated. Add `private(set) var hasBuilt = false`, set after the first `rebuild()` that ran.

- [ ] **Step 1: Write the failing tests**

```swift
import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@Suite struct OverviewTests {
    @Test func aConflictAloneIsNotEmpty() {
        let parts = OverviewParts.make(history: SubmissionHistory(), newerCommit: nil, conflicts: ["building-hours/1-1-cage.yaml"],
                                       changedFiles: [], buildProblems: [], hasBuilt: true)
        #expect(!parts.isEmpty)
    }

    @Test func nothingChangedIsEmptyButStillOffersNewerData() {
        let parts = OverviewParts.make(history: SubmissionHistory(), newerCommit: "abc", conflicts: [],
                                       changedFiles: [], buildProblems: [], hasBuilt: true)
        #expect(parts.isEmpty)
        #expect(parts.newerData)
    }

    @Test func aMergedPullRequestStaysUntilTheNextSubmission() {
        var history = SubmissionHistory()
        var merged = record(number: 7)
        merged.state = .merged
        history.add(merged)
        let parts = OverviewParts.make(history: history, newerCommit: nil, conflicts: [], changedFiles: [], buildProblems: [], hasBuilt: true)
        #expect(parts.pullRequest?.id == 7)
    }

    @Test func thePreviewNamesTheFileThatStopsIt() {
        let problem = Problem(file: "building-hours/1-1-cage.yaml", message: "bad", path: nil)
        let parts = OverviewParts.make(history: SubmissionHistory(), newerCommit: nil, conflicts: [], changedFiles: [],
                                       buildProblems: [problem], hasBuilt: true)
        #expect(parts.preview == .stopsAt(file: "building-hours/1-1-cage.yaml"))
        let cage = BuildingSummary(file: "building-hours/1-1-cage.yaml", name: "The Cage", category: "Food")
        #expect(parts.preview?.text(buildings: [cage]) == "The preview stops at The Cage")
    }

    @Test func noPreviewLineBeforeTheFirstBuild() {
        let parts = OverviewParts.make(history: SubmissionHistory(), newerCommit: nil, conflicts: [], changedFiles: [],
                                       buildProblems: [], hasBuilt: false)
        #expect(parts.preview == nil)
    }

    @Test func aPastPullRequestListsOnlyItsFilesAndNamesOnesNoLongerListed() {
        var history = SubmissionHistory()
        history.add(record(number: 7, paths: ["data/building-hours/1-1-cage.yaml", "data/building-hours/9-9-gone.yaml"]))
        let cage = BuildingSummary(file: "building-hours/1-1-cage.yaml", name: "The Cage", category: "Food")
        let stav = BuildingSummary(file: "building-hours/1-3-stav.yaml", name: "Stav Hall", category: "Food")
        let shown = changesetBuildings(.pullRequest(number: 7), all: [cage, stav], history: history)
        #expect(shown.map(\.name) == ["The Cage", "9-9-gone.yaml"])
    }
}
```

Match `BuildingSummary`'s real initializer; if it has more fields, fill them. Put `record(number:paths:)` in a shared test helper file both suites use.

- [ ] **Step 2: Run and see them fail.**

- [ ] **Step 3: Implement**, and change `shownProblems` and `hasBuilt` as listed. Add a test to the suite that covers `shownProblems` if `AppModel` can be built without a helper with `problems` and `buildProblems` set; otherwise move the filter into a static function `AppModel.problems(of file: String?, open: [Problem], build: [Problem]) -> [Problem]` and test that.

- [ ] **Step 4: Run all unit tests; they pass.**

- [ ] **Step 5: Commit** — "Decide what a changeset's Overview shows".

---

### Task 5: Three columns

**Files:**
- Create: `macos/DataEditor/DataEditor/ChangesetList.swift`, `OverviewView.swift`, `DiffView.swift`
- Modify: `ContentView.swift`, `BuildingList.swift`, `PullRequestDetailView.swift`, `HoursDetailView.swift` (the conflict lock's text)
- Delete: `ChangesView.swift` once emptied (move `SubmitControl` to `OverviewView.swift`, `DiffView` and `ConflictRow` to `DiffView.swift`, `SubmissionBanner`'s content into the Overview's pull request part); move `ChangesViewTests` to `OverviewTests` or a `SubmitControlTests` file it fits

**Interfaces:**
- Consumes: everything from Tasks 1–4.

Views only; the decisions they draw are tested in Tasks 2–4. Accessibility identifiers below are what Task 6's UI tests use.

- [ ] **Step 1: `ContentView`** becomes

```swift
        NavigationSplitView {
            ChangesetList().disabled(!ready)
        } content: {
            BuildingList().disabled(!ready)
        } detail: {
            detail
        }
```

The detail switch keeps the launch phases; for `.ready` it draws, by `(model.changeset, model.item)`:
`(.current, .overview)` → `OverviewView()`; `(.current, .building)` → `HoursDetailView(document:)` when `model.document` is loaded, else a `ProgressView()`; `(.pullRequest(n), .overview)` → `PullRequestDetailView(number: n)`; `(.pullRequest(n), .building(file))` → `PullRequestFileView(number: n, file: file)`. Remove the Changes toolbar button, its `showingChanges` state and the sheet. Raise `minWidth` to 1100 for the third column.

- [ ] **Step 2: `ChangesetList`** (column 1, identifier `changeset-list`): a `List` with selection bound to `model.changeset` through `choose(_:)`.
  - Row "Current changes", identifier `changeset-current`, with a count badge `ContentView.changeCount(changedFiles:conflicts:)` and a trailing `exclamationmark.triangle.fill` when `!parts.problems.isEmpty || !parts.conflicts.isEmpty || parts.preview != .upToDate && parts.preview != nil`.
  - `Section("Submitted")` only when there are records: today's `ActivityRow`, moved here, identifier `pull-request-\(number)`.
  - Column width `min: 200, ideal: 220`.

- [ ] **Step 3: `BuildingList`** (column 2, identifier `building-list`): selection bound to `model.item` through `choose(_:)`. A first row `Label("Overview", systemImage: "list.bullet.rectangle")`, identifier `overview`, tag `.overview`. Below it, the sections of `changesetBuildings(model.changeset, …)` grouped by `BuildingList.sections(of:)`. Under `.current`, a changed building's icon is `pencil.circle.fill`, a conflicted one's `exclamationmark.2`, and one named by a build problem gets a trailing `exclamationmark.triangle.fill`. Under a pull request, all show `doc.text`. Remove the Activity section.

- [ ] **Step 4: `OverviewView`** (identifier `overview-page`): a `Form` with `.formStyle(.grouped)`, the parts of `OverviewParts.make(…)` in order:
  1. Pull request (identifier `overview-pull-request`): `#n` and its state (`PullRequestState`), "Open on GitHub"; when `model.submissionUnreadable`, "Forget This Pull Request" as today; when finished, "Get the Latest Data", running `updateWorkspace()`.
  2. Newer data (identifier `overview-newer-data`): "Newer data is available. Your edits will be kept." and "Get the Latest Data"; the update error row as the sheet had it.
  3. Conflicts: a `ConflictRow` each.
  4. Preview (identifier `overview-preview`): `parts.preview.text(…)`, and for `.stopsAt(file)` a button "Show {name}" that runs `choose(.building(file:))`.
  5. Problems (identifier `overview-problems`): `ProblemLabel(problem:fileOnScreen: nil, …)` each, as a button that chooses its file.
  6. Changed buildings: a `Section` each, headed by the building's name and file with "Revert" (confirmation as the sheet had it), holding `DiffView(rows: diffRows(model.diff(for: file)))`.
  When `parts.isEmpty`, in place of 3 and 6: `ContentUnavailableView("No changes", systemImage: "checkmark.circle")`, framed `maxWidth: .infinity`. A bottom bar (`.safeAreaInset(edge: .bottom)`) holds `SubmitControl`'s reason and button, which presents `SubmitSheet` as a sheet.

- [ ] **Step 5: `PullRequestDetailView(number:)`**: summary as the header, then `#n`, state, submitted date, "Open on GitHub", and every file's rows from `record.diffs` in a `DiffView`, headed by its building's name; "Too large to show here" with the GitHub link for a file in `tooLarge`. Under them, by `model.diffLoad[n]` and `record.checked`:
  - `.loading` and no saved diffs → `ProgressView()`
  - `.failed` and saved diffs → "Last checked {checked, date and time}" (or, never checked, "Last checked when you submitted it")
  - `.failed` and no saved diffs → "Couldn't load this pull request's changes." and "Try Again"
  - `.gone` → "This pull request no longer exists on GitHub." and "Forget This Pull Request"
  `PullRequestFileView(number:file:)` shows one file's rows the same way, read-only.

- [ ] **Step 6: `HoursDetailView`'s conflict lock** reads "This file changed on GitHub too." with a button "Choose a Version…" that runs `choose(.overview)`.

- [ ] **Step 7: Build and run all unit tests**; no warnings from our code.

- [ ] **Step 8: Commit** — "Lay the data editor out in three columns, with each changeset's Overview".

---

### Task 6: UI tests and screenshots

**Files:**
- Modify: `macos/DataEditor/DataEditorUITests/ChangesUITests.swift`, `ActivityUITests.swift` (rename `PullRequestUITests.swift`), `HoursEditorUITests.swift`
- Test: the same

- [ ] **Step 1: Update the existing UI tests** to the new navigation: where a test clicked the Changes toolbar button, it clicks `changeset-current` then `overview`; where it opened a building, it clicks the building in `building-list`. Run them; fix the tests, not the app, unless the app is wrong.

- [ ] **Step 2: Write the new UI tests**, each with a window screenshot (`XCTAttachment(screenshot: app.windows.firstMatch.screenshot())`, `lifetime = .keepAlways`, a descriptive `name`):
  - `testOverviewShowsAConflictAndAChange`: plant a conflict the way `ChangesUITests` already does, edit another building, open the Overview; assert the conflict's buttons, the changed building's section and no "No changes".
  - `testOverviewWithNoChanges`: fresh workspace; assert "No changes".
  - `testAPastPullRequestShowsItsSavedDiffs`: plant `submissions.json` with record #7 holding `diffs` for The Cage (as `ActivityUITests` plants records today); click `pull-request-7`; assert the Overview shows the summary and a diff line, column 2 lists only The Cage, and choosing it shows its read-only diff. No network: the app is under UI tests.
  - `testADraftThatWontSaveStaysOnScreen` is a unit test (Task 3), not here.

- [ ] **Step 3: Run the whole app suite** with the Global Constraints' command; all pass.

- [ ] **Step 4: Export the screenshots** — `xcrun xcresulttool export attachments --path <xcresult> --output-path .superpowers/sdd/2026-11-10-data-editor-changesets/screenshots` — open each, and check: three columns; the Overview's parts in order; "No changes" centred in the detail column; a past pull request's diff; nothing clipped.

- [ ] **Step 5: Commit** — "Test the data editor's three columns".
