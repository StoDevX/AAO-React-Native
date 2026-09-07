import type {ContactType} from './types'

/// Matches the home grid's gap, so the two screens sit at the same rhythm.
export const TILE_SPACING = 10

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

/// Groups the contacts into the rows a SwiftUI Grid wants: its API takes
/// children pre-split into `Grid.Row`s rather than a flat list. `columns`
/// varies with Dynamic Type (see `columnsForFontScale`), so it is a parameter
/// rather than a closed-over constant.
export function inRows(contacts: ContactType[], columns: number): ContactType[][] {
	let rows: ContactType[][] = []
	for (let i = 0; i < contacts.length; i += columns) {
		rows.push(contacts.slice(i, i + columns))
	}
	return rows
}
