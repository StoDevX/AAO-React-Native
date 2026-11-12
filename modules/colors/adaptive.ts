import {DynamicColorIOS, type ColorValue} from 'react-native'

import {ADAPTIVE_COLORS, type AdaptiveColorName} from './adaptive-colors'

/** One of `ADAPTIVE_COLORS`, which follows light and dark mode. */
export function adaptiveColor(name: AdaptiveColorName): ColorValue {
	return DynamicColorIOS(ADAPTIVE_COLORS[name])
}
