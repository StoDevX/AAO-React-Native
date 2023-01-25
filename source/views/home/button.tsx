import * as React from 'react'
import {Text, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import {Touchable} from '@frogpond/touchable'
import {transparent} from '@frogpond/colors'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'
import {hasNotch} from 'react-native-device-info'

type Props = {
	view: ViewType
	onPress: () => void
}

export function HomeScreenButton({view, onPress}: Props): JSX.Element {
	let foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground

	return (
		<Touchable
			accessibilityLabel={view.title}
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			onPress={onPress}
			style={[styles.button, styles.contents, {backgroundColor: view.tint}]}
		>
			<>
				<Icon name={view.icon} size={32} style={[foreground, styles.icon]} />
				<Text style={[foreground, styles.text]}>{view.title}</Text>
			</>
		</Touchable>
	)
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
	button: {
		elevation: 2,
		borderRadius: Platform.OS === 'ios' ? (hasNotch() ? 17 : 6) : 3,

		marginBottom: CELL_MARGIN,
		marginLeft: CELL_MARGIN / 2,
		marginRight: CELL_MARGIN / 2,
	},
	contents: {
		alignItems: 'center',
		justifyContent: 'center',

		paddingTop: cellVerticalPadding,
		paddingBottom: cellVerticalPadding / 2,
		paddingHorizontal: cellHorizontalPadding,
	},
	icon: {
		backgroundColor: transparent,
	},
	text: {
		backgroundColor: transparent,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
		fontSize: 14,
	},
	lightForeground: {
		color: homescreenForegroundLight,
	},
	darkForeground: {
		color: homescreenForegroundDark,
	},
})
