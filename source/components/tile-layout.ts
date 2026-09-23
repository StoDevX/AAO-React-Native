/// Gap between the screen edge and the tiles.
export const SCREEN_MARGIN = 16

/// SwiftUI has no "fill the available width" constant reachable from JS, so we
/// cap the frame at a width no phone reaches and let the stack divide the space.
export const FILL_WIDTH = 10_000

/// Gap between tiles, both within a column and between columns. Every tile grid
/// shares it -- home, Directory and Student Orgs -- so they sit at one rhythm.
export const TILE_SPACING = 10

/// Phone.app draws a favourite a little taller than 3:2 -- 109 x 167pt,
/// measured off a screenshot of a 393pt-wide screen. The ratio is what is
/// pinned rather than the width, so the row still fills a wider phone.
export const TILE_ASPECT = 109 / 167

/// Measured from the same screenshot of Phone.app's favourites. This version
/// of @expo/ui's RoundedRectangleView has no cornerStyle prop, so the corners
/// are drawn circular regardless of any style specified in modifiers.
export const TILE_RADIUS = 26

/// A column count fixed at four fits the label at default text size but not
/// at an accessibility size: the icon and the label both grow with Dynamic
/// Type (see ICON_TEXT_STYLE), while the column width does not, so a wide
/// enough label has nowhere to go. `fontScale` is 1.0 at the default size and
/// grows from there -- 1.2 is xxLarge, the first size past the "readable"
/// range iOS calls out separately, and 1.6 is roughly AX1, the first
/// accessibility size proper. Floored at two rather than one: a single
/// column stops being a grid at all, and two still reads as one even at the
/// largest accessibility sizes this returns for (AX5, `fontScale` ~= 3.1).
export function columnsForFontScale(fontScale: number): number {
	if (fontScale < 1.2) return 4
	if (fontScale < 1.6) return 3
	return 2
}

/// Home's cards carry a headline-sized title, longer than the other grids'
/// labels, so they start at two abreast rather than four and hold there up to
/// xxxLarge. From AX1 (`fontScale` ~= 1.6, `columnsForFontScale`'s last
/// breakpoint) two cards leave a title too narrow to break between words, so
/// each card takes the full width.
export function homeColumnsForFontScale(fontScale: number): number {
	return fontScale < 1.6 ? 2 : 1
}

/// Groups a flat list into the rows a SwiftUI Grid wants: its API takes
/// children pre-split into `Grid.Row`s rather than a flat list. `columns`
/// varies with Dynamic Type (see `columnsForFontScale`), so it is a parameter
/// rather than a closed-over constant. Generic over the row type -- each
/// caller supplies its own item shape (`ContactType`, `DirectoryItem`,
/// `CategoryTileData`, ...).
export function inRows<T>(items: T[], columns: number): T[][] {
	let rows: T[][] = []
	for (let i = 0; i < items.length; i += columns) {
		rows.push(items.slice(i, i + columns))
	}
	return rows
}

/// The height a photo of the given width needs to sit at the tile's aspect.
/// Stated in points rather than left to a SwiftUI `aspectRatio` modifier
/// because a React Native image hosted in an `RNHostView` has no bounds of its
/// own: a percentage size there resolves against nothing, and the image falls
/// back to its intrinsic size and is cropped by whatever clips it.
export function photoHeight(width: number): number {
	return width / TILE_ASPECT
}
