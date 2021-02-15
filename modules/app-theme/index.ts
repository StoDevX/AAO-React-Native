import {createTheming} from '@callstack/react-theme-provider'
import type {ThemingType} from '@callstack/react-theme-provider'

let {ThemeProvider, withTheme, useTheme} = createTheming(undefined) as ThemingType<
	AppTheme | undefined
>

export {ThemeProvider, withTheme, useTheme}

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

let theme: AppTheme

export function setTheme(newTheme: AppTheme): void {
	theme = newTheme

	const result: ThemingType<AppTheme> = createTheming(newTheme)

	ThemeProvider = result.ThemeProvider
	withTheme = result.withTheme
	useTheme = result.useTheme
}

export function getTheme(): AppTheme {
	return theme
}
