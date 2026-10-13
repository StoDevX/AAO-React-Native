import AudioToolbox
import Foundation

/// Parses fragmented MP3 data and decodes with Apple's codec on the network queue.
/// The sink borrows samples only for the duration of its call.
final class MP3Decoder {
	typealias Sink = (UnsafePointer<Float>, Int) -> Void
	private let sink: Sink
	private let packet = UnsafeMutablePointer<AudioStreamPacketDescription>.allocate(capacity: 1)
	private let decoded = UnsafeMutablePointer<Float>.allocate(capacity: 4096 * 2)
	private var stream: AudioFileStreamID?
	private var converter: AudioConverterRef?
	private var channels: UInt32 = 0
	private var error: OSStatus = noErr
	private static let needMoreInput: OSStatus = 1

	init(_ sink: @escaping Sink) {
		self.sink = sink
		packet.initialize(to: AudioStreamPacketDescription())
		error = AudioFileStreamOpen(
			Unmanaged.passUnretained(self).toOpaque(),
			{ context, stream, property, _ in
				Unmanaged<MP3Decoder>.fromOpaque(context).takeUnretainedValue().readFormat(
					stream, property)
			},
			{ context, _, count, bytes, descriptions in
				guard let descriptions else { return }
				Unmanaged<MP3Decoder>.fromOpaque(context).takeUnretainedValue().decode(
					bytes, count, descriptions)
			}, kAudioFileMP3Type, &stream)
	}

	deinit {
		packet.deallocate()
		decoded.deallocate()
		if let stream { AudioFileStreamClose(stream) }
		if let converter { AudioConverterDispose(converter) }
	}

	func feed(_ data: Data) -> OSStatus {
		guard error == noErr, let stream else { return error }
		guard !data.isEmpty else { return noErr }
		let result = data.withUnsafeBytes { bytes in
			AudioFileStreamParseBytes(stream, UInt32(bytes.count), bytes.baseAddress!, [])
		}
		return result == noErr ? error : result
	}

	private func readFormat(_ stream: AudioFileStreamID, _ property: AudioFileStreamPropertyID) {
		guard property == kAudioFileStreamProperty_DataFormat, converter == nil else { return }
		var source = AudioStreamBasicDescription()
		var size = UInt32(MemoryLayout.size(ofValue: source))
		error = AudioFileStreamGetProperty(stream, property, &size, &source)
		guard error == noErr else { return }
		channels = source.mChannelsPerFrame
		var target = AudioStreamBasicDescription(
			mSampleRate: 48000, mFormatID: kAudioFormatLinearPCM,
			mFormatFlags: kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked, mBytesPerPacket: 8,
			mFramesPerPacket: 1, mBytesPerFrame: 8, mChannelsPerFrame: 2, mBitsPerChannel: 32,
			mReserved: 0)
		error = AudioConverterNew(&source, &target, &converter)
	}

	/// The converter borrows packet memory until FillComplexBuffer returns.
	private struct Input {
		let bytes: UnsafeRawPointer
		let descriptions: UnsafeMutablePointer<AudioStreamPacketDescription>
		let count: UInt32
		let channels: UInt32
		var index: UInt32 = 0
		let packet: UnsafeMutablePointer<AudioStreamPacketDescription>
	}

	private func decode(
		_ bytes: UnsafeRawPointer, _ count: UInt32,
		_ descriptions: UnsafeMutablePointer<AudioStreamPacketDescription>
	) {
		guard let converter, error == noErr else { return }
		var input = Input(
			bytes: bytes, descriptions: descriptions, count: count, channels: channels,
			packet: packet)
		withUnsafeMutablePointer(to: &input) { context in
			while true {
				var frames: UInt32 = 4096
				var output = AudioBufferList(
					mNumberBuffers: 1,
					mBuffers: AudioBuffer(
						mNumberChannels: 2,
						mDataByteSize: UInt32(4096 * 2 * MemoryLayout<Float>.size),
						mData: decoded))
				let result = AudioConverterFillComplexBuffer(
					converter,
					{ _, count, buffers, descriptions, context in
						guard let context else { return MP3Decoder.needMoreInput }
						let source = context.assumingMemoryBound(to: Input.self)
						guard source.pointee.index < source.pointee.count else {
							count.pointee = 0
							return MP3Decoder.needMoreInput
						}
						let packet = source.pointee.descriptions[
							Int(source.pointee.index)]
						source.pointee.index += 1
						buffers.pointee.mNumberBuffers = 1
						buffers.pointee.mBuffers = AudioBuffer(
							mNumberChannels: source.pointee.channels,
							mDataByteSize: packet.mDataByteSize,
							mData: UnsafeMutableRawPointer(
								mutating: source.pointee.bytes.advanced(
									by: Int(packet.mStartOffset))))
						source.pointee.packet.pointee = packet
						source.pointee.packet.pointee.mStartOffset = 0
						descriptions?.pointee = source.pointee.packet
						count.pointee = 1
						return noErr
					}, context, &frames, &output, nil)
				if frames > 0 { sink(UnsafePointer(decoded), Int(frames)) }
				if result == Self.needMoreInput { break }
				if result != noErr {
					error = result
					break
				}
				if frames == 0 { break }
			}
		}
	}
}
