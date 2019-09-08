// @flow

export const icons = {
	oldMain: require('./old-main.png'),
	windmill: require('./windmill.png'),
}

export const defaultIcon = icons.oldMain

// eslint-disable camelcase
export const iosToNamedIconsMap: {[key: string]: $Keys<typeof icons>} = {
	icon_type_windmill: 'windmill',
	default: 'oldMain',
}
// eslint-enable camelcase

export function lookup(iosIconName: $Keys<typeof iosToNamedIconsMap>): number {
	let iconName = iosToNamedIconsMap[iosIconName]
	if (!iconName) {
		return defaultIcon
	}

	let icon = icons[iconName]
	if (!icon) {
		return defaultIcon
	}

	return icon
}
