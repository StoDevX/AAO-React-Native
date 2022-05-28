import * as React from 'react'
import {Text, Platform, StyleSheet} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import type {
	NavigationAction,
	NavigationRoute,
	NavigationScreenProp,
} from 'react-navigation'
import {commonStyles} from './styles'

type Props = {
	navigation: NavigationScreenProp<NavigationRoute, NavigationAction>
	buttonStyle?: any
}

export function CloseScreenButton({
	navigation,
	buttonStyle,
}: Props): JSX.Element {
	return (
		<Touchable
			accessibilityLabel="Close the screen"
			accessibilityRole="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => navigation.goBack()}
			style={[commonStyles.button, buttonStyle]}
			testID="button-close-screen"
		>
			<Text style={[commonStyles.text, styles.text]}>Done</Text>
		</Touchable>
	)
}

const styles = StyleSheet.create({
	text: {
		...Platform.select({
			ios: {
				fontWeight: '600',
			},
			android: {
				fontWeight: '400',
			},
		}),
	},
})
