import tinycolor from 'tinycolor2'
import {black, white} from './colors'

/**
 * Given a background and a set of foreground colors, returns the first
 * foreground color that is readable (at WCAG AA-Small), or black/white if
 * none of the options were readable.
 */
export function firstReadable(
	background: string,
	possibilities: Array<string>,
): string {
	for (let colorString of possibilities) {
		let color = tinycolor(colorString)
		if (tinycolor.isReadable(color, background)) {
			return color.toRgbString()
		}
	}
	return tinycolor.mostReadable(background, [black, white]).toRgbString()
}
