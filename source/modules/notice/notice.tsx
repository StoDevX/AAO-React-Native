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
import * as c from '../colors'
import {Button} from '../button'
import {Heading} from '../markdown'

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 30,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: c.systemBackground,
	},
	text: {
		textAlign: 'center',
		color: c.label,
	},
	spinner: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
})

interface Props {
	buttonDisabled?: boolean
	header?: string
	text?: string
	style?: StyleProp<ViewStyle>
	spinner?: boolean
	buttonText?: string
	onPress?: () => unknown
	textStyle?: StyleProp<TextStyle>
}

export function NoticeView(props: Props): React.JSX.Element {
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
