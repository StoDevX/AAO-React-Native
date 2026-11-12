import {Platform, type ColorValue} from 'react-native'
import * as c from '@frogpond/colors'

import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationLightTheme,
} from 'expo-router/react-navigation'

/** React Navigation's theme colours, as both of its themes carry them. */
type ThemeColors = typeof NavigationLightTheme.colors

/**
 * A `@frogpond/colors` colour as a theme colour. The themes' colours are typed
 * as strings, but React Navigation only hands them to styles and to the native
 * stack's header, where a `PlatformColor` works.
 */
function themeColor(color: ColorValue): string {
	return color as unknown as string
}

/**
 * iOS's `systemGroupedBackground`, which the app's screens and sheets paint.
 * React Navigation draws its own background behind every screen -- a flat
 * grey in light mode, and black in dark -- which shows wherever a screen
 * paints nothing, so the theme takes the system's colour instead.
 *
 * The system colour rather than its usual value: in a dark sheet it lightens
 * to match the sheet's raised rows, which no fixed colour can.
 */
const groupedBackground = themeColor(c.systemGroupedBackground)

/**
 * Android's whole theme, from Material roles read off the app's Material 3
 * theme, so every native-stack header is a Material top app bar: `surface`
 * behind `onSurface` titles and icons, with `primary` for the accent. The
 * roles follow the wallpaper's dynamic colours and light and dark, so one set
 * serves both themes. `@frogpond/colors` exports each role on Android under
 * the iOS name that plays the same part.
 */
const ANDROID_COLORS: Partial<ThemeColors> = {
	primary: themeColor(c.link),
	background: groupedBackground,
	card: themeColor(c.systemBackground),
	text: themeColor(c.label),
	border: themeColor(c.separator),
	notification: themeColor(c.systemRed),
}

/** The colours each theme takes over React Navigation's own. */
const OVERRIDES: Partial<ThemeColors> =
	Platform.OS === 'android' ? ANDROID_COLORS : {background: groupedBackground}

export const LightTheme = {
	...NavigationLightTheme,
	colors: {...NavigationLightTheme.colors, ...OVERRIDES},
}

export const DarkTheme = {
	...NavigationDarkTheme,
	colors: {...NavigationDarkTheme.colors, ...OVERRIDES},
}
