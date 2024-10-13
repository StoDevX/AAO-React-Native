import * as React from 'react'
import {Platform, StyleSheet, Text} from 'react-native'
import {Touchable} from '../touchable'
import {useNavigation, useTheme} from 'expo-router'
import {commonStyles, rightButtonStyles as styles} from './styles'

export const buttonStyles = StyleSheet.create({
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

export const NetworkLoggerButton: React.FC = () => {
	const navigation = useNavigation()
	let {colors} = useTheme()

	return (
		<Touchable
			highlight={false}
			onPress={() => {
				navigation.navigate('NetworkLogger')
			}}
			style={styles.button}
		>
			<Text
				style={[commonStyles.text, buttonStyles.text, {color: colors.primary}]}
			>
				Log
			</Text>
		</Touchable>
	)
}
