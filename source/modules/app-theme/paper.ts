import merge from 'deepmerge'

import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationLightTheme,
} from 'expo-router'

import {
	MD3DarkTheme as PaperDarkTheme,
	MD3LightTheme as PaperLightTheme,
} from 'react-native-paper'

export const CombinedLightTheme = merge(PaperLightTheme, NavigationLightTheme)

export const CombinedDarkTheme = merge(PaperDarkTheme, NavigationDarkTheme)
