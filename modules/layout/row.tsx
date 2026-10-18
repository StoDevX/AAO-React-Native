import * as React from 'react'
import {StyleSheet, View, ViewProps, ViewStyle} from 'react-native'

type PropsType = {
	flex?: ViewStyle['flex']
	alignItems?: ViewStyle['alignItems']
} & ViewProps

const styles = StyleSheet.create({
	column: {
		flexDirection: 'row',
	},
})

export const Row = ({children, style, flex, alignItems, ...props}: PropsType): React.ReactNode => {
	let flexStyle = flex != null ? {flex: flex} : null
	let alignItemsStyle = alignItems != null ? {alignItems: alignItems} : null
	return (
		<View style={[styles.column, style, flexStyle, alignItemsStyle]} {...props}>
			{children}
		</View>
	)
}
