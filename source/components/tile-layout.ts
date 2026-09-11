/// Matches the home grid's gap, so the two screens sit at the same rhythm.
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
