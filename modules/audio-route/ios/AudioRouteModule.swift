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
final class VolumeSliderView: ExpoView {
	let volumeView = MPVolumeView(frame: .zero)

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		volumeView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
		addSubview(volumeView)
	}

	override func layoutSubviews() {
		super.layoutSubviews()
		volumeView.frame = bounds
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
