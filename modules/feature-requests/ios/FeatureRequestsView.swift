import ExpoModulesCore
import SwiftUI

/// The feature request board, for JavaScript to show.
///
/// The board is KickstartSignal's, a Swift package linked into the app target
/// alone, and a pod cannot import it, so AppDelegate fills in this hook (see
/// plugins/with-kickstart-sdk.ts). `onBack` is what the board's Back button
/// calls. The hook is written once in `didFinishLaunchingWithOptions`, before
/// JavaScript loads, and only read after that.
public enum FeatureRequests {
	nonisolated(unsafe) public static var makeBoard: (@MainActor (_ onBack: @escaping () -> Void) -> AnyView)?
}

final class FeatureRequestsProps: ExpoSwiftUI.ViewProps {
	var onBack = EventDispatcher()
}

/// The SwiftUI face of the module: what `@expo/ui`'s `Host` mounts as a child.
struct FeatureRequestsView: ExpoSwiftUI.View {
	@ObservedObject var props: FeatureRequestsProps

	init(props: FeatureRequestsProps) {
		self.props = props
	}

	var body: some View {
		if let makeBoard = FeatureRequests.makeBoard {
			makeBoard { props.onBack() }
		}
	}
}
