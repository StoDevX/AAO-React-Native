import SwiftUI

/// Sizes and colors of the slab. The greys are fixed rather than system colors: stone does not
/// change with dark mode, and these read against both backgrounds.
enum Slab {
	/// The space under the notice, blank until tapped. Fixed so the scroll view never jumps.
	static let spaceHeight: CGFloat = 180
	static let width: CGFloat = 220
	static let height: CGFloat = 150
	/// How much shows by the end of the edge stage.
	static let edgeHeight: CGFloat = 40
	static let face = LinearGradient(
		colors: [Color(white: 0.6), Color(white: 0.42)], startPoint: .top, endPoint: .bottom)
	static let carved = Color(white: 0.26)
	static let carvedHighlight = Color(white: 0.72)
	static let crack = Color(white: 0.16)
	static let dirt = Color(red: 0.38, green: 0.29, blue: 0.21)
	static let chip = Color(white: 0.5)

	/// How much of the slab shows above the ground.
	static func shown(_ stage: SlabStage, _ fraction: Double) -> CGFloat {
		switch stage {
		case .blank, .tremor: 0
		case .edge: edgeHeight * fraction
		case .risen: edgeHeight + (height - edgeHeight) * fraction
		case .cracking, .open: height
		}
	}

	static func inscriptionOpacity(_ stage: SlabStage, _ fraction: Double) -> Double {
		switch stage {
		case .blank, .tremor, .edge: 0
		case .risen: fraction
		case .cracking, .open: 1
		}
	}

	static func crackLength(_ stage: SlabStage, _ fraction: Double) -> Double {
		switch stage {
		case .cracking: fraction
		case .open: 1
		default: 0
		}
	}
}

/// The slab, sunk into the ground by however much has not risen, and split in two once open.
struct SlabDrawing: View {
	let stage: SlabStage
	let fraction: Double
	let inscription: String
	let reduceMotion: Bool

	private var isOpen: Bool { stage == .open }

	var body: some View {
		let shown = Slab.shown(stage, fraction)
		HStack(spacing: 0) {
			half(alignment: .leading)
				.offset(x: isOpen && !reduceMotion ? -Slab.width * 0.65 : 0)
			half(alignment: .trailing)
				.offset(x: isOpen && !reduceMotion ? Slab.width * 0.65 : 0)
		}
		.opacity(isOpen && reduceMotion ? 0 : 1)
		.frame(width: Slab.width, height: Slab.height)
		// Pushed below the ground line by whatever has not risen; the clip below hides it.
		.offset(y: Slab.height - shown)
		.animation(reduceMotion ? .easeInOut(duration: 0.4) : .spring(duration: 0.9), value: isOpen)
		.animation(.easeOut(duration: 0.15), value: shown)
		.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
		.overlay(alignment: .bottom) {
			if shown > 0 && shown < Slab.height {
				Ground()
			}
		}
		.clipped()
	}

	/// One side of the slab: the whole face, cut down the middle.
	private func half(alignment: Alignment) -> some View {
		face
			.frame(width: Slab.width / 2, alignment: alignment)
			.clipped()
	}

	private var face: some View {
		ZStack {
			UnevenRoundedRectangle(topLeadingRadius: 70, topTrailingRadius: 70)
				.fill(Slab.face)
			Text(inscription)
				.font(.system(size: 13, weight: .heavy, design: .serif))
				.multilineTextAlignment(.center)
				.minimumScaleFactor(0.5)
				.foregroundStyle(Slab.carved)
				// A light edge under each letter reads as cut into the stone.
				.shadow(color: Slab.carvedHighlight, radius: 0, x: 0, y: 1)
				.padding(.horizontal, 20)
				.padding(.top, 30)
				.opacity(Slab.inscriptionOpacity(stage, fraction))
			Cracks()
				.trim(from: 0, to: Slab.crackLength(stage, fraction))
				.stroke(Slab.crack, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
		}
		.frame(width: Slab.width, height: Slab.height)
	}
}

/// Dirt heaped where the slab breaks the surface.
private struct Ground: View {
	var body: some View {
		HStack(spacing: 6) {
			ForEach(0..<9, id: \.self) { i in
				Ellipse()
					.fill(Slab.dirt)
					.frame(width: 10 + CGFloat(i % 3) * 4, height: 5 + CGFloat(i % 2) * 2)
			}
		}
		.allowsHitTesting(false)
	}
}

/// The cracks across the face: the split down the middle first, so a short trim shows it alone,
/// then three branches. Points are shares of the face's width and height.
struct Cracks: Shape {
	private static let lines: [[(Double, Double)]] = [
		[(0.50, 0.06), (0.47, 0.30), (0.53, 0.50), (0.48, 0.72), (0.51, 1.00)],
		[(0.47, 0.30), (0.31, 0.38), (0.18, 0.33)],
		[(0.53, 0.50), (0.71, 0.57), (0.86, 0.50)],
		[(0.48, 0.72), (0.34, 0.81), (0.26, 0.96)],
	]

	func path(in rect: CGRect) -> Path {
		var path = Path()
		for line in Self.lines {
			let points = line.map { CGPoint(x: rect.minX + $0.0 * rect.width, y: rect.minY + $0.1 * rect.height) }
			path.addLines(points)
		}
		return path
	}
}

/// Specks thrown up by a tap: dirt while the slab is underground, stone chips once it cracks.
struct Debris: View {
	let trigger: Int
	let color: Color

	var body: some View {
		HStack(spacing: 16) {
			ForEach(0..<5, id: \.self) { i in
				Circle()
					.fill(color)
					.frame(width: 4, height: 4)
					.keyframeAnimator(initialValue: Puff(), trigger: trigger) { content, puff in
						content.offset(y: puff.rise).opacity(puff.opacity)
					} keyframes: { _ in
						KeyframeTrack(\.rise) {
							LinearKeyframe(-10 - Double(i % 3) * 5, duration: 0.35)
							LinearKeyframe(0, duration: 0.01)
						}
						KeyframeTrack(\.opacity) {
							LinearKeyframe(1, duration: 0.05)
							LinearKeyframe(0, duration: 0.3)
						}
					}
			}
		}
		.allowsHitTesting(false)
	}
}

struct Puff {
	var rise = 0.0
	var opacity = 0.0
}
