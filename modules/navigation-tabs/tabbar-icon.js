// @flow
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
	tintColor: string,
	focused: boolean,
}

export const TabBarIcon = (icon: string) => ({tintColor}: Props) => (
	<Icon
		name={platformPrefixIconName(icon)}
		style={[styles.icon, {color: tintColor}]}
	/>
)
