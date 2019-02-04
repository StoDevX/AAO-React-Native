// @flow

import {Platform} from 'react-native'
import {Icon} from '@frogpond/icon'

export function platformPrefixIconName(name: string) {
	let isAvailable = Icon.hasIcon(name)
	let isAvailableOnBothPlatforms =
		Icon.hasIcon(`ios-${name}`) && Icon.hasIcon(`md-${name}`)

	if (isAvailable && !isAvailableOnBothPlatforms) {
		return name
	}

	return Platform.OS === 'ios' ? `ios-${name}` : `md-${name}`
}
