import Foundation
import Network

/// Serves the newest good build to the phone and to the local Worker, on
/// every address at `port`. `root` is read on every request, so a new build is
/// served from the moment the helper reports it. Each connection asks for one
/// file and is closed once it has it.
public final class BuildServer: @unchecked Sendable {
    public enum Failure: LocalizedError, Equatable {
        case portInUse(UInt16)
        public var errorDescription: String? {
            switch self { case .portInUse(let port): "Port \(port) is in use" }
        }
    }

    struct Response: Equatable {
        let status: Int
        let headers: [String: String]
        let file: URL?
    }

    /// The types of what `bundle-data` writes.
    private static let types = ["json": "application/json", "webp": "image/webp", "css": "text/css", "geojson": "application/geo+json"]
    private static let notFound = Response(status: 404, headers: ["Cache-Control": "no-store"], file: nil)

    private let port: UInt16
    private let root: @Sendable () -> URL?
    private let queue = DispatchQueue(label: "com.drewvolz.allaboutolaf-data-editor.build-server")
    private var listener: NWListener?

    public init(port: UInt16, root: @escaping @Sendable () -> URL?) {
        self.port = port
        self.root = root
    }

    /// What a request for `target` gets: a file under `root`, or a refusal.
    static func response(method: String, target: String, root: URL?) -> Response {
        guard method == "GET" || method == "HEAD" else { return Response(status: 405, headers: ["Allow": "GET, HEAD"], file: nil) }
        let encoded = String(target.prefix { $0 != "?" && $0 != "#" })
        guard let path = encoded.removingPercentEncoding else { return Response(status: 400, headers: [:], file: nil) }
        guard let root else { return notFound }
        let base = root.standardizedFileURL
        let file = base.appending(path: path).standardizedFileURL
        var isDirectory: ObjCBool = false
        guard file.path.hasPrefix(base.path + "/"),
              FileManager.default.fileExists(atPath: file.path, isDirectory: &isDirectory), !isDirectory.boolValue else { return notFound }
        let type = types[file.pathExtension] ?? "application/octet-stream"
        return Response(status: 200, headers: ["Content-Type": type, "Cache-Control": "no-store"], file: file)
    }

    /// Listens on `port`, and returns once it is listening.
    public func start() async throws {
        let parameters = NWParameters.tcp
        parameters.allowLocalEndpointReuse = false
        let listener = try NWListener(using: parameters, on: NWEndpoint.Port(rawValue: port)!)
        self.listener = listener
        listener.newConnectionHandler = { [weak self] connection in self?.serve(connection) }
        let port = port
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
            let started = Once(continuation)
            listener.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    started.resume(with: .success(()))
                case .failed(let error), .waiting(let error):
                    listener.cancel()
                    if case .posix(.EADDRINUSE) = error { started.resume(with: .failure(Failure.portInUse(port))) }
                    else { started.resume(with: .failure(error)) }
                default: break
                }
            }
            listener.start(queue: queue)
        }
    }

    public func stop() {
        listener?.cancel()
        listener = nil
    }

    /// Reads one request head, answers it and closes the connection.
    private func serve(_ connection: NWConnection) {
        connection.start(queue: queue)
        read(connection, after: Data())
    }

    /// Reads until the request head is whole, carrying what has come so far.
    private func read(_ connection: NWConnection, after head: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16_384) { [self] data, _, done, error in
            let head = head + (data ?? Data())
            if let end = head.range(of: Data("\r\n\r\n".utf8)) {
                answer(String(decoding: head[..<end.lowerBound], as: UTF8.self), on: connection)
            } else if done || error != nil || head.count > 65_536 {
                connection.cancel()
            } else {
                read(connection, after: head)
            }
        }
    }

    private func answer(_ head: String, on connection: NWConnection) {
        let words = head.split(separator: "\r\n", maxSplits: 1).first?.split(separator: " ") ?? []
        let method = words.count > 0 ? String(words[0]) : ""
        let target = words.count > 1 ? String(words[1]) : "/"
        let reply = Self.response(method: method, target: target, root: root())
        // the file is read whole: the largest bundle-data writes is a few hundred kilobytes
        let body = reply.file.flatMap { try? Data(contentsOf: $0) }
        if reply.file != nil && body == nil {
            send(Self.notFound, body: Data(), method: method, on: connection)
        } else {
            send(reply, body: body ?? Data(), method: method, on: connection)
        }
    }

    private func send(_ reply: Response, body: Data, method: String, on connection: NWConnection) {
        let reason = [200: "OK", 400: "Bad Request", 404: "Not Found", 405: "Method Not Allowed"][reply.status] ?? ""
        var headers = reply.headers
        headers["Content-Length"] = String(body.count)
        headers["Connection"] = "close"
        let lines = ["HTTP/1.1 \(reply.status) \(reason)"] + headers.sorted { $0.key < $1.key }.map { "\($0.key): \($0.value)" }
        var message = Data((lines.joined(separator: "\r\n") + "\r\n\r\n").utf8)
        if method != "HEAD" { message.append(body) }
        connection.send(content: message, completion: .contentProcessed { _ in connection.cancel() })
    }
}

/// Resumes a continuation the first time it is asked, from the listener's
/// queue, which reports a state after the one that settled the start.
private final class Once: @unchecked Sendable {
    private let lock = NSLock()
    private var continuation: CheckedContinuation<Void, any Error>?

    init(_ continuation: CheckedContinuation<Void, any Error>) { self.continuation = continuation }

    func resume(with result: Result<Void, any Error>) {
        let waiting = lock.withLock { () -> CheckedContinuation<Void, any Error>? in
            defer { continuation = nil }
            return continuation
        }
        waiting?.resume(with: result)
    }
}
