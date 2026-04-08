import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import type {ViewStyle, StyleProp} from 'react-native'

const styles = StyleSheet.create({
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.separator,
	},
})

export function Separator(props: {style?: StyleProp<ViewStyle>}): JSX.Element {
	return <View style={[styles.separator, props.style]} />
}
