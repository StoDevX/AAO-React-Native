import {Image, type ImageResolvedAssetSource} from 'react-native'
import rawOldMain from './old-main.png'
import rawWindmill from './windmill.png'

const oldMain = Image.resolveAssetSource(rawOldMain)
const windmill = Image.resolveAssetSource(rawWindmill)

export const icons = {
	oldMain,
	windmill,
} as const

export const defaultIcon = icons.windmill

export const iosToNamedIconsMap: {[key: string]: keyof typeof icons} = {
	// eslint-disable-next-line camelcase
	icon_type_old_main: 'oldMain',
	default: 'windmill',
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
