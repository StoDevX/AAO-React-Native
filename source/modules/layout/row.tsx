import * as React from 'react'
import {FlexStyle, StyleSheet, View, ViewProps} from 'react-native'

type PropsType = {
	flex?: FlexStyle['flex']
	alignItems?: FlexStyle['alignItems']
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
	alignItems,
	...props
}: PropsType): React.JSX.Element => {
	let flexStyle = flex != null ? {flex: flex} : null
	let alignItemsStyle = alignItems != null ? {alignItems: alignItems} : null
	return (
		<View style={[styles.column, style, flexStyle, alignItemsStyle]} {...props}>
			{children}
		</View>
	)
}
