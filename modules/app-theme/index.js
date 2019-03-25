// @flow

export type AppTheme = {
	accent: string,
	androidListHeaderBackground: string,
	androidListHeaderForeground: string,
	androidStatusBarColor: string,
	androidTabBarBackground: string,
	androidTabBarForeground: string,
	buttonBackground: string,
	buttonForeground: string,
	iosPushButtonCellBackground: string,
	iosPushButtonCellForeground: string,
	iosTabBarActiveColor: string,
	iosTabBarBackground: string,
	navigationBackground: string,
	navigationForeground: string,
	statusBarStyle: 'dark-content' | 'light-content',
	switchThumbTint: ?string,
	switchTintOff: ?string,
	switchTintOn: ?string,
	toolbarButtonBackground: string,
	toolbarButtonForeground: string,
}

let theme: AppTheme

export function setTheme(newTheme: AppTheme) {
	theme = newTheme
}

export function getTheme(): AppTheme {
	return theme
}
