import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI

/// The sheet's colours in one appearance. Light Mode is warm newsprint with near-black ink;
/// Dark Mode is dark grey paper with pale ink.
struct PaperPalette {
	let paper: Color
	let ink: Color
	let rule: Color
	let columnRule: Color
	let special: Color
	let edgeNear: Color
	let edgeFar: Color
	let shadow: Color
	let crease: Color
	let creaseLight: Color
	let placeholder: Color

	init(_ scheme: ColorScheme) {
		if scheme == .dark {
			paper = Color(red: 0.173, green: 0.169, blue: 0.161)
			ink = Color(red: 0.914, green: 0.902, blue: 0.875)
			rule = Color(red: 0.741, green: 0.722, blue: 0.678)
			columnRule = Color(red: 0.29, green: 0.282, blue: 0.267)
			special = Color(red: 1.0, green: 0.42, blue: 0.369)
			edgeNear = Color(red: 0.22, green: 0.216, blue: 0.204)
			edgeFar = Color(red: 0.267, green: 0.259, blue: 0.243)
			shadow = .black.opacity(0.6)
			crease = .black.opacity(0.35)
			creaseLight = .white.opacity(0.06)
			placeholder = Color(red: 0.22, green: 0.216, blue: 0.204)
		} else {
			paper = Color(red: 0.945, green: 0.925, blue: 0.878)
			ink = Color(red: 0.086, green: 0.075, blue: 0.059)
			rule = Color(red: 0.086, green: 0.075, blue: 0.059)
			columnRule = Color(red: 0.788, green: 0.757, blue: 0.69)
			special = Color(red: 0.753, green: 0.224, blue: 0.169)
			edgeNear = Color(red: 0.867, green: 0.839, blue: 0.769)
			edgeFar = Color(red: 0.784, green: 0.753, blue: 0.686)
			shadow = .black.opacity(0.25)
			crease = .black.opacity(0.12)
			creaseLight = .white.opacity(0.5)
			placeholder = Color(red: 0.878, green: 0.855, blue: 0.8)
		}
	}
}

/// Noise images made once and tiled over every sheet: fine speckle for the pulp, streaks for its
/// fibres, and a finer grain for photos. Made from Core Image's random generator rather than
/// shipped as files, so the module carries no assets.
enum Textures {
	private static let context = CIContext(options: [.useSoftwareRenderer: false])
	private static let side: CGFloat = 256

	private static func noise(stretchX: CGFloat, alpha: CGFloat, seed: CGFloat) -> CGImage? {
		let random = CIFilter.randomGenerator().outputImage?
			.transformed(by: CGAffineTransform(translationX: seed * 97, y: seed * 53))
			.transformed(by: CGAffineTransform(scaleX: stretchX, y: 1))
		let grey = CIFilter.colorMatrix()
		grey.inputImage = random
		// Every channel takes the red noise; alpha is a faint constant.
		grey.rVector = CIVector(x: 1, y: 0, z: 0, w: 0)
		grey.gVector = CIVector(x: 1, y: 0, z: 0, w: 0)
		grey.bVector = CIVector(x: 1, y: 0, z: 0, w: 0)
		grey.aVector = CIVector(x: 0, y: 0, z: 0, w: 0)
		grey.biasVector = CIVector(x: 0, y: 0, z: 0, w: alpha)
		guard let output = grey.outputImage else { return nil }
		return context.createCGImage(output, from: CGRect(x: 0, y: 0, width: side, height: side))
	}

	static let pulp = noise(stretchX: 1, alpha: 0.18, seed: 1)
	static let fibres = noise(stretchX: 9, alpha: 0.10, seed: 2)
	static let grain = noise(stretchX: 1, alpha: 0.55, seed: 3)
}

/// A tiled noise image, or nothing when Core Image could not make one.
struct TextureLayer: View {
	let image: CGImage?

	var body: some View {
		if let image {
			Image(decorative: image, scale: 2)
				.resizable(resizingMode: .tile)
		}
	}
}

/// The sheet itself: paper, pulp, fibres, and a fold 70% of the way down.
struct PaperBackground: View {
	let palette: PaperPalette
	let scheme: ColorScheme

	var body: some View {
		ZStack {
			palette.paper
			TextureLayer(image: Textures.pulp)
				.blendMode(scheme == .dark ? .softLight : .multiply)
			TextureLayer(image: Textures.fibres)
				.blendMode(scheme == .dark ? .softLight : .multiply)
			GeometryReader { proxy in
				let y = proxy.size.height * 0.7
				Rectangle()
					.fill(LinearGradient(
						colors: [.clear, palette.crease, palette.creaseLight, .clear],
						startPoint: .top, endPoint: .bottom))
					.frame(height: 6)
					.offset(y: y - 3)
				Rectangle()
					.fill(palette.crease)
					.frame(height: 1)
					.offset(y: y)
			}
		}
	}
}

/// Two sheets showing behind the top one, down and to the right, with a soft shadow.
struct SheetEdges: View {
	let palette: PaperPalette

	var body: some View {
		ZStack {
			Rectangle().fill(palette.edgeFar).offset(x: 4, y: 4)
			Rectangle().fill(palette.edgeNear).offset(x: 2, y: 2)
		}
		.shadow(color: palette.shadow, radius: 4, x: 3, y: 3)
	}
}
