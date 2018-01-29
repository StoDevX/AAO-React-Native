// @flow

import * as React from 'react'
import {StyleSheet, Text, Platform} from 'react-native'
import * as c from '../../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../../components/touchable'

type ActionButtonProps = {
	icon: string,
	text: string,
	tint: string,
	onPress: () => mixed,
}

export const ActionButton = (props: ActionButtonProps) => (
	<Touchable
		highlight={false}
		onPress={props.onPress}
		style={[styles.button, styles.large, {backgroundColor: props.tint}]}
	>
		<Icon name={props.icon} style={styles.icon} />
		<Text style={styles.action}>{props.text}</Text>
	</Touchable>
)

type NamedSmallActionButtonProps = {
	onPress: () => mixed,
	tint: string,
}

export const CallButton = (props: NamedSmallActionButtonProps) => (
	<SmallActionButton
		icon={Platform.OS === 'ios' ? 'ios-call' : 'md-call'}
		onPress={props.onPress}
		tint={props.tint}
	/>
)

export const ShowCalendarButton = (props: NamedSmallActionButtonProps) => (
	<SmallActionButton
		icon={Platform.OS === 'ios' ? 'ios-calendar' : 'md-calendar'}
		onPress={props.onPress}
		tint={props.tint}
	/>
)

type SmallActionButtonProps = {
	icon: string,
	onPress: () => mixed,
	tint: string,
}

const SmallActionButton = ({icon, onPress, tint}: SmallActionButtonProps) => (
	<Touchable
		highlight={false}
		onPress={onPress}
		style={[styles.button, styles.small, {backgroundColor: tint}]}
	>
		<Icon name={icon} style={styles.icon} />
	</Touchable>
)

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		backgroundColor: c.denim,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		overflow: 'hidden',
		paddingVertical: 5,
	},
	large: {
		width: 180,
	},
	small: {
		width: 50,
	},
	icon: {
		color: c.white,
		fontSize: 30,
	},
	action: {
		color: c.white,
		paddingLeft: 10,
		fontWeight: '900',
	},
})
