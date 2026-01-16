import * as React from 'react'
import {StyleSheet} from 'react-native'
import Ionicons, {
	type IoniconsIconName,
} from '@react-native-vector-icons/ionicons'
import MaterialDesignIcons, {
	type MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons'

const styles = StyleSheet.create({
	icon: {
		fontSize: 30,
	},
})

type Props = {
	color: string
	focused: boolean
	size?: number
}

export type IconName = IoniconsIconName & MaterialDesignIconsIconName

export const IosIcon =
	(icon: IoniconsIconName) =>
	({color}: Props): React.JSX.Element => (
		<Ionicons name={icon} style={[styles.icon, {color: color}]} />
	)

export const MaterialIcon =
	(icon: MaterialDesignIconsIconName) =>
	({color}: Props): React.JSX.Element => (
		<MaterialDesignIcons name={icon} style={[{color: color}]} />
	)
