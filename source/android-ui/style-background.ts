import type {StyleProp, ViewStyle} from 'react-native'

/**
 * The background a style ends up with: the last one set, reading into nested
 * lists, as flattening the style would give.
 *
 * `StyleSheet.flatten` would answer this too, but Expo's web typings
 * (`expo/types`, which the generated `expo-env.d.ts` loads) add web-only
 * fields to `ViewStyle` that its parameter type no longer accepts.
 */
export function backgroundColorOf(style: StyleProp<ViewStyle>): ViewStyle['backgroundColor'] {
	if (!style) {
		return undefined
	}
	if (!isStyleList(style)) {
		return style.backgroundColor
	}
	for (let index = style.length - 1; index >= 0; index--) {
		let color = backgroundColorOf(style[index])
		if (color !== undefined) {
			return color
		}
	}
	return undefined
}

function isStyleList(
	style: ViewStyle | ReadonlyArray<StyleProp<ViewStyle>>,
): style is ReadonlyArray<StyleProp<ViewStyle>> {
	return Array.isArray(style)
}
