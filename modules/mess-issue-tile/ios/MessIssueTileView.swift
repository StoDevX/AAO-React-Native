import ExpoModulesCore
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
		case .topLandscape: 1.6
		}
	}
}

final class MessIssueTileProps: ExpoSwiftUI.ViewProps {
	@Field var title: String = ""
	@Field var date: String = ""
	@Field var special: Bool = false
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
	/// A photo that failed to load draws the tile as one with no photo.
	private var hasPhoto: Bool { props.photoUrl != nil && !photoLoader.failed }

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
		.onChange(of: props.photoUrl, initial: true) { photoLoader.load(props.photoUrl) }
	}

	private var outline: PaperOutline {
		PaperOutline(
			seed: UInt32(truncatingIfNeeded: Int(props.sheet.edgeSeed)),
			dogEar: props.sheet.dogEar,
			earSize: isTop ? 22 : 14)
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
			.background(PaperBackground(palette: palette, scheme: scheme))
			.overlay(StainLayer(marks: props.stains, kind: props.stainKind, scheme: scheme))
			.overlay(CreaseLayer(creases: props.sheet.creases, scheme: scheme))
			.overlay(FoldShade(palette: palette))
			.clipShape(outline)
			.overlay(DogEarFlap(dogEar: props.sheet.dogEar, earSize: isTop ? 22 : 14, palette: palette))
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
/// neither waits on a load of its own. URLSession's shared cache keeps a photo seen before.
@MainActor
final class PhotoLoader: ObservableObject {
	@Published private(set) var image: UIImage?
	@Published private(set) var failed = false
	private var url: URL?
	private var task: Task<Void, Never>?

	func load(_ next: URL?) {
		guard next != url else { return }
		url = next
		task?.cancel()
		image = nil
		failed = false
		guard let next else { return }
		task = Task { [weak self] in
			do {
				let (data, _) = try await URLSession.shared.data(from: next)
				guard !Task.isCancelled else { return }
				guard let image = UIImage(data: data) else { throw URLError(.cannotDecodeContentData) }
				self?.image = image
			} catch {
				if !Task.isCancelled { self?.failed = true }
			}
		}
	}
}
