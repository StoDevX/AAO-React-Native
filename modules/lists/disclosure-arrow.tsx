import * as React from 'react'
import {Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'
import {Ionicons} from '@react-native-vector-icons/ionicons'

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
}): React.JSX.Element | null {
	if (Platform.OS === 'android') {
		return null
	}

	return (
		<View style={[arrowStyles.wrapper, style]}>
			<Ionicons name="chevron-forward-outline" style={arrowStyles.icon} />
		</View>
	)
}
