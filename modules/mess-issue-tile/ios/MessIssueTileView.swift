import ExpoModulesCore
import ImageIO
import SwiftUI

enum TileLayout: String, Enumerable {
	case grid
	case topPortrait
	case topLandscape

	/// Width over height: a grid tile is a tall sheet, the top tile nearly square, or wide.
	var aspect: CGFloat {
		switch self {
		case .grid: 2.0 / 3.0
		case .topPortrait: 0.96
		// Wide enough to sit on a landscape screen under the bar and the switch.
		case .topLandscape: 2.4
		}
	}
}

final class MessIssueTileProps: ExpoSwiftUI.ViewProps {
	@Field var nameplate: String = ""
	@Field var title: String = ""
	@Field var date: String = ""
	@Field var special: Bool = false
	@Field var hasPhoto: Bool = false
	@Field var photoUrl: URL?
	@Field var stains: [StainMark] = []
	@Field var stainKind: StainKind = .coffee
	@Field var photoTone: PhotoTone = .auto
	@Field var layout: TileLayout = .grid
	@Field var paragraphs: [String] = []
	@Field var sheet: SheetShape = SheetShape()
	@Field var label: String = ""
	@Field var testID: String?
	var onTilePress = EventDispatcher()
}

/// One Messenger issue's tile: its sheet, drawn live until it has everything it will show, and from
/// then on an image of its flat sheet, drawn once, kept until anything that changes its look changes,
/// and folded. The whole sheet is one button, and VoiceOver reads only its label.
struct MessIssueTileView: ExpoSwiftUI.View {
	@ObservedObject var props: MessIssueTileProps

	init(props: MessIssueTileProps) {
		self.props = props
	}

	@Environment(\.colorScheme) private var scheme
	@Environment(\.displayScale) private var scale
	@Environment(\.dynamicTypeSize) private var typeSize
	/// The lead photo, loaded once and drawn in both halves of the folded sheet.
	@StateObject private var photoLoader = PhotoLoader()
	/// The sheet's size, which its image is drawn at
	@State private var size: CGSize = .zero
	/// The key of the image last drawn for this tile, which draws the tile again to show it
	@State private var drawn: TileImageKey?

	/// The most pixels a photo needs along its longer side: a grid tile's is about 180 points wide
	/// and the top tile's up to about 460, at three pixels a point.
	private var photoPixels: CGFloat { props.layout == .grid ? 600 : 1400 }

	var body: some View {
		let content = TileContent(props)
		let key = imageKey(content)
		// Read so that drawing the image shows it: the cache itself is not observed.
		let _ = drawn
		let image = key.flatMap(TileImageCache.image(for:))
		Button {
			props.onTilePress()
		} label: {
			Group {
				if let image {
					FoldedSheet(shape: content.sheet) { SheetImage(image: image, layout: content.layout) }
				} else {
					TileSheet(content: content, photo: photoLoader.image, scheme: scheme)
				}
			}
			.onGeometryChange(for: CGSize.self, of: \.size) { size = $0 }
			.contentShape(.rect)
		}
		.buttonStyle(.plain)
		.accessibilityElement(children: .ignore)
		.accessibilityLabel(props.label)
		.accessibilityAddTraits(.isButton)
		.accessibilityIdentifier(props.testID ?? "")
		// Tied to the tile's time on screen: a tile scrolled away stops its load, and one that comes
		// back without its photo starts again. A tile showing its image needs no photo.
		.task(id: PhotoRequest(url: props.photoUrl, wanted: image == nil)) {
			guard image == nil else { return }
			await photoLoader.load(props.photoUrl, maxPixels: photoPixels)
		}
		// Draws the image once the sheet has everything it will show. A flat sheet takes about 2 ms
		// to draw, so it is drawn at once, mid-scroll or not: the live sheet it replaces costs the
		// render server more than that on every frame it is on screen.
		.task(id: image == nil && isComplete(content) ? key : nil) {
			guard image == nil, let key, isComplete(content) else { return }
			TileImageCache.draw(
				content, photo: photoLoader.image, size: size, scheme: scheme, typeSize: typeSize,
				scale: scale, as: key)
			drawn = key
		}
	}

	/// The image's key, or nil before the sheet is laid out. A landscape top tile is always drawn
	/// live: its photo's width is set by its container, which an image drawn on its own lacks.
	private func imageKey(_ content: TileContent) -> TileImageKey? {
		guard size.width > 0, size.height > 0, content.layout != .topLandscape else { return nil }
		return TileImageKey(
			content, photoUrl: props.photoUrl, size: size, scheme: scheme, typeSize: typeSize, scale: scale)
	}

	/// Whether the sheet shows all it will: a photo with an address has loaded. Until then the tile
	/// stays live, so the photo appears in it as it arrives.
	private func isComplete(_ content: TileContent) -> Bool {
		!(content.hasPhoto && props.photoUrl != nil && photoLoader.image == nil)
	}
}

/// The photo a tile wants, as the identity of the task that loads it.
private struct PhotoRequest: Equatable {
	let url: URL?
	let wanted: Bool
}

/// Loads a tile's photo once, so the two halves of its folded sheet draw the same picture and
/// neither waits on a load of its own. WordPress serves each photo as uploaded, often thousands of
/// pixels across, so it is decoded off the main thread straight to the size the tile draws it at:
/// a full-size decode on first draw stalls scrolling, and a grid of them holds far more memory
/// than the screen shows. The shared URL cache is too small to keep most originals, so a tile
/// built again fetches its photo again. A load runs in the tile's own task, so a fast scroll
/// through the grid does not leave downloads and decodes running for photos nobody sees.
@MainActor
final class PhotoLoader: ObservableObject {
	@Published private(set) var image: UIImage?
	private var url: URL?

	/// Load `next`, decoded no larger than `maxPixels` along its longer side, unless it is loaded
	/// already. The placeholder stays drawn until it loads. A download that fails is tried again,
	/// after longer and longer waits, for as long as its tile is on screen, so a tile launched
	/// offline, the top tile especially, fills in once the connection returns; a photo that
	/// downloads but cannot be decoded is not.
	func load(_ next: URL?, maxPixels: CGFloat) async {
		if next != url {
			url = next
			image = nil
		}
		guard let next, image == nil else { return }
		var wait: Duration = .seconds(2)
		while !Task.isCancelled {
			if let data = try? await URLSession.shared.data(from: next).0 {
				let decoded = await decode(data, maxPixels: maxPixels)
				if let decoded, !Task.isCancelled, url == next { image = decoded }
				return
			}
			// Sleep throws once the tile's task is cancelled, ending the retries.
			guard (try? await Task.sleep(for: wait)) != nil else { return }
			wait = min(wait * 2, .seconds(60))
		}
	}

	/// A photo's bytes decoded off the main thread; nil when they are no image, or the tile's task
	/// is cancelled.
	private func decode(_ data: Data, maxPixels: CGFloat) async -> UIImage? {
		guard !Task.isCancelled else { return nil }
		// A detached task does not share its caller's cancellation, so it is passed on, and a decode
		// not yet begun is skipped.
		let work = Task.detached(priority: .userInitiated) { () -> UIImage? in
			guard !Task.isCancelled else { return nil }
			return PhotoLoader.thumbnail(of: data, maxPixels: maxPixels)
		}
		return await withTaskCancellationHandler {
			await work.value
		} onCancel: {
			work.cancel()
		}
	}

	/// The photo decoded at no more than `maxPixels` along its longer side, upright.
	nonisolated static func thumbnail(of data: Data, maxPixels: CGFloat) -> UIImage? {
		let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
		guard let source = CGImageSourceCreateWithData(data as CFData, sourceOptions) else { return nil }
		let thumbnailOptions = [
			kCGImageSourceCreateThumbnailFromImageAlways: true,
			kCGImageSourceCreateThumbnailWithTransform: true,
			kCGImageSourceShouldCacheImmediately: true,
			kCGImageSourceThumbnailMaxPixelSize: maxPixels,
		] as CFDictionary
		guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, thumbnailOptions) else { return nil }
		return UIImage(cgImage: image)
	}
}
