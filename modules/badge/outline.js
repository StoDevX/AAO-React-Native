// @flow

import * as React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import * as c from '@frogpond/colors'

type Props = {
	status: string,
	accentColor?: string,
	textColor?: string,
}

export function OutlineBadge(props: Props) {
	const {status, accentColor = c.goldenrod, textColor = c.white} = props

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
