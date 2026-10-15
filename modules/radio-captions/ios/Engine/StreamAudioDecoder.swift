import AVFoundation

public struct DecodedAudio: @unchecked Sendable {
	public let buffer: AVAudioPCMBuffer
	/// Seconds of audio since the run started, by frame count.
	public let startSeconds: Double
}

/// Downloads a progressive MP3 or AAC stream and decodes it to PCM itself. AVFoundation exposes
/// no audio tracks for a streamed asset, so nothing can tap a player on the stream; reading the
/// bytes directly is the only way to the samples.
public final class StreamAudioDecoder {
	public enum Status: Sendable { case connecting, playing, failed(String) }

	private let url: URL
	private let lock = NSLock()
	private var current: Session?
	private let statusContinuation: AsyncStream<Status>.Continuation
	public let status: AsyncStream<Status>

	/// One download. `start()` makes a fresh one each time, so a stale callback can tell it no
	/// longer owns the decoder. Its fields are set once under the decoder's lock and used only
	/// after being taken from `current` under that lock.
	private final class Session {
		let continuation: AsyncStream<DecodedAudio>.Continuation
		let delegateQueue: OperationQueue
		let parser: StreamParser
		var urlSession: URLSession?

		init(continuation: AsyncStream<DecodedAudio>.Continuation, delegateQueue: OperationQueue, parser: StreamParser) {
			self.continuation = continuation
			self.delegateQueue = delegateQueue
			self.parser = parser
		}
	}

	public init(url: URL) {
		self.url = url
		var continuation: AsyncStream<Status>.Continuation!
		status = AsyncStream { continuation = $0 }
		statusContinuation = continuation
	}

	/// Starts a new run, ending any earlier one first.
	public func start() -> AsyncStream<DecodedAudio> {
		end(takeCurrent())
		return AsyncStream { continuation in
			// The queue is serial, so the parser's state is only ever touched one callback at a time.
			let delegateQueue = OperationQueue()
			delegateQueue.maxConcurrentOperationCount = 1
			let parser = StreamParser(continuation: continuation)
			let session = Session(continuation: continuation, delegateQueue: delegateQueue, parser: parser)
			parser.onFirstBuffer = { [weak self, weak session] in
				guard let self, let session, self.isCurrent(session) else { return }
				self.statusContinuation.yield(.playing)
			}
			let download = Download(parser: parser) { [weak self, weak session] message in
				self?.fail(session, message)
			}

			// An ephemeral configuration keeps a live stream out of the shared cache and cookie store.
			let urlSession = URLSession(configuration: .ephemeral, delegate: download, delegateQueue: delegateQueue)
			// No Icy-MetaData header is sent, so the server interleaves no metadata into the audio.
			let task = urlSession.dataTask(with: URLRequest(url: url))
			lock.withLock {
				session.urlSession = urlSession
				current = session
			}
			// A consumer that goes away ends only its own run.
			continuation.onTermination = { [weak self, weak session] _ in
				guard let self, let session else { return }
				self.lock.withLock { if self.current === session { self.current = nil } }
				self.end(session)
			}
			statusContinuation.yield(.connecting)
			task.resume()
		}
	}

	/// Ends the run and both streams. Safe to call from any thread, and more than once.
	public func stop() {
		end(takeCurrent())
		statusContinuation.finish()
	}

	private func takeCurrent() -> Session? {
		lock.withLock {
			defer { current = nil }
			return current
		}
	}

	private func isCurrent(_ session: Session) -> Bool {
		lock.withLock { current === session }
	}

	/// Finishes the run's audio stream and cancels its download. The parser is closed on the
	/// delegate queue, after any callback already running on it.
	private func end(_ session: Session?) {
		guard let session else { return }
		let urlSession = lock.withLock { session.urlSession }
		urlSession?.invalidateAndCancel()
		session.continuation.finish()
		session.delegateQueue.addOperation { session.parser.close() }
	}

	/// Reports a failure for a run that is still current, and ends that run.
	private func fail(_ session: Session?, _ message: String) {
		guard let session, isCurrent(session) else { return }
		statusContinuation.yield(.failed(message))
		lock.withLock { if current === session { current = nil } }
		end(session)
	}
}

/// Feeds the response's bytes to the parser and reports why the download ended. A stream that
/// ends is a failure like any other: a live station does not end, so the caller reconnects.
private final class Download: NSObject, URLSessionDataDelegate {
	private let parser: StreamParser
	private let fail: (String) -> Void

	init(parser: StreamParser, fail: @escaping (String) -> Void) {
		self.parser = parser
		self.fail = fail
	}

	func urlSession(
		_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
		completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
	) {
		if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
			fail("The server answered \(http.statusCode).")
			completionHandler(.cancel)
			return
		}
		if let message = parser.open(contentType: response.mimeType) {
			fail(message)
			completionHandler(.cancel)
			return
		}
		completionHandler(.allow)
	}

	func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
		if let message = parser.parse(data) { fail(message) }
	}

	func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
		fail(error?.localizedDescription ?? "The stream ended.")
	}
}

/// Turns downloaded bytes into PCM: `AudioFileStream` finds the packets and `AVAudioConverter`
/// decodes them. Not thread-safe: every method runs on the download's serial delegate queue.
private final class StreamParser {
	private let continuation: AsyncStream<DecodedAudio>.Continuation
	var onFirstBuffer: (() -> Void)?
	private var fileStream: AudioFileStreamID?
	private var converter: AVAudioConverter?
	private var inputFormat: AVAudioFormat?
	private var outputFormat: AVAudioFormat?
	private var framesDelivered: AVAudioFramePosition = 0
	private var failure: String?

	init(continuation: AsyncStream<DecodedAudio>.Continuation) {
		self.continuation = continuation
	}

	/// The parser sniffs the format itself when the content type is not one it knows.
	private func fileTypeHint(for contentType: String?) -> AudioFileTypeID {
		switch contentType?.lowercased() {
		case "audio/mpeg": return kAudioFileMP3Type
		case "audio/aac", "audio/aacp": return kAudioFileAAC_ADTSType
		default: return 0
		}
	}

	/// Returns a failure message, or nil once the parser is ready for bytes.
	func open(contentType: String?) -> String? {
		let context = Unmanaged.passRetained(self).toOpaque()
		let status = AudioFileStreamOpen(
			context,
			{ context, _, property, _ in
				Unmanaged<StreamParser>.fromOpaque(context).takeUnretainedValue().propertyChanged(property)
			},
			{ context, byteCount, packetCount, bytes, descriptions in
				Unmanaged<StreamParser>.fromOpaque(context).takeUnretainedValue()
					.receivePackets(byteCount: byteCount, packetCount: packetCount, bytes: bytes, descriptions: descriptions)
			},
			fileTypeHint(for: contentType),
			&fileStream
		)
		guard status == noErr else {
			Unmanaged<StreamParser>.fromOpaque(context).release()
			fileStream = nil
			return "The stream's audio format is not recognised."
		}
		return nil
	}

	/// Returns a failure message, or nil when the bytes parsed.
	func parse(_ data: Data) -> String? {
		guard let fileStream else { return nil }
		let status = data.withUnsafeBytes {
			AudioFileStreamParseBytes(fileStream, UInt32($0.count), $0.baseAddress, [])
		}
		if let failure { return failure }
		return status == noErr ? nil : "The stream could not be parsed (\(status))."
	}

	/// Closes the parser and drops the retain `open` made for its callbacks. Safe to call again.
	func close() {
		guard let stream = fileStream else { return }
		fileStream = nil
		AudioFileStreamClose(stream)
		Unmanaged.passUnretained(self).release()
	}

	private func propertyChanged(_ property: AudioFileStreamPropertyID) {
		guard property == kAudioFileStreamProperty_ReadyToProducePackets, let fileStream else { return }
		var description = AudioStreamBasicDescription()
		var size = UInt32(MemoryLayout<AudioStreamBasicDescription>.size)
		guard AudioFileStreamGetProperty(fileStream, kAudioFileStreamProperty_DataFormat, &size, &description) == noErr,
			let input = AVAudioFormat(streamDescription: &description),
			let output = AVAudioFormat(
				commonFormat: .pcmFormatFloat32, sampleRate: description.mSampleRate,
				channels: description.mChannelsPerFrame, interleaved: false),
			let converter = AVAudioConverter(from: input, to: output)
		else {
			failure = "The stream's audio format is not supported."
			return
		}
		inputFormat = input
		outputFormat = output
		self.converter = converter
	}

	private func receivePackets(
		byteCount: UInt32, packetCount: UInt32, bytes: UnsafeRawPointer,
		descriptions: UnsafeMutablePointer<AudioStreamPacketDescription>?
	) {
		guard failure == nil, packetCount > 0, let converter, let inputFormat, let outputFormat else { return }
		// A format without per-packet descriptions has no variable packets to split on.
		guard let descriptions else {
			failure = "The stream's packets are not described."
			return
		}
		let packets = UnsafeBufferPointer(start: descriptions, count: Int(packetCount))
		// The bytes can exceed the packets' sizes (ADTS headers sit between them), so the buffer is
		// sized to hold them all.
		let largestPacket = packets.map(\.mDataByteSize).max() ?? 0
		let averageBytesPerPacket = (byteCount + packetCount - 1) / packetCount
		let compressed = AVAudioCompressedBuffer(
			format: inputFormat, packetCapacity: packetCount,
			maximumPacketSize: Int(max(largestPacket, averageBytesPerPacket, 1)))
		memcpy(compressed.data, bytes, Int(byteCount))
		if let destination = compressed.packetDescriptions {
			destination.update(from: descriptions, count: Int(packetCount))
		}
		compressed.packetCount = packetCount
		compressed.byteLength = byteCount

		let framesPerPacket = max(inputFormat.streamDescription.pointee.mFramesPerPacket, 1)
		guard
			let decoded = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: packetCount * framesPerPacket)
		else { return }
		var supplied = false
		var conversionError: NSError?
		let result = converter.convert(to: decoded, error: &conversionError) { _, inputStatus in
			if supplied {
				inputStatus.pointee = .noDataNow
				return nil
			}
			supplied = true
			inputStatus.pointee = .haveData
			return compressed
		}
		if result == .error {
			failure = conversionError?.localizedDescription ?? "The stream could not be decoded."
			return
		}
		guard decoded.frameLength > 0 else { return }

		let startSeconds = Double(framesDelivered) / outputFormat.sampleRate
		framesDelivered += AVAudioFramePosition(decoded.frameLength)
		if startSeconds == 0 { onFirstBuffer?() }
		continuation.yield(DecodedAudio(buffer: decoded, startSeconds: startSeconds))
	}
}
