import AVFoundation
import ExpoAudio
import ExpoModulesCore
import UIKit

/// Shares Expo Audio's existing player; the native tap owns all sample processing.
public class RadioScrubModule: Module {
	private let lock = NSRecursiveLock()
	private var player: AVPlayer?
	private var observation: NSKeyValueObservation?
	private var tracksObservation: NSKeyValueObservation?
	private var tap: RadioScrubbing?
	private var token = ""
	private var orientationObserver: NSObjectProtocol?
	private var lastDeckSide = "left"

	public func definition() -> ModuleDefinition {
		Name("RadioScrub")
		Function("supportsVisualization") { true }
		View(RadioVisualizerView.self) {
			Prop("attachment") { (view: RadioVisualizerView, attachment: String) in
				view.provider = { [weak self] in
					guard let self else { return nil }
					return self.lock.withLock { self.token == attachment ? self.tap?.visualization : nil }
				}
			}
			Prop("active") { (view: RadioVisualizerView, active: Bool) in view.active = active }
			Prop("mode") { (view: RadioVisualizerView, mode: String) in view.mode = mode }
			Prop("tint") { (view: RadioVisualizerView, color: UIColor?) in view.signalColor = color ?? .white }
			OnViewDidUpdateProps { (view: RadioVisualizerView) in view.updateActivity() }
		}

		Events("onDeckSideChanged")
		OnStartObserving("onDeckSideChanged") {
			DispatchQueue.main.async { self.startOrientationObservation() }
		}
		OnStopObserving("onDeckSideChanged") {
			DispatchQueue.main.async { self.stopOrientationObservation() }
		}
		AsyncFunction("getDeckSide") { () -> String in self.currentDeckSide() }.runOnQueue(.main)

		View(ScrubSliderView.self) {
			Events("onValueChange")
			Prop("value") { (view: ScrubSliderView, value: Float) in
				view.requestedValue = value
				view.applyValue()
			}
			Prop("minimum") { (view: ScrubSliderView, value: Float) in
				view.slider.minimumValue = value
				view.applyValue()
			}
			Prop("maximum") { (view: ScrubSliderView, value: Float) in
				view.slider.maximumValue = value
				view.applyValue()
			}
			Prop("disabled") { (view: ScrubSliderView, value: Bool) in
				view.slider.isEnabled = !value
			}
			Prop("label") { (view: ScrubSliderView, value: String) in
				view.slider.accessibilityLabel = value
			}
			Prop("unit") { (view: ScrubSliderView, value: String) in
				view.unit = value
				view.updateSpokenValue()
			}
			Prop("signed") { (view: ScrubSliderView, value: Bool) in
				view.signed = value
				view.updateSpokenValue()
			}
			Prop("tint") { (view: ScrubSliderView, value: UIColor?) in
				view.slider.minimumTrackTintColor = value
			}
		}

		Function("attach") { (audio: AudioPlayer, streamURL: String, stationId: String) -> String in
			self.lock.withLock {
				self.detach()
				self.player = audio.ref
				self.token = UUID().uuidString
				if stationId == "krlx", let url = URL(string: streamURL),
					url.scheme == "https"
				{
					let pcm = RadioScrubPCM()
					if pcm.attach(to: url, player: audio.ref) { self.tap = pcm }
					return self.token
				}
				self.observation = audio.ref.observe(
					\.currentItem, options: [.initial, .new]
				) { [weak self] player, _ in
					guard let self else { return }
					self.lock.withLock {
						self.tracksObservation?.invalidate()
						self.tracksObservation = nil
						self.tap?.detach()
						self.tap = nil
						if let item = player.currentItem {
							self.tracksObservation = item.observe(
								\.tracks, options: [.initial, .new]
							) { [weak self] item, _ in
								guard let self else { return }
								self.lock.withLock {
									self.tap?.detach()
									let tap = RadioScrubTap()
									self.tap =
										tap.attach(to: item)
										? tap : nil
								}
							}
						}
					}
				}
				return self.token
			}
		}

		Function("detach") { (token: String) in
			self.lock.withLock {
				if self.token == token { self.detach() }
			}
		}

		Function("beginScratch") { () -> Void in self.lock.withLock { self.tap?.beginScratch() } }
		Function("move") { (rate: Double) -> Void in
			self.lock.withLock { self.tap?.move(withRate: rate) }
		}
		Function("release") { (rate: Double) -> Void in
			self.lock.withLock { self.tap?.release(withRate: rate) }
		}
		Function("goLive") { () -> Void in self.lock.withLock { self.tap?.goLive() } }
		Function("setPitch") { (percent: Double) -> Void in
			self.lock.withLock { (self.tap as? RadioScrubPCM)?.setPitch(percent) }
		}
		Function("setQuartzLocked") { (locked: Bool) -> Void in
			self.lock.withLock { (self.tap as? RadioScrubPCM)?.setQuartzLocked(locked) }
		}
		Function("setEffectParameter") { (effect: String, parameter: String, value: Double) -> Void in
			self.lock.withLock {
				(self.tap as? RadioScrubPCM)?.setEffectParameter(
					effect, parameter: parameter, value: value)
			}
		}
		Function("setEffect") { (effect: String, enabled: Bool, amount: Double) -> Void in
			self.lock.withLock {
				(self.tap as? RadioScrubPCM)?.setEffect(
					effect, enabled: enabled, amount: amount)
			}
		}
		Function("status") { () -> [String: Any] in
			self.lock.withLock {
				var status: [String: Any] = [
					"ready": false, "bufferSeconds": 0, "delaySeconds": 0,
					"controlsAvailable": false, "customRoomsAvailable": false, "pitch": 0,
					"quartzLocked": true, "bufferLimit": "none",
					"effects": [
						"echo": [
							"enabled": false, "amount": 0.0, "delayMs": 250.0,
							"feedback": 25.0, "resonance": 0.0, "preset": 1,
							"lowCut": 0.0, "highCut": 0.0, "occupancy": 0.0,
						],
						"reverb": [
							"enabled": false, "amount": 0.0, "delayMs": 250.0,
							"feedback": 25.0, "resonance": 0.0, "preset": 1,
							"lowCut": 0.0, "highCut": 0.0, "occupancy": 0.0,
						],
						"filter": [
							"enabled": false, "amount": 0.0, "delayMs": 250.0,
							"feedback": 25.0, "resonance": 0.0, "preset": 1,
							"lowCut": 0.0, "highCut": 0.0, "occupancy": 0.0,
						],
					],
				]
				if let current = self.tap?.status() {
					status.merge(current) { _, new in new }
				}
				return status
			}
		}
		Function("setPlaying") { (playing: Bool) -> Void in
			self.lock.withLock { (self.tap as? RadioScrubPCM)?.setPlaying(playing) }
		}
		OnDestroy {
			self.lock.withLock { self.detach() }
			DispatchQueue.main.async { self.stopOrientationObservation() }
		}
	}

	/// Device orientation names the physical top; interface orientation uses the opposite convention.
	private func currentDeckSide() -> String {
		switch UIDevice.current.orientation {
		case .landscapeLeft: return "left"
		case .landscapeRight: return "right"
		default:
			switch SceneGeometry.windowScene()?.effectiveGeometry.interfaceOrientation {
			case .landscapeRight: return "left"
			case .landscapeLeft: return "right"
			default: return lastDeckSide
			}
		}
	}

	private func startOrientationObservation() {
		guard orientationObserver == nil else { return }
		UIDevice.current.beginGeneratingDeviceOrientationNotifications()
		orientationObserver = NotificationCenter.default.addObserver(
			forName: UIDevice.orientationDidChangeNotification, object: nil, queue: .main
		) { [weak self] _ in
			guard let self else { return }
			let side = self.currentDeckSide()
			guard side != self.lastDeckSide else { return }
			self.lastDeckSide = side
			self.sendEvent("onDeckSideChanged", ["side": side])
		}
		lastDeckSide = currentDeckSide()
		sendEvent("onDeckSideChanged", ["side": lastDeckSide])
	}

	private func stopOrientationObservation() {
		guard let observer = orientationObserver else { return }
		NotificationCenter.default.removeObserver(observer)
		orientationObserver = nil
		UIDevice.current.endGeneratingDeviceOrientationNotifications()
	}

	private func detach() {
		observation?.invalidate()
		observation = nil
		tracksObservation?.invalidate()
		tracksObservation = nil
		tap?.detach()
		tap = nil
		player = nil
		token = ""
	}
}

/// UIKit owns continuous touch tracking and VoiceOver's adjustable interaction.
final class ScrubSliderView: ExpoView {
	let slider = UISlider()
	let onValueChange = EventDispatcher()
	var unit = "percent"
	var signed = false
	var requestedValue: Float = 0

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		addSubview(slider)
		slider.addTarget(self, action: #selector(changed), for: .valueChanged)
		slider.addTarget(
			self, action: #selector(ended), for: [.touchUpInside, .touchUpOutside, .touchCancel])
	}

	override func layoutSubviews() {
		super.layoutSubviews()
		slider.frame = bounds
	}

	/// Retain updates received during tracking, and reapply after bounds changes too.
	func applyValue() {
		guard !slider.isTracking else { return }
		slider.setValue(requestedValue, animated: signed && window != nil)
		updateSpokenValue()
	}

	@objc private func ended() {
		// UIKit finishes tracking after dispatching the touch-up action.
		DispatchQueue.main.async { [weak self] in self?.applyValue() }
	}

	func updateSpokenValue() {
		slider.accessibilityValue =
			signed
			? String(format: "%+.2f percent", slider.value)
			: String(format: "%.0f %@", slider.value, unit)
	}

	@objc private func changed() {
		requestedValue = slider.value
		updateSpokenValue()
		onValueChange(["value": slider.value])
	}
}
