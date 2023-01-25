import * as React from 'react'
import {
	Platform,
	StyleProp,
	StyleSheet,
	TextStyle,
	ViewStyle,
} from 'react-native'
import BasicButton from 'react-native-button'
import noop from 'lodash/noop'
import {iOSUIKit, material} from 'react-native-typography'
import {useTheme} from '@frogpond/app-theme'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	button: {
		alignSelf: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
		marginVertical: 10,
		borderRadius: 6,
		overflow: 'hidden',
	},
	disabled: {
		backgroundColor: c.secondaryBackground,
	},
	text: {
		...Platform.select({
			ios: iOSUIKit.calloutWhiteObject,
			android: material.buttonWhiteObject,
		}),
	},
	textDisabled: {
		color: c.secondaryLabel,
	},
})

const inverted = StyleSheet.create({
	text: {
		...Platform.select({
			ios: iOSUIKit.calloutObject,
			android: material.buttonObject,
		}),
	},
})

type Props = {
	title?: string
	onPress?: () => unknown
	disabled?: boolean
	buttonStyle?: StyleProp<ViewStyle>
	textStyle?: StyleProp<TextStyle>
	mode?: 'default' | 'inverted'
}

export function Button({
	title = 'Push me!',
	onPress = noop,
	disabled = false,
	buttonStyle = null,
	textStyle = null,
	mode = 'default',
}: Props): JSX.Element {
	let {colors} = useTheme()

	let background =
		mode === 'default'
			? {backgroundColor: colors.background}
			: {backgroundColor: colors.text}
	let foreground =
		mode === 'default' ? {color: colors.text} : {color: colors.background}

	const textStyleThing = mode === 'default' ? styles.text : inverted.text
	const containerStyle = [styles.button, background, buttonStyle]
	const style = [textStyleThing, foreground, textStyle]

	return (
		<BasicButton
			containerStyle={containerStyle}
			disabled={disabled}
			disabledContainerStyle={styles.disabled}
			onPress={onPress}
			style={style}
			styleDisabled={styles.textDisabled}
		>
			{Platform.OS === 'android' ? title.toUpperCase() : title}
		</BasicButton>
	)
}
