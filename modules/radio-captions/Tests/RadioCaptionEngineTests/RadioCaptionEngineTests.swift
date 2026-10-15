import Foundation
import Network
import XCTest
@testable import RadioCaptionEngine

/// These run the whole engine: the real decoder, classifier, gate and speech model, on real
/// `say` speech served from a file or a local socket. A machine without the en-US speech model
/// skips them, naming the model.
final class RadioCaptionEngineTests: XCTestCase {
	private let sentence = "Good evening, and welcome back to the show. Tonight we will talk about the weather, the campus news, and the game on Saturday. "
	private let shortRetry = Backoff(first: .milliseconds(200), longest: .milliseconds(400))

	private func makeEngine(url: URL, stallTimeout: Duration = .seconds(10)) -> RadioCaptionEngine {
		RadioCaptionEngine(url: url, locale: Locale(identifier: "en-US"), stallTimeout: stallTimeout, backoff: shortRetry)
	}

	/// Starts `engine` and collects its events until `done` accepts one, or `timeout` passes;
	/// then stops it and returns everything up to the end of the event stream.
	private func collect(
		_ engine: RadioCaptionEngine, timeout: Double, until done: @escaping ([EngineEvent]) -> Bool
	) async throws -> [EngineEvent] {
		let stream = engine.events()
		let starting = Task { await engine.start() }
		let deadline = Task {
			try? await Task.sleep(for: .seconds(timeout))
			engine.stop()
		}
		var events: [EngineEvent] = []
		for await event in stream {
			events.append(event)
			if case .state(.unavailable(let reason)) = event, reason.contains("one-time download") {
				engine.stop()
				throw XCTSkip("the en-US speech model is not installed on this machine")
			}
			if done(events) { engine.stop() }
		}
		deadline.cancel()
		await starting.value
		return events
	}

	private func states(_ events: [EngineEvent]) -> [EngineState] {
		events.compactMap { if case .state(let state) = $0 { state } else { nil } }
	}

	private func captions(_ events: [EngineEvent]) -> [CaptionUpdate] {
		events.compactMap { if case .caption(let update) = $0 { update } else { nil } }
	}

	func testEventStreamFinishesAfterStop() async throws {
		let engine = makeEngine(url: URL(string: "http://127.0.0.1:1/stream")!)
		let events = try await collect(engine, timeout: 30) { _ in true }
		XCTAssertEqual(states(events).first, .downloading)
	}

	func testAnUnreachableStreamReconnectsInsteadOfFailing() async throws {
		let engine = makeEngine(url: URL(string: "http://127.0.0.1:1/stream")!)
		let events = try await collect(engine, timeout: 30) { self.states($0).contains(.reconnecting) }
		XCTAssertEqual(states(events), [.downloading, .reconnecting])
	}

	func testStoppingWhileDownloadingEndsCleanly() async throws {
		let engine = makeEngine(url: URL(string: "http://127.0.0.1:1/stream")!)
		let stream = engine.events()
		let starting = Task { await engine.start() }
		var seen: [EngineEvent] = []
		for await event in stream {
			seen.append(event)
			engine.stop()
		}
		await starting.value
		// start() returns once stopped, and nothing it was still doing reached the stream.
		XCTAssertEqual(seen, [.state(.downloading)])
		for await event in engine.events() { XCTFail("unexpected event after stop: \(event)") }
	}

	func testCaptionsSpeechFromAStreamAndKeepsCaptioningAcrossAReconnect() async throws {
		let speech = try SpeechFixture.aacFile(saying: String(repeating: sentence, count: 4))
		let engine = makeEngine(url: speech.url)
		// The file ends, which the decoder reports as a lost stream, so the engine reads it again.
		// A second pass only captions if its times continue where the first ended.
		let events = try await collect(engine, timeout: 90) { events in
			self.states(events).filter { $0 == .reconnecting }.count >= 2
				&& self.captions(events).contains { $0.isFinal && $0.startSeconds > speech.seconds }
		}
		let allStates = states(events)
		XCTAssertFalse(allStates.contains { if case .unavailable = $0 { true } else { false } }, "states: \(allStates)")
		XCTAssertEqual(Array(allStates.prefix(3)), [.downloading, .music, .captioning])
		XCTAssertTrue(allStates.contains(.reconnecting))
		let text = captions(events).filter(\.isFinal).map(\.text).joined(separator: " ").lowercased()
		XCTAssertTrue(text.contains("weather") || text.contains("welcome"), "got: \(text)")
		let secondPass = captions(events).filter { $0.isFinal && $0.startSeconds > speech.seconds }
		XCTAssertFalse(secondPass.isEmpty, "no caption after the reconnect; states: \(allStates)")
	}

	func testAStreamThatGoesSilentIsReadAgain() async throws {
		let speech = try SpeechFixture.aacFile(saying: sentence)
		let data = try Data(contentsOf: speech.url)
		let server = try StallingServer(sending: data.prefix(data.count / 2))
		defer { server.stop() }
		let engine = makeEngine(url: server.url, stallTimeout: .seconds(1))
		let events = try await collect(engine, timeout: 60) { _ in server.connections >= 2 }
		// The server never closes a connection, so only the silence can have ended the first.
		XCTAssertGreaterThanOrEqual(server.connections, 2)
		XCTAssertTrue(states(events).contains(.reconnecting), "states: \(states(events))")
	}
}

/// A local HTTP server that sends `body` as an AAC stream and then holds each connection
/// open and quiet, as a stream does when its source stops.
private final class StallingServer {
	private final class Held {
		let lock = NSLock()
		var accepted = 0
		var open: [NWConnection] = []
	}

	private let listener: NWListener
	private let held = Held()
	let url: URL

	var connections: Int { held.lock.withLock { held.accepted } }

	init(sending body: Data) throws {
		let queue = DispatchQueue(label: "stalling-server")
		let held = held
		listener = try NWListener(using: .tcp, on: .any)
		let ready = DispatchSemaphore(value: 0)
		listener.stateUpdateHandler = { if case .ready = $0 { ready.signal() } }
		listener.newConnectionHandler = { connection in
			held.lock.withLock {
				held.accepted += 1
				held.open.append(connection)
			}
			connection.start(queue: queue)
			connection.receive(minimumIncompleteLength: 1, maximumLength: 4096) { _, _, _, _ in
				var response = Data("HTTP/1.1 200 OK\r\nContent-Type: audio/aac\r\nConnection: keep-alive\r\n\r\n".utf8)
				response.append(body)
				connection.send(content: response, completion: .contentProcessed { _ in })
			}
		}
		listener.start(queue: queue)
		guard ready.wait(timeout: .now() + 5) == .success, let port = listener.port else {
			throw CocoaError(.fileReadUnknown)
		}
		url = URL(string: "http://127.0.0.1:\(port.rawValue)/stream")!
	}

	func stop() {
		listener.cancel()
		held.lock.withLock { held.open.forEach { $0.cancel() } }
	}
}
