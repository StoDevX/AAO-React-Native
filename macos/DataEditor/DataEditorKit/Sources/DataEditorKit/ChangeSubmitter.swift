import Foundation

/// One changed file, at its path in the repo; nil contents means it was removed.
public struct Change: Hashable, Sendable {
    public let path: String
    public let contents: Data?
    public init(path: String, contents: Data?) {
        self.path = path
        self.contents = contents
    }
}

/// A pull request the app opened.
public struct Submission: Codable, Hashable, Sendable {
    public let number: Int
    public let url: URL
    /// the account whose fork holds the branch
    public let owner: String
    public let branch: String
    /// the commit the pull request was first submitted from
    public let base: String
    /// every path the pull request has touched, so an update can put back one no longer changed
    public let paths: [String]

    public init(number: Int, url: URL, owner: String, branch: String, base: String, paths: [String]) {
        self.number = number
        self.url = url
        self.owner = owner
        self.branch = branch
        self.base = base
        self.paths = paths
    }
}

public enum SubmissionState: String, Codable, Sendable, Equatable { case open, changesRequested, merged, closed }

public enum SubmitError: LocalizedError, Equatable, Sendable {
    case signInRequired
    /// the fork cannot see the commit the data was downloaded at yet
    case missingBaseCommit
    case github(Int, String)

    /// Whether GitHub says what was asked for no longer exists. Only 404 and
    /// 410 say so: a 403 on a public read is nearly always the rate limit, for
    /// something that is still there.
    public var isGone: Bool {
        if case .github(let status, _) = self { status == 404 || status == 410 } else { false }
    }

    /// Whether GitHub refused for sending too many requests, which a wait
    /// fixes. GitHub answers 403 or 429 and says so in the message, in
    /// both its primary and its secondary limit.
    public var isRateLimited: Bool {
        guard case .github(let status, let message) = self, status == 403 || status == 429 else { return false }
        return message.localizedCaseInsensitiveContains("rate limit")
    }

    public var errorDescription: String? {
        if isRateLimited { return "GitHub is limiting requests right now. Try again in a few minutes." }
        switch self {
        case .signInRequired: return "Sign in to GitHub to submit your changes."
        case .missingBaseCommit: return "GitHub is still setting up your copy of the data. Try again in a minute."
        case .github(let status, let message) where message.isEmpty: return "GitHub answered with status \(status)."
        case .github(_, let message): return message
        }
    }
}

/// Sends changes for review. GitHub today; a service that needs no account could take its place.
public protocol ChangeSubmitter: Sendable {
    func submit(changes: [Change], base: String, summary: String, appVersion: String) async throws -> Submission
    /// Makes the pull request hold `changes` and nothing else: a path it touched
    /// before that is not in `changes` goes back to the base. Returns the
    /// submission with the paths it now touches.
    func update(_ submission: Submission, changes: [Change], summary: String) async throws -> Submission
    func state(of submission: Submission) async throws -> SubmissionState
}
