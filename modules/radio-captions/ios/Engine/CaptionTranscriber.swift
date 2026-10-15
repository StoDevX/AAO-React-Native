import AVFoundation
import Speech

/// Turns speech audio into caption text on the device. Volatile updates are the analyzer's
/// current guess and are replaced; final updates are settled.
public final class CaptionTranscriber {
	private let locale: Locale
	private var transcriber: SpeechTranscriber?
	private var analyzer: SpeechAnalyzer?
	private var input: AsyncStream<AnalyzerInput>.Continuation?
	private var converter: AVAudioConverter?
	private var analyzerFormat: AVAudioFormat?
	private var expectedNextStart: Double?
	private static let contiguityTolerance = 0.02

	public init(locale: Locale) { self.locale = locale }

	/// Checks the locale, and downloads its model if it is not installed.
	public func prepare() async throws {
		guard let supported = await SpeechTranscriber.supportedLocale(equivalentTo: locale) else {
			throw CaptionError.unsupportedLocale
		}
		let transcriber = SpeechTranscriber(
			locale: supported,
			transcriptionOptions: [],
			reportingOptions: [.volatileResults],
			attributeOptions: [.audioTimeRange]
		)
		do {
			if let request = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
				try await request.downloadAndInstall()
			}
		} catch {
			throw CaptionError.assetsUnavailable
		}
		self.transcriber = transcriber
		analyzerFormat = await SpeechAnalyzer.bestAvailableAudioFormat(compatibleWith: [transcriber])
	}

	public func start() async throws -> AsyncThrowingStream<CaptionUpdate, Error> {
		guard let transcriber else { throw CaptionError.assetsUnavailable }
		let analyzer = SpeechAnalyzer(modules: [transcriber])
		self.analyzer = analyzer
		let (sequence, continuation) = AsyncStream.makeStream(of: AnalyzerInput.self)
		input = continuation
		do { try await analyzer.start(inputSequence: sequence) } catch {
			throw Self.map(error)
		}
		return AsyncThrowingStream { results in
			let task = Task {
				do {
					for try await result in transcriber.results {
						results.yield(CaptionUpdate(
							text: String(result.text.characters),
							isFinal: result.isFinal,
							startSeconds: result.range.start.seconds
						))
					}
					results.finish()
				} catch { results.finish(throwing: Self.map(error)) }
			}
			results.onTermination = { _ in task.cancel() }
		}
	}

	/// Feeds audio at `startSeconds` of stream time. Audio that continues the last buffer is
	/// fed without a time, so the analyzer places it itself. Audio after a gap, as after a song,
	/// is fed with its time, and the analyzer keeps the gap: on this machine a 3 s gap came back
	/// as the next phrase's final result starting 3 s after the first phrase ended. Giving every
	/// buffer a time instead fails the run with "Audio input timestamp overlaps or precedes prior
	/// audio input", because resampled buffers rarely end exactly where the next one starts.
	public func feed(_ buffer: AVAudioPCMBuffer, startSeconds: Double) {
		guard let converted = convert(buffer) else { return }
		let contiguous = expectedNextStart.map { abs(startSeconds - $0) < Self.contiguityTolerance } ?? false
		expectedNextStart = startSeconds + Double(buffer.frameLength) / buffer.format.sampleRate
		let time = contiguous ? nil : CMTime(seconds: startSeconds, preferredTimescale: 48_000)
		input?.yield(AnalyzerInput(buffer: converted, bufferStartTime: time))
	}

	public func finish() async {
		input?.finish()
		try? await analyzer?.finalizeAndFinishThroughEndOfInput()
	}

	/// Brings `buffer` to the format the analyzer wants. A converter is built for one input
	/// format, and a stream's rate or channel count can change when it reconnects, so the
	/// converter is rebuilt whenever the buffer's format differs from the one it was made for.
	private func convert(_ buffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
		guard let analyzerFormat, buffer.format != analyzerFormat else { return buffer }
		if converter == nil || converter?.inputFormat != buffer.format {
			converter = AVAudioConverter(from: buffer.format, to: analyzerFormat)
		}
		let ratio = analyzerFormat.sampleRate / buffer.format.sampleRate
		guard let converter,
			let output = AVAudioPCMBuffer(pcmFormat: analyzerFormat, frameCapacity: AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1)
		else { return nil }
		var supplied = false
		var error: NSError?
		converter.convert(to: output, error: &error) { _, status in
			if supplied { status.pointee = .noDataNow; return nil }
			supplied = true
			status.pointee = .haveData
			return buffer
		}
		return error == nil ? output : nil
	}

	private static func map(_ error: Error) -> CaptionError {
		if let speech = error as? SFSpeechError, speech.code == SFSpeechError.Code.insufficientResources {
			return .insufficientResources
		}
		return .failed(error.localizedDescription)
	}
}

public struct CaptionUpdate: Sendable, Equatable {
	public let text: String
	public let isFinal: Bool
	public let startSeconds: Double
}

public enum CaptionError: Error, Equatable {
	case unsupportedLocale, authorizationDenied, assetsUnavailable, insufficientResources
	case failed(String)
}
