import * as React from 'react'
import {Text, Platform, StyleSheet, ViewStyle, StyleProp} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {commonStyles} from './styles'
import {useNavigation} from '@react-navigation/native'

type Props = {
	buttonStyle?: StyleProp<ViewStyle>
}

export function CloseScreenButton({buttonStyle}: Props): JSX.Element {
	let navigation = useNavigation()
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
