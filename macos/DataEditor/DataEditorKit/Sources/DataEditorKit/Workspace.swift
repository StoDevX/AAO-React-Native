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

    /// Downloads `commit` into a staging folder, then swaps it in. The old
    /// `data/`, `images/` and `base/` wait in `previous/` until the new ones and
    /// the snapshot are in place; a failure at any point puts them back, so the
    /// workspace and its snapshot always agree. Local edits are dropped; the
    /// caller keeps any it means to replay.
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
        let names = ["data", "images", "base"]
        let previous = root.appending(path: "previous")
        try? fm.removeItem(at: previous)
        try fm.createDirectory(at: previous, withIntermediateDirectories: true)
        let existed = names.filter { fm.fileExists(atPath: root.appending(path: $0).path) }
        var setAside: [String] = []
        do {
            for name in existed {
                try fm.moveItem(at: root.appending(path: name), to: previous.appending(path: name))
                setAside.append(name)
            }
            try fm.createDirectory(at: root.appending(path: "base"), withIntermediateDirectories: true)
            try fm.copyItem(at: staging.appending(path: "data"), to: baseDataDirectory)
            try fm.moveItem(at: staging.appending(path: "data"), to: dataDirectory)
            try fm.moveItem(at: staging.appending(path: "images"), to: root.appending(path: "images"))
            try JSONEncoder().encode(snapshot).write(to: snapshotFile, options: .atomic)
        } catch {
            // an original whose move failed is still in place, so only what this call made goes
            for name in names where setAside.contains(name) || !existed.contains(name) {
                try? fm.removeItem(at: root.appending(path: name))
            }
            for name in setAside { try? fm.moveItem(at: previous.appending(path: name), to: root.appending(path: name)) }
            try? fm.removeItem(at: previous)
            throw error
        }
        try? fm.removeItem(at: previous)
        try? fm.removeItem(at: staging)
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
    /// A name that starts with `.` or `_` is not data (the helper's `isDataEntry`):
    /// Finder's `.DS_Store`, or a `_<file>.next` the helper left half written.
    public func changedFiles() throws -> [String] {
        let current = relativeFiles(in: dataDirectory)
        let base = relativeFiles(in: baseDataDirectory)
        return current.union(base)
            .filter { file in
                let name = file.split(separator: "/").last ?? ""
                return !name.hasPrefix(".") && !name.hasPrefix("_")
            }
            .filter { try! contents(of: $0) != baseContents(of: $0) }.sorted()
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
    /// Conflicts where the contributor deleted the file, kept as empty markers.
    private var deletedConflictsDirectory: URL { root.appending(path: "conflicts-deleted") }
    /// The contributor's edits, on disk while an update downloads and replays them.
    private var replayDirectory: URL { root.appending(path: "replay") }

    private func write(_ data: Data, to url: URL) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: url)
    }

    /// Writes the contributor's edits, and any conflicts still open, to
    /// `replay/`: `mine/` holds their version, `deleted/` marks a file they
    /// deleted, `base/` holds the base they started from, and `conflicted/`
    /// marks a file that must stay a conflict until master matches it.
    private func saveEdits() throws {
        let fm = FileManager.default
        try? fm.removeItem(at: replayDirectory)
        try fm.createDirectory(at: replayDirectory, withIntermediateDirectories: true)
        func save(_ file: String, mine: Data?, conflicted: Bool) throws {
            if let mine { try write(mine, to: replayDirectory.appending(path: "mine/\(file)")) }
            else { try write(Data(), to: replayDirectory.appending(path: "deleted/\(file)")) }
            if let base = try baseContents(of: file) { try write(base, to: replayDirectory.appending(path: "base/\(file)")) }
            if conflicted { try write(Data(), to: replayDirectory.appending(path: "conflicted/\(file)")) }
        }
        let changed = try changedFiles()
        for file in changed { try save(file, mine: try contents(of: file), conflicted: false) }
        for file in conflicts where !changed.contains(file) {
            let kept = try? Data(contentsOf: conflictsDirectory.appending(path: file))
            try save(file, mine: kept, conflicted: true)
        }
    }

    /// Whether `data/` still holds every edit `replay/` saved. A conflict's
    /// saved copy came from `conflicts/`, not `data/`, so it is not compared.
    private func dataHoldsSavedEdits() -> Bool {
        let fm = FileManager.default
        let mine = replayDirectory.appending(path: "mine")
        let isConflict = { (file: String) in fm.fileExists(atPath: self.replayDirectory.appending(path: "conflicted/\(file)").path) }
        for file in relativeFiles(in: mine) where !isConflict(file) {
            if (try? Data(contentsOf: mine.appending(path: file))) != (try? contents(of: file)) { return false }
        }
        for file in relativeFiles(in: replayDirectory.appending(path: "deleted")) where !isConflict(file) {
            if (try? contents(of: file)) != nil { return false }
        }
        return true
    }

    /// Downloads `commit` and puts the contributor's edits back on top. An
    /// edit master already has (it was merged) is dropped. A file master also
    /// changed is a conflict: master's version stays in `data/`, the
    /// contributor's is kept aside until they choose with `keepMine` or
    /// `keepLatest`, and stays a conflict through later updates until master
    /// matches it. The edits are written to `replay/` before the download and
    /// removed once replayed, so a failed download leaves the workspace as it
    /// was and a failed replay leaves the edits on disk. Returns the conflicts.
    public func update(to commit: String) async throws -> [String] {
        let fm = FileManager.default
        try saveEdits()
        do {
            try await download(commit: commit)
        } catch {
            if dataHoldsSavedEdits() { try? fm.removeItem(at: replayDirectory) }
            throw error
        }
        try? fm.removeItem(at: conflictsDirectory)
        try? fm.removeItem(at: deletedConflictsDirectory)
        let files = relativeFiles(in: replayDirectory.appending(path: "mine")).union(relativeFiles(in: replayDirectory.appending(path: "deleted")))
        for file in files.sorted() {
            let mine = try? Data(contentsOf: replayDirectory.appending(path: "mine/\(file)"))
            let oldBase = try? Data(contentsOf: replayDirectory.appending(path: "base/\(file)"))
            let conflicted = fm.fileExists(atPath: replayDirectory.appending(path: "conflicted/\(file)").path)
            let newBase = try baseContents(of: file)
            if newBase == mine { continue }
            if !conflicted && newBase == oldBase {
                let target = dataDirectory.appending(path: file)
                if let mine { try write(mine, to: target) } else { try? fm.removeItem(at: target) }
            } else if let mine {
                try write(mine, to: conflictsDirectory.appending(path: file))
            } else {
                try write(Data(), to: deletedConflictsDirectory.appending(path: file))
            }
        }
        try? fm.removeItem(at: replayDirectory)
        return conflicts
    }

    /// The files set aside by the last update, waiting for a choice.
    public var conflicts: [String] {
        relativeFiles(in: conflictsDirectory).union(relativeFiles(in: deletedConflictsDirectory)).sorted()
    }

    /// The contributor's side of an open conflict.
    public enum ConflictCopy: Equatable, Sendable {
        /// their version of the file, set aside while master's sits in `data/`
        case kept(Data)
        /// they deleted the file
        case deleted
    }

    /// What the contributor had in `file`, which waits for them to choose
    /// between it and master's version, or nil if `file` has no open conflict.
    public func conflictCopy(of file: String) -> ConflictCopy? {
        if let kept = try? Data(contentsOf: conflictsDirectory.appending(path: file)) { return .kept(kept) }
        return FileManager.default.fileExists(atPath: deletedConflictsDirectory.appending(path: file).path) ? .deleted : nil
    }

    /// Resolves a conflict with the contributor's version.
    public func keepMine(_ file: String) throws {
        let fm = FileManager.default
        let kept = conflictsDirectory.appending(path: file)
        let target = dataDirectory.appending(path: file)
        if fm.fileExists(atPath: kept.path) {
            try fm.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? fm.removeItem(at: target)
            try fm.moveItem(at: kept, to: target)
        } else {
            try? fm.removeItem(at: target)
            try fm.removeItem(at: deletedConflictsDirectory.appending(path: file))
        }
    }

    /// Resolves a conflict with master's version.
    public func keepLatest(_ file: String) throws {
        let fm = FileManager.default
        let kept = conflictsDirectory.appending(path: file)
        try fm.removeItem(at: fm.fileExists(atPath: kept.path) ? kept : deletedConflictsDirectory.appending(path: file))
    }

    /// Puts a data file back as it was at the base commit.
    public func revert(_ file: String) throws {
        let target = dataDirectory.appending(path: file)
        try? FileManager.default.removeItem(at: target)
        if let base = try baseContents(of: file) { try base.write(to: target) }
    }
}
