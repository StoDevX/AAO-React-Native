import {createTheming} from '@callstack/react-theme-provider'

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

export const theming = createTheming<PlayerTheme>(defaultTheme)
