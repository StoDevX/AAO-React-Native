export const icons = {
	oldMain: require('./old-main.png'),
	windmill: require('./windmill.png'),
}

export const defaultIcon = icons.oldMain

export const iosToNamedIconsMap: {[key: string]: keyof typeof icons} = {
	// eslint-disable-next-line camelcase
	icon_type_windmill: 'windmill',
	default: 'oldMain',
}

export function lookup(iosIconName: keyof typeof iosToNamedIconsMap): number {
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
