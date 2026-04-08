import * as React from 'react'
import {StyleProp, StyleSheet, TextStyle, ViewStyle} from 'react-native'
import BasicButton from 'react-native-button'
import noop from 'lodash/noop'
import {iOSUIKit} from 'react-native-typography'
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
		backgroundColor: c.tertiarySystemFill,
	},
	text: iOSUIKit.calloutWhiteObject,
	textDisabled: {
		color: c.secondaryLabel,
	},
})

const inverted = StyleSheet.create({
	text: iOSUIKit.calloutObject,
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
	let background = {backgroundColor: c.tertiarySystemFill}
	let foreground = {color: c.label}

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
			{title}
		</BasicButton>
	)
}
