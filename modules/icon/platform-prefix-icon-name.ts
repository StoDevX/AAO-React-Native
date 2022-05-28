import {Platform} from 'react-native'
import {Icon} from './source'
import type {Glyphs} from './source'

export function platformPrefixIconName(name: string): Glyphs {
	const isAvailable = Icon.hasIcon(name)
	const isAvailableOnBothPlatforms =
		Icon.hasIcon(`ios-${name}`) && Icon.hasIcon(`md-${name}`)

	if (isAvailable && !isAvailableOnBothPlatforms) {
		return name as Glyphs
	}

	const resolvedName: Glyphs =
		Platform.OS === 'ios' ? (`ios-${name}` as Glyphs) : (`md-${name}` as Glyphs)

	return resolvedName
}
