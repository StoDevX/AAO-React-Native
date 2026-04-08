import {StyleSheet} from 'react-native'
import {link} from '@frogpond/colors'

export const commonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 18,
	},
	text: {
		fontSize: 17,
	},
})

export const rightButtonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 6,
		paddingRight: 16,
	},
	icon: {
		color: link,
		fontSize: 24,
	},
})

export const leftButtonStyles = StyleSheet.create({
	icon: {
		fontSize: 24,
	},
})
