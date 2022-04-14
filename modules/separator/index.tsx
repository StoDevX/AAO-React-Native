import * as React from 'react'
import {View, StyleSheet, Platform} from 'react-native'
import * as c from '@frogpond/colors'
import type {ViewStyle, StyleProp} from 'react-native'

const styles = StyleSheet.create({
	separator: {
		...Platform.select({
			ios: {
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: c.iosSeparator,
			},
			android: {
				borderBottomWidth: 1,
				borderBottomColor: c.androidSeparator,
			},
		}),
	},
})

export function Separator({
	style,
}: {
	style?: StyleProp<ViewStyle>
}): JSX.Element {
	return <View style={[styles.separator, style]} />
}
