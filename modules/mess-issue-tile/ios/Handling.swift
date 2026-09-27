import ExpoModulesCore
import SwiftUI

/// A line where the sheet was once crumpled; see `SheetShape` in index.tsx.
struct Crease: Record {
	@Field var position: Double = 0.5
	@Field var angle: Double = 0
	@Field var strength: Double = 0.5
}

enum DogEar: String, Enumerable {
	case topRight
	case bottomRight
	case bottomLeft
}

/// How one issue's sheet has been handled, worked out in TypeScript from the issue's day so a
/// sheet looks the same every time it is drawn.
struct SheetShape: Record {
	@Field var tilt: Double = 0
	@Field var dogEar: DogEar?
	@Field var creases: [Crease] = []
	@Field var edgeSeed: Double = 0
	@Field var bend: Double = 6
}

/// Where the sheet is folded, as a share of its height.
let foldLine: CGFloat = 0.7

/// A sheet's outline: a rectangle whose edges wander by half a point or so, as cut newsprint's
/// do, with one corner turned down when the sheet has one.
struct PaperOutline: Shape {
	let seed: UInt32
	let dogEar: DogEar?
	/// How far along each edge a turned corner reaches
	let earSize: CGFloat

	func path(in rect: CGRect) -> Path {
		var random = SeededRandom(seed: seed)
		let step: CGFloat = 12
		let wander: CGFloat = 0.6

		func edge(from start: CGPoint, to end: CGPoint) -> [CGPoint] {
			let length = hypot(end.x - start.x, end.y - start.y)
			let count = max(Int(length / step), 1)
			// Level with the edge, so the wander never cuts into the sheet's corners.
			let normal = CGPoint(x: -(end.y - start.y) / length, y: (end.x - start.x) / length)
			return (0..<count).map { index in
				let t = CGFloat(index) / CGFloat(count)
				let shift = index == 0 ? 0 : (random.next() * 2 - 1) * wander
				return CGPoint(
					x: start.x + (end.x - start.x) * t + normal.x * shift,
					y: start.y + (end.y - start.y) * t + normal.y * shift)
			}
		}

		let ear = earSize
		let topLeft = CGPoint(x: rect.minX, y: rect.minY)
		let topRight = CGPoint(x: rect.maxX, y: rect.minY)
		let bottomRight = CGPoint(x: rect.maxX, y: rect.maxY)
		let bottomLeft = CGPoint(x: rect.minX, y: rect.maxY)

		// Each corner, or the two points of its turned-down cut.
		func corner(_ point: CGPoint, _ which: DogEar?, before: CGPoint, after: CGPoint) -> [CGPoint] {
			guard which == dogEar, dogEar != nil else { return [point] }
			return [toward(point, before, by: ear), toward(point, after, by: ear)]
		}

		var points: [CGPoint] = []
		points += edge(from: topLeft, to: topRight)
		points += corner(topRight, .topRight, before: topLeft, after: bottomRight)
		points += edge(from: topRight, to: bottomRight).dropFirst()
		points += corner(bottomRight, .bottomRight, before: topRight, after: bottomLeft)
		points += edge(from: bottomRight, to: bottomLeft).dropFirst()
		points += corner(bottomLeft, .bottomLeft, before: bottomRight, after: topLeft)
		points += edge(from: bottomLeft, to: topLeft).dropFirst()

		return Path { path in
			path.addLines(points)
			path.closeSubpath()
		}
	}
}

/// The underside of a turned-down corner: a triangle of paper lying on the sheet, a shade darker,
/// with a soft shadow along its fold.
struct DogEarFlap: View {
	let dogEar: DogEar?
	let earSize: CGFloat
	let palette: PaperPalette

	var body: some View {
		GeometryReader { proxy in
			if let dogEar {
				let rect = CGRect(origin: .zero, size: proxy.size)
				let (corner, a, b) = Self.points(dogEar, rect, earSize)
				// The flap is the cut corner folded over its own crease, onto the sheet.
				let tip = CGPoint(x: a.x + b.x - corner.x, y: a.y + b.y - corner.y)
				Path { path in
					path.addLines([a, tip, b])
					path.closeSubpath()
				}
				.fill(palette.edgeNear)
				.shadow(color: palette.shadow, radius: 1.5, x: 0, y: 0)
			}
		}
		.allowsHitTesting(false)
	}

	static func points(_ ear: DogEar, _ rect: CGRect, _ size: CGFloat) -> (CGPoint, CGPoint, CGPoint) {
		switch ear {
		case .topRight:
			let corner = CGPoint(x: rect.maxX, y: rect.minY)
			return (corner, CGPoint(x: rect.maxX - size, y: rect.minY), CGPoint(x: rect.maxX, y: rect.minY + size))
		case .bottomRight:
			let corner = CGPoint(x: rect.maxX, y: rect.maxY)
			return (corner, CGPoint(x: rect.maxX, y: rect.maxY - size), CGPoint(x: rect.maxX - size, y: rect.maxY))
		case .bottomLeft:
			let corner = CGPoint(x: rect.minX, y: rect.maxY)
			return (corner, CGPoint(x: rect.minX + size, y: rect.maxY), CGPoint(x: rect.minX, y: rect.maxY - size))
		}
	}
}

/// The lines of an old crumple, laid over everything on the sheet -- the photo and the type too --
/// as a soft shadow on one side of each line and a faint catch of light on the other.
struct CreaseLayer: View {
	let creases: [Crease]
	let scheme: ColorScheme

	var body: some View {
		let shadow: Double = scheme == .dark ? 0.35 : 0.14
		let light: Double = scheme == .dark ? 0.06 : 0.35
		ZStack {
			Canvas { context, size in
				context.addFilter(.blur(radius: 2.5))
				for crease in creases {
					context.stroke(
						line(crease, size, shift: -1.2), with: .color(.black.opacity(shadow * crease.strength)),
						lineWidth: 3)
				}
			}
			.blendMode(.multiply)
			Canvas { context, size in
				context.addFilter(.blur(radius: 1.2))
				for crease in creases {
					context.stroke(
						line(crease, size, shift: 1.2), with: .color(.white.opacity(light * crease.strength)),
						lineWidth: 1.5)
				}
			}
			.blendMode(.screen)
		}
		.allowsHitTesting(false)
		.accessibilityHidden(true)
	}

	/// The crease as a line across the whole sheet through its point on the sheet's middle, moved
	/// `shift` points to one side of itself.
	private func line(_ crease: Crease, _ size: CGSize, shift: CGFloat) -> Path {
		let angle = crease.angle * .pi / 180
		let centre = CGPoint(x: size.width / 2, y: CGFloat(crease.position) * size.height)
		let reach = size.width + size.height
		let dx = CGFloat(cos(angle)) * reach
		let dy = CGFloat(sin(angle)) * reach
		let nx = CGFloat(-sin(angle)) * shift
		let ny = CGFloat(cos(angle)) * shift
		return Path { path in
			path.move(to: CGPoint(x: centre.x - dx + nx, y: centre.y - dy + ny))
			path.addLine(to: CGPoint(x: centre.x + dx + nx, y: centre.y + dy + ny))
		}
	}
}

/// The shade a fold casts: a dark line along the fold, then a shadow fading down the bent part.
struct FoldShade: View {
	let palette: PaperPalette

	var body: some View {
		GeometryReader { proxy in
			let y = proxy.size.height * foldLine
			VStack(spacing: 0) {
				Color.clear.frame(height: max(y - 1, 0))
				Rectangle().fill(palette.crease).frame(height: 1)
				LinearGradient(colors: [palette.crease.opacity(0.6), .clear], startPoint: .top, endPoint: .bottom)
					.frame(height: max(proxy.size.height - y, 0) * 0.3)
				Spacer(minLength: 0)
			}
		}
		.allowsHitTesting(false)
		.accessibilityHidden(true)
	}
}

/// A horizontal band of a view, from one share of its height to another.
struct Band: Shape {
	let from: CGFloat
	let to: CGFloat

	func path(in rect: CGRect) -> Path {
		Path(CGRect(x: rect.minX - 20, y: rect.minY + rect.height * from,
			width: rect.width + 40, height: rect.height * (to - from)))
	}
}

/// A small xorshift generator, so a sheet's edges wander the same way every time.
struct SeededRandom {
	private var state: UInt32

	init(seed: UInt32) {
		state = seed == 0 ? 0x9E3779B9 : seed
	}

	/// A number in [0, 1).
	mutating func next() -> CGFloat {
		state ^= state << 13
		state ^= state >> 17
		state ^= state << 5
		return CGFloat(state) / CGFloat(UInt32.max)
	}
}

private func toward(_ from: CGPoint, _ to: CGPoint, by distance: CGFloat) -> CGPoint {
	let length = hypot(to.x - from.x, to.y - from.y)
	guard length > 0 else { return from }
	return CGPoint(
		x: from.x + (to.x - from.x) / length * distance,
		y: from.y + (to.y - from.y) / length * distance)
}
