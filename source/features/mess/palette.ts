import {DynamicColorIOS} from 'react-native'
import type {Typeface} from '../../components/lib/typeface'

/** Newsprint, and warm dark paper in dark mode. */
export const paper = DynamicColorIOS({light: '#FBF9F4', dark: '#1C1A17'})
/** The type on it. */
export const ink = DynamicColorIOS({light: '#1A1A1A', dark: '#EDE8DF'})
/** Secondary type: dates, captions, bios. */
export const faded = DynamicColorIOS({light: '#5C5850', dark: '#A8A196'})
/** The Mess red, for kickers and links. */
export const messRed = DynamicColorIOS({light: '#8A1C1C', dark: '#E0736B'})
/** Type on a Mess red fill: white on the deep light-mode red, dark paper on the light dark-mode red. */
export const onMessRed = DynamicColorIOS({light: '#FFFFFF', dark: '#1C1A17'})
/**
 * A mounted print's shadow. @expo/ui's shadow is white unless given a color, which glows on
 * dark paper; this one is darker on dark paper, where a light shadow would not show.
 */
export const printShadow = DynamicColorIOS({light: '#0000004D', dark: '#000000B3'})
/** A tinted card or square, a shade off the paper. */
export const wash = DynamicColorIOS({light: '#ECE7DC', dark: '#2A2723'})

/** The paper's type, for a shared row or header set on the paper. */
export const paperTypeface: Typeface = {
	design: 'serif',
	label: ink,
	secondaryLabel: faded,
	tint: messRed,
}
