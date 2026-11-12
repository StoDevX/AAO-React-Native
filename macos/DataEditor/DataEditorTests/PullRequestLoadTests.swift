import Foundation
import Testing
@testable import DataEditor

@MainActor
struct PullRequestLoadTests {
    private let when = Date(timeIntervalSince1970: 1_800_000_000)

    @Test func showsNothingWhileGitHubAnswersOrHasAnswered() {
        #expect(PullRequestLoadLine.make(load: nil, hasDiffs: true, checked: when) == .none)
        #expect(PullRequestLoadLine.make(load: .loading, hasDiffs: true, checked: when) == .none)
    }

    @Test func waitsWithNothingToShow() {
        #expect(PullRequestLoadLine.make(load: .loading, hasDiffs: false, checked: nil) == .loading)
    }

    /// Offline, the diffs kept stand, dated so nobody takes them for GitHub's latest.
    @Test func keepsTheSavedDiffsWhenGitHubCantBeReached() {
        #expect(PullRequestLoadLine.make(load: .failed, hasDiffs: true, checked: when) == .lastChecked(when))
        // never fetched: what was sent at submission
        #expect(PullRequestLoadLine.make(load: .failed, hasDiffs: true, checked: nil) == .lastChecked(nil))
    }

    @Test func offersTryAgainWithNothingSaved() {
        #expect(PullRequestLoadLine.make(load: .failed, hasDiffs: false, checked: nil) == .tryAgain)
    }

    @Test func saysWhenThePullRequestIsGone() {
        #expect(PullRequestLoadLine.make(load: .gone, hasDiffs: true, checked: when) == .gone)
    }
}
