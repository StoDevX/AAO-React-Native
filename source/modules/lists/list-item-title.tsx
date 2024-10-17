import * as React from 'react'
import {PropsWithChildren} from 'react'
import {Platform, StyleProp, StyleSheet, Text, TextStyle} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
	title: {
		color: c.label,
		fontSize: 17,
		...Platform.select({
			ios: {fontWeight: '500'},
			android: {fontWeight: '600'},
		}),
	},
	noBold: {
		fontWeight: '400',
	},
})

type Props = PropsWithChildren<{
	style?: StyleProp<TextStyle>
	lines?: number
	bold?: boolean
}>
export function Title(props: Props): React.JSX.Element {
	return (
		<Text
			numberOfLines={props.lines}
			style={[styles.title, !props.bold && styles.noBold, props.style]}
		>
			{props.children}
		</Text>
	)
}
