import Foundation

/// The repository the data comes from.
public struct GitHubRepo: Sendable, Hashable {
    public let owner: String
    public let name: String
    public let branch: String
    public static let aao = GitHubRepo(owner: "StoDevX", name: "AAO-React-Native", branch: "master")
    public var fullName: String { "\(owner)/\(name)" }
}

/// The trees of `scripts/` and `modules/` the bundled helper was built from.
public struct HelperStamp: Codable, Hashable, Sendable {
    public let scriptsTree: String
    public let modulesTree: String
    public init(scriptsTree: String, modulesTree: String) {
        self.scriptsTree = scriptsTree
        self.modulesTree = modulesTree
    }
}

/// The commit a workspace was downloaded at.
public struct Snapshot: Codable, Hashable, Sendable {
    public let commit: String
    public let scriptsTree: String
    public let modulesTree: String

    /// Whether the bundled helper was built from the scripts this data expects.
    public func isCompatible(with stamp: HelperStamp) -> Bool {
        scriptsTree == stamp.scriptsTree && modulesTree == stamp.modulesTree
    }
}

/// The data being edited: `data/` and the published `images/` at a commit, a
/// pristine copy of both under `base/`, and the build under `out/`.
public final class Workspace: Sendable {
    public let root: URL
    private let session: URLSession
    private let repo: GitHubRepo

    public init(root: URL, session: URLSession = .shared, repo: GitHubRepo = .aao) {
        self.root = root
        self.session = session
        self.repo = repo
    }

    public var dataDirectory: URL { root.appending(path: "data") }
    public var outDirectory: URL { root.appending(path: "out") }
    private var baseDataDirectory: URL { root.appending(path: "base/data") }
    private var snapshotFile: URL { root.appending(path: "snapshot.json") }

    public var snapshot: Snapshot? {
        guard let data = try? Data(contentsOf: snapshotFile) else { return nil }
        return try? JSONDecoder().decode(Snapshot.self, from: data)
    }

    private struct Tree: Decodable {
        struct Entry: Decodable { let path: String; let type: String; let sha: String }
        let tree: [Entry]
        let truncated: Bool?
    }

    private func get(_ url: URL, accept: String = "application/vnd.github+json") async throws -> Data {
        var request = URLRequest(url: url)
        request.setValue(accept, forHTTPHeaderField: "Accept")
        let (data, response) = try await session.data(for: request)
        guard let status = (response as? HTTPURLResponse)?.statusCode, (200..<300).contains(status) else {
            throw URLError(.badServerResponse, userInfo: [NSURLErrorFailingURLErrorKey: url])
        }
        return data
    }

    private var api: URL { URL(string: "https://api.github.com/repos/\(repo.fullName)")! }

    /// The newest commit on the repo's default branch.
    public func latestCommit() async throws -> String {
        let data = try await get(api.appending(path: "commits/\(repo.branch)"), accept: "application/vnd.github.sha")
        return String(decoding: data, as: UTF8.self).trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func tree(_ sha: String, recursive: Bool) async throws -> Tree {
        var url = api.appending(path: "git/trees/\(sha)")
        if recursive { url.append(queryItems: [URLQueryItem(name: "recursive", value: "1")]) }
        let tree = try JSONDecoder().decode(Tree.self, from: try await get(url))
        if tree.truncated == true { throw URLError(.dataLengthExceedsMaximum) }
        return tree
    }

    private func fetch(_ url: URL, to destination: URL) async throws {
        try FileManager.default.createDirectory(at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
        try await get(url, accept: "*/*").write(to: destination)
    }

    /// The files of `data/` and the images `bundle-data` publishes, at `commit`.
    private func files(at commit: String) async throws -> (paths: [String], snapshot: Snapshot) {
        let top = try await tree(commit, recursive: false)
        func sha(_ name: String) throws -> String {
            guard let entry = top.tree.first(where: { $0.path == name && $0.type == "tree" }) else { throw URLError(.fileDoesNotExist) }
            return entry.sha
        }
        let data = try await tree(try sha("data"), recursive: true).tree.filter { $0.type == "blob" }.map { "data/\($0.path)" }
        let images = try await tree(try sha("images"), recursive: true).tree
            .filter { $0.type == "blob" && ($0.path == "groups.json" || $0.path.split(separator: "/").count == 2 && $0.path.hasSuffix(".webp")) }
            .map { "images/\($0.path)" }
        return (data + images, Snapshot(commit: commit, scriptsTree: try sha("scripts"), modulesTree: try sha("modules")))
    }

    /// Downloads `commit` into a staging folder, then swaps it in whole. A
    /// failure partway leaves the workspace as it was. Local edits are dropped;
    /// the caller keeps any it means to replay.
    @discardableResult
    public func download(commit: String) async throws -> Snapshot {
        let (paths, snapshot) = try await files(at: commit)
        let fm = FileManager.default
        let staging = root.appending(path: "staging")
        try? fm.removeItem(at: staging)
        try fm.createDirectory(at: staging, withIntermediateDirectories: true)
        let raw = URL(string: "https://raw.githubusercontent.com/\(repo.fullName)/\(commit)/")!
        // eight at a time
        try await withThrowingTaskGroup(of: Void.self) { group in
            var remaining = paths[...]
            for _ in 0..<8 {
                guard let path = remaining.popFirst() else { break }
                group.addTask { try await self.fetch(raw.appending(path: path), to: staging.appending(path: path)) }
            }
            while try await group.next() != nil {
                guard let path = remaining.popFirst() else { continue }
                group.addTask { try await self.fetch(raw.appending(path: path), to: staging.appending(path: path)) }
            }
        }
        try fm.createDirectory(at: root, withIntermediateDirectories: true)
        for name in ["data", "images", "base"] { try? fm.removeItem(at: root.appending(path: name)) }
        try fm.createDirectory(at: root.appending(path: "base"), withIntermediateDirectories: true)
        try fm.copyItem(at: staging.appending(path: "data"), to: baseDataDirectory)
        try fm.moveItem(at: staging.appending(path: "data"), to: dataDirectory)
        try fm.moveItem(at: staging.appending(path: "images"), to: root.appending(path: "images"))
        try fm.removeItem(at: staging)
        try JSONEncoder().encode(snapshot).write(to: snapshotFile)
        return snapshot
    }

    private func relativeFiles(in directory: URL) -> Set<String> {
        guard let enumerator = FileManager.default.enumerator(at: directory, includingPropertiesForKeys: [.isRegularFileKey]) else { return [] }
        var files = Set<String>()
        let prefix = directory.standardizedFileURL.path + "/"
        for case let url as URL in enumerator where (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true {
            files.insert(String(url.standardizedFileURL.path.dropFirst(prefix.count)))
        }
        return files
    }

    /// The data files that differ from the base commit: changed, added or removed.
    public func changedFiles() throws -> [String] {
        let current = relativeFiles(in: dataDirectory)
        let base = relativeFiles(in: baseDataDirectory)
        return current.union(base).filter { try! contents(of: $0) != baseContents(of: $0) }.sorted()
    }

    /// A data file's contents now, or nil if it was removed.
    public func contents(of file: String) throws -> Data? {
        try? Data(contentsOf: dataDirectory.appending(path: file))
    }

    /// A data file's contents at the base commit, or nil if it is new.
    public func baseContents(of file: String) throws -> Data? {
        try? Data(contentsOf: baseDataDirectory.appending(path: file))
    }

    private var conflictsDirectory: URL { root.appending(path: "conflicts") }

    /// Downloads `commit` and puts the contributor's edits back on top. An
    /// edit master already has (it was merged) is dropped. A file master also
    /// changed is a conflict: master's version stays in `data/`, the
    /// contributor's is kept aside until they choose with `keepMine` or
    /// `keepLatest`. Returns the conflicts.
    public func update(to commit: String) async throws -> [String] {
        let edits = try changedFiles().map { (file: $0, oldBase: try baseContents(of: $0), mine: try contents(of: $0)) }
        try await download(commit: commit)
        let fm = FileManager.default
        try? fm.removeItem(at: conflictsDirectory)
        var conflicts: [String] = []
        for edit in edits {
            let newBase = try baseContents(of: edit.file)
            if newBase == edit.mine { continue }
            if newBase == edit.oldBase {
                let target = dataDirectory.appending(path: edit.file)
                if let mine = edit.mine {
                    try fm.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
                    try mine.write(to: target)
                } else {
                    try? fm.removeItem(at: target)
                }
            } else {
                conflicts.append(edit.file)
                let kept = conflictsDirectory.appending(path: edit.file)
                try fm.createDirectory(at: kept.deletingLastPathComponent(), withIntermediateDirectories: true)
                try (edit.mine ?? Data()).write(to: kept)
            }
        }
        return conflicts
    }

    /// The files set aside by the last update, waiting for a choice.
    public var conflicts: [String] { relativeFiles(in: conflictsDirectory).sorted() }

    /// Resolves a conflict with the contributor's version.
    public func keepMine(_ file: String) throws {
        let kept = conflictsDirectory.appending(path: file)
        let target = dataDirectory.appending(path: file)
        try? FileManager.default.removeItem(at: target)
        try FileManager.default.moveItem(at: kept, to: target)
    }

    /// Resolves a conflict with master's version.
    public func keepLatest(_ file: String) throws {
        try FileManager.default.removeItem(at: conflictsDirectory.appending(path: file))
    }

    /// Puts a data file back as it was at the base commit.
    public func revert(_ file: String) throws {
        let target = dataDirectory.appending(path: file)
        try? FileManager.default.removeItem(at: target)
        if let base = try baseContents(of: file) { try base.write(to: target) }
    }
}
