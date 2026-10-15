import AVFoundation

extension AVAudioPCMBuffer {
	/// Consecutive copies of at most `maxFrames` frames that together hold every frame once.
	/// A stream's first reads decode to buffers many seconds long, and the gate, the pre-roll
	/// and the transcriber's timeline can only act at a buffer's edges. Needs Float32 samples.
	func slices(maxFrames: AVAudioFrameCount) -> [AVAudioPCMBuffer] {
		guard frameLength > maxFrames, maxFrames > 0, let source = floatChannelData else { return [self] }
		var pieces: [AVAudioPCMBuffer] = []
		var start: AVAudioFrameCount = 0
		while start < frameLength {
			let count = min(maxFrames, frameLength - start)
			guard let piece = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: count),
				let destination = piece.floatChannelData
			else { return [self] }
			for channel in 0..<Int(format.channelCount) {
				destination[channel].update(from: source[channel].advanced(by: Int(start)), count: Int(count))
			}
			piece.frameLength = count
			pieces.append(piece)
			start += count
		}
		return pieces
	}
}
