import ExpoModulesCore
import SwiftUI

/// Where one stain sits, as shares of the tile's size. Worked out in TypeScript from the issue's
/// day, so the same issue always stains the same way.
struct StainMark: Record {
	@Field var x: Double = 0.5
	@Field var y: Double = 0.5
	@Field var radius: Double = 0.24
	@Field var rotation: Double = 0
	@Field var arcStart: Double = 0
	@Field var arcLength: Double = 0.8
}

enum StainKind: String, Enumerable {
	case coffee
	case tea
	case none
}

/// How a tile tints its lead photo: by the appearance, in full color, or in sepia.
enum PhotoTone: String, Enumerable {
	case auto
	case color
	case sepia
}

/// A ring's three inks: the faint wash inside it, the soft halo along its edge, and the edge.
private struct StainInks {
	let fill: Color
	let halo: Color
	let edge: Color

	static func of(_ kind: StainKind, _ scheme: ColorScheme) -> StainInks? {
		func rgba(_ r: Double, _ g: Double, _ b: Double, _ a: Double) -> Color {
			Color(red: r / 255, green: g / 255, blue: b / 255).opacity(a)
		}
		switch (kind, scheme) {
		case (.none, _):
			return nil
		case (.coffee, .dark):
			return StainInks(fill: rgba(150, 100, 60, 0.10), halo: rgba(170, 115, 70, 0.22), edge: rgba(200, 145, 95, 0.42))
		case (.tea, .dark):
			// Tea's amber glows on grey paper, so it is drawn thin and quiet there, with no halo.
			return StainInks(fill: rgba(150, 130, 95, 0.05), halo: .clear, edge: rgba(165, 145, 110, 0.22))
		case (.coffee, _):
			return StainInks(fill: rgba(160, 105, 50, 0.10), halo: rgba(125, 78, 32, 0.22), edge: rgba(110, 66, 25, 0.45))
		case (.tea, _):
			return StainInks(fill: rgba(200, 150, 60, 0.08), halo: rgba(185, 135, 50, 0.20), edge: rgba(165, 115, 35, 0.35))
		}
	}
}

/// The rings a cup leaves, drawn over the sheet and clipped with it. Hidden from VoiceOver: the
/// tile's label says how much is read.
struct StainLayer: View {
	let marks: [StainMark]
	let kind: StainKind
	let scheme: ColorScheme

	/// A ring bigger than this many points looks like a saucer, not a cup, on the wide top tile.
	private let largestRadius: CGFloat = 46

	var body: some View {
		if let inks = StainInks.of(kind, scheme), !marks.isEmpty {
			Canvas { context, size in
				for mark in marks {
					let radius = min(CGFloat(mark.radius) * size.width, largestRadius)
					let centre = CGPoint(x: CGFloat(mark.x) * size.width, y: CGFloat(mark.y) * size.height)
					let ring = ringPoints(centre: centre, radius: radius, phase: mark.rotation * .pi / 180)
					context.fill(closed(ring), with: .color(inks.fill))
					let edge = arc(ring, start: mark.arcStart, length: mark.arcLength)
					context.drawLayer { halo in
						halo.addFilter(.blur(radius: 1.6))
						halo.stroke(edge, with: .color(inks.halo), style: StrokeStyle(lineWidth: 7, lineCap: .round))
					}
					context.stroke(edge, with: .color(inks.edge), style: StrokeStyle(lineWidth: 1.3, lineCap: .round))
				}
			}
			.blendMode(scheme == .dark ? .normal : .multiply)
			.allowsHitTesting(false)
			.accessibilityHidden(true)
		}
	}

	/// A slightly wobbly circle, as a cup's rim leaves it.
	private func ringPoints(centre: CGPoint, radius: CGFloat, phase: Double) -> [CGPoint] {
		(0...72).map { step in
			let angle = Double(step) / 72 * 2 * .pi
			let wobble = 1 + 0.025 * sin(2 * angle + phase) + 0.015 * sin(5 * angle + phase * 1.7)
			let r = radius * CGFloat(wobble)
			return CGPoint(x: centre.x + r * CGFloat(cos(angle)), y: centre.y + r * CGFloat(sin(angle)))
		}
	}

	private func closed(_ points: [CGPoint]) -> Path {
		Path { path in
			path.addLines(points)
			path.closeSubpath()
		}
	}

	/// The part of the ring whose edge shows: a worn ring is never drawn all the way round.
	private func arc(_ points: [CGPoint], start: Double, length: Double) -> Path {
		let count = points.count - 1
		let first = Int(start * Double(count))
		let steps = Int(length * Double(count))
		let run = (0...steps).map { points[(first + $0) % count] }
		return Path { $0.addLines(run) }
	}
}
