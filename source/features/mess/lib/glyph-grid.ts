/** Apple's smallest comfortable tap target, in points. */
export const TAP_TARGET = 44

/** The gap between glyph cells, across and down. */
export const GLYPH_SPACING = 4

/** The fewest glyphs to a row; any fewer and the grid would be a list. */
const FEWEST_PER_ROW = 2

/** Row lengths that divide the twelve signs evenly, widest first. */
const ROW_LENGTHS = [6, 4, 3, FEWEST_PER_ROW]

/**
 * The height of a glyph's line at each accessibility text size, in points, keyed by the
 * least `fontScale` of that size. React Native's `fontScale` follows the body style, not
 * the glyphs' title 2, and outgrows it (3.571 at AX5, where title 2 grows only from 22pt
 * to 56pt), so it picks a size rather than scaling a length. Each threshold sits midway
 * between two sizes' scales in `RCTFontSizeMultiplier`: AX2 2.143, AX3 2.643, AX4 3.143,
 * AX5 3.571. The heights are the serif title 2 line as the simulator lays it out. Below
 * AX2 the line is shorter than a tap target, so the target sets the cell.
 */
const GLYPH_LINE_HEIGHTS = [
	{fontScale: 3.357, height: 67},
	{fontScale: 2.893, height: 60},
	{fontScale: 2.393, height: 53},
	{fontScale: 1.965, height: 47},
]

/** The narrowest a glyph's cell can be: a tap target, or the glyph's line if taller. */
function smallestCell(fontScale: number): number {
	let line = GLYPH_LINE_HEIGHTS.find((size) => fontScale >= size.fontScale)
	return Math.max(TAP_TARGET, line?.height ?? 0)
}

/**
 * How many zodiac glyphs to put in each row of a grid spanning `columnWidth`, at React
 * Native's `fontScale`. Each cell must be as wide as it is tall, so the chosen sign's
 * circle holds its glyph, and no narrower than a tap target. The rows always come out
 * even, and never fewer than two to a row.
 */
export function glyphsPerRow(columnWidth: number, fontScale: number): number {
	let cell = smallestCell(fontScale)
	let fits = ROW_LENGTHS.find(
		(count) => (columnWidth - GLYPH_SPACING * (count - 1)) / count >= cell,
	)
	return fits ?? FEWEST_PER_ROW
}
