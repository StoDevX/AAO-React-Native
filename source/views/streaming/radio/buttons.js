// @flow

import * as React from 'react'
import {StyleSheet, Text, View, Platform} from 'react-native'
import * as c from '@frogpond/colors'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '@frogpond/touchable'
import type {PlayerTheme} from './types'

type ActionButtonProps = {
	colors: PlayerTheme,
	icon: string,
	text: string,
	onPress: () => mixed,
}

export const ActionButton = (props: ActionButtonProps) => {
	let {icon, text, onPress, colors} = props
	let bg = {backgroundColor: colors.tintColor}
	let fg = {color: colors.buttonTextColor}
	let style = [styles.button, styles.largeButton, bg]

	return (
		<Touchable highlight={false} onPress={onPress} style={style}>
			<View style={styles.wrapper}>
				<Icon name={icon} style={[styles.icon, fg]} />
				<Text style={[styles.action, fg]}>{text}</Text>
			</View>
		</Touchable>
	)
}

type PrefabButtonProps = {
	colors: PlayerTheme,
	onPress: () => mixed,
}

export const CallButton = (props: PrefabButtonProps) => (
	<SmallActionButton
		icon={Platform.OS === 'ios' ? 'ios-call' : 'md-call'}
		{...props}
	/>
)

export const ShowCalendarButton = (props: PrefabButtonProps) => (
	<SmallActionButton
		icon={Platform.OS === 'ios' ? 'ios-calendar' : 'md-calendar'}
		{...props}
	/>
)

type SmallActionButtonProps = {
	colors: PlayerTheme,
	icon: string,
	onPress: () => mixed,
}

export const SmallActionButton = (props: SmallActionButtonProps) => {
	let {icon, onPress, colors} = props
	let bg = {backgroundColor: colors.tintColor}
	let fg = {color: colors.buttonTextColor}
	let style = [styles.button, styles.smallButton, bg]

	return (
		<Touchable highlight={false} onPress={onPress} style={style}>
			<Icon name={icon} style={[styles.icon, fg]} />
		</Touchable>
	)
}

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		paddingVertical: 5,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: c.black,
	},
	wrapper: {
		justifyContent: 'center',
		flexDirection: 'row',
	},
	largeButton: {
		width: 180,
	},
	smallButton: {
		width: 50,
	},
	icon: {
		color: c.white,
		fontSize: 30,
	},
	action: {
		color: c.white,
		paddingLeft: 10,
		paddingTop: 7,
		fontWeight: '900',
	},
})
