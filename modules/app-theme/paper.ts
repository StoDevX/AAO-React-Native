import merge from 'deepmerge'

import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native'

import {
	DarkTheme as PaperDarkTheme,
	DefaultTheme as PaperDefaultTheme,
} from 'react-native-paper'

export const CombinedDefaultTheme = merge(
	PaperDefaultTheme,
	NavigationDefaultTheme,
)

export const CombinedDarkTheme = merge(PaperDarkTheme, NavigationDarkTheme)
