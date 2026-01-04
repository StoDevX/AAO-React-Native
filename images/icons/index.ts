import {Image, type ImageResolvedAssetSource} from 'react-native'

const oldMain = Image.resolveAssetSource(require('./old-main.png'))
const windmill = Image.resolveAssetSource(require('./windmill.png'))

export const icons = {
	oldMain,
	windmill,
} as const

export const defaultIcon = icons.oldMain

export const iosToNamedIconsMap: {[key: string]: keyof typeof icons} = {
	// eslint-disable-next-line camelcase
	icon_type_windmill: 'windmill',
	default: 'oldMain',
}

export function lookup(
	iosIconName: keyof typeof iosToNamedIconsMap,
): ImageResolvedAssetSource {
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
