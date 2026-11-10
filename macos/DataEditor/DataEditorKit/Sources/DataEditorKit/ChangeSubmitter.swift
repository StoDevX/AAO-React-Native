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
}

public enum SubmissionState: Sendable, Equatable { case open, changesRequested, merged, closed }

public enum SubmitError: LocalizedError, Equatable, Sendable {
    case signInRequired
    /// the fork cannot see the commit the data was downloaded at yet
    case missingBaseCommit
    case github(Int, String)

    public var errorDescription: String? {
        switch self {
        case .signInRequired: "Sign in to GitHub to submit your changes."
        case .missingBaseCommit: "Your fork on GitHub does not have the data's commit yet. Try again in a minute."
        case .github(let status, let message) where message.isEmpty: "GitHub answered with status \(status)."
        case .github(_, let message): message
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
