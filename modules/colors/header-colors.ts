/**
 * Utilities for converting tile gradient colors to header-compatible formats.
 *
 * The tile gradients are Display P3 CSS strings, but navigation headers need
 * standard hex colors. This module handles the conversion and luminance-based
 * tint color selection.
 */

/**
 * Converts a Display P3 CSS color to a hex string for use in navigation headers.
 *
 * P3 colors outside sRGB gamut are clamped to the nearest sRGB value.
 */
export function p3ToHex(p3Css: string): string {
	let match = p3Css.match(
		/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/iu,
	)
	if (!match) {
		return '#888888'
	}

	let [, rStr, gStr, bStr] = match
	let [r, g, b] = [rStr, gStr, bStr].map((s) => {
		let v = Number(s)
		let clamped = Math.max(0, Math.min(1, v))
		return Math.round(clamped * 255)
	})

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Determines whether white or black text has better contrast against a
 * Display P3 background color.
 *
 * Uses relative luminance (WCAG 2.1) with a threshold of 0.5.
 */
export function getTintColorForP3(p3Css: string): '#fff' | '#000' {
	let match = p3Css.match(
		/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/iu,
	)
	if (!match) {
		return '#fff'
	}

	let [, rStr, gStr, bStr] = match
	let [r, g, b] = [rStr, gStr, bStr].map(Number)

	let toLinear = (c: number) =>
		c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
	let luminance =
		0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

	return luminance > 0.5 ? '#000' : '#fff'
}

export type HeaderColors = {
	backgroundColor: string
	tintColor: '#fff' | '#000'
}

/**
 * Converts a P3 gradient's outer color to header-compatible colors.
 */
export function gradientToHeaderColors(
	gradient: [string, string],
): HeaderColors {
	let outerColor = gradient[1]
	return {
		backgroundColor: p3ToHex(outerColor),
		tintColor: getTintColorForP3(outerColor),
	}
}
