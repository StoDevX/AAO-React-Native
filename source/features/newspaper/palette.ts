import {adaptiveColor} from '@frogpond/colors'
import type {Typeface} from '../../components/lib/typeface'

/** Newsprint, and warm dark paper in dark mode. */
export const paper = adaptiveColor('newspaperPaper')
/** The type on it. */
export const ink = adaptiveColor('newspaperInk')
/** Secondary type: dates, captions, bios. */
export const faded = adaptiveColor('newspaperFaded')
/** The Mess red, for kickers and links. */
export const messRed = adaptiveColor('newspaperMessRed')
/** Type on a Mess red fill: white on the deep light-mode red, dark paper on the light dark-mode red. */
export const onMessRed = adaptiveColor('newspaperOnMessRed')
/**
 * A mounted print's shadow. @expo/ui's shadow is white unless given a color, which glows on
 * dark paper; this one is darker on dark paper, where a light shadow would not show.
 */
export const printShadow = adaptiveColor('newspaperPrintShadow')
/** A tinted card or square, a shade off the paper. */
export const wash = adaptiveColor('newspaperWash')

/** The paper's type, for a shared row or header set on the paper. */
export const paperTypeface: Typeface = {
	design: 'serif',
	label: ink,
	secondaryLabel: faded,
	tint: messRed,
}
