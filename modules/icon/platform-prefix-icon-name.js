// @flow

import {Platform} from 'react-native'
import {Icon, type Glyphs} from './source'

export function platformPrefixIconName(name: string): Glyphs {
	let isAvailable = Icon.hasIcon(name)
	let isAvailableOnBothPlatforms =
		Icon.hasIcon(`ios-${name}`) && Icon.hasIcon(`md-${name}`)

	if (isAvailable && !isAvailableOnBothPlatforms) {
		return (name: any)
	}

	let resolvedName: any = Platform.OS === 'ios' ? `ios-${name}` : `md-${name}`

	return resolvedName
}
