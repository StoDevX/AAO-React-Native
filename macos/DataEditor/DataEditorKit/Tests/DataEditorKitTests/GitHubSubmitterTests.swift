import Foundation
import Testing
@testable import DataEditorKit

private let api = "https://api.github.com"

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

struct GitHubSubmitterTests {
    @Test func opensAPullRequestFromAForkBranch() async throws {
        let (session, stub) = github()
        let (submitter, _) = submitter(session)
        let submission = try await submitter.submit(changes: [change], base: "base1", summary: "Close The Cage early on Fridays", appVersion: "1.0")
        #expect(submission.number == 42)
        #expect(submission.owner == "ole")
        #expect(submission.branch.hasPrefix("data-editor/close-the-cage-early-on-fridays-"))

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
        let open = Submission(number: 42, url: URL(string: "https://github.com/StoDevX/AAO-React-Native/pull/42")!, owner: "ole", branch: "data-editor/x")
        try await submitter.update(open, changes: [change], summary: "Fix the Friday close")
        let requests = stub.requests
        #expect(!requests.contains { $0.url!.path.hasSuffix("/pulls") && $0.httpMethod == "POST" })
        let commit = json(requests.first { $0.url!.path.hasSuffix("/git/commits") && $0.httpMethod == "POST" }!)
        #expect(commit["parents"] == .array([.string("head1")]))
        let patch = requests.first { $0.httpMethod == "PATCH" }!
        #expect(json(patch)["sha"] == .string("commit2"))
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
        let open = Submission(number: 42, url: URL(string: "https://github.com/StoDevX/AAO-React-Native/pull/42")!, owner: "ole", branch: "data-editor/x")
        #expect(try await submitter.state(of: open) == .changesRequested)
    }

    @Test func slugsTheBranchName() {
        #expect(GitHubSubmitter.slug("Close The Cage — early on Fridays!") == "close-the-cage-early-on-fridays")
        #expect(GitHubSubmitter.slug(String(repeating: "a", count: 80)).count == 40)
    }
}
