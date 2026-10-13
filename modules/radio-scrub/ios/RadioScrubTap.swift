import AVFoundation
import MediaToolbox

/// Both station transports expose the same scratch controls to Expo.
protocol RadioScrubbing: AnyObject {
	func detach()
	func beginScratch()
	func move(withRate rate: Double)
	func release(withRate rate: Double)
	func goLive()
	func status() -> [String: Any]
}

/// Owns the audio tap and its history for one AVPlayerItem.
final class RadioScrubTap: RadioScrubbing {
	private var state = ScrubTapState()
	private var tap: MTAudioProcessingTap?
	private var item: AVPlayerItem?
	private var previousMix: AVAudioMix?
	private var mix: AVAudioMix?

	func attach(to item: AVPlayerItem) -> Bool {
		detach()
		state = ScrubTapState()
		var format = AudioStreamBasicDescription(
			mSampleRate: 48000, mFormatID: kAudioFormatLinearPCM,
			mFormatFlags: kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked, mBytesPerPacket: 8,
			mFramesPerPacket: 1, mBytesPerFrame: 8, mChannelsPerFrame: 2, mBitsPerChannel: 32,
			mReserved: 0)
		var description: CMAudioFormatDescription?
		guard
			CMAudioFormatDescriptionCreate(
				allocator: kCFAllocatorDefault, asbd: &format,
				layoutSize: 0, layout: nil, magicCookieSize: 0, magicCookie: nil,
				extensions: nil,
				formatDescriptionOut: &description) == noErr, let description
		else { return false }
		var callbacks = MTAudioProcessingTapCallbacks(
			version: kMTAudioProcessingTapCallbacksVersion_0,
			clientInfo: Unmanaged.passUnretained(state).toOpaque(),
			init: { _, context, storage in
				// The tap retains its state until finalize, even after its owner detaches.
				let state = Unmanaged<ScrubTapState>.fromOpaque(context!)
					.takeUnretainedValue()
				storage.pointee = Unmanaged.passRetained(state).toOpaque()
			},
			finalize: { tap in
				Unmanaged<ScrubTapState>.fromOpaque(MTAudioProcessingTapGetStorage(tap))
					.release()
			},
			prepare: { tap, _, format in
				ScrubTapState.from(tap).prepare(format.pointee)
			},
			unprepare: { tap in
				ScrubTapState.from(tap).buffer.ready.store(
					false, ordering: .sequentiallyConsistent)
			},
			process: { tap, requested, _, buffers, frames, flags in
				guard
					MTAudioProcessingTapGetSourceAudio(
						tap, requested, buffers, flags, nil, frames) == noErr
				else {
					frames.pointee = 0
					return
				}
				ScrubTapState.from(tap).process(buffers, Int(frames.pointee))
			})
		let hls = (item.asset as? AVURLAsset)?.url.pathExtension.lowercased() == "m3u8"
		let audioTrack =
			hls ? nil : item.tracks.compactMap(\.assetTrack).first { $0.mediaType == .audio }
		var created: MTAudioProcessingTap?
		let result =
			audioTrack != nil
			? MTAudioProcessingTapCreate(
				kCFAllocatorDefault, &callbacks,
				kMTAudioProcessingTapCreationFlag_PostEffects, &created)
			: MTAudioProcessingTapCreateWithPreferredFormat(
				kCFAllocatorDefault, &callbacks,
				kMTAudioProcessingTapCreationFlag_PostEffects, description, &created)
		guard result == noErr, let created else { return false }
		tap = created
		let parameters = AVMutableAudioMixInputParameters(track: audioTrack)
		if let audioTrack { parameters.trackID = audioTrack.trackID }
		parameters.audioTapProcessor = tap
		let mix = AVMutableAudioMix()
		mix.inputParameters = [parameters]
		previousMix = item.audioMix
		self.mix = mix
		self.item = item
		item.audioMix = mix
		return true
	}

	func detach() {
		state.buffer.ready.store(false, ordering: .sequentiallyConsistent)
		if let item, item.audioMix === mix { item.audioMix = previousMix }
		item = nil
		mix = nil
		previousMix = nil
		tap = nil
	}

	func beginScratch() { state.buffer.begin() }
	func move(withRate rate: Double) { state.buffer.move(rate) }
	func release(withRate rate: Double) { state.buffer.release(rate) }
	func goLive() { state.buffer.goLive() }
	func status() -> [String: Any] {
		[
			"ready": state.buffer.ready.load(ordering: .sequentiallyConsistent),
			"bufferSeconds": state.buffer.availableSeconds.load(
				ordering: .sequentiallyConsistent),
			"delaySeconds": state.buffer.delaySeconds.load(ordering: .sequentiallyConsistent),
		]
	}
	deinit { detach() }
}

/// Prepare/process/unprepare are serialized by MediaToolbox. UI controls are atomic.
private final class ScrubTapState {
	let buffer = RecordBuffer()
	private var format = AudioStreamBasicDescription()
	private var supported = false
	private let input = UnsafeMutablePointer<Float>.allocate(capacity: RecordBuffer.maxChannels)
	private let output = UnsafeMutablePointer<Float>.allocate(capacity: RecordBuffer.maxChannels)

	init() {
		input.initialize(repeating: 0, count: RecordBuffer.maxChannels)
		output.initialize(repeating: 0, count: RecordBuffer.maxChannels)
	}
	deinit {
		input.deallocate()
		output.deallocate()
	}

	static func from(_ tap: MTAudioProcessingTap) -> ScrubTapState {
		Unmanaged<ScrubTapState>.fromOpaque(MTAudioProcessingTapGetStorage(tap)).takeUnretainedValue()
	}

	func prepare(_ format: AudioStreamBasicDescription) {
		self.format = format
		let floating = format.mFormatFlags & kAudioFormatFlagIsFloat != 0
		let signed = format.mFormatFlags & kAudioFormatFlagIsSignedInteger != 0
		supported =
			format.mFormatID == kAudioFormatLinearPCM
			&& format.mFormatFlags & kAudioFormatFlagIsBigEndian == 0
			&& (floating
				? [32, 64].contains(format.mBitsPerChannel)
				: signed && [16, 32].contains(format.mBitsPerChannel))
			&& format.mChannelsPerFrame > 0 && format.mChannelsPerFrame <= 2
			&& format.mSampleRate > 0 && format.mSampleRate <= 96000
		if supported {
			buffer.prepare(format.mSampleRate, Int(format.mChannelsPerFrame))
		} else {
			buffer.ready.store(false, ordering: .sequentiallyConsistent)
		}
	}

	func process(_ list: UnsafeMutablePointer<AudioBufferList>, _ frames: Int) {
		guard supported, buffer.ready.load(ordering: .sequentiallyConsistent) else { return }
		let channels = Int(format.mChannelsPerFrame)
		let planar = format.mFormatFlags & kAudioFormatFlagIsNonInterleaved != 0
		let buffers = UnsafeMutableAudioBufferListPointer(list)
		guard buffers.count >= (planar ? channels : 1) else { return }
		for index in buffers.indices { if buffers[index].mData == nil { return } }
		buffer.beginBlock()
		for frame in 0..<frames {
			for channel in 0..<channels {
				input[channel] = read(address(buffers, frame, channel))
			}
			buffer.processFrame(input, output)
			for channel in 0..<channels {
				write(address(buffers, frame, channel), output[channel])
			}
		}
		buffer.endBlock()
	}

	private func address(_ buffers: UnsafeMutableAudioBufferListPointer, _ frame: Int, _ channel: Int)
		-> UnsafeMutableRawPointer
	{
		let planar = format.mFormatFlags & kAudioFormatFlagIsNonInterleaved != 0
		let offset = planar ? frame : frame * Int(format.mChannelsPerFrame) + channel
		return buffers[planar ? channel : 0].mData!.advanced(
			by: offset * Int(format.mBitsPerChannel / 8))
	}

	private func read(_ address: UnsafeMutableRawPointer) -> Float {
		if format.mFormatFlags & kAudioFormatFlagIsFloat != 0 {
			return format.mBitsPerChannel == 32
				? address.load(as: Float.self) : Float(address.load(as: Double.self))
		}
		return format.mBitsPerChannel == 16
			? Float(address.load(as: Int16.self)) / 32768
			: Float(address.load(as: Int32.self)) / 2_147_483_648
	}

	private func write(_ address: UnsafeMutableRawPointer, _ value: Float) {
		if format.mFormatFlags & kAudioFormatFlagIsFloat != 0 {
			if format.mBitsPerChannel == 32 {
				address.storeBytes(of: value, as: Float.self)
			} else {
				address.storeBytes(of: Double(value), as: Double.self)
			}
		} else if format.mBitsPerChannel == 16 {
			address.storeBytes(of: Int16(min(1, max(-1, value)) * 32767), as: Int16.self)
		} else {
			address.storeBytes(
				of: Int32(min(1, max(-1, Double(value))) * 2_147_483_647), as: Int32.self)
		}
	}
}
