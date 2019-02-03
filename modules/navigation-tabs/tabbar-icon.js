// @flow
import * as React from 'react'
import {StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

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

export const platformPrefixIcon = (name: string) => {
	return Platform.OS === 'ios' ? `ios-${name}` : `md-${name}`
}

export const TabBarIcon = (icon: string) => ({tintColor}: Props) => (
	<Icon name={`ios-${icon}`} style={[styles.icon, {color: tintColor}]} />
)
