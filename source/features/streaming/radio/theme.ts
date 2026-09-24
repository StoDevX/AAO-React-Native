import type {ColorValue} from 'react-native'
import {createTheming} from '@callstack/react-theme-provider'

export type PlayerTheme = {
	tintColor?: ColorValue
	buttonTextColor?: ColorValue
	textColor?: ColorValue
	imageBorderColor?: ColorValue
	imageBackgroundColor?: ColorValue
}

const defaultTheme: PlayerTheme = {
	tintColor: '#000',
	buttonTextColor: '#fff',
	textColor: '#000',
	imageBorderColor: '#000',
	imageBackgroundColor: 'transparent',
}

export const theming = createTheming<PlayerTheme>(defaultTheme)
