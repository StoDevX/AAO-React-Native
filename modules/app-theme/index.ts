import {createTheming} from '@callstack/react-theme-provider'
export {CombinedLightTheme, CombinedDarkTheme} from './paper'

export type AppTheme = {
	accent: string
	androidListHeaderBackground: string
	androidListHeaderForeground: string
	androidStatusBarColor: string
	androidTabBarBackground: string
	androidTabBarForeground: string
	buttonBackground: string
	buttonForeground: string
	iosPushButtonCellBackground: string
	iosPushButtonCellForeground: string
	iosTabBarActiveColor: string
	iosTabBarBackground: string
	navigationBackground: string
	navigationForeground: string
	statusBarStyle: 'dark-content' | 'light-content'
	switchThumbTint?: string
	switchTintOff?: string
	switchTintOn?: string
	toolbarButtonBackground: string
	toolbarButtonForeground: string
}

let defaultTheme: AppTheme = {
	accent: '#000',
	androidListHeaderBackground: '#fff',
	androidListHeaderForeground: '#000',
	androidStatusBarColor: '#000',
	androidTabBarBackground: '#fff',
	androidTabBarForeground: '#000',
	buttonBackground: '#000',
	buttonForeground: '#fff',
	iosPushButtonCellBackground: '#000',
	iosPushButtonCellForeground: '#fff',
	iosTabBarActiveColor: '#0f0',
	iosTabBarBackground: '#000',
	navigationBackground: '#000',
	navigationForeground: '#fff',
	statusBarStyle: 'light-content',
	toolbarButtonBackground: '#000',
	toolbarButtonForeground: '#fff',
}

let theme: AppTheme

let ThemeProvider: ReturnType<typeof createTheming<AppTheme>>['ThemeProvider']
let withTheme: ReturnType<typeof createTheming<AppTheme>>['withTheme']
let useTheme: ReturnType<typeof createTheming<AppTheme>>['useTheme']

export function setTheme(newTheme: AppTheme): void {
	theme = newTheme

	const result = createTheming<AppTheme>(newTheme)

	ThemeProvider = result.ThemeProvider
	withTheme = result.withTheme
	useTheme = result.useTheme
}

export function getTheme(): AppTheme {
	return theme
}

// initialize
setTheme(defaultTheme)

export {ThemeProvider, withTheme, useTheme}
