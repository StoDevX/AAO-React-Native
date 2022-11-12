import * as React from 'react'
import {
	ActivityIndicator,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
	ViewStyle,
} from 'react-native'
import * as c from '@frogpond/colors'
import {Button} from '@frogpond/button'
import {Heading} from '@frogpond/markdown'

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 30,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: c.white,
	},
	text: {
		textAlign: 'center',
	},
	spinner: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
})

type Props = {
	buttonDisabled?: boolean
	header?: string
	text?: string
	style?: StyleProp<ViewStyle>
	spinner?: boolean
	buttonText?: string
	onPress?: () => void
	textStyle?: StyleProp<TextStyle>
}

export function NoticeView(props: Props): JSX.Element {
	let {header, text, style, textStyle} = props
	let {buttonDisabled, buttonText, onPress} = props
	let {spinner} = props

	return (
		<View style={[styles.container, style]}>
			{spinner ? <ActivityIndicator style={styles.spinner} /> : null}

			{header ? (
				<Heading level={1} style={textStyle}>
					{header}
				</Heading>
			) : null}

			<Text selectable={true} style={[styles.text, textStyle]}>
				{text || 'Notice!'}
			</Text>

			{buttonText ? (
				<Button
					disabled={buttonDisabled}
					onPress={onPress}
					title={buttonText}
				/>
			) : null}
		</View>
	)
}
