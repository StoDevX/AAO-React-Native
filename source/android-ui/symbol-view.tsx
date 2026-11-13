import * as React from 'react'
import type {StyleProp, ViewStyle} from 'react-native'

import {Host} from '@expo/ui/jetpack-compose'
import type {SymbolViewProps} from 'expo-symbols'

import {resolveColor, usePalette} from './colors'
import {SymbolIcon} from './components/image'

/** The size `SymbolView` draws at when given none. */
const DEFAULT_SIZE = 24

/**
 * `expo-symbols`' `SymbolView` on Android. Upstream draws a Material Symbol
 * only for an `android` name, and the screens name SF Symbols alone, so the
 * radio's actions, its play button and volume ends, the FAQ banner's icon and
 * the lists' disclosure arrows drew nothing. This draws the SF Symbol's
 * Material counterpart from `symbol-table.ts`, the same glyph the rest of the
 * Android UI uses for that name, tinted as asked.
 *
 * Metro substitutes this for `expo-symbols` on Android (see
 * `metro.config.js`).
 */
export function SymbolView({
	name,
	size = DEFAULT_SIZE,
	tintColor,
	style,
}: SymbolViewProps): React.ReactNode {
	let palette = usePalette()
	let sfName = typeof name === 'string' ? name : name.ios
	let hostStyle: StyleProp<ViewStyle> = [{width: size, height: size}, style]
	return (
		<Host matchContents={true} style={hostStyle}>
			<SymbolIcon color={resolveColor(tintColor, palette)} name={sfName} size={size} />
		</Host>
	)
}
