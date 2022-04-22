import {StyleSheet, View, ViewProps} from 'react-native'

type PropsType = {
	flex?: number
} & ViewProps

const styles = StyleSheet.create({
	column: {
		flexDirection: 'column',
	},
})

export const Column = ({
	children,
	style,
	flex,
	...props
}: PropsType): JSX.Element => {
	let flexStyle = flex !== undefined && flex !== null ? {flex: flex} : null
	return (
		<View style={[styles.column, style, flexStyle]} {...props}>
			{children}
		</View>
	)
}
