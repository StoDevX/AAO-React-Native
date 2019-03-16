// @flow
import * as React from 'react'
import {StyleSheet, Platform} from 'react-native'
import BasicButton from 'react-native-button'
import noop from 'lodash/noop'
import {material, iOSUIKit} from 'react-native-typography'
import * as c from '@frogpond/colors'
import {useTheme} from '@frogpond/theme'

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
		backgroundColor: c.sectionBgColor,
	},
	text: {
		...Platform.select({
			ios: iOSUIKit.calloutWhiteObject,
			android: material.buttonWhiteObject,
		}),
	},
	textDisabled: {
		color: c.iosDisabledText,
	},
})

const inverted = StyleSheet.create({
	text: {
		...Platform.select({
			ios: iOSUIKit.calloutBlackObject,
			android: material.buttonBlackObject,
		}),
	},
})

type Props = {
	title?: string,
	onPress?: () => any,
	disabled?: boolean,
	buttonStyle?: any,
	textStyle?: any,
	mode?: 'default' | 'inverted',
}

export function Button({
	title = 'Push me!',
	onPress = noop,
	disabled = false,
	buttonStyle = null,
	textStyle = null,
	mode = 'default',
}: Props) {
	let theme = useTheme()

	let background =
		mode === 'default'
			? {backgroundColor: theme.buttonBackground}
			: {backgroundColor: theme.buttonForeground}
	let foreground =
		mode === 'default'
			? {color: theme.buttonForeground}
			: {color: theme.buttonBackground}

	let textStyleThing = mode === 'default' ? styles.text : inverted.text
	let containerStyle = [styles.button, background, buttonStyle]
	let style = [textStyleThing, foreground, textStyle]

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
