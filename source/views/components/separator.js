// @flow
import * as React from 'react'
import {View, StyleSheet, Platform} from 'react-native'
import * as c from './colors'
import type {ViewStyleProp} from '../types'

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

export function Separator({style}: {|style?: ViewStyleProp|}) {
	return <View style={[styles.separator, style]} />
}
