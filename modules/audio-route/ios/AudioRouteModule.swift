import AVKit
import ExpoModulesCore
import MediaPlayer
import UIKit

public class AudioRouteModule: Module {
	public func definition() -> ModuleDefinition {
		Name("AudioRoute")

		View(VolumeSliderView.self) {
			Prop("tint") { (view: VolumeSliderView, color: UIColor?) in
				view.volumeView.tintColor = color
			}
		}

		View(AirPlayButtonView.self) {
			Prop("tint") { (view: AirPlayButtonView, color: UIColor?) in
				view.picker.tintColor = color
				view.picker.activeTintColor = color
			}
		}
	}
}

/// The system's volume slider, which sets the device's volume and follows the
/// hardware buttons. It is the system's own control, so it draws and behaves
/// as it does in Music.
///
/// Music draws no thumb, so none is drawn here. The thumb image is clear and
/// the size of a finger, not nothing, since a slider can be grabbed only where
/// its thumb is.
final class VolumeSliderView: ExpoView {
	let volumeView = CenteredVolumeView(frame: .zero)

	private static let thumbSize = CGSize(width: 28, height: 28)

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		let clearThumb = UIGraphicsImageRenderer(size: Self.thumbSize).image { _ in }
		volumeView.setVolumeThumbImage(clearThumb, for: .normal)
		volumeView.setVolumeThumbImage(clearThumb, for: .highlighted)
		addSubview(volumeView)
	}

	override func layoutSubviews() {
		super.layoutSubviews()
		volumeView.frame = bounds
	}
}

/// A volume view that keeps its slider vertically centred. It puts the slider
/// at the top of its frame, and moves it there again at times of its own
/// choosing: when it first lays out, when playback starts, when the audio route
/// changes. Centring after each layout it is known to do does not last, so the
/// slider's position is watched, and put back whenever it is moved.
final class CenteredVolumeView: MPVolumeView {
	private var watching: NSKeyValueObservation?

	override func layoutSubviews() {
		super.layoutSubviews()
		watchSlider()
		centreSlider()
	}

	private var slider: UISlider? {
		subviews.compactMap { $0 as? UISlider }.first
	}

	private func watchSlider() {
		guard watching == nil, let slider else { return }
		watching = slider.layer.observe(\.position, options: []) { [weak self] _, _ in
			self?.centreSlider()
		}
	}

	/// The system moves the slider with an animation, and resetting it inside
	/// that animation would animate the reset, so the slider would be seen to
	/// leave the middle and come back. The reset is made without animation, and
	/// the animation already under way is dropped.
	private func centreSlider() {
		guard let slider, abs(slider.center.y - bounds.midY) > 0.5 else { return }
		UIView.performWithoutAnimation {
			slider.center.y = bounds.midY
		}
		slider.layer.removeAllAnimations()
	}
}

/// The system's AirPlay route picker: a button that opens the list of places
/// the audio can play, and shows when one is in use.
final class AirPlayButtonView: ExpoView {
	let picker = AVRoutePickerView(frame: .zero)

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		picker.prioritizesVideoDevices = false
		picker.autoresizingMask = [.flexibleWidth, .flexibleHeight]
		addSubview(picker)
	}

	override func layoutSubviews() {
		super.layoutSubviews()
		picker.frame = bounds
	}
}
