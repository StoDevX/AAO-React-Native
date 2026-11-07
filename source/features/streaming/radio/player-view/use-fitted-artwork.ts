import * as React from 'react'
import type {LayoutChangeEvent} from 'react-native'

import {artworkSize} from './artwork-size'

/**
 * The record's size, fitted to `viewportHeight`, and the `onLayout` for the
 * player around it. What the player measures is how tall it laid out and the
 * record it laid out with, so the size follows the viewport when that arrives
 * after the player's own layout, or changes without the player's layout moving.
 */
export function useFittedArtwork({
	width,
	viewportHeight,
	minimum = 160,
}: {
	width: number
	viewportHeight: number
	minimum?: number
}): {artwork: number; onLayout: (event: LayoutChangeEvent) => void} {
	let [measured, setMeasured] = React.useState<{layoutHeight: number; artwork: number} | null>(null)
	let artwork = measured
		? artworkSize({
				width,
				minimum,
				viewportHeight,
				layoutHeight: measured.layoutHeight,
				currentArtwork: measured.artwork,
			})
		: width
	return {
		artwork,
		onLayout: (event) => {
			let layoutHeight = event.nativeEvent.layout.height
			setMeasured((current) =>
				current?.layoutHeight === layoutHeight && current.artwork === artwork
					? current
					: {layoutHeight, artwork},
			)
		},
	}
}
