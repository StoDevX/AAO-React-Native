import * as React from 'react'
import {Platform, StyleSheet, Text} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {useRouter} from 'expo-router'
import {useTheme} from '@react-navigation/native'
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

export const NetworkLoggerButton = (): React.JSX.Element => {
	let router = useRouter()
	let {colors} = useTheme()

	return (
		<Touchable
			highlight={false}
			onPress={() => router.push('/settings/network-logger')}
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
