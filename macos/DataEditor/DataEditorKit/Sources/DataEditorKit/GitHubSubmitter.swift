import Foundation

/// Opens and updates pull requests from the contributor's fork, through GitHub's API alone.
public struct GitHubSubmitter: ChangeSubmitter {
    private let tokens: any TokenStore
    private let session: URLSession
    private let repo: GitHubRepo
    private let sleep: @Sendable (Duration) async -> Void

    public init(tokens: any TokenStore, session: URLSession = .shared, repo: GitHubRepo = .aao,
                sleep: @escaping @Sendable (Duration) async -> Void = { try? await Task.sleep(for: $0) }) {
        self.tokens = tokens
        self.session = session
        self.repo = repo
        self.sleep = sleep
    }

    /// A branch-name-safe form of a summary: lowercase words joined by dashes, at most 40 characters.
    static func slug(_ text: String) -> String {
        let words = text.lowercased().split { !$0.isLetter && !$0.isNumber || !$0.isASCII }
        return String(words.joined(separator: "-").prefix(40)).trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    }

    private func send(_ method: String, _ path: String, _ payload: JSONValue? = nil) async throws -> JSONValue {
        guard let token = tokens.read() else { throw SubmitError.signInRequired }
        var request = URLRequest(url: URL(string: "https://api.github.com\(path)")!)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        if let payload { request.httpBody = try JSONEncoder().encode(payload) }
        let (data, response) = try await session.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 401 {
            tokens.write(nil)
            throw SubmitError.signInRequired
        }
        let value = (try? JSONDecoder().decode(JSONValue.self, from: data)) ?? .null
        guard (200..<300).contains(status) else { throw SubmitError.github(status, value["message"]?.string ?? "") }
        return value
    }

    /// The contributor's fork, made if they have none, synced with upstream where it can be.
    private func fork() async throws -> (owner: String, fullName: String) {
        let created = try await send("POST", "/repos/\(repo.fullName)/forks")
        guard let fullName = created["full_name"]?.string, let owner = created["owner"]?["login"]?.string else {
            throw SubmitError.github(0, "GitHub did not say where the fork is")
        }
        // forking finishes in the background; only a 404 means it is not there yet
        for attempt in 0..<30 {
            do {
                _ = try await send("GET", "/repos/\(fullName)")
                break
            } catch SubmitError.github(404, _) {
                if attempt == 29 { throw SubmitError.github(0, "The fork was not ready in time") }
                await sleep(.seconds(1))
            }
        }
        _ = try? await send("POST", "/repos/\(fullName)/merge-upstream", .object(["branch": .string(repo.branch)]))
        return (owner, fullName)
    }

    /// The blob `path` had at `commit` in `fork`, or null if the file is new since.
    private func blob(of path: String, at commit: String, in fork: String) async throws -> JSONValue {
        let file: JSONValue
        do {
            file = try await send("GET", "/repos/\(fork)/contents/\(path)?ref=\(commit)")
        } catch SubmitError.github(404, _) {
            return .null
        }
        guard let sha = file["sha"], sha != .null else { throw SubmitError.github(0, "GitHub did not give the base of \(path)") }
        return sha
    }

    /// A commit of `changes`, and of each `restored` path set to the blob given, on top of `parent` in `fork`.
    private func commit(_ changes: [Change], restoring restored: [(path: String, sha: JSONValue)] = [],
                        parent: String, message: String, in fork: String) async throws -> String {
        let parentCommit: JSONValue
        do {
            parentCommit = try await send("GET", "/repos/\(fork)/git/commits/\(parent)")
        } catch SubmitError.github(404, _) {
            throw SubmitError.missingBaseCommit
        }
        guard let baseTree = parentCommit["tree"]?["sha"]?.string else { throw SubmitError.missingBaseCommit }
        var entries: [JSONValue] = []
        for change in changes {
            var sha = JSONValue.null
            if let contents = change.contents {
                let blob = try await send("POST", "/repos/\(fork)/git/blobs", .object([
                    "content": .string(contents.base64EncodedString()), "encoding": .string("base64"),
                ]))
                sha = blob["sha"] ?? .null
            }
            entries.append(.object(["path": .string(change.path), "mode": .string("100644"), "type": .string("blob"), "sha": sha]))
        }
        for (path, sha) in restored {
            entries.append(.object(["path": .string(path), "mode": .string("100644"), "type": .string("blob"), "sha": sha]))
        }
        let tree = try await send("POST", "/repos/\(fork)/git/trees", .object(["base_tree": .string(baseTree), "tree": .array(entries)]))
        let commit = try await send("POST", "/repos/\(fork)/git/commits", .object([
            "message": .string(message), "tree": tree["sha"] ?? .null, "parents": .array([.string(parent)]),
        ]))
        guard let sha = commit["sha"]?.string else { throw SubmitError.github(0, "GitHub did not return the commit") }
        return sha
    }

    public func submit(changes: [Change], base: String, summary: String, appVersion: String) async throws -> Submission {
        _ = try await send("GET", "/user")
        let (owner, fullName) = try await fork()
        let stamp = Date.now.formatted(.iso8601.year().month().day().time(includingFractionalSeconds: false)).filter(\.isNumber)
        let branch = "data-editor/\(Self.slug(summary))-\(stamp)"
        let sha = try await commit(changes, parent: base, message: summary, in: fullName)
        _ = try await send("POST", "/repos/\(fullName)/git/refs", .object(["ref": .string("refs/heads/\(branch)"), "sha": .string(sha)]))
        let files = changes.map { "- `\($0.path)`" }.joined(separator: "\n")
        let body = "\(summary)\n\n\(files)\n\nSubmitted with the All About Olaf Data Editor \(appVersion), from \(base.prefix(7))."
        let pull = try await send("POST", "/repos/\(repo.fullName)/pulls", .object([
            "title": .string(summary), "head": .string("\(owner):\(branch)"), "base": .string(repo.branch),
            "body": .string(body), "maintainer_can_modify": .bool(true),
        ]))
        guard case .number(let number)? = pull["number"], let url = pull["html_url"]?.string.flatMap(URL.init(string:)) else {
            throw SubmitError.github(0, "GitHub did not return the pull request")
        }
        return Submission(number: Int(number), url: url, owner: owner, branch: branch, base: base, paths: changes.map(\.path))
    }

    public func update(_ submission: Submission, changes: [Change], summary: String) async throws -> Submission {
        let fullName = "\(submission.owner)/\(repo.name)"
        let ref = try await send("GET", "/repos/\(fullName)/git/ref/heads/\(submission.branch)")
        guard let head = ref["object"]?["sha"]?.string else { throw SubmitError.github(0, "The pull request's branch is gone") }
        // a file the pull request changed before, and the contributor has since reverted, goes back to the base
        var restored: [(path: String, sha: JSONValue)] = []
        for path in submission.paths where !changes.contains(where: { $0.path == path }) {
            restored.append((path, try await blob(of: path, at: submission.base, in: fullName)))
        }
        let sha = try await commit(changes, restoring: restored, parent: head, message: summary, in: fullName)
        _ = try await send("PATCH", "/repos/\(fullName)/git/refs/heads/\(submission.branch)", .object(["sha": .string(sha)]))
        let touched = changes.map(\.path).filter { !submission.paths.contains($0) }
        return Submission(number: submission.number, url: submission.url, owner: submission.owner, branch: submission.branch,
                          base: submission.base, paths: submission.paths + touched)
    }

    public func state(of submission: Submission) async throws -> SubmissionState {
        let pull = try await send("GET", "/repos/\(repo.fullName)/pulls/\(submission.number)")
        if let merged = pull["merged_at"], merged != .null { return .merged }
        if pull["state"]?.string == "closed" { return .closed }
        let reviews = try await send("GET", "/repos/\(repo.fullName)/pulls/\(submission.number)/reviews").array ?? []
        var latest: [String: String] = [:]
        for review in reviews {
            if let user = review["user"]?["login"]?.string, let state = review["state"]?.string, state != "COMMENTED" { latest[user] = state }
        }
        return latest.values.contains("CHANGES_REQUESTED") ? .changesRequested : .open
    }
}
