/// Wide enough at the default text size for "Buntrock Commons" to wrap to two
/// lines rather than truncate, narrow enough that four cells are visible at
/// once on a 393pt screen.
const DEFAULT_CELL_WIDTH = 86

/**
 * How wide each cell on the stop strip is, given React Native's `fontScale`.
 *
 * The cell grows with text larger than the default, so a time or a stop name
 * wraps between words rather than breaking mid-word. It never shrinks below
 * the default width, so smaller text leaves the strip as it is.
 */
export function stopCellWidth(fontScale: number): number {
	return DEFAULT_CELL_WIDTH * Math.max(1, fontScale)
}
