import {
	MD3DarkTheme as PaperDarkTheme,
	MD3LightTheme as PaperLightTheme,
} from 'react-native-paper'

import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationLightTheme,
} from '@react-navigation/native'

import merge from 'deepmerge'

export const CombinedLightTheme = merge(PaperLightTheme, NavigationLightTheme)

export const CombinedDarkTheme = merge(PaperDarkTheme, NavigationDarkTheme)
