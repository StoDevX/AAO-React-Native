import SwiftUI

/// The shaders, from this module's own bundle: SwiftUI's `ShaderLibrary.default` reads the app's
/// main bundle, which a pod's Metal file does not compile into.
enum MeltShaders {
	static let library: ShaderLibrary = {
		if let url = Bundle.main.url(forResource: "SomethingSecret", withExtension: "bundle"),
			let bundle = Bundle(url: url)
		{
			return ShaderLibrary.bundle(bundle)
		}
		return ShaderLibrary.default
	}()
}

/// A snapshot of the app slumping away like glass over black, or, reversed, pouring back up.
struct MeltView: View {
	let snapshot: UIImage
	let duration: Double
	let reversed: Bool
	/// Called once the melt has run its whole duration, counted from its first frame.
	let onFinish: () -> Void

	/// When the first frame drew. Counting from the view's creation instead would skip whatever
	/// time the snapshot held up the main thread.
	@State private var start: Date?
	@Environment(\.accessibilityReduceMotion) private var reduceMotion

	var body: some View {
		TimelineView(.animation) { context in
			let elapsed = start.map { min(context.date.timeIntervalSince($0), duration) } ?? 0
			let time = reversed ? duration - elapsed : elapsed
			GeometryReader { geometry in
				let image = Image(uiImage: snapshot).resizable()
				if reduceMotion {
					// The same timing, with nothing moving: the app fades to black, or back.
					image.opacity(1 - time / duration)
				} else {
					image.layerEffect(
						MeltShaders.library.glassMelt(.float(time), .float2(geometry.size)),
						maxSampleOffset: CGSize(width: 32, height: geometry.size.height))
				}
			}
		}
		.background(Color.black)
		.ignoresSafeArea()
		.accessibilityHidden(true)
		.task {
			start = .now
			try? await Task.sleep(for: .seconds(duration))
			onFinish()
		}
	}
}
