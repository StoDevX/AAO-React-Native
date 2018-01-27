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
	return (
		<TouchableButton
			gradient={view.gradient}
			label={view.title}
			onPress={onPress}
			tint={view.tint}
		>
			<View style={styles.contents}>
				<Icon name={view.icon} size={32} style={styles.icon} />
				<Text style={styles.text}>{view.title}</Text>
			</View>
		</TouchableButton>
	)
}

function TouchableButton({onPress, label, children, tint, gradient}) {
	if (Platform.OS === 'android') {
		return (
			<Tint gradient={gradient} tint={tint}>
				<TouchableWrapper label={label} onPress={onPress}>
					{children}
				</TouchableWrapper>
			</Tint>
		)
	} else {
		return (
			<TouchableWrapper label={label} onPress={onPress}>
				<Tint gradient={gradient} tint={tint}>
					{children}
				</Tint>
			</TouchableWrapper>
		)
	}
}

function TouchableWrapper({onPress, children, label}) {
	return (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel={label}
			accessibilityTraits="button"
			highlight={false}
			onPress={onPress}
		>
			{children}
		</Touchable>
	)
}

function Tint({tint = 'black', gradient, children}) {
	if (!gradient) {
		const bg = {backgroundColor: tint}
		return <View style={[styles.button, bg]}>{children}</View>
	}

	return (
		<LinearGradient
			colors={gradient}
			end={{x: 1, y: 0.85}}
			start={{x: 0, y: 0.05}}
			style={styles.button}
		>
			{children}
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
