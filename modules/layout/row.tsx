import * as React from 'react'
import {FlexStyle, StyleSheet, View, ViewProps} from 'react-native'

type PropsType = {
	flex?: FlexStyle['flex']
} & ViewProps

const styles = StyleSheet.create({
	column: {
		flexDirection: 'row',
	},
})

export const Row = ({
	children,
	style,
	flex,
	...props
}: PropsType): JSX.Element => {
	let flexStyle = flex != null ? {flex: flex} : null
	return (
		<View style={[styles.column, style, flexStyle]} {...props}>
			{children}
		</View>
	)
}
