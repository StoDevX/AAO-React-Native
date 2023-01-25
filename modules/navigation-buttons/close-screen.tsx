import * as React from 'react'
import {Text, Platform, StyleSheet, ViewStyle, StyleProp} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {commonStyles} from './styles'
import {useNavigation} from '@react-navigation/native'
import {useTheme} from '@frogpond/app-theme'

type Props = {
	title?: string
	buttonStyle?: StyleProp<ViewStyle>
}

export function CloseScreenButton({title, buttonStyle}: Props): JSX.Element {
	let navigation = useNavigation()
	let {colors} = useTheme()
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
			<Text style={[commonStyles.text, styles.text, {color: colors.text}]}>
				{title ?? 'Done'}
			</Text>
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
