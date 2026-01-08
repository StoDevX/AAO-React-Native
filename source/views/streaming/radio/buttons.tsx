import * as React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import type {Glyphs} from '@frogpond/icon'
import {Icon} from '@frogpond/icon'
import {Touchable} from '@frogpond/touchable'
import {theming} from './theme'

type ActionButtonProps = {
	icon: Glyphs
	text: string
	onPress: () => unknown
}

export function ActionButton(props: ActionButtonProps): JSX.Element {
	let theme = theming.useTheme()
	let {icon, text, onPress} = props
	let bg = {backgroundColor: theme.tintColor}
	let fg = {color: theme.buttonTextColor}
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

type CallButtonProps = {
	onPress: () => unknown
}

export function CallButton({onPress}: CallButtonProps): JSX.Element {
	return (
		<SmallActionButton
			icon={Platform.OS === 'ios' ? 'ios-call' : 'md-call'}
			onPress={onPress}
		/>
	)
}

type ShowCalendarButtonProps = {
	onPress: () => unknown
}

export function ShowCalendarButton({
	onPress,
}: ShowCalendarButtonProps): JSX.Element {
	return (
		<SmallActionButton
			icon={Platform.OS === 'ios' ? 'ios-calendar' : 'md-calendar'}
			onPress={onPress}
		/>
	)
}

type SmallActionButtonProps = Omit<ActionButtonProps, 'text'>

export function SmallActionButton(props: SmallActionButtonProps): JSX.Element {
	let theme = theming.useTheme()
	let {icon, onPress} = props
	let bg = {backgroundColor: theme.tintColor}
	let fg = {color: theme.buttonTextColor}
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
		backgroundColor: c.tertiarySystemBackground,
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
		color: c.label,
		fontSize: 30,
	},
	action: {
		color: c.label,
		paddingLeft: 10,
		paddingTop: 7,
		fontWeight: '900',
	},
})
