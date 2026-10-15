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
	private var player: AVPlayer?
	private var observation: NSKeyValueObservation?
	private var statusContinuation: AsyncStream<Status>.Continuation?
	public let status: AsyncStream<Status>

	public init(url: URL) {
		self.url = url
		var continuation: AsyncStream<Status>.Continuation!
		status = AsyncStream { continuation = $0 }
		statusContinuation = continuation
	}

	public func start() -> AsyncStream<TappedAudio> {
		AsyncStream { continuation in
			let context = TapContext(continuation: continuation)
			let item = AVPlayerItem(url: url)
			let player = AVPlayer(playerItem: item)
			player.isMuted = true
			// A tap on a live stream must not make the player wait for a deep buffer.
			player.automaticallyWaitsToMinimizeStalling = false
			self.player = player

			observation = item.observe(\.status) { [weak self] item, _ in
				guard let self else { return }
				switch item.status {
				case .readyToPlay:
					Task { await self.attachTap(to: item, context: context) }
				case .failed:
					self.statusContinuation?.yield(.failed(item.error?.localizedDescription ?? "The stream failed."))
					continuation.finish()
				default: break
				}
			}
			continuation.onTermination = { [weak self] _ in self?.stop() }
			player.play()
		}
	}

	public func stop() {
		player?.pause()
		player?.currentItem?.audioMix = nil
		observation = nil
		player = nil
	}

	@MainActor private func attachTap(to item: AVPlayerItem, context: TapContext) async {
		guard let track = try? await item.asset.loadTracks(withMediaType: .audio).first else {
			statusContinuation?.yield(.failed("The stream has no audio track the tap can read."))
			context.continuation.finish()
			return
		}
		var callbacks = MTAudioProcessingTapCallbacks(
			version: kMTAudioProcessingTapCallbacksVersion_0,
			clientInfo: Unmanaged.passRetained(context).toOpaque(),
			init: { _, clientInfo, storageOut in storageOut.pointee = clientInfo },
			finalize: { tap in Unmanaged<TapContext>.fromOpaque(MTAudioProcessingTapGetStorage(tap)).release() },
			prepare: { tap, _, format in
				let context = Unmanaged<TapContext>.fromOpaque(MTAudioProcessingTapGetStorage(tap)).takeUnretainedValue()
				context.format = AVAudioFormat(streamDescription: format)
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
			statusContinuation?.yield(.failed("Could not create the audio tap."))
			context.continuation.finish()
			return
		}
		let parameters = AVMutableAudioMixInputParameters(track: track)
		parameters.audioTapProcessor = tap
		let mix = AVMutableAudioMix()
		mix.inputParameters = [parameters]
		item.audioMix = mix
		statusContinuation?.yield(.playing)
	}
}

/// Safe to share across threads: `format` and `framesSeen` are written only on the audio render
/// thread (prepare, then process, which never overlap) and read nowhere else, and
/// `AsyncStream.Continuation` is itself thread-safe.
private final class TapContext: @unchecked Sendable {
	let continuation: AsyncStream<TappedAudio>.Continuation
	var format: AVAudioFormat?
	private var framesSeen: AVAudioFramePosition = 0

	init(continuation: AsyncStream<TappedAudio>.Continuation) { self.continuation = continuation }

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
