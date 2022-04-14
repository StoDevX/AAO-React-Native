import * as React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import * as c from '@frogpond/colors'
import Icon from 'react-native-vector-icons/Ionicons'

const arrowStyles = StyleSheet.create({
	wrapper: {
		marginLeft: 10,
	},
	icon: {
		color: c.iosDisabledText,
		fontSize: 20,
	},
})

export const DisclosureArrow = ({style}: {style?: any}) => {
	if (Platform.OS === 'android') {
		return null
	}

	return (
		<View style={[arrowStyles.wrapper, style]}>
			<Icon name="chevron-forward-outline" style={arrowStyles.icon} />
		</View>
	)
}
