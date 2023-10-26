import {ColorValue} from 'react-native'

import * as c from '@frogpond/colors'

export const BG_COLORS: Record<string, ColorValue> = {
	Open: c.systemGreen,
	Closed: c.systemRed,
}

export const FG_COLORS: Record<string, ColorValue> = {
	Open: c.label,
	Closed: c.label,
}

export const getAccentBackgroundColor = (openStatus: string): ColorValue =>
	BG_COLORS[openStatus] ?? c.systemYellow

export const getAccentTextColor = (openStatus: string): ColorValue =>
	FG_COLORS[openStatus] ?? c.label
