import * as React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'

const arrowStyles = StyleSheet.create({
	wrapper: {
		marginLeft: 10,
	},
	icon: {
		color: c.secondaryLabel,
		fontSize: 20,
	},
})

export function DisclosureArrow({
	style,
}: {
	style?: StyleProp<ViewStyle>
}): JSX.Element | null {
	return (
		<View style={[arrowStyles.wrapper, style]}>
			<Icon name="chevron-forward-outline" style={arrowStyles.icon} />
		</View>
	)
}
