import Foundation
import Testing
@testable import DataEditorKit

private final class Counter: @unchecked Sendable {
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
}

final class SleepLog: @unchecked Sendable {
    private let lock = NSLock()
    private var recorded: [Duration] = []
    var durations: [Duration] { lock.withLock { recorded } }
    var record: @Sendable (Duration) async -> Void { { duration in self.lock.withLock { self.recorded.append(duration) } } }
}
