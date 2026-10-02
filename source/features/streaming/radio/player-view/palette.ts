import * as React from 'react'
import {StyleSheet, type ColorValue, type TextStyle, type ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'

/** The player's colours: the system's on glass, and white over the tint fill, as Music's full player. */
export type Palette = {
	primary: ColorValue
	secondary: ColorValue
	tertiary: ColorValue
	styles: {
		primary: TextStyle
		secondary: TextStyle
		tertiary: TextStyle
		track: ViewStyle
	}
}

const ON_FILL = {
	primary: '#ffffff',
	secondary: 'rgba(255, 255, 255, 0.7)',
	tertiary: 'rgba(255, 255, 255, 0.4)',
	track: 'rgba(255, 255, 255, 0.25)',
}

const systemStyles = StyleSheet.create({
	primary: {color: c.label},
	secondary: {color: c.secondaryLabel},
	tertiary: {color: c.tertiaryLabel},
	track: {backgroundColor: c.tertiarySystemFill},
})

const onFillStyles = StyleSheet.create({
	primary: {color: ON_FILL.primary},
	secondary: {color: ON_FILL.secondary},
	tertiary: {color: ON_FILL.tertiary},
	track: {backgroundColor: ON_FILL.track},
})

export const SYSTEM_PALETTE: Palette = {
	primary: c.label,
	secondary: c.secondaryLabel,
	tertiary: c.tertiaryLabel,
	styles: systemStyles,
}

export const ON_FILL_PALETTE: Palette = {
	primary: ON_FILL.primary,
	secondary: ON_FILL.secondary,
	tertiary: ON_FILL.tertiary,
	styles: onFillStyles,
}

export const PaletteContext = React.createContext<Palette>(SYSTEM_PALETTE)

export function usePalette(): Palette {
	return React.useContext(PaletteContext)
}
