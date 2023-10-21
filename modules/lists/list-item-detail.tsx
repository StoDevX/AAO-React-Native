import * as React from 'react'
import {PropsWithChildren} from 'react'
import {Platform, StyleProp, StyleSheet, Text, TextStyle} from 'react-native'

import * as c from '@frogpond/colors'

const FONT_SIZE = 14
const styles = StyleSheet.create({
	detail: {
		paddingTop: 4,
		fontSize: FONT_SIZE,
		...Platform.select({
			ios: {
				lineHeight: FONT_SIZE * 1.25,
				color: c.secondaryLabel,
			},
			android: {
				// android lineHeight must be an integer: see kinda https://github.com/facebook/react-native/issues/10607
				lineHeight: Math.round(FONT_SIZE * 1.25),
				color: c.secondaryLabel,
			},
		}),
	},
})

type Props = PropsWithChildren<{
	style?: StyleProp<TextStyle>
	lines?: number
}>
export function Detail(props: Props): JSX.Element {
	return (
		<Text numberOfLines={props.lines} style={[styles.detail, props.style]}>
			{props.children}
		</Text>
	)
}
