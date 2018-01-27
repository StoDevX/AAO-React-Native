// @flow

import * as React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import LinearGradient from 'react-native-linear-gradient'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'

type Props = {
	view: ViewType,
	onPress: () => any,
}

export function HomeScreenButton({view, onPress}: Props) {
	const foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground
	let contents = (
		<React.Fragment>
			<Icon name={view.icon} size={32} style={[foreground, styles.icon]} />
			<Text style={[foreground, styles.text]}>{view.title}</Text>
		</React.Fragment>
	)

	if (view.gradient) {
		contents = (
			<LinearGradient
				colors={view.gradient}
				end={{x: 1, y: 0.85}}
				start={{x: 0, y: 0.05}}
				style={styles.rectangle}
			>
				{contents}
			</LinearGradient>
		)
	} else {
		contents = (
			<View style={[styles.rectangle, {backgroundColor: view.tint}]}>
				{contents}
			</View>
		)
	}

	return (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel={view.title}
			accessibilityTraits="button"
			highlight={false}
			onPress={onPress}
		>
			{contents}
		</Touchable>
	)
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
	// Main buttons for actions on home screen
	rectangle: {
		alignItems: 'center',
		justifyContent: 'center',

		paddingTop: cellVerticalPadding,
		paddingBottom: cellVerticalPadding / 2,
		paddingHorizontal: cellHorizontalPadding,
		borderRadius: Platform.OS === 'ios' ? 6 : 3,

		elevation: 2,

		marginBottom: CELL_MARGIN,
		marginLeft: CELL_MARGIN / 2,
		marginRight: CELL_MARGIN / 2,
	},

	// Text styling in buttons
	icon: {
		backgroundColor: c.transparent,
	},
	text: {
		backgroundColor: c.transparent,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
		fontSize: 14,
	},
	lightForeground: {
		color: c.homescreenForegroundLight,
	},
	darkForeground: {
		color: c.homescreenForegroundDark,
	},
})
