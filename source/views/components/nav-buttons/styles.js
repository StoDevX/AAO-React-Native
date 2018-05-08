/**
 * @flow
 * A collection of common styles for navbar buttons
 */

import {StyleSheet, Platform} from 'react-native'
import * as c from '../colors'

export const commonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		...Platform.select({
			ios: {
				paddingHorizontal: 18,
			},
			android: {
				paddingVertical: 15.5,
				paddingHorizontal: 16,
			},
		}),
	},
	text: {
		fontSize: 17,
		color: c.black,
		...Platform.select({
			android: {
				marginTop: 1,
			},
		}),
	},
})

export const rightButtonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 6,
		...Platform.select({
			ios: {
				paddingRight: 16,
				marginTop: 7,
			},
			android: {
				paddingVertical: 16,
				paddingRight: 16,
			},
		}),
	},
	icon: {
		color: c.black,
		...Platform.select({
			ios: {
				fontSize: 32,
			},
			android: {
				fontSize: 24,
			},
		}),
	},
})

export const leftButtonStyles = StyleSheet.create({
	icon: {
		color: c.black,
		fontSize: 24,
	},
})
