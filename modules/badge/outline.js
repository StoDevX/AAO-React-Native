// @flow

import * as React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import * as c from '@frogpond/colors'

const BGCOLORS = {
	Open: c.moneyGreen,
	Closed: c.salmon,
}

type Props = {status: string}

export class OutlineBadge extends React.PureComponent<Props> {
	render() {
		const {status} = this.props
		const bgColor = BGCOLORS[status] || c.goldenrod

		return (
			<View style={[styles.badge, {backgroundColor: bgColor}]}>
				<Text style={styles.badgeText}>
					{status}
				</Text>
			</View>
		)
	}
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
		color: c.white,
		fontSize: 18,
	},
})
