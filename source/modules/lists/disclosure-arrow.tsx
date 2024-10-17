import * as React from 'react'
import {Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '../colors'
import Ionicon from '@expo/vector-icons/Ionicons'

const arrowStyles = StyleSheet.create({
	wrapper: {
		marginLeft: 10,
	},
	icon: {
		color: c.secondaryLabel,
		fontSize: 20,
	},
})

interface Props {
	style?: StyleProp<ViewStyle>
}

export function DisclosureArrow({style}: Props): React.JSX.Element | null {
	if (Platform.OS === 'android') {
		return null
	}

	return (
		<View style={[arrowStyles.wrapper, style]}>
			<Ionicon name="chevron-forward-outline" style={arrowStyles.icon} />
		</View>
	)
}
