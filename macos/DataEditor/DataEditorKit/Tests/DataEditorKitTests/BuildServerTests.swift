import Foundation
import Network
import Testing
@testable import DataEditorKit

/// A build folder with a JSON file, an image and a nested folder.
private func build() throws -> URL {
    let root = FileManager.default.temporaryDirectory.appending(path: "build \(UUID().uuidString)")
    try FileManager.default.createDirectory(at: root.appending(path: "hours"), withIntermediateDirectories: true)
    try Data(#"{"a":1}"#.utf8).write(to: root.appending(path: "hours/cage.json"))
    try Data("RIFF".utf8).write(to: root.appending(path: "cage.webp"))
    try Data("x".utf8).write(to: root.appending(path: "notes.txt"))
    try Data("secret".utf8).write(to: root.deletingLastPathComponent().appending(path: "outside-\(root.lastPathComponent)"))
    return root
}

struct BuildServerTests {
    @Test func servesAFileWithItsTypeAndNoCaching() throws {
        let root = try build()
        let reply = BuildServer.response(method: "GET", target: "/hours/cage.json", root: root)
        #expect(reply == .init(status: 200, headers: ["Content-Type": "application/json", "Cache-Control": "no-store"],
                               file: root.appending(path: "hours/cage.json")))
        #expect(BuildServer.response(method: "HEAD", target: "/cage.webp", root: root).headers["Content-Type"] == "image/webp")
        #expect(BuildServer.response(method: "GET", target: "/cage%2Ewebp?x=1", root: root).status == 200)
    }

    @Test func refusesAPathOutsideTheBuild() throws {
        let root = try build()
        for target in ["/../outside-\(root.lastPathComponent)", "/%2e%2e/outside-\(root.lastPathComponent)", "/hours/../../outside-\(root.lastPathComponent)"] {
            #expect(BuildServer.response(method: "GET", target: target, root: root) == .init(status: 404, headers: ["Cache-Control": "no-store"], file: nil), "\(target)")
        }
    }

    @Test func answersWhatItCannotServe() throws {
        let root = try build()
        let missing = BuildServer.Response(status: 404, headers: ["Cache-Control": "no-store"], file: nil)
        #expect(BuildServer.response(method: "GET", target: "/nope.json", root: root) == missing)
        #expect(BuildServer.response(method: "GET", target: "/hours", root: root) == missing)
        #expect(BuildServer.response(method: "GET", target: "/hours/cage.json", root: nil) == missing)
        #expect(BuildServer.response(method: "GET", target: "/%zz", root: root) == .init(status: 400, headers: [:], file: nil))
        #expect(BuildServer.response(method: "POST", target: "/hours/cage.json", root: root) == .init(status: 405, headers: ["Allow": "GET, HEAD"], file: nil))
        // as Node's server did, a file of another kind goes as bytes
        #expect(BuildServer.response(method: "GET", target: "/notes.txt", root: root).headers["Content-Type"] == "application/octet-stream")
    }

    @Test func servesOverTheNetwork() async throws {
        let root = try build()
        let server = BuildServer(port: 18790, root: { root })
        try await server.start()
        defer { server.stop() }
        let (data, response) = try await URLSession.shared.data(from: URL(string: "http://127.0.0.1:18790/hours/cage.json")!)
        let http = try #require(response as? HTTPURLResponse)
        #expect(http.statusCode == 200)
        #expect(http.value(forHTTPHeaderField: "Content-Length") == "7")
        #expect(data == Data(#"{"a":1}"#.utf8))
    }

    @Test func saysWhenItsPortIsTaken() async throws {
        let first = BuildServer(port: 18791, root: { nil })
        try await first.start()
        defer { first.stop() }
        let second = BuildServer(port: 18791, root: { nil })
        await #expect(throws: BuildServer.Failure.portInUse(18791)) { try await second.start() }
        #expect(BuildServer.Failure.portInUse(8790).localizedDescription == "Port 8790 is in use")
    }
}
