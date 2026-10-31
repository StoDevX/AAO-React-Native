import AVFoundation
import ExpoModulesCore
import os

public class TelephoneTonesModule: Module {
	private let player = TonePlayer()

	public func definition() -> ModuleDefinition {
		Name("TelephoneTones")

		Function("playKeyTone") { (key: String) in
			self.player.play(TonePattern.key(key))
		}

		Function("startRingback") {
			self.player.play(TonePattern.ringback)
		}

		Function("stopRingback") {
			self.player.stop()
		}

		AsyncFunction("playCallEnded") { (promise: Promise) in
			self.player.play(TonePattern.callEnded) {
				promise.resolve(nil)
			}
		}

		Function("stopTones") {
			self.player.stop()
		}
	}
}

/// A stretch of one tone: the frequencies sounding together, or none for silence.
struct ToneSegment {
	let frequencies: [Double]
	let seconds: Double
}

/// A sequence of segments, played once or round and round.
struct TonePattern {
	let segments: [ToneSegment]
	let loops: Bool

	/// DTMF: each key sounds its row's low tone with its column's high one.
	private static let rows: [Character: Double] = [
		"1": 697, "2": 697, "3": 697,
		"4": 770, "5": 770, "6": 770,
		"7": 852, "8": 852, "9": 852,
		"*": 941, "0": 941, "#": 941,
	]
	private static let columns: [Character: Double] = [
		"1": 1209, "4": 1209, "7": 1209, "*": 1209,
		"2": 1336, "5": 1336, "8": 1336, "0": 1336,
		"3": 1477, "6": 1477, "9": 1477, "#": 1477,
	]

	static func key(_ key: String) -> TonePattern {
		guard let digit = key.first, let low = rows[digit], let high = columns[digit] else {
			return TonePattern(segments: [], loops: false)
		}
		return TonePattern(segments: [ToneSegment(frequencies: [low, high], seconds: 0.15)], loops: false)
	}

	/// North American ringback: 440 and 480 Hz, two seconds on, four off.
	static let ringback = TonePattern(
		segments: [
			ToneSegment(frequencies: [440, 480], seconds: 2),
			ToneSegment(frequencies: [], seconds: 4),
		],
		loops: true
	)

	/// Three short beeps of the reorder tone's 480 and 620 Hz.
	static let callEnded = TonePattern(
		segments: (0..<3).flatMap { _ in
			[
				ToneSegment(frequencies: [480, 620], seconds: 0.25),
				ToneSegment(frequencies: [], seconds: 0.25),
			]
		},
		loops: false
	)
}

/// Plays one `TonePattern` at a time through an `AVAudioEngine`, generating the
/// samples as it goes. A new pattern replaces whatever is sounding.
final class TonePlayer {
	private let engine = AVAudioEngine()
	private var source: AVAudioSourceNode?
	private let sampleRate: Double = 44_100
	private let amplitude: Float = 0.2
	/// A few milliseconds of fade at each edge, so a tone starts and stops without a click.
	private let rampSeconds = 0.005

	/// Shared with the render thread, which holds the lock only to read and advance it.
	private var lock = os_unfair_lock()
	private var pattern = TonePattern(segments: [], loops: false)
	private var segmentIndex = 0
	private var sampleInSegment = 0
	private var phases: [Double] = []
	private var completion: (() -> Void)?

	func play(_ next: TonePattern, completion: (() -> Void)? = nil) {
		startEngineIfNeeded()
		os_unfair_lock_lock(&lock)
		let replaced = self.completion
		pattern = next
		segmentIndex = 0
		sampleInSegment = 0
		phases = []
		self.completion = completion
		os_unfair_lock_unlock(&lock)
		replaced?()
		if next.segments.isEmpty {
			finish()
		}
	}

	func stop() {
		play(TonePattern(segments: [], loops: false))
	}

	/// Ends the pattern and calls its completion, once, on the main queue.
	private func finish() {
		os_unfair_lock_lock(&lock)
		let done = completion
		completion = nil
		pattern = TonePattern(segments: [], loops: false)
		os_unfair_lock_unlock(&lock)
		if let done {
			DispatchQueue.main.async(execute: done)
		}
	}

	private func startEngineIfNeeded() {
		// The same session the radio plays in: speaker, sound with the silent switch on.
		try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
		try? AVAudioSession.sharedInstance().setActive(true)

		if source == nil {
			let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
			let node = AVAudioSourceNode(format: format) { [unowned self] _, _, frameCount, bufferList in
				self.render(frameCount: Int(frameCount), into: UnsafeMutableAudioBufferListPointer(bufferList))
				return noErr
			}
			engine.attach(node)
			engine.connect(node, to: engine.mainMixerNode, format: format)
			source = node
		}
		if !engine.isRunning {
			try? engine.start()
		}
	}

	private func render(frameCount: Int, into buffers: UnsafeMutableAudioBufferListPointer) {
		guard let samples = buffers.first?.mData?.assumingMemoryBound(to: Float.self) else {
			return
		}

		var ended = false
		os_unfair_lock_lock(&lock)
		for frame in 0..<frameCount {
			samples[frame] = nextSample(ended: &ended)
		}
		os_unfair_lock_unlock(&lock)

		if ended {
			finish()
		}
	}

	/// The next sample of the pattern, advancing through it; silence once it is done.
	private func nextSample(ended: inout Bool) -> Float {
		guard segmentIndex < pattern.segments.count else {
			return 0
		}

		let segment = pattern.segments[segmentIndex]
		let length = Int(segment.seconds * sampleRate)
		if phases.count != segment.frequencies.count {
			phases = Array(repeating: 0, count: segment.frequencies.count)
		}

		var value: Double = 0
		for (i, frequency) in segment.frequencies.enumerated() {
			value += sin(phases[i])
			phases[i] += 2 * .pi * frequency / sampleRate
			if phases[i] > 2 * .pi {
				phases[i] -= 2 * .pi
			}
		}

		let ramp = rampSeconds * sampleRate
		let edge = Double(min(sampleInSegment, length - sampleInSegment))
		let envelope = min(1, edge / ramp)

		sampleInSegment += 1
		if sampleInSegment >= length {
			sampleInSegment = 0
			phases = []
			segmentIndex += 1
			if segmentIndex >= pattern.segments.count {
				if pattern.loops {
					segmentIndex = 0
				} else {
					ended = true
				}
			}
		}

		return Float(value * envelope) * amplitude
	}
}
