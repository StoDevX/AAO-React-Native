import {createTheming, ThemingType} from '@callstack/react-theme-provider'

export type PlayerTheme = {
	tintColor?: string
	buttonTextColor?: string
	textColor?: string
	imageBorderColor?: string
	imageBackgroundColor?: string
}

const defaultTheme: PlayerTheme = {
	tintColor: '#000',
	buttonTextColor: '#fff',
	textColor: '#000',
	imageBorderColor: '#000',
	imageBackgroundColor: 'transparent',
}

let {ThemeProvider, withTheme, useTheme} = createTheming(
	defaultTheme,
) as ThemingType<PlayerTheme>

export {ThemeProvider, withTheme, useTheme}
