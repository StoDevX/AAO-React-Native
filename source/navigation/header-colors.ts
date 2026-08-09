/**
 * Header color utilities for tile-colored navigation headers.
 */

import {AllViews} from '../views/views'
import {gradientToHeaderColors, type HeaderColors} from '@frogpond/colors'
import type {NativeStackNavigationOptions} from '@react-navigation/native-stack'

/**
 * Build a map from screen name to header colors,
 * derived from homescreen tile definitions.
 */
function buildScreenColorMap(): Map<string, HeaderColors> {
	let map = new Map<string, HeaderColors>()
	for (let view of AllViews()) {
		if (view.type === 'view') {
			map.set(view.view, gradientToHeaderColors(view.gradient))
		}
	}
	return map
}

const SCREEN_COLORS = buildScreenColorMap()

/**
 * Get header style options for a screen based on its tile color.
 * Returns empty object if no tile color is defined.
 */
export function headerColorsFor(
	screenName: string,
): Partial<NativeStackNavigationOptions> {
	let colors = SCREEN_COLORS.get(screenName)
	if (!colors) {
		return {}
	}
	return {
		headerStyle: {backgroundColor: colors.backgroundColor},
		headerTintColor: colors.tintColor,
	}
}
