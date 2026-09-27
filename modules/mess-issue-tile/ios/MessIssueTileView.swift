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
	@Field var title: String = ""
	@Field var date: String = ""
	@Field var special: Bool = false
	@Field var hasPhoto: Bool = false
	@Field var photoUrl: URL?
	@Field var stains: [StainMark] = []
	@Field var stainKind: StainKind = .coffee
	@Field var layout: TileLayout = .grid
	@Field var paragraphs: [String] = []
	@Field var sheet: SheetShape = SheetShape()
	@Field var label: String = ""
	@Field var testID: String?
	var onTilePress = EventDispatcher()
}

/// One Messenger issue as a small folded broadsheet: nameplate, date, lead photo, headline, and on
/// the top tile the lead story in columns; then the rings of whatever the reader has read. The
/// whole sheet is one button, and VoiceOver reads only its label.
struct MessIssueTileView: ExpoSwiftUI.View {
	@ObservedObject var props: MessIssueTileProps

	init(props: MessIssueTileProps) {
		self.props = props
	}

	@Environment(\.colorScheme) private var scheme
	/// The lead photo, loaded once and drawn in both halves of the folded sheet.
	@StateObject private var photoLoader = PhotoLoader()

	private var palette: PaperPalette { PaperPalette(scheme) }
	/// The most pixels a photo needs along its longer side: a grid tile's is about 180 points wide
	/// and the top tile's up to about 460, at three pixels a point.
	private var photoPixels: CGFloat { isTop ? 1400 : 600 }

	/// A tile whose lead has a photo keeps the photo's layout while the photo's address is unknown or
	/// the photo fails to load, drawing the placeholder in its place: the words that fill a photo-less
	/// tile below its fold are fetched only for a lead with no photo at all.
	private var hasPhoto: Bool { props.hasPhoto }

	var body: some View {
		Button {
			props.onTilePress()
		} label: {
			sheet
		}
		.buttonStyle(.plain)
		.accessibilityElement(children: .ignore)
		.accessibilityLabel(props.label)
		.accessibilityAddTraits(.isButton)
		.accessibilityIdentifier(props.testID ?? "")
		// Tied to the tile's time on screen: a tile scrolled away stops its load, and one that comes
		// back without its photo starts again.
		.task(id: props.photoUrl) {
			await photoLoader.load(props.photoUrl, maxPixels: photoPixels)
		}
	}

	/// How far along each edge a turned corner reaches: small enough to nick a headline's last
	/// letter at most, not hide a word.
	private var earSize: CGFloat { isTop ? 14 : 10 }

	private var outline: PaperOutline {
		PaperOutline(
			seed: UInt32(truncatingIfNeeded: Int(props.sheet.edgeSeed)),
			dogEar: props.sheet.dogEar,
			earSize: earSize)
	}

	/// The flat sheet with everything on it: paper, the page, stains, creases, a turned corner,
	/// and the sheets showing behind it.
	private var flatSheet: some View {
		Color.clear
			.aspectRatio(props.layout.aspect, contentMode: .fit)
			.frame(maxWidth: .infinity)
			.overlay(alignment: .topLeading) {
				content.padding(7)
			}
			.overlay { wordsBelowFold }
			.background(PaperBackground(palette: palette, scheme: scheme))
			.overlay(StainLayer(marks: props.stains, kind: props.stainKind, scheme: scheme))
			.overlay(CreaseLayer(creases: props.sheet.creases, scheme: scheme))
			.overlay(FoldShade(palette: palette))
			.clipShape(outline)
			.overlay(DogEarFlap(dogEar: props.sheet.dogEar, earSize: earSize, palette: palette))
			.background(SheetEdges(palette: palette, outline: outline))
	}

	/// The sheet folded: the part below the fold bends back away from the reader, photo, type and
	/// all, then the whole sheet sits at its slight tilt.
	private var sheet: some View {
		ZStack {
			flatSheet
				.clipShape(Band(from: 0, to: foldLine))
			flatSheet
				.clipShape(Band(from: foldLine, to: 1.2))
				.rotation3DEffect(
					.degrees(props.sheet.bend), axis: (x: 1, y: 0, z: 0),
					anchor: UnitPoint(x: 0.5, y: foldLine), perspective: 0.4)
				// The bent half is a second drawing of the same sheet; VoiceOver has the tile's label.
				.accessibilityHidden(true)
		}
		.rotationEffect(.degrees(props.sheet.tilt))
		.padding([.trailing, .bottom], 5)
		.contentShape(.rect)
	}

	/// A grid tile with no photo keeps its headline above the fold and sets its lead story in two
	/// columns below it.
	@ViewBuilder private var wordsBelowFold: some View {
		if props.layout == .grid, !hasPhoto, !props.paragraphs.isEmpty {
			GeometryReader { proxy in
				let top = proxy.size.height * foldLine + 5
				ColumnText(
					paragraphs: props.paragraphs, columns: 2, clearedColumns: 0, clearHeight: 0,
					ink: palette.ink, rule: palette.columnRule, size: 3.4)
					.frame(width: proxy.size.width - 14, height: max(proxy.size.height - top - 7, 0))
					.offset(x: 7, y: top)
			}
			.allowsHitTesting(false)
		}
	}

	@ViewBuilder private var content: some View {
		switch props.layout {
		case .grid: gridContent
		case .topPortrait: topPortraitContent
		case .topLandscape: topLandscapeContent
		}
	}

	private var isTop: Bool { props.layout != .grid }

	private var header: some View {
		VStack(spacing: 3) {
			Text("The Olaf Messenger")
				.font(.system(size: isTop ? 20 : 12, weight: .bold, design: .serif))
				.lineLimit(1)
				.minimumScaleFactor(0.7)
			rule(1)
			Text(props.date)
				.font(.system(size: isTop ? 10 : 8))
				.textCase(.uppercase)
				.kerning(0.8)
			if props.special {
				Text("Special Edition")
					.font(.system(size: isTop ? 10 : 8, weight: .heavy))
					.textCase(.uppercase)
					.kerning(1)
					.foregroundStyle(palette.special)
			}
			rule(0.5)
		}
		.foregroundStyle(palette.ink)
		.frame(maxWidth: .infinity)
	}

	private func rule(_ thickness: CGFloat) -> some View {
		Rectangle().fill(palette.rule).frame(height: thickness)
	}

	/// A grid tile: photo and a headline that always has room for three lines, or, with no photo,
	/// a larger headline of up to six.
	private var gridContent: some View {
		VStack(alignment: .leading, spacing: 5) {
			header
			if hasPhoto {
				photo
				Headline(text: props.title, size: 11, lines: 3, color: palette.ink)
					.frame(height: 11 * 1.2 * 3, alignment: .top)
			} else {
				Headline(text: props.title, size: 16, lines: 6, color: palette.ink)
					.padding(.top, 5)
				Spacer(minLength: 0)
			}
		}
	}

	/// Portrait: the headline across the sheet, the photo over two columns, the story flowing
	/// under it and down the third. With no photo the story takes all three from the top.
	private var topPortraitContent: some View {
		VStack(alignment: .leading, spacing: 6) {
			header
			Headline(text: props.title, size: hasPhoto ? 18 : 22, lines: 3, color: palette.ink)
			GeometryReader { proxy in
				let gutter: CGFloat = 9
				let column = (proxy.size.width - gutter * 2) / 3
				let photoHeight = hasPhoto ? min(proxy.size.height * 0.62, (column * 2 + gutter) * 0.75) : 0
				ZStack(alignment: .topLeading) {
					ColumnText(
						paragraphs: props.paragraphs, columns: 3,
						clearedColumns: hasPhoto ? 2 : 0, clearHeight: photoHeight,
						ink: palette.ink, rule: palette.columnRule)
					if hasPhoto {
						photo.frame(width: column * 2 + gutter, height: photoHeight)
					}
				}
			}
		}
	}

	/// Landscape: the photo takes the left two-thirds; the headline and the story run down the right.
	private var topLandscapeContent: some View {
		VStack(alignment: .leading, spacing: 6) {
			header
			HStack(alignment: .top, spacing: 8) {
				if hasPhoto {
					photo.containerRelativeFrame(.horizontal) { width, _ in width * 0.6 }
				}
				VStack(alignment: .leading, spacing: 5) {
					Headline(text: props.title, size: hasPhoto ? 15 : 22, lines: hasPhoto ? 5 : 3, color: palette.ink)
					ColumnText(
						paragraphs: props.paragraphs, columns: hasPhoto ? 1 : 3,
						clearedColumns: 0, clearHeight: 0,
						ink: palette.ink, rule: palette.columnRule)
				}
			}
		}
	}

	/// The lead photo as newsprint prints one: faded and grainy, soft at the edges, greyscale in
	/// Dark Mode, and drifting a little against the page as it scrolls.
	private var photo: some View {
		GeometryReader { proxy in
			if let image = photoLoader.image {
				Image(uiImage: image)
					.resizable()
					.scaledToFill()
					.grayscale(scheme == .dark ? 1 : 0.3)
					.contrast(0.88)
					.brightness(scheme == .dark ? -0.05 : 0.04)
					// Headroom for the drift, so it never shows the photo's edge.
					.scaleEffect(1.12)
					.visualEffect { content, geometry in
						// Where the photo sits in the visible part of the scroll view, from -0.5 at its top
						// edge to 0.5 at its bottom, measured in the photo's own coordinates.
						let height = geometry.size.height
						let travel: CGFloat
						if let visible = geometry.bounds(of: .scrollView), visible.height > 0 {
							travel = min(max((height / 2 - visible.midY) / visible.height, -0.5), 0.5)
						} else {
							travel = 0
						}
						// The photo is drawn 12% larger, so a drift of 10% of its height never shows an edge.
						return content.offset(y: -travel * height * 0.1)
					}
					.frame(width: proxy.size.width, height: proxy.size.height)
					.clipped()
					.overlay(TextureLayer(image: Textures.grain).blendMode(.overlay).opacity(0.55))
			} else {
				palette.placeholder
			}
		}
		.blendMode(scheme == .dark ? .normal : .multiply)
		.mask(
			RadialGradient(
				colors: [.black, .black, .black.opacity(0.5)],
				center: .center, startRadius: 0, endRadius: 140))
		.accessibilityHidden(true)
	}
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
