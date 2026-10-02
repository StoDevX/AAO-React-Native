import SwiftUI
import UIKit

/// Everything that changes how a tile looks. A tile's image is drawn again when any of it changes:
/// its words, stains or handling, its size, the appearance, the text size or the screen's scale.
/// A photo is named by its address; an image is only made once the photo it shows has loaded.
struct TileImageKey: Hashable {
	let title: String
	let date: String
	let special: Bool
	let hasPhoto: Bool
	let photoUrl: URL?
	let stains: [[Double]]
	let stainKind: String
	let layout: String
	let paragraphs: [String]
	let handling: [Double]
	let dogEar: String?
	let creases: [[Double]]
	let width: Double
	let height: Double
	let scheme: ColorScheme
	let typeSize: DynamicTypeSize
	let scale: Double

	init(
		_ content: TileContent, photoUrl: URL?, size: CGSize, scheme: ColorScheme,
		typeSize: DynamicTypeSize, scale: CGFloat
	) {
		title = content.title
		date = content.date
		special = content.special
		hasPhoto = content.hasPhoto
		self.photoUrl = photoUrl
		stains = content.stains.map { [$0.x, $0.y, $0.radius, $0.rotation, $0.arcStart, $0.arcLength] }
		stainKind = content.stainKind.rawValue
		layout = content.layout.rawValue
		paragraphs = content.paragraphs
		handling = [content.sheet.tilt, content.sheet.edgeSeed, content.sheet.bend]
		dogEar = content.sheet.dogEar?.rawValue
		creases = content.sheet.creases.map { [$0.position, $0.angle, $0.strength] }
		width = size.width
		height = size.height
		self.scheme = scheme
		self.typeSize = typeSize
		self.scale = scale
	}
}

/// Tiles drawn once into images and kept, so a grid tile scrolled away and back is one bitmap to
/// composite rather than its dozens of layers of paper, type, photo, stains and fold, which made
/// the render server miss frames while the grid scrolled.
@MainActor
enum TileImageCache {
	/// How far past the sheet's frame its image reaches, for the tilt and the shadow behind it
	static let margin: CGFloat = 12

	/// About ninety grid tiles at three pixels a point; the system also empties it under memory
	/// pressure.
	private static let images: NSCache<KeyBox, UIImage> = {
		let cache = NSCache<KeyBox, UIImage>()
		cache.totalCostLimit = 192 * 1024 * 1024
		return cache
	}()

	static func image(for key: TileImageKey) -> UIImage? {
		images.object(forKey: KeyBox(key))
	}

	/// Draws a sheet of `size` points into an image, with `margin` to spare on every side, and keeps it.
	static func draw(
		_ content: TileContent, photo: UIImage?, size: CGSize, scheme: ColorScheme,
		typeSize: DynamicTypeSize, scale: CGFloat, as key: TileImageKey
	) {
		let sheet = TileSheet(content: content, photo: photo, scheme: scheme)
			.frame(width: size.width, height: size.height)
			.padding(margin)
			.environment(\.colorScheme, scheme)
			.environment(\.dynamicTypeSize, typeSize)
		let renderer = ImageRenderer(content: sheet)
		renderer.scale = scale
		renderer.isOpaque = false
		guard let image = renderer.uiImage, let bitmap = image.cgImage else { return }
		images.setObject(image, forKey: KeyBox(key), cost: bitmap.bytesPerRow * bitmap.height)
	}

	/// An `NSCache` key needs object equality, which a struct key gets through this box.
	private final class KeyBox: NSObject {
		let key: TileImageKey

		init(_ key: TileImageKey) {
			self.key = key
		}

		override var hash: Int { key.hashValue }

		override func isEqual(_ object: Any?) -> Bool {
			(object as? KeyBox)?.key == key
		}
	}
}

/// Runs tile drawing on a timer in the main run loop's default mode, which the run loop leaves
/// while a scroll view tracks a finger or decelerates: a grid being flung draws no tiles, and once
/// it rests they are drawn one a frame, so the main thread is never held for more than one tile.
@MainActor
final class TileDrawQueue {
	static let shared = TileDrawQueue()

	private var jobs: [(id: UUID, work: () -> Void)] = []
	private var timer: Timer?

	func enqueue(_ id: UUID, _ work: @escaping () -> Void) {
		jobs.append((id, work))
		schedule()
	}

	func cancel(_ id: UUID) {
		jobs.removeAll { $0.id == id }
	}

	private func schedule() {
		guard timer == nil, !jobs.isEmpty else { return }
		let next = Timer(timeInterval: 1.0 / 60, repeats: false) { _ in
			MainActor.assumeIsolated {
				self.timer = nil
				if !self.jobs.isEmpty {
					self.jobs.removeFirst().work()
				}
				self.schedule()
			}
		}
		timer = next
		RunLoop.main.add(next, forMode: .default)
	}
}

/// A tile's cached image, laid out exactly as the sheet it stands in for, so swapping one for the
/// other moves nothing.
struct CachedTileImage: View {
	let image: UIImage
	let layout: TileLayout

	var body: some View {
		Color.clear
			.aspectRatio(layout.aspect, contentMode: .fit)
			.frame(maxWidth: .infinity)
			.padding([.trailing, .bottom], 5)
			.overlay {
				Image(uiImage: image)
					.resizable()
					.padding(-TileImageCache.margin)
			}
	}
}

/// Suspends until the calling task is cancelled.
func untilCancelled() async {
	let (stream, continuation) = AsyncStream<Never>.makeStream()
	await withTaskCancellationHandler {
		for await _ in stream {}
	} onCancel: {
		continuation.finish()
	}
}
