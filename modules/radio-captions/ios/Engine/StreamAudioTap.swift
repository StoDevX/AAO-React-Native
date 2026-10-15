import AVFoundation
import MediaToolbox

public struct TappedAudio: @unchecked Sendable {
	public let buffer: AVAudioPCMBuffer
	/// Seconds of audio since the tap started, by frame count.
	public let startSeconds: Double
}

/// Plays a stream muted and hands over its decoded audio. A second player on the same URL
/// leaves the app's own player, and its lock-screen entry, alone; AVPlayer handles HLS, MP3
/// and AAC alike.
public final class StreamAudioTap {
	public enum Status: Sendable { case buffering, playing, failed(String) }

	private let url: URL
	private let lock = NSLock()
	private var current: Session?
	private let statusContinuation: AsyncStream<Status>.Continuation
	public let status: AsyncStream<Status>

	/// One run of the player. `start()` makes a fresh one each time, so a stale callback can tell
	/// it no longer owns the tap. Its fields are set once under the tap's lock and used only after
	/// being taken from `current` under that lock.
	private final class Session {
		let player: AVPlayer
		let continuation: AsyncStream<TappedAudio>.Continuation
		var observation: NSKeyValueObservation?

		init(player: AVPlayer, continuation: AsyncStream<TappedAudio>.Continuation) {
			self.player = player
			self.continuation = continuation
		}
	}

	public init(url: URL) {
		self.url = url
		var continuation: AsyncStream<Status>.Continuation!
		status = AsyncStream { continuation = $0 }
		statusContinuation = continuation
	}

	/// Starts a new run, ending any earlier one first.
	public func start() -> AsyncStream<TappedAudio> {
		end(takeCurrent())
		return AsyncStream { continuation in
			let item = AVPlayerItem(url: url)
			let player = AVPlayer(playerItem: item)
			player.isMuted = true
			// A tap on a live stream must not make the player wait for a deep buffer.
			player.automaticallyWaitsToMinimizeStalling = false
			let session = Session(player: player, continuation: continuation)
			let context = TapContext(continuation: continuation) { [weak self, weak session] message in
				self?.fail(session, message)
			}

			lock.withLock { current = session }
			let observation = item.observe(\.status) { [weak self, weak session] item, _ in
				guard let self, let session else { return }
				switch item.status {
				case .readyToPlay:
					Task { await self.attachTap(to: item, context: context, session: session) }
				case .failed:
					self.fail(session, item.error?.localizedDescription ?? "The stream failed.")
				default: break
				}
			}
			lock.withLock { session.observation = observation }
			// A consumer that goes away ends only its own run.
			continuation.onTermination = { [weak self, weak session] _ in
				guard let self, let session else { return }
				self.lock.withLock { if self.current === session { self.current = nil } }
				self.end(session)
			}
			player.play()
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

	/// Finishes the run's audio stream and silences its player. The player and its audio mix belong
	/// to the main actor.
	private func end(_ session: Session?) {
		guard let session else { return }
		lock.withLock { session.observation = nil }
		session.continuation.finish()
		Task { @MainActor in
			session.player.pause()
			session.player.currentItem?.audioMix = nil
		}
	}

	/// Reports a failure for a run that is still current, and ends that run.
	private func fail(_ session: Session?, _ message: String) {
		guard let session, isCurrent(session) else { return }
		statusContinuation.yield(.failed(message))
		lock.withLock { if current === session { current = nil } }
		end(session)
	}

	@MainActor private func attachTap(to item: AVPlayerItem, context: TapContext, session: Session) async {
		guard let track = try? await item.asset.loadTracks(withMediaType: .audio).first else {
			fail(session, "The stream has no audio track the tap can read.")
			return
		}
		// The run may have ended while the tracks loaded.
		guard isCurrent(session) else { return }
		var callbacks = MTAudioProcessingTapCallbacks(
			version: kMTAudioProcessingTapCallbacksVersion_0,
			clientInfo: Unmanaged.passRetained(context).toOpaque(),
			init: { _, clientInfo, storageOut in storageOut.pointee = clientInfo },
			finalize: { tap in Unmanaged<TapContext>.fromOpaque(MTAudioProcessingTapGetStorage(tap)).release() },
			prepare: { tap, _, format in
				let context = Unmanaged<TapContext>.fromOpaque(MTAudioProcessingTapGetStorage(tap)).takeUnretainedValue()
				context.format = AVAudioFormat(streamDescription: format)
				if context.format == nil { context.fail("The stream's audio format is not supported.") }
			},
			unprepare: { _ in },
			process: { tap, frames, _, bufferList, framesOut, flagsOut in
				var timeRange = CMTimeRange()
				guard MTAudioProcessingTapGetSourceAudio(tap, frames, bufferList, flagsOut, &timeRange, framesOut) == noErr
				else { return }
				let context = Unmanaged<TapContext>.fromOpaque(MTAudioProcessingTapGetStorage(tap)).takeUnretainedValue()
				context.deliver(bufferList, frames: framesOut.pointee)
			}
		)
		var tap: MTAudioProcessingTap?
		// Before the player's effects, so muting the player does not silence the tap.
		guard MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PreEffects, &tap) == noErr,
			let tap
		else {
			// A tap that was never created never runs finalize, so the callbacks' retain is ours to drop.
			Unmanaged.passUnretained(context).release()
			fail(session, "Could not create the audio tap.")
			return
		}
		let parameters = AVMutableAudioMixInputParameters(track: track)
		parameters.audioTapProcessor = tap
		let mix = AVMutableAudioMix()
		mix.inputParameters = [parameters]
		item.audioMix = mix
		statusContinuation.yield(.playing)
	}
}

/// Safe to share across threads: `format` and `framesSeen` are written only on the audio render
/// thread (prepare, then process, which never overlap) and read nowhere else, and
/// `AsyncStream.Continuation` is itself thread-safe.
private final class TapContext: @unchecked Sendable {
	let continuation: AsyncStream<TappedAudio>.Continuation
	let fail: @Sendable (String) -> Void
	var format: AVAudioFormat?
	private var framesSeen: AVAudioFramePosition = 0

	init(continuation: AsyncStream<TappedAudio>.Continuation, fail: @escaping @Sendable (String) -> Void) {
		self.continuation = continuation
		self.fail = fail
	}

	func deliver(_ bufferList: UnsafeMutablePointer<AudioBufferList>, frames: CMItemCount) {
		guard let format, frames > 0,
			let copy = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frames))
		else { return }
		copy.frameLength = AVAudioFrameCount(frames)
		let source = UnsafeMutableAudioBufferListPointer(bufferList)
		let destination = UnsafeMutableAudioBufferListPointer(copy.mutableAudioBufferList)
		for (from, to) in zip(source, destination) {
			guard let fromData = from.mData, let toData = to.mData else { continue }
			memcpy(toData, fromData, Int(min(from.mDataByteSize, to.mDataByteSize)))
		}
		continuation.yield(TappedAudio(buffer: copy, startSeconds: Double(framesSeen) / format.sampleRate))
		framesSeen += AVAudioFramePosition(frames)
	}
}
