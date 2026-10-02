import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, Rectangle} from '@expo/ui/swift-ui'
import {foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import tinycolor from 'tinycolor2'

import type {RadioLogo} from '../theme'

/** The fill for a logo without a tint of its own. Every station's logos have one today. */
const UNTINTED = '#48484a'

/** How much darker the bottom of the fill is than the logo's tint. */
const FILL_DARKENING = 25

/** The full player's background: the logo's tint, darkening downward, as Music's art-coloured fill. */
export function tintGradient(logo: RadioLogo): {
	type: 'linearGradient'
	colors: string[]
	startPoint: {x: number; y: number}
	endPoint: {x: number; y: number}
} {
	let tint = logo.theme.tintColor ?? UNTINTED
	return {
		type: 'linearGradient',
		colors: [tint, tinycolor(tint).darken(FILL_DARKENING).toHexString()],
		startPoint: {x: 0.5, y: 0},
		endPoint: {x: 0.5, y: 1},
	}
}

/** The tint fill behind a React Native screen, filling it edge to edge. */
export function TintFill({logo}: {logo: RadioLogo}): React.ReactNode {
	return (
		<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Rectangle modifiers={[foregroundStyle(tintGradient(logo))]} />
		</Host>
	)
}
