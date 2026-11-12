import Foundation
import Testing
@testable import DataEditorKit

final class Counter: @unchecked Sendable {
    private let lock = NSLock()
    private var value = 0
    func next() -> Int { lock.withLock { value += 1; return value } }
}

struct DeviceFlowTests {
    @Test func pollsUntilTheCodeIsApproved() async throws {
        let polls = Counter()
        let waits = SleepLog()
        let (session, _) = StubProtocol.session { request in
            switch request.url!.path {
            case "/login/device/code":
                return (200, body(#"{"device_code":"dev","user_code":"ABCD-1234","verification_uri":"https://github.com/login/device","interval":5,"expires_in":900}"#))
            case "/login/oauth/access_token":
                switch polls.next() {
                case 1: return (200, body(#"{"error":"authorization_pending"}"#))
                case 2: return (200, body(#"{"error":"slow_down","interval":10}"#))
                default: return (200, body(#"{"access_token":"tok","token_type":"bearer"}"#))
                }
            default: return (404, Data())
            }
        }
        let flow = DeviceFlow(clientID: "client", session: session, sleep: waits.record)
        let code = try await flow.start()
        #expect(code.userCode == "ABCD-1234")
        #expect(try await flow.token(for: code) == "tok")
        #expect(waits.durations == [.seconds(5), .seconds(5), .seconds(10)])
    }

    @Test func stopsWhenTheCodeIsDenied() async throws {
        let (session, _) = StubProtocol.session { request in
            request.url!.path == "/login/device/code"
                ? (200, body(#"{"device_code":"dev","user_code":"A","verification_uri":"https://github.com/login/device","interval":1,"expires_in":900}"#))
                : (200, body(#"{"error":"access_denied"}"#))
        }
        let flow = DeviceFlow(clientID: "client", session: session, sleep: { _ in })
        let code = try await flow.start()
        await #expect(throws: DeviceFlow.Failure.denied) { _ = try await flow.token(for: code) }
    }

    @Test func stopsWhenTheCodeExpires() async throws {
        let (session, _) = StubProtocol.session { _ in (200, body(#"{"error":"expired_token"}"#)) }
        let flow = DeviceFlow(clientID: "client", session: session, sleep: { _ in })
        await #expect(throws: DeviceFlow.Failure.expired) { _ = try await flow.token(for: code) }
    }

    @Test func slowsDownByFiveSecondsWhenGitHubGivesNoInterval() async throws {
        let polls = Counter()
        let waits = SleepLog()
        let (session, _) = StubProtocol.session { _ in
            polls.next() == 1 ? (200, body(#"{"error":"slow_down"}"#)) : (200, body(#"{"access_token":"tok"}"#))
        }
        let flow = DeviceFlow(clientID: "client", session: session, sleep: waits.record)
        #expect(try await flow.token(for: code) == "tok")
        #expect(waits.durations == [.seconds(5), .seconds(10)])
    }

    @Test func stopsPollingOnceCancelled() async throws {
        let polls = Counter()
        let (session, _) = StubProtocol.session { _ in
            _ = polls.next()
            return (200, body(#"{"error":"authorization_pending"}"#))
        }
        // cancelled while it waits, as when the contributor closes the sign-in sheet;
        // the poll runs in a task of its own, so the test's task is not the one cancelled
        let flow = DeviceFlow(clientID: "client", session: session, sleep: { _ in withUnsafeCurrentTask { $0?.cancel() } })
        let polling = Task { try await flow.token(for: code) }
        await #expect(throws: CancellationError.self) { _ = try await polling.value }
        #expect(polls.next() == 1)
    }

    @Test func describesEachFailureForTheContributor() {
        #expect(DeviceFlow.Failure.unexpected("bad client").localizedDescription.contains("bad client"))
        #expect(DeviceFlow.Failure.denied.errorDescription != nil)
        #expect(DeviceFlow.Failure.expired.errorDescription != nil)
    }
}

/// A code GitHub handed out, polled every five seconds.
private let code = DeviceFlow.DeviceCode(deviceCode: "dev", userCode: "A", verificationURL: URL(string: "https://github.com/login/device")!, interval: 5)

final class SleepLog: @unchecked Sendable {
    private let lock = NSLock()
    private var recorded: [Duration] = []
    var durations: [Duration] { lock.withLock { recorded } }
    var record: @Sendable (Duration) async -> Void { { duration in self.lock.withLock { self.recorded.append(duration) } } }
}
