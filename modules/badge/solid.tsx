import * as React from 'react'
import {ColorValue, Platform, StyleSheet, Text, View} from 'react-native'

import * as c from '@frogpond/colors'

type Props = {
	status: string
	accentColor?: ColorValue
	textColor?: ColorValue
}

export function SolidBadge(props: Props): JSX.Element {
	const {status, accentColor = c.systemYellow, textColor = c.label} = props

	return (
		<View style={[styles.badge, {backgroundColor: accentColor}]}>
			<Text style={[styles.badgeText, {color: textColor}]}>{status}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	badge: {
		marginTop: 20,
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 5,
		alignSelf: 'center',
		...Platform.select({
			android: {
				marginBottom: 14,
			},
		}),
	},
	badgeText: {
		fontSize: 18,
	},
})
