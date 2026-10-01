import merge from 'deepmerge'
import * as c from '@frogpond/colors'

import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationLightTheme,
} from 'expo-router/react-navigation'

import {MD3DarkTheme as PaperDarkTheme, MD3LightTheme as PaperLightTheme} from 'react-native-paper'

/**
 * iOS's `systemGroupedBackground`, which the app's screens and sheets paint.
 * React Navigation draws its own background behind every screen -- a flat
 * grey in light mode, and black in dark -- which shows wherever a screen
 * paints nothing, so the theme takes the system's colour instead.
 *
 * The system colour rather than its usual value: in a dark sheet it lightens
 * to match the sheet's raised rows, which no fixed colour can. The themes'
 * colours are typed as strings, but React Navigation only hands `background`
 * to a style, where a `PlatformColor` works.
 */
const groupedBackground = c.systemGroupedBackground as unknown as string

const MergedLightTheme = merge(PaperLightTheme, NavigationLightTheme)
const MergedDarkTheme = merge(PaperDarkTheme, NavigationDarkTheme)

export const CombinedLightTheme = {
	...MergedLightTheme,
	colors: {...MergedLightTheme.colors, background: groupedBackground},
}

export const CombinedDarkTheme = {
	...MergedDarkTheme,
	colors: {...MergedDarkTheme.colors, background: groupedBackground},
}
