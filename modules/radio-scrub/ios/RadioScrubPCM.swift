import AVFoundation
import Foundation

/// Streams MP3 on a serial delegate queue; the engine consumes only decoded PCM.
/// The module serializes control calls. decoderLock protects delegate/teardown races.
final class RadioScrubPCM: NSObject, RadioScrubbing, URLSessionDataDelegate {
	let visualization = AudioVisualization()
	private var visualizationTapInstalled = false
	private var pcm: PCMBuffer?
	private var engine: AVAudioEngine?
	private var source: AVAudioSourceNode?
	private var effects: RadioEffects?
	private var player: AVPlayer?
	private var wasMuted = false
	private var session: URLSession?
	private var task: URLSessionDataTask?
	private var streamURL: URL?
	private var playingRequested = false
	private var decoder: MP3Decoder?
	private let decoderLock = NSLock()

	func attach(to url: URL, player: AVPlayer) -> Bool {
		let pcm = PCMBuffer()
		self.pcm = pcm
		self.player = player
		wasMuted = player.isMuted
		player.isMuted = true
		streamURL = url
		let engine = AVAudioEngine()
		let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!
		let source = AVAudioSourceNode(format: format) { _, _, frames, output in
			pcm.render(Int(frames), output)
			return noErr
		}
		let effects = RadioEffects()
		do { try effects.connect(engine, source: source, format: format) } catch {
			NSLog("RadioScrub audio graph: %@", String(describing: error))
			detach()
			return false
		}
		self.engine = engine
		self.source = source
		self.effects = effects
		let samples = visualization.samples
		do {
			try engine.mainMixerNode.installAudioTap(onBus: 0, bufferSize: 4800, format: nil) {
				buffer, _ in
				let rate = buffer.format.sampleRate
				if rate != samples.sampleRate.load(ordering: .relaxed) {
					samples.prepare(rate)
				}
				guard samples.beginBlock(Int(buffer.frameLength)) else { return }
				let channels = Int(buffer.format.channelCount)
				guard channels > 0 else {
					samples.endBlock()
					return
				}
				guard case .float(let left) = buffer.channelData(0),
					case .float(let right) = buffer.channelData(channels - 1)
				else {
					samples.endBlock()
					return
				}
				let stride = buffer.stride
				for i in 0..<Int(buffer.frameLength) {
					samples.append(left[i * stride], right[i * stride])
				}
				samples.endBlock()
			}
			visualizationTapInstalled = true
		} catch {
			NSLog("RadioScrub visualization: %@", String(describing: error))
		}
		let queue = OperationQueue()
		queue.maxConcurrentOperationCount = 1
		let session = URLSession(configuration: .ephemeral, delegate: self, delegateQueue: queue)
		self.session = session

		return true
	}

	func setPitch(_ percent: Double) { pcm?.record.setPitch(percent) }
	func setQuartzLocked(_ locked: Bool) { pcm?.record.setQuartzLocked(locked) }
	func setEffect(_ effect: String, enabled: Bool, amount: Double) {
		effects?.setEffect(effect, enabled: enabled, amount: amount)
	}
	func setEffectParameter(_ effect: String, parameter: String, value: Double) {
		effects?.setParameter(effect, parameter: parameter, value: value)
	}

	func setPlaying(_ playing: Bool) {
		guard let engine else { return }
		if !playing {
			guard playingRequested else { return }
			playingRequested = false
			engine.pause()
			stopDecoding()
			pcm?.requestLiveReset()
			return
		}
		player?.isMuted = true
		if !playingRequested, let session, let streamURL, let pcm {
			playingRequested = true
			decoderLock.withLock {
				decoder = MP3Decoder { pcm.enqueue($0, $1) }
				let task = session.dataTask(with: streamURL)
				self.task = task
				task.resume()
			}
		}
		if !engine.isRunning {
			do { try engine.start() } catch {
				NSLog("RadioScrub renderer: %@", String(describing: error))
				playingRequested = false
				stopDecoding()
				pcm?.requestLiveReset()
			}
		}
	}

	/// Shares the delegate's lock so a cancelled task cannot feed a new decoder.
	private func stopDecoding() {
		decoderLock.withLock {
			task?.cancel()
			task = nil
			decoder = nil
		}
	}

	func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
		decoderLock.withLock {
			guard dataTask === task, let decoder else { return }
			let result = decoder.feed(data)
			if result != noErr { NSLog("RadioScrub MP3 decode: %d", result) }
		}
	}

	func detach() {
		playingRequested = false
		stopDecoding()
		session?.invalidateAndCancel()
		session = nil
		streamURL = nil
		effects?.cancelRamps()
		if visualizationTapInstalled { engine?.mainMixerNode.removeTap(onBus: 0) }
		visualizationTapInstalled = false
		engine?.stop()
		engine = nil
		source = nil
		effects = nil
		player?.isMuted = wasMuted
		player = nil
		pcm?.record.ready.store(false, ordering: .sequentiallyConsistent)
	}

	func beginScratch() { pcm?.record.begin() }
	func move(withRate rate: Double) { pcm?.record.move(rate) }
	func release(withRate rate: Double) { pcm?.record.release(rate) }
	func goLive() { pcm?.record.goLive() }

	func status() -> [String: Any] {
		guard let pcm else { return ["ready": false, "bufferSeconds": 0, "delaySeconds": 0] }
		let record = pcm.record
		let available = record.availableSeconds.load(ordering: .sequentiallyConsistent)
		return [
			"ready": playingRequested && record.ready.load(ordering: .sequentiallyConsistent)
				&& pcm.rendering.load(ordering: .relaxed) && available > 0,
			"bufferSeconds": available,
			"delaySeconds": record.delaySeconds.load(ordering: .sequentiallyConsistent),
			"controlsAvailable": true,
			"customRoomsAvailable": effects?.customRoomsAvailable ?? false,
			"pitch": record.pitch.load(ordering: .sequentiallyConsistent),
			"quartzLocked": record.quartzLocked.load(ordering: .sequentiallyConsistent),
			"bufferLimit": ["none", "live", "oldest"][
				record.bufferLimit.load(ordering: .sequentiallyConsistent)],
			"effects": effects?.status ?? [:],
		]
	}

	deinit { detach() }
}
