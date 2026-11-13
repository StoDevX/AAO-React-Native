import {Appearance, DynamicColorIOS, Platform, type ColorValue} from 'react-native'
import type {Typeface} from '../../components/lib/typeface'

/**
 * A colour that follows light and dark mode. `DynamicColorIOS` throws on
 * Android, which takes the value for the appearance the app launched in.
 */
function adaptive(colors: {light: string; dark: string}): ColorValue {
	if (Platform.OS === 'ios') {
		return DynamicColorIOS(colors)
	}
	return Appearance.getColorScheme() === 'dark' ? colors.dark : colors.light
}

/** Newsprint, and warm dark paper in dark mode. */
export const paper = adaptive({light: '#FBF9F4', dark: '#1C1A17'})
/** The type on it. */
export const ink = adaptive({light: '#1A1A1A', dark: '#EDE8DF'})
/** Secondary type: dates, captions, bios. */
export const faded = adaptive({light: '#5C5850', dark: '#A8A196'})
/** The Mess red, for kickers and links. */
export const messRed = adaptive({light: '#8A1C1C', dark: '#E0736B'})
/** Type on a Mess red fill: white on the deep light-mode red, dark paper on the light dark-mode red. */
export const onMessRed = adaptive({light: '#FFFFFF', dark: '#1C1A17'})
/**
 * A mounted print's shadow. @expo/ui's shadow is white unless given a color, which glows on
 * dark paper; this one is darker on dark paper, where a light shadow would not show.
 */
export const printShadow = adaptive({light: '#0000004D', dark: '#000000B3'})
/** A tinted card or square, a shade off the paper. */
export const wash = adaptive({light: '#ECE7DC', dark: '#2A2723'})

/** The paper's type, for a shared row or header set on the paper. */
export const paperTypeface: Typeface = {
	design: 'serif',
	label: ink,
	secondaryLabel: faded,
	tint: messRed,
}
