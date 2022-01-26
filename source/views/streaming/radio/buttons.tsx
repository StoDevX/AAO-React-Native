import * as React from 'react'
import {StyleSheet, Text, View, Platform} from 'react-native'
import * as c from '@frogpond/colors'
import {Icon} from '@frogpond/icon'
import type {Glyphs} from '@frogpond/icon'
import {Touchable} from '@frogpond/touchable'
import {withTheme} from '@frogpond/app-theme'
import type {PlayerTheme} from './types'

type ActionButtonBaseProps = {
	icon: Glyphs
	text: string
	onPress: () => unknown
}

type HocProps = {
	theme: PlayerTheme
}

type ActionButtonProps = ActionButtonBaseProps & HocProps

const ActionButton: React.FunctionComponent<ActionButtonProps> = (
	props: ActionButtonProps,
) => {
	let {icon, text, onPress, theme} = props
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

const ThemedActionButton: React.FunctionComponent<ActionButtonBaseProps> =
	withTheme(ActionButton)

export {ThemedActionButton as ActionButton}

export const CallButton = ({onPress}: {onPress: () => unknown}) => (
	<ThemedSmallActionButton
		icon={Platform.OS === 'ios' ? 'ios-call' : 'md-call'}
		onPress={onPress}
	/>
)

export const ShowCalendarButton = ({onPress}: {onPress: () => unknown}) => (
	<ThemedSmallActionButton
		icon={Platform.OS === 'ios' ? 'ios-calendar' : 'md-calendar'}
		onPress={onPress}
	/>
)

type SmallActionButtonBaseProps = {
	icon: Glyphs
	onPress: () => unknown
}

type SmallActionButtonProps = ActionButtonBaseProps & HocProps

const SmallActionButton = (props: SmallActionButtonProps) => {
	let {icon, onPress, theme} = props
	let bg = {backgroundColor: theme.tintColor}
	let fg = {color: theme.buttonTextColor}
	let style = [styles.button, styles.smallButton, bg]

	return (
		<Touchable highlight={false} onPress={onPress} style={style}>
			<Icon name={icon} style={[styles.icon, fg]} />
		</Touchable>
	)
}

const ThemedSmallActionButton: React.FunctionComponent<SmallActionButtonBaseProps> =
	withTheme(SmallActionButton)

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
