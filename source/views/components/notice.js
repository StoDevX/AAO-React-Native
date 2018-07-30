// @flow
import * as React from 'react'
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	ScrollView,
	RefreshControl,
} from 'react-native'
import * as c from './colors'
import {Button} from './button'
import {Heading} from './markdown/heading'
import {Viewport} from './viewport'

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
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
	buttonDisabled?: boolean,
	header?: string,
	text?: string,
	style?: any,
	spinner?: boolean,
	buttonText?: string,
	onPress?: () => any,
	textStyle?: any,
	refreshControl?: React.Element<typeof RefreshControl>,
}

export function NoticeView(props: Props) {
	const {header, text, style, textStyle} = props
	const {buttonDisabled, buttonText, onPress} = props
	const {spinner, refreshControl} = props

	return (
		<Viewport
			render={() => (
				<ScrollView
					contentContainerStyle={[styles.container, style]}
					refreshControl={refreshControl}
				>
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
				</ScrollView>
			)}
		/>
	)
}
