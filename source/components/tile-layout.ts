/// Gap between the screen edge and the tiles.
export const SCREEN_MARGIN = 16

/// SwiftUI has no "fill the available width" constant reachable from JS, so we
/// cap the frame at a width no phone reaches and let the stack divide the space.
export const FILL_WIDTH = 10_000

/// Gap between tiles, both within a column and between columns. Every tile grid
/// shares it -- home, Directory, Maps and Student Work -- so they sit at one rhythm.
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
/// grows from there (React Native's table is in `RCTUtils.mm`): 1.2 falls
/// between xLarge (1.118) and xxLarge (1.235), so xxLarge is the first size
/// with three columns, and 1.6 between xxxLarge (1.353) and AX1 (1.786), the
/// first accessibility size. Floored at two rather than one: a single column
/// stops being a grid at all, and two still reads as one even at the largest
/// accessibility size (AX5, `fontScale` 3.571).
export function columnsForFontScale(fontScale: number): number {
	if (fontScale < 1.2) return 4
	if (fontScale < 1.6) return 3
	return 2
}

/// The width of one tile in a row of `columns`, with `TILE_SPACING` between.
function tileWidth(rowWidth: number, columns: number): number {
	return (rowWidth - (columns - 1) * TILE_SPACING) / columns
}

/// The grid a screen draws when someone picks Grid from its layout menu:
/// three cards a row, each as tall as a square in the four-column grid, so a
/// row costs no more height than the four-column one did and the extra width
/// goes to the label. At an accessibility size it follows `columnsForFontScale`
/// down to two, and the cards go back to squares -- a card two abreast at a
/// four-column height is too short for an icon at that size.
export function wideGridShape(
	rowWidth: number,
	fontScale: number,
): {columns: number; ratio: number} {
	let columns = Math.min(3, columnsForFontScale(fontScale))
	if (columns < 3) return {columns, ratio: 1}
	return {columns, ratio: tileWidth(rowWidth, 3) / tileWidth(rowWidth, 4)}
}

/// Home's cards carry a headline-sized title, longer than the other grids'
/// labels, so they start at two abreast rather than four and hold there up to
/// xxxLarge, where a long title wraps onto a second line. From AX1 (the same
/// 1.6 breakpoint as `columnsForFontScale`'s last) two cards leave a title only
/// a few letters a line, so each card takes the full width.
export function homeColumnsForFontScale(fontScale: number): number {
	return fontScale < 1.6 ? 2 : 1
}

/// Groups a flat list into the rows a SwiftUI Grid wants: its API takes
/// children pre-split into `Grid.Row`s rather than a flat list. `columns`
/// varies with Dynamic Type (see `columnsForFontScale`), so it is a parameter
/// rather than a closed-over constant. Generic over the row type -- each
/// caller supplies its own item shape (`ContactType`, `DirectoryItem`,
/// ...).
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
