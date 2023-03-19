import * as React from 'react'
import {Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'
import Icon from 'react-native-vector-icons/Ionicons'

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
	if (Platform.OS === 'android') {
		return null
	}

	return (
		<View style={[arrowStyles.wrapper, style]}>
			<Icon name="chevron-forward-outline" style={arrowStyles.icon} />
		</View>
	)
}
