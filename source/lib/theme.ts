import tinycolor from 'tinycolor2'
import {sto} from './colors'
import {firstReadable} from '@frogpond/colors'
import type {AppTheme} from '@frogpond/app-theme'

/**
 * The primary color of the app.
 */
export const accent = sto.gold

// When you change this for iOS, you also need to update the RGB values in
// `/ios/AllAboutOlaf/LaunchScreen.storyboard`; you'll need to edit
// <color key="backgroundColor"/> and <color key="tintColor"/> in <view>,
// and <color key="tintColor"/> and <color key="barTintColor"/> in <navigationBar/>.
export const navigationBackground = accent
export const navigationForeground = firstReadable(navigationBackground, [
	sto.black,
	sto.white,
])

export const buttonBackground = accent
export const buttonForeground = firstReadable(buttonBackground, [
	sto.black,
	sto.white,
])

export const toolbarButtonBackground = buttonBackground
export const toolbarButtonForeground = buttonForeground

export const iosPushButtonCellBackground = sto.white
export const iosPushButtonCellForeground = firstReadable(
	iosPushButtonCellBackground,
	[accent, sto.black, sto.white],
)

// Background color when the switch is turned on.
export const switchTintOn = accent
// Border color on iOS when the switch is turned off.
export const switchTintOff = undefined

// not used in the gui; just used for calculations
const iosTabBarBackground = '#F7F7F7'
export const iosTabBarActiveColor = sto.purple

export const statusBarStyle = (
	tinycolor.isReadable('#000', navigationBackground)
		? 'dark-content'
		: 'light-content'
) as 'dark-content' | 'light-content'

export const themeObject: AppTheme = {
	accent,
	navigationBackground,
	navigationForeground,
	buttonBackground,
	buttonForeground,
	toolbarButtonBackground,
	toolbarButtonForeground,
	iosPushButtonCellBackground,
	iosPushButtonCellForeground,
	switchTintOn,
	switchTintOff,
	iosTabBarBackground,
	iosTabBarActiveColor,
	statusBarStyle,
}
