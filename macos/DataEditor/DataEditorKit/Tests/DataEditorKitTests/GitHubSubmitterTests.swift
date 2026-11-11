import Foundation
import Testing
@testable import DataEditorKit

/// GitHub as far as a submission sees it, for user `ole` whose fork already exists.
private func github(status401 paths: Set<String> = []) -> (URLSession, StubProtocol.Stub) {
    StubProtocol.session { request in
        let method = request.httpMethod ?? "GET"
        let path = request.url!.path
        if paths.contains(path) { return (401, body(#"{"message":"Bad credentials"}"#)) }
        switch (method, path) {
        case ("GET", "/user"): return (200, body(#"{"login":"ole"}"#))
        case ("POST", "/repos/StoDevX/AAO-React-Native/forks"): return (202, body(#"{"full_name":"ole/AAO-React-Native","owner":{"login":"ole"}}"#))
        case ("GET", "/repos/ole/AAO-React-Native"): return (200, body("{}"))
        case ("POST", "/repos/ole/AAO-React-Native/merge-upstream"): return (200, body("{}"))
        case ("POST", "/repos/ole/AAO-React-Native/git/blobs"): return (201, body(#"{"sha":"blob1"}"#))
        case ("GET", "/repos/ole/AAO-React-Native/git/commits/base1"): return (200, body(#"{"tree":{"sha":"tree0"}}"#))
        case ("GET", "/repos/ole/AAO-React-Native/git/commits/head1"): return (200, body(#"{"tree":{"sha":"tree1"}}"#))
        case ("GET", "/repos/ole/AAO-React-Native/git/ref/heads/data-editor/x"): return (200, body(#"{"object":{"sha":"head1"}}"#))
        case ("POST", "/repos/ole/AAO-React-Native/git/trees"): return (201, body(#"{"sha":"tree2"}"#))
        case ("POST", "/repos/ole/AAO-React-Native/git/commits"): return (201, body(#"{"sha":"commit2"}"#))
        case ("POST", "/repos/ole/AAO-React-Native/git/refs"): return (201, body("{}"))
        case ("PATCH", "/repos/ole/AAO-React-Native/git/refs/heads/data-editor/x"): return (200, body("{}"))
        case ("POST", "/repos/StoDevX/AAO-React-Native/pulls"): return (201, body(#"{"number":42,"html_url":"https://github.com/StoDevX/AAO-React-Native/pull/42"}"#))
        case ("GET", "/repos/StoDevX/AAO-React-Native/pulls/42"): return (200, body(#"{"state":"open","merged_at":null}"#))
        case ("GET", "/repos/StoDevX/AAO-React-Native/pulls/42/reviews"): return (200, body(#"[{"user":{"login":"drew"},"state":"COMMENTED"},{"user":{"login":"drew"},"state":"CHANGES_REQUESTED"}]"#))
        case ("GET", "/repos/ole/AAO-React-Native/contents/data/building-hours/1-3-stav.yaml") where request.url!.query == "ref=base1":
            return (200, body(#"{"sha":"stavbase"}"#))
        default: return (404, body(#"{"message":"Not Found"}"#))
        }
    }
}

private func json(_ request: URLRequest) -> JSONValue {
    try! JSONDecoder().decode(JSONValue.self, from: request.httpBody ?? Data())
}

private func submitter(_ session: URLSession, token: String? = "tok") -> (GitHubSubmitter, MemoryTokenStore) {
    let tokens = MemoryTokenStore(token)
    return (GitHubSubmitter(tokens: tokens, session: session, sleep: { _ in }), tokens)
}

private let change = Change(path: "data/building-hours/1-1-cage.yaml", contents: Data("name: The Cage\n".utf8))

/// Pull request 42, opened from `base1`, which has touched `paths`.
private func openSubmission(paths: [String] = ["data/building-hours/1-1-cage.yaml"]) -> Submission {
    Submission(number: 42, url: URL(string: "https://github.com/StoDevX/AAO-React-Native/pull/42")!, owner: "ole", branch: "data-editor/x",
               base: "base1", paths: paths)
}

/// GitHub answering a pull request's state with `pull`, and no reviews.
private func pullRequest(_ pull: String) -> URLSession {
    StubProtocol.session { request in
        switch request.url!.path {
        case "/repos/StoDevX/AAO-React-Native/pulls/42": return (200, body(pull))
        case "/repos/StoDevX/AAO-React-Native/pulls/42/reviews": return (200, body("[]"))
        default: return (404, body(#"{"message":"Not Found"}"#))
        }
    }.0
}

struct GitHubSubmitterTests {
    @Test func opensAPullRequestFromAForkBranch() async throws {
        let (session, stub) = github()
        let (submitter, _) = submitter(session)
        let submission = try await submitter.submit(changes: [change], base: "base1", summary: "Close The Cage early on Fridays", appVersion: "1.0")
        #expect(submission.number == 42)
        #expect(submission.owner == "ole")
        #expect(submission.branch.hasPrefix("data-editor/close-the-cage-early-on-fridays-"))
        #expect(submission.base == "base1")
        #expect(submission.paths == ["data/building-hours/1-1-cage.yaml"])

        let requests = stub.requests
        let tree = json(requests.first { $0.url!.path.hasSuffix("/git/trees") }!)
        #expect(tree["base_tree"] == .string("tree0"))
        #expect(tree["tree"]?[0]?["path"] == .string("data/building-hours/1-1-cage.yaml"))
        #expect(tree["tree"]?[0]?["sha"] == .string("blob1"))
        let commit = json(requests.first { $0.url!.path.hasSuffix("/git/commits") && $0.httpMethod == "POST" }!)
        #expect(commit["parents"] == .array([.string("base1")]))
        let pull = json(requests.first { $0.url!.path.hasSuffix("/pulls") }!)
        #expect(pull["head"] == .string("ole:\(submission.branch)"))
        #expect(pull["base"] == .string("master"))
        #expect(pull["title"] == .string("Close The Cage early on Fridays"))
        #expect(requests.allSatisfy { $0.value(forHTTPHeaderField: "Authorization") == "Bearer tok" })
    }

    @Test func addsACommitToAnOpenPullRequest() async throws {
        let (session, stub) = github()
        let (submitter, _) = submitter(session)
        let open = openSubmission()
        _ = try await submitter.update(open, changes: [change], summary: "Fix the Friday close")
        let requests = stub.requests
        #expect(!requests.contains { $0.url!.path.hasSuffix("/pulls") && $0.httpMethod == "POST" })
        #expect(json(requests.first { $0.url!.path.hasSuffix("/git/trees") }!)["base_tree"] == .string("tree1"))
        let commit = json(requests.first { $0.url!.path.hasSuffix("/git/commits") && $0.httpMethod == "POST" }!)
        #expect(commit["parents"] == .array([.string("head1")]))
        let patch = requests.first { $0.httpMethod == "PATCH" }!
        #expect(json(patch)["sha"] == .string("commit2"))
    }

    @Test func restoresTheBaseOfAFileNoLongerChanged() async throws {
        let (session, stub) = github()
        let (submitter, _) = submitter(session)
        let stav = "data/building-hours/1-3-stav.yaml"
        let pause = "data/building-hours/2-1-pause.yaml"
        let open = openSubmission(paths: [change.path, stav, pause])
        let updated = try await submitter.update(open, changes: [change], summary: "Only The Cage")
        let entries = json(stub.requests.first { $0.url!.path.hasSuffix("/git/trees") }!)["tree"]?.array ?? []
        let shas = Dictionary(uniqueKeysWithValues: entries.map { ($0["path"]!.string!, $0["sha"]!) })
        #expect(shas == [change.path: .string("blob1"), stav: .string("stavbase"), pause: .null])
        #expect(updated.paths == [change.path, stav, pause])
        #expect(updated.base == "base1")
    }

    @Test func recordsEveryPathAnUpdateTouches() async throws {
        let (session, _) = github()
        let (submitter, _) = submitter(session)
        let pause = Change(path: "data/building-hours/2-1-pause.yaml", contents: Data("name: The Pause\n".utf8))
        let updated = try await submitter.update(openSubmission(), changes: [change, pause], summary: "x")
        #expect(updated.paths == [change.path, pause.path])
    }

    @Test func saysWhenTheForkLacksTheBaseCommit() async {
        let (session, _) = github()
        let (submitter, _) = submitter(session)
        await #expect(throws: SubmitError.missingBaseCommit) {
            _ = try await submitter.submit(changes: [change], base: "unknown", summary: "x", appVersion: "1.0")
        }
    }

    @Test func readsAMergedPullRequest() async throws {
        let (submitter, _) = submitter(pullRequest(#"{"state":"closed","merged_at":"2026-11-05T12:00:00Z"}"#))
        #expect(try await submitter.state(of: openSubmission()) == .merged)
    }

    @Test func readsAClosedPullRequest() async throws {
        let (submitter, _) = submitter(pullRequest(#"{"state":"closed","merged_at":null}"#))
        #expect(try await submitter.state(of: openSubmission()) == .closed)
    }

    @Test func readsAnOpenPullRequest() async throws {
        let (submitter, _) = submitter(pullRequest(#"{"state":"open","merged_at":null}"#))
        #expect(try await submitter.state(of: openSubmission()) == .open)
    }

    @Test func describesEachErrorForTheContributor() {
        #expect(SubmitError.github(422, "Validation Failed").localizedDescription.contains("Validation Failed"))
        #expect(SubmitError.signInRequired.errorDescription != nil)
        // a contributor never asked for a fork, so the word means nothing to them
        #expect(SubmitError.missingBaseCommit.errorDescription == "GitHub is still setting up your copy of the data. Try again in a minute.")
        #expect(SubmitError.github(500, "").errorDescription != nil)
    }

    /// A 403 on a public read is nearly always the rate limit, for a pull
    /// request that still exists, so only 404 and 410 mean it is gone.
    @Test func tellsAGonePullRequestFromARateLimit() {
        #expect(SubmitError.github(404, "Not Found").isGone)
        #expect(SubmitError.github(410, "Gone").isGone)
        #expect(!SubmitError.github(403, "Forbidden").isGone)
        #expect(!SubmitError.github(500, "").isGone)
        #expect(!SubmitError.signInRequired.isGone)

        let primary = SubmitError.github(403, "API rate limit exceeded for user ID 1.")
        let secondary = SubmitError.github(403, "You have exceeded a secondary rate limit. Please wait a few minutes.")
        let tooMany = SubmitError.github(429, "Too many requests, slow down: rate limit")
        for error in [primary, secondary, tooMany] {
            #expect(error.isRateLimited)
            #expect(!error.isGone)
            #expect(error.errorDescription == "GitHub is limiting requests right now. Try again in a few minutes.")
        }
        #expect(!SubmitError.github(403, "Resource not accessible by integration").isRateLimited)
        #expect(SubmitError.github(403, "Resource not accessible by integration").errorDescription == "Resource not accessible by integration")
        #expect(!SubmitError.github(404, "rate limit").isRateLimited)
    }

    @Test func forgetsARejectedToken() async {
        let (session, _) = github(status401: ["/user"])
        let (submitter, tokens) = submitter(session)
        await #expect(throws: SubmitError.signInRequired) {
            _ = try await submitter.submit(changes: [change], base: "base1", summary: "x", appVersion: "1.0")
        }
        #expect(tokens.read() == nil)
    }

    @Test func asksForSignInWithoutAToken() async {
        let (session, stub) = github()
        let (submitter, _) = submitter(session, token: nil)
        await #expect(throws: SubmitError.signInRequired) {
            _ = try await submitter.submit(changes: [change], base: "base1", summary: "x", appVersion: "1.0")
        }
        #expect(stub.requests.isEmpty)
    }

    @Test func readsChangesRequested() async throws {
        let (session, _) = github()
        let (submitter, _) = submitter(session)
        let open = openSubmission()
        #expect(try await submitter.state(of: open) == .changesRequested)
    }

    @Test func removesAFileWithoutUploadingIt() async throws {
        let (session, stub) = github()
        let (submitter, _) = submitter(session)
        let removal = Change(path: "data/building-hours/1-1-cage.yaml", contents: nil)
        _ = try await submitter.submit(changes: [removal], base: "base1", summary: "Remove The Cage", appVersion: "1.0")
        let requests = stub.requests
        #expect(!requests.contains { $0.url!.path.hasSuffix("/git/blobs") })
        let tree = json(requests.first { $0.url!.path.hasSuffix("/git/trees") }!)
        #expect(tree["tree"]?[0]?["sha"] == .null)
    }

    @Test func asksForSignInWhenTheForkPollIsRejected() async {
        let (session, _) = github(status401: ["/repos/ole/AAO-React-Native"])
        let tokens = MemoryTokenStore("tok")
        let waits = SleepLog()
        let submitter = GitHubSubmitter(tokens: tokens, session: session, sleep: waits.record)
        await #expect(throws: SubmitError.signInRequired) {
            _ = try await submitter.submit(changes: [change], base: "base1", summary: "x", appVersion: "1.0")
        }
        #expect(tokens.read() == nil)
        #expect(waits.durations.isEmpty)
    }

    @Test func waitsForAForkThatIsNotThereYet() async throws {
        let polls = Counter()
        let (session, _) = StubProtocol.session { request in
            let path = request.url!.path
            switch (request.httpMethod ?? "GET", path) {
            case ("GET", "/user"): return (200, body(#"{"login":"ole"}"#))
            case ("POST", "/repos/StoDevX/AAO-React-Native/forks"): return (202, body(#"{"full_name":"ole/AAO-React-Native","owner":{"login":"ole"}}"#))
            case ("GET", "/repos/ole/AAO-React-Native"):
                return polls.next() == 1 ? (404, body(#"{"message":"Not Found"}"#)) : (200, body("{}"))
            case ("GET", "/repos/ole/AAO-React-Native/git/commits/base1"): return (200, body(#"{"tree":{"sha":"tree0"}}"#))
            case ("POST", "/repos/ole/AAO-React-Native/git/blobs"): return (201, body(#"{"sha":"blob1"}"#))
            case ("POST", "/repos/ole/AAO-React-Native/git/trees"): return (201, body(#"{"sha":"tree2"}"#))
            case ("POST", "/repos/ole/AAO-React-Native/git/commits"): return (201, body(#"{"sha":"commit2"}"#))
            case ("POST", "/repos/ole/AAO-React-Native/git/refs"): return (201, body("{}"))
            case ("POST", "/repos/StoDevX/AAO-React-Native/pulls"): return (201, body(#"{"number":42,"html_url":"https://github.com/StoDevX/AAO-React-Native/pull/42"}"#))
            default: return (404, body(#"{"message":"Not Found"}"#))
            }
        }
        let waits = SleepLog()
        let submitter = GitHubSubmitter(tokens: MemoryTokenStore("tok"), session: session, sleep: waits.record)
        let submission = try await submitter.submit(changes: [change], base: "base1", summary: "x", appVersion: "1.0")
        #expect(submission.number == 42)
        #expect(waits.durations == [.seconds(1)])
    }

    @Test func slugsTheBranchName() {
        #expect(GitHubSubmitter.slug("Close The Cage — early on Fridays!") == "close-the-cage-early-on-fridays")
        #expect(GitHubSubmitter.slug(String(repeating: "a", count: 80)).count == 40)
    }

    /// GitHub answering pull request 42's files with `files`, or `status` when not 200.
    private func pullRequestFiles(_ files: String, status: Int = 200) -> (URLSession, StubProtocol.Stub) {
        StubProtocol.session { request in
            guard request.url!.path == "/repos/StoDevX/AAO-React-Native/pulls/42/files" else { return (404, body(#"{"message":"Not Found"}"#)) }
            return (status, body(files))
        }
    }

    @Test func readsAPullRequestsFiles() async throws {
        let (session, stub) = pullRequestFiles(#"[{"filename":"data/building-hours/1-1-cage.yaml","patch":"@@ -1 +1 @@\n-a\n+b"},{"filename":"data/building-hours/2-1-big.yaml"}]"#)
        let files = try await submitter(session).0.files(of: openSubmission())
        #expect(files == [
            PullRequestFile(path: "data/building-hours/1-1-cage.yaml", rows: [.line(DiffLine(kind: .removed, text: "a")), .line(DiffLine(kind: .added, text: "b"))]),
            PullRequestFile(path: "data/building-hours/2-1-big.yaml", rows: nil),
        ])
        #expect(stub.requests.first?.url?.query == "per_page=100")
    }

    @Test func readsFilesWithoutSigningIn() async throws {
        let (session, stub) = pullRequestFiles("[]")
        _ = try await submitter(session, token: nil).0.files(of: openSubmission())
        #expect(stub.requests.count == 1)
        #expect(stub.requests.first?.value(forHTTPHeaderField: "Authorization") == nil)
    }

    @Test func saysWhenAPullRequestsFilesAreGone() async throws {
        let (session, _) = pullRequestFiles(#"{"message":"Not Found"}"#, status: 404)
        let error = await #expect(throws: SubmitError.self) { try await submitter(session).0.files(of: openSubmission()) }
        #expect(error?.isGone == true)
    }
}
