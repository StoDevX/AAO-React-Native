import {DynamicColorIOS, type ColorValue, type ImageResolvedAssetSource} from 'react-native'
import {createTheming} from '@callstack/react-theme-provider'
import * as c from '@frogpond/colors'
import tinycolor from 'tinycolor2'

export type PlayerTheme = {
	tintColor?: string
	buttonTextColor?: string
	textColor?: ColorValue
}

/** One of a station's logos, and the colours its screen takes while it shows. */
export type RadioLogo = {
	/** How VoiceOver tells this logo from the station's others. */
	name: string
	image: ImageResolvedAssetSource
	theme: PlayerTheme
	/** The paper of the record's centre label, behind the logo. */
	labelColor: string
	/** How much of the label's width the logo takes; 0.8 when unset. */
	labelScale?: number
}

/**
 * A theme drawn in one tint: the buttons take it, and the button text is
 * whichever of white or black reads better on it. The title and station name
 * take it too in light mode, and turn white in Dark Mode, where a tint dark
 * enough for white button text reads dimly against black.
 */
export function tintedTheme(tintColor: string): PlayerTheme {
	return {
		tintColor,
		buttonTextColor: tinycolor.mostReadable(tintColor, [c.white, c.black]).toRgbString(),
		textColor: DynamicColorIOS({light: tintColor, dark: c.white}),
	}
}

const defaultTheme: PlayerTheme = {
	tintColor: '#000',
	buttonTextColor: '#fff',
	textColor: '#000',
}

export const theming = createTheming<PlayerTheme>(defaultTheme)
