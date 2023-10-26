import * as React from 'react'
import type {StyleProp, ViewStyle} from 'react-native'
import {Platform, StyleSheet, View} from 'react-native'

import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	separator: {
		...Platform.select({
			ios: {
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: c.separator,
			},
			android: {
				borderBottomWidth: 1,
				borderBottomColor: c.separator,
			},
		}),
	},
})

export function Separator(props: {style?: StyleProp<ViewStyle>}): JSX.Element {
	return <View style={[styles.separator, props.style]} />
}
