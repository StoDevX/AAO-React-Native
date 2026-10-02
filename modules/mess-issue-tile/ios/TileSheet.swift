import SwiftUI

/// What one tile draws, copied out of its props, so the live tile and its cached image are drawn
/// from the same values.
struct TileContent {
	var title: String
	var date: String
	var special: Bool
	var hasPhoto: Bool
	var stains: [StainMark]
	var stainKind: StainKind
	var layout: TileLayout
	var paragraphs: [String]
	var sheet: SheetShape

	init(_ props: MessIssueTileProps) {
		title = props.title
		date = props.date
		special = props.special
		hasPhoto = props.hasPhoto
		stains = props.stains
		stainKind = props.stainKind
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

	/// A tile whose lead has a photo keeps the photo's layout while the photo's address is unknown or
	/// the photo fails to load, drawing the placeholder in its place: the words that fill a photo-less
	/// tile below its fold are fetched only for a lead with no photo at all.
	private var hasPhoto: Bool { content.hasPhoto }

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
			.overlay(alignment: .topLeading) {
				page.padding(7)
			}
			.overlay { wordsBelowFold }
			.background(PaperBackground(palette: palette, scheme: scheme))
			.overlay(StainLayer(marks: content.stains, kind: content.stainKind, scheme: scheme))
			.overlay(CreaseLayer(creases: content.sheet.creases, scheme: scheme))
			.overlay(FoldShade(palette: palette))
			.clipShape(outline)
			.overlay(DogEarFlap(dogEar: content.sheet.dogEar, earSize: earSize, palette: palette))
			.background(SheetEdges(palette: palette, outline: outline))
	}

	/// A grid tile with no photo keeps its headline above the fold and sets its lead story in two
	/// columns below it.
	@ViewBuilder private var wordsBelowFold: some View {
		if content.layout == .grid, !hasPhoto, !content.paragraphs.isEmpty {
			GeometryReader { proxy in
				let top = proxy.size.height * foldLine + 5
				ColumnText(
					paragraphs: content.paragraphs, columns: 2, clearedColumns: 0, clearHeight: 0,
					ink: palette.ink, rule: palette.columnRule, size: 3.4)
					.frame(width: proxy.size.width - 14, height: max(proxy.size.height - top - 7, 0))
					.offset(x: 7, y: top)
			}
			.allowsHitTesting(false)
		}
	}

	@ViewBuilder private var page: some View {
		switch content.layout {
		case .grid: gridContent
		case .topPortrait: topPortraitContent
		case .topLandscape: topLandscapeContent
		}
	}

	private var header: some View {
		VStack(spacing: 3) {
			Text("The Olaf Messenger")
				.font(.system(size: isTop ? 20 : 12, weight: .bold, design: .serif))
				.lineLimit(1)
				.minimumScaleFactor(0.7)
			rule(1)
			Text(content.date)
				.font(.system(size: isTop ? 10 : 8))
				.textCase(.uppercase)
				.kerning(0.8)
			if content.special {
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
				photoView
				Headline(text: content.title, size: 11, lines: 3, color: palette.ink)
					.frame(height: 11 * 1.2 * 3, alignment: .top)
			} else {
				Headline(text: content.title, size: 16, lines: 6, color: palette.ink)
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
			Headline(text: content.title, size: hasPhoto ? 18 : 22, lines: 3, color: palette.ink)
			GeometryReader { proxy in
				let gutter: CGFloat = 9
				let column = (proxy.size.width - gutter * 2) / 3
				let photoHeight = hasPhoto ? min(proxy.size.height * 0.62, (column * 2 + gutter) * 0.75) : 0
				ZStack(alignment: .topLeading) {
					ColumnText(
						paragraphs: content.paragraphs, columns: 3,
						clearedColumns: hasPhoto ? 2 : 0, clearHeight: photoHeight,
						ink: palette.ink, rule: palette.columnRule)
					if hasPhoto {
						photoView.frame(width: column * 2 + gutter, height: photoHeight)
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
					photoView.containerRelativeFrame(.horizontal) { width, _ in width * 0.6 }
				}
				VStack(alignment: .leading, spacing: 5) {
					Headline(text: content.title, size: hasPhoto ? 15 : 22, lines: hasPhoto ? 5 : 3, color: palette.ink)
					ColumnText(
						paragraphs: content.paragraphs, columns: hasPhoto ? 1 : 3,
						clearedColumns: 0, clearHeight: 0,
						ink: palette.ink, rule: palette.columnRule)
				}
			}
		}
	}

	/// The lead photo as newsprint prints one: faded and grainy, soft at the edges, and greyscale in
	/// Dark Mode. It sits still in its frame, as a photo drawn into the tile's cached image must.
	private var photoView: some View {
		GeometryReader { proxy in
			if let photo {
				Image(uiImage: photo)
					.resizable()
					.scaledToFill()
					.grayscale(scheme == .dark ? 1 : 0.3)
					.contrast(0.88)
					.brightness(scheme == .dark ? -0.05 : 0.04)
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
				center: .center, startRadius: 0, endRadius: 140))
		.accessibilityHidden(true)
	}
}
