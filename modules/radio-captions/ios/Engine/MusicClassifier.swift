import AVFoundation
import SoundAnalysis

/// Scores how much of the audio sounds like speech and like music, with Apple's built-in
/// sound classifier, which needs no bundled model. Scores come once per 3 s window, 1.5 s
/// apart, and are reported synchronously inside `analyze` (and `finish`), on the calling thread.
public final class MusicClassifier: NSObject, SNResultsObserving {
	private let analyzer: SNAudioStreamAnalyzer
	private let onScores: (_ speech: Double, _ music: Double) -> Void

	public init(format: AVAudioFormat, onScores: @escaping (_ speech: Double, _ music: Double) -> Void) throws {
		analyzer = SNAudioStreamAnalyzer(format: format)
		self.onScores = onScores
		super.init()
		let request = try SNClassifySoundRequest(classifierIdentifier: .version1)
		request.overlapFactor = 0.5
		try analyzer.add(request, withObserver: self)
	}

	/// `framePosition` counts frames of this classifier's own audio, from 0.
	public func analyze(_ buffer: AVAudioPCMBuffer, framePosition: AVAudioFramePosition) {
		analyzer.analyze(buffer, atAudioFramePosition: framePosition)
	}

	/// Scores what is left of the audio, then reports no more.
	public func finish() {
		analyzer.completeAnalysis()
	}

	public func request(_ request: SNRequest, didProduce result: SNResult) {
		guard let result = result as? SNClassificationResult else { return }
		onScores(
			result.classification(forIdentifier: "speech")?.confidence ?? 0,
			result.classification(forIdentifier: "music")?.confidence ?? 0
		)
	}
}
