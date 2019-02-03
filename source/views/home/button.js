// @flow

import * as React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import LinearGradient from 'react-native-linear-gradient'
import {Touchable} from '@frogpond/touchable'
import {transparent} from '@frogpond/colors'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'
import {iPhoneX} from '@frogpond/device'
import {SafeAreaView} from 'react-navigation'

type Props = {
	view: ViewType,
	onPress: () => any,
}

export function HomeScreenButton({view, onPress}: Props) {
	const foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground

	return (
		<SafeAreaView>
			<TouchableButton
				gradient={view.gradient}
				label={view.title}
				onPress={onPress}
				tint={view.tint}
			>
				<View style={styles.contents}>
					<Icon name={view.icon} size={32} style={[foreground, styles.icon]} />
					<Text style={[foreground, styles.text]}>{view.title}</Text>
				</View>
			</TouchableButton>
		</SafeAreaView>
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
			accessibilityLabel={label}
			accessibilityRole="button"
			accessible={true}
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
			end={{x: 0, y: 0.85}}
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
		borderRadius: Platform.OS === 'ios' ? (iPhoneX ? 17 : 6) : 3,

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
