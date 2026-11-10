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
}

public enum SubmissionState: Sendable, Equatable { case open, changesRequested, merged, closed }

public enum SubmitError: Error, Equatable, Sendable {
    case signInRequired
    /// the fork cannot see the commit the data was downloaded at yet
    case missingBaseCommit
    case github(Int, String)
}

/// Sends changes for review. GitHub today; a service that needs no account could take its place.
public protocol ChangeSubmitter: Sendable {
    func submit(changes: [Change], base: String, summary: String, appVersion: String) async throws -> Submission
    func update(_ submission: Submission, changes: [Change], summary: String) async throws
    func state(of submission: Submission) async throws -> SubmissionState
}
