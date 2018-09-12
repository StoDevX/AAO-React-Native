// @flow

import {StyleSheet, Platform} from 'react-native'
import {getTheme} from '@frogpond/app-theme'

let theme = getTheme()

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
		color: theme.navigationForeground,
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
			},
			android: {
				paddingVertical: 16,
				paddingRight: 16,
			},
		}),
	},
	icon: {
		color: theme.navigationForeground,
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
		color: theme.navigationForeground,
		fontSize: 24,
	},
})
