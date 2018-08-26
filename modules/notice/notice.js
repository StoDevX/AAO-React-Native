// @flow
import * as React from 'react'
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {Button} from '../../source/components/button'
import {Heading} from '../../source/components/markdown/heading'
import {Viewport} from '@frogpond/viewport'

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
	buttonDisabled?: boolean,
	header?: string,
	text?: string,
	style?: any,
	spinner?: boolean,
	buttonText?: string,
	onPress?: () => any,
	textStyle?: any,
}

export function NoticeView(props: Props) {
	const {header, text, style, textStyle} = props
	const {buttonDisabled, buttonText, onPress} = props
	const {spinner} = props

	return (
		<Viewport
			render={() => (
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
			)}
		/>
	)
}
