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

/// The window's snapshot, melting over black.
struct MeltView: View {
	let snapshot: UIImage
	let duration: Double

	@State private var start = Date.now

	var body: some View {
		TimelineView(.animation) { context in
			let time = min(context.date.timeIntervalSince(start), duration)
			GeometryReader { geometry in
				Image(uiImage: snapshot)
					.resizable()
					.colorEffect(MeltShaders.library.heat(.float(time)))
					.distortionEffect(
						MeltShaders.library.melt(.float(time), .float2(geometry.size)),
						maxSampleOffset: CGSize(width: 0, height: geometry.size.height))
			}
		}
		.background(Color.black)
		.ignoresSafeArea()
		.accessibilityHidden(true)
	}
}
