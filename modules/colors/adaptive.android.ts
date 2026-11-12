import {PlatformColor, type ColorValue} from 'react-native'

import type {AdaptiveColorName} from './adaptive-colors'

/**
 * One of `ADAPTIVE_COLORS`, as the colour resource plugins/with-material-theme
 * writes for it. Android picks its night variant in dark mode.
 */
export function adaptiveColor(name: AdaptiveColorName): ColorValue {
	return PlatformColor(`@color/${name}`)
}
