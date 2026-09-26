/// An Hours accent bar's width at the default text size, and the most it
/// grows to: past 8pt it would crowd the 16pt margin it is centred in.
const BASE_WIDTH = 4
const MAX_WIDTH = 8

/**
 * How wide an accent bar draws at a text size, given as React Native's
 * `fontScale`. It grows with the text, so it still reads beside large type,
 * but never thins below its default.
 */
export function accentBarWidth(fontScale: number): number {
	return Math.min(MAX_WIDTH, Math.max(BASE_WIDTH, BASE_WIDTH * fontScale))
}
