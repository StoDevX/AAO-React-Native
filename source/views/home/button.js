// @flow

import * as React from 'react'
import {View, Text, StyleSheet, Platform, Dimensions} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import LinearGradient from 'react-native-linear-gradient'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import {iPhoneX} from '../components/device'

type Props = {
	view: ViewType,
	onPress: () => any,
}

export function HomeScreenButton({view, onPress, layout}: Props) {
	const foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground

	const wideMode = view.size.width > 1 && view.size.width !== view.size.height

	return (
		<TouchableButton
			gradient={view.gradient}
			label={view.title}
			onPress={onPress}
			tint={view.tint}
			style={[styles.button, layout]}
		>
			<View style={[styles.contents, wideMode && styles.wide]}>
				<Icon name={view.icon} size={24} style={[foreground, styles.icon, wideMode && styles.wideIcon]} />
				<Text style={[foreground, styles.text, wideMode && styles.wideText]}>{view.title}</Text>
			</View>
		</TouchableButton>
	)
}

function TouchableButton({onPress, label, children, tint, gradient, style}) {
	if (Platform.OS === 'android') {
		return (
			<Tint gradient={gradient} tint={tint} style={style}>
				<TouchableWrapper label={label} onPress={onPress}>
					{children}
				</TouchableWrapper>
			</Tint>
		)
	} else {
		return (
			<TouchableWrapper label={label} onPress={onPress}>
				<Tint gradient={gradient} tint={tint} style={style}>
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

function Tint({tint = 'black', gradient, children, style}) {
	if (!gradient) {
		const bg = {backgroundColor: tint}
		return <View style={[styles.button, style, bg]}>{children}</View>
	}

	return (
		<LinearGradient
			colors={gradient}
			end={{x: 1, y: 0.85}}
			start={{x: 0, y: 0.05}}
			style={[styles.button, style]}
		>
			{children}
		</LinearGradient>
	)
}

export const CELL_MARGIN = 10
export const CELL_SIZE = 70
export const CELL_INNER_PADDING = 4

const styles = StyleSheet.create({
	button: {
		borderRadius: Platform.OS === 'ios' ? (iPhoneX ? 17 : 6) : 3,
		position: 'absolute',
		shadowColor: 'rgba(0,0,0,0.15)',
		shadowOffset: {width: 0, height: 2},
		shadowRadius: 4,
		shadowOpacity: 1,
	},
	contents: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: CELL_INNER_PADDING,
	},
	icon: {
		backgroundColor: c.transparent,
	},
	text: {
		marginTop: 4,
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
	wide: {
		flexDirection: 'row',
	},
	wideIcon: {
		flex: 2,
		textAlign: 'center',
	},
	wideText: {
		flex: 3,
		textAlign: 'center',
	},
})
