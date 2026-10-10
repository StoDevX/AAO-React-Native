import SwiftUI

/// What one tile draws, copied out of its props, so the live tile and its cached image are drawn
/// from the same values.
struct TileContent {
	var nameplate: String
	var title: String
	var date: String
	var special: Bool
	var hasPhoto: Bool
	var stains: [StainMark]
	var stainKind: StainKind
	var photoTone: PhotoTone
	var layout: TileLayout
	var paragraphs: [String]
	var sheet: SheetShape

	init(_ props: MessIssueTileProps) {
		nameplate = props.nameplate
		title = props.title
		date = props.date
		special = props.special
		hasPhoto = props.hasPhoto
		stains = props.stains
		stainKind = props.stainKind
		photoTone = props.photoTone
		layout = props.layout
		paragraphs = props.paragraphs
		sheet = props.sheet
	}
}

/// One Messenger issue as a small folded broadsheet: nameplate, date, lead photo, headline, and on
/// the top tile the lead story in columns; then the rings of whatever the reader has read. It
/// draws only: the tile around it is the button, and VoiceOver reads the tile's label alone.
struct TileSheet: View {
	let content: TileContent
	/// The lead photo, or nil to draw the placeholder in its place
	let photo: UIImage?
	let scheme: ColorScheme

	var body: some View {
		FoldedSheet(shape: content.sheet) {
			FlatSheet(content: content, photo: photo, scheme: scheme)
		}
	}
}

/// A sheet folded: the part below the fold bends back away from the reader, photo, type and all,
/// then the whole sheet sits at its slight tilt. The flat sheet is drawn twice, once for each half,
/// so it should be cheap to draw: an image of it, once there is one.
struct FoldedSheet<Flat: View>: View {
	let shape: SheetShape
	@ViewBuilder let flat: Flat

	var body: some View {
		ZStack {
			flat
				.clipShape(Band(from: 0, to: foldLine))
			flat
				.clipShape(Band(from: foldLine, to: 1.2))
				.rotation3DEffect(
					.degrees(shape.bend), axis: (x: 1, y: 0, z: 0),
					anchor: UnitPoint(x: 0.5, y: foldLine), perspective: 0.4)
				// The bent half is a second drawing of the same sheet; VoiceOver has the tile's label.
				.accessibilityHidden(true)
		}
		.rotationEffect(.degrees(shape.tilt))
		.padding([.trailing, .bottom], 5)
	}
}

/// The flat sheet with everything on it: paper, the page, stains, creases, the shade the fold will
/// cast, a turned corner, and the sheets showing behind it.
struct FlatSheet: View {
	let content: TileContent
	/// The lead photo, or nil to draw the placeholder in its place
	let photo: UIImage?
	let scheme: ColorScheme

	private var palette: PaperPalette { PaperPalette(scheme) }

	private var isTop: Bool { content.layout != .grid }

	/// How far along each edge a turned corner reaches: small enough to nick a headline's last
	/// letter at most, not hide a word.
	private var earSize: CGFloat { isTop ? 14 : 10 }

	private var outline: PaperOutline {
		PaperOutline(
			seed: UInt32(truncatingIfNeeded: Int(content.sheet.edgeSeed)),
			dogEar: content.sheet.dogEar,
			earSize: earSize)
	}

	var body: some View {
		Color.clear
			.aspectRatio(content.layout.aspect, contentMode: .fit)
			.frame(maxWidth: .infinity)
			.overlay {
				GeometryReader { proxy in
					SheetPage(
						content: content, photo: photo, scheme: scheme,
						scale: content.layout.typeScale(width: proxy.size.width),
						size: proxy.size)
				}
			}
			.background(PaperBackground(palette: palette, scheme: scheme))
			.overlay(StainLayer(marks: content.stains, kind: content.stainKind, scheme: scheme))
			.overlay(CreaseLayer(creases: content.sheet.creases, scheme: scheme))
			.overlay(FoldShade(palette: palette))
			.clipShape(outline)
			.overlay(DogEarFlap(dogEar: content.sheet.dogEar, earSize: earSize, palette: palette))
			.background(SheetEdges(palette: palette, outline: outline))
	}
}

/// What is printed on a sheet: its nameplate and date, then its lead story laid out for the
/// sheet's shape. Every size here is the phone's, times `scale`, so a sheet set across a wider
/// window is the same page with larger type, not a small page lost on a large sheet.
private struct SheetPage: View {
	let content: TileContent
	/// The lead photo, or nil to draw the placeholder in its place
	let photo: UIImage?
	let scheme: ColorScheme
	/// How many times the phone's sizes the page's type and spacing are
	let scale: CGFloat
	/// The whole sheet's size
	let size: CGSize

	private var palette: PaperPalette { PaperPalette(scheme) }

	/// A tile whose lead has a photo keeps the photo's layout while the photo's address is unknown or
	/// the photo fails to load, drawing the placeholder in its place: the words that fill a photo-less
	/// tile below its fold are fetched only for a lead with no photo at all.
	private var hasPhoto: Bool { content.hasPhoto }

	private var isTop: Bool { content.layout != .grid }

	/// The page's margin inside the sheet's edges
	private var margin: CGFloat { 7 * scale }

	/// The story's type on the top tile
	private var bodySize: CGFloat { 4.6 * scale }

	var body: some View {
		page
			.padding(margin)
			.frame(width: size.width, height: size.height, alignment: .topLeading)
			.overlay { wordsBelowFold }
	}

	/// A grid tile with no photo keeps its headline above the fold and sets its lead story in two
	/// columns below it.
	@ViewBuilder private var wordsBelowFold: some View {
		if content.layout == .grid, !hasPhoto, !content.paragraphs.isEmpty {
			let top = size.height * foldLine + 5 * scale
			ColumnText(
				paragraphs: content.paragraphs, columns: 2,
				ink: palette.ink, rule: palette.columnRule, size: 3.4 * scale)
				.frame(width: size.width - margin * 2, height: max(size.height - top - margin, 0))
				.position(x: size.width / 2, y: top + max(size.height - top - margin, 0) / 2)
				.allowsHitTesting(false)
		}
	}

	@ViewBuilder private var page: some View {
		switch content.layout {
		case .grid: gridContent
		case .topPortrait: topPortraitContent
		case .topLandscape, .topBroadsheet: topWideContent
		}
	}

	private var header: some View {
		VStack(spacing: 3 * scale) {
			Text(content.nameplate)
				.font(.system(size: (isTop ? 20 : 12) * scale, weight: .bold, design: .serif))
				.lineLimit(1)
				.minimumScaleFactor(0.7)
			rule(1)
			Text(content.date)
				.font(.system(size: (isTop ? 10 : 8) * scale))
				.textCase(.uppercase)
				.kerning(0.8 * scale)
			if content.special {
				Text("Special Edition")
					.font(.system(size: (isTop ? 10 : 8) * scale, weight: .heavy))
					.textCase(.uppercase)
					.kerning(scale)
					.foregroundStyle(palette.special)
			}
			rule(0.5)
		}
		.foregroundStyle(palette.ink)
		.frame(maxWidth: .infinity)
	}

	private func rule(_ thickness: CGFloat) -> some View {
		Rectangle().fill(palette.rule).frame(height: thickness * scale)
	}

	private func headline(size: CGFloat, lines: Int) -> Headline {
		Headline(text: content.title, size: size * scale, lines: lines, color: palette.ink)
	}

	/// A grid tile: photo and a headline that always has room for three lines, or, with no photo,
	/// a larger headline of up to six.
	private var gridContent: some View {
		VStack(alignment: .leading, spacing: 5 * scale) {
			header
			if hasPhoto {
				photoView
				headline(size: 11, lines: 3)
					.frame(height: 11 * 1.2 * 3 * scale, alignment: .top)
			} else {
				headline(size: 16, lines: 6)
					.padding(.top, 5 * scale)
				Spacer(minLength: 0)
			}
		}
	}

	/// The tall sheet: the headline across it, the photo over two columns, the story flowing
	/// under it and down the third. With no photo the story takes all three from the top.
	private var topPortraitContent: some View {
		VStack(alignment: .leading, spacing: 6 * scale) {
			header
			headline(size: hasPhoto ? 18 : 22, lines: 3)
			GeometryReader { proxy in
				let gutter = bodySize * 2
				let column = (proxy.size.width - gutter * 2) / 3
				let photoHeight = hasPhoto ? min(proxy.size.height * 0.62, (column * 2 + gutter) * 0.75) : 0
				let underPhoto = photoHeight + 5 * scale
				ZStack(alignment: .topLeading) {
					ColumnText(
						paragraphs: content.paragraphs, columns: 3,
						tops: hasPhoto ? [underPhoto, underPhoto] : [],
						ink: palette.ink, rule: palette.columnRule, size: bodySize)
					if hasPhoto {
						photoView.frame(width: column * 2 + gutter, height: photoHeight)
					}
				}
			}
		}
	}

	/// A wide sheet, strip or broadsheet, a front page: the photo over the left two of four columns and
	/// the headline over the right two, the story flowing under both from the left. With no photo
	/// the headline runs across the sheet and the story takes all four from under it.
	private var topWideContent: some View {
		VStack(alignment: .leading, spacing: 6 * scale) {
			header
			if !hasPhoto {
				headline(size: 22, lines: 2)
			}
			GeometryReader { proxy in
				let gutter = bodySize * 2
				let column = (proxy.size.width - gutter * 3) / 4
				let half = column * 2 + gutter
				let photoHeight = min(proxy.size.height * 0.72, half * 0.62)
				let lead = headline(size: 17, lines: 4)
				let underPhoto = photoHeight + 5 * scale
				let underHeadline = lead.height(width: half) + 5 * scale
				ZStack(alignment: .topLeading) {
					ColumnText(
						paragraphs: content.paragraphs, columns: 4,
						tops: hasPhoto ? [underPhoto, underPhoto, underHeadline, underHeadline] : [],
						ink: palette.ink, rule: palette.columnRule, size: bodySize)
					if hasPhoto {
						photoView.frame(width: half, height: photoHeight)
						lead.frame(width: half).offset(x: half + gutter)
					}
				}
			}
		}
	}

	/// The lead photo as newsprint prints one: faded and grainy, soft at the edges, and toned as the
	/// reader chose; by default greyscale in Dark Mode. It sits still in its frame, as a photo drawn into the tile's cached image must.
	private var photoView: some View {
		GeometryReader { proxy in
			if let photo {
				Image(uiImage: photo)
					.resizable()
					.scaledToFill()
					.modifier(PhotoTint(tone: content.photoTone, scheme: scheme))
					// Cropped a little inside the frame, as the photo has always been.
					.scaleEffect(1.12)
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
				center: .center, startRadius: 0, endRadius: 140 * scale))
		.accessibilityHidden(true)
	}
}

/// The tone of a tile's lead photo. Automatic follows the appearance, near full color in Light
/// Mode and greyscale in Dark; Color keeps Light Mode's tone in both; Sepia is greyscale under a warm
/// multiply, as an old newspaper's photo, in both.
private struct PhotoTint: ViewModifier {
	let tone: PhotoTone
	let scheme: ColorScheme

	/// The warm paper tone a greyscale photo is multiplied by for sepia.
	private static let sepia = Color(red: 0.96, green: 0.80, blue: 0.58)

	@ViewBuilder
	func body(content: Content) -> some View {
		switch tone {
		case .auto:
			content
				.grayscale(scheme == .dark ? 1 : 0.3)
				.contrast(0.88)
				.brightness(scheme == .dark ? -0.05 : 0.04)
		case .color:
			content
				.grayscale(0.3)
				.contrast(0.88)
				.brightness(0.04)
		case .sepia:
			content
				.grayscale(1)
				.colorMultiply(Self.sepia)
				.contrast(0.88)
				.brightness(scheme == .dark ? -0.02 : 0.04)
		}
	}
}
