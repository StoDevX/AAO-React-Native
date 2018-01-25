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
	const contents = (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel={view.title}
			accessibilityTraits="button"
			highlight={false}
			onPress={onPress}
			containerStyle={styles.contents}
			style={StyleSheet.absoluteFill}
		>
			<Icon name={view.icon} size={32} style={styles.icon} />
			<Text style={styles.text}>{view.title}</Text>
		</Touchable>
	)

	if (!view.gradient) {
		const tint = view.tint || 'black'
		return (
			<View style={[styles.button, {backgroundColor: tint}]}>
				{contents}
			</View>
		)
	}

	return (
		<LinearGradient
			colors={view.gradient}
			end={{x: 1, y: 0.85}}
			start={{x: 0, y: 0.05}}
			style={styles.button}
		>
			{contents}
		</LinearGradient>
	)
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
	button: {
		elevation: 2,
		borderRadius: Platform.OS === 'ios' ? 6 : 3,

		marginBottom: CELL_MARGIN,
		marginLeft: CELL_MARGIN / 2,
		marginRight: CELL_MARGIN / 2,
	},
	contents: {
		...StyleSheet.absoluteFillObject,

		alignItems: 'center',
		justifyContent: 'center',

		paddingTop: cellVerticalPadding,
		paddingBottom: cellVerticalPadding / 2,
		paddingHorizontal: cellHorizontalPadding,
	},
	icon: {
		color: c.white,
		backgroundColor: c.transparent,
	},
	text: {
		color: c.white,
		backgroundColor: c.transparent,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
		fontSize: 14,
	},
})
