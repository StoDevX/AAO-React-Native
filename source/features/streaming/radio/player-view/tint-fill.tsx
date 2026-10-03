import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, Rectangle} from '@expo/ui/swift-ui'
import {foregroundStyle, ignoreSafeArea} from '@expo/ui/swift-ui/modifiers'
import tinycolor from 'tinycolor2'

import type {RadioLogo} from '../theme'

/** How much darker the bottom of the fill is than the logo's tint. */
const FILL_DARKENING = 25

/** The full player's background: the logo's tint, darkening downward, as Music's art-coloured fill. */
export function tintGradient(logo: RadioLogo): {
	type: 'linearGradient'
	colors: string[]
	startPoint: {x: number; y: number}
	endPoint: {x: number; y: number}
} {
	return {
		type: 'linearGradient',
		colors: [logo.tint, tinycolor(logo.tint).darken(FILL_DARKENING).toHexString()],
		startPoint: {x: 0.5, y: 0},
		endPoint: {x: 0.5, y: 1},
	}
}

/** The tint fill behind a React Native screen, filling it edge to edge. */
export function TintFill({logo}: {logo: RadioLogo}): React.ReactNode {
	return (
		<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
			{/* SwiftUI keeps to the safe area, which on a tab screen ends at the
			    tab bar; the fill runs under it. */}
			<Rectangle modifiers={[foregroundStyle(tintGradient(logo)), ignoreSafeArea()]} />
		</Host>
	)
}
