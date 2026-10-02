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

/// Each tile's flat sheet drawn once into an image and kept. The tile folds the image, two clipped
/// copies of one bitmap, rather than drawing its dozens of layers of paper, type, photo, stains and
/// creases twice over, which made the render server miss frames while the grid scrolled.
@MainActor
enum TileImageCache {
	/// How far past the sheet's frame its image reaches, for the sheets behind it and their shadow
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

	/// Draws the flat sheet of a tile `size` points across into an image, with `margin` to spare on
	/// every side, and keeps it.
	static func draw(
		_ content: TileContent, photo: UIImage?, size: CGSize, scheme: ColorScheme,
		typeSize: DynamicTypeSize, scale: CGFloat, as key: TileImageKey
	) {
		// The fold's padding is outside the flat sheet.
		let sheet = FlatSheet(content: content, photo: photo, scheme: scheme)
			.frame(width: size.width - 5, height: size.height - 5)
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

/// An image of a flat sheet, laid out exactly as the sheet it stands in for, so swapping one for the
/// other moves nothing. It reaches `margin` past its frame on every side.
struct SheetImage: View {
	let image: UIImage
	let layout: TileLayout

	var body: some View {
		Color.clear
			.aspectRatio(layout.aspect, contentMode: .fit)
			.frame(maxWidth: .infinity)
			.overlay {
				Image(uiImage: image)
					.resizable()
					.padding(-TileImageCache.margin)
			}
	}
}
