import * as c from '@frogpond/colors'
import {ColorValue} from 'react-native'

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

// systemYellow (the fallback background for "Opening/Closing Soon") stays
// bright in dark mode, so the dynamic `label` color -- white in dark mode --
// is illegible against it. Use a fixed dark color instead of a dynamic one.
export const getAccentTextColor = (openStatus: string): ColorValue =>
	FG_COLORS[openStatus] ?? c.black
