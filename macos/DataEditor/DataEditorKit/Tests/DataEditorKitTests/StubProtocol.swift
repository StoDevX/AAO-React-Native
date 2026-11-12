import Foundation

/// Answers a session's requests from a closure, and records them. Each session
/// gets its own stub, found by a header, so suites can run in parallel.
final class StubProtocol: URLProtocol, @unchecked Sendable {
    final class Stub: @unchecked Sendable {
        let respond: @Sendable (URLRequest) -> (Int, Data)
        private let lock = NSLock()
        private var recorded: [URLRequest] = []
        init(respond: @escaping @Sendable (URLRequest) -> (Int, Data)) { self.respond = respond }
        var requests: [URLRequest] { lock.withLock { recorded } }
        func record(_ request: URLRequest) { lock.withLock { recorded.append(request) } }
    }

    private static let lock = NSLock()
    nonisolated(unsafe) private static var stubs: [String: Stub] = [:]
    private static let header = "X-Stub-ID"

    static func session(_ respond: @escaping @Sendable (URLRequest) -> (Int, Data)) -> (URLSession, Stub) {
        let id = UUID().uuidString
        let stub = Stub(respond: respond)
        lock.withLock { stubs[id] = stub }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubProtocol.self]
        configuration.httpAdditionalHeaders = [header: id]
        return (URLSession(configuration: configuration), stub)
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}

    override func startLoading() {
        var request = self.request
        if request.httpBody == nil, let stream = request.httpBodyStream {
            request.httpBody = Data(reading: stream)
        }
        let id = request.value(forHTTPHeaderField: Self.header) ?? ""
        guard let stub = Self.lock.withLock({ Self.stubs[id] }) else {
            client?.urlProtocol(self, didFailWithError: URLError(.cannotConnectToHost))
            return
        }
        stub.record(request)
        let (status, body) = stub.respond(request)
        if status < 0 {
            client?.urlProtocol(self, didFailWithError: URLError(.notConnectedToInternet))
            return
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }
}

extension Data {
    init(reading stream: InputStream) {
        self.init()
        stream.open()
        defer { stream.close() }
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let count = stream.read(&buffer, maxLength: buffer.count)
            if count <= 0 { break }
            append(buffer, count: count)
        }
    }
}

/// A JSON body for a stub's answer.
func body(_ json: String) -> Data { Data(json.utf8) }
