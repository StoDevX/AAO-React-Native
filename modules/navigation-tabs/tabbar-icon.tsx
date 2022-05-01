import * as React from 'react'
import {StyleSheet, Platform} from 'react-native'
import {Icon, platformPrefixIconName} from '@frogpond/icon'

const styles = StyleSheet.create({
	icon: {
		fontSize: Platform.select({
			ios: 30,
			android: 24,
		}),
	},
})

type Props = {
	color: string
	focused: boolean
	size: number
}

export const TabBarIcon =
	(icon: string) =>
	({color}: Props): JSX.Element =>
		(
			<Icon
				name={platformPrefixIconName(icon)}
				style={[styles.icon, {color: color}]}
			/>
		)
