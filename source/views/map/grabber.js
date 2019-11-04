// @flow

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'

export const GrabberBar = () => (
	<View>
		<View style={styles.grabber} />
	</View>
)

const styles = StyleSheet.create({
	grabber: {
		backgroundColor: c.iosGray,
		borderRadius: 4,
		height: 6,
		width: 40,
		alignSelf: 'center',
		marginBottom: 1,
		marginTop: 6,
	},
})
