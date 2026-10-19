import AVFoundation

/// The most recent audio, held back while the gate is closed. The classifier takes about a
/// second to call a window speech, so this gives the analyzer the words spoken before it did.
public struct PreRollBuffer {
	public struct Chunk {
		public let buffer: AVAudioPCMBuffer
		public let startSeconds: Double
	}

	private var chunks: [Chunk] = []
	private let maxSeconds: Double

	public init(maxSeconds: Double) { self.maxSeconds = maxSeconds }

	public mutating func append(_ buffer: AVAudioPCMBuffer, startSeconds: Double) {
		chunks.append(Chunk(buffer: buffer, startSeconds: startSeconds))
		while duration > maxSeconds, chunks.count > 1 { chunks.removeFirst() }
	}

	public mutating func drain() -> [Chunk] {
		defer { chunks.removeAll() }
		return chunks
	}

	private var duration: Double {
		chunks.reduce(0) { $0 + Double($1.buffer.frameLength) / $1.buffer.format.sampleRate }
	}
}
