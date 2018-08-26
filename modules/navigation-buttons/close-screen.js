// @flow

import * as React from 'react'
import {Text, Platform, StyleSheet} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {type NavigationScreenProp} from 'react-navigation'
import {commonStyles} from './styles'

type Props = {
	navigation: NavigationScreenProp<*>,
	buttonStyle?: any,
}

export function CloseScreenButton({navigation, buttonStyle}: Props) {
	return (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel="Close the screen"
			accessibilityTraits="button"
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
