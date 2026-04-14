import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Ionicons as Ionicon} from '@react-native-vector-icons/ionicons'
import {MaterialDesignIcons as MaterialCommunityIcon} from '@react-native-vector-icons/material-design-icons'
import type IoniconsGlyphs from '@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json'
import type MaterialDesignIconsGlyphs from '@react-native-vector-icons/material-design-icons/glyphmaps/MaterialDesignIcons.json'

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

export const IosIcon =
	(icon: keyof typeof IoniconsGlyphs) =>
	({color}: Props): JSX.Element => (
		<Ionicon name={icon} style={[styles.icon, {color: color}]} />
	)

export const MaterialIcon =
	(icon: keyof typeof MaterialDesignIconsGlyphs) =>
	({color}: Props): JSX.Element => (
		<MaterialCommunityIcon name={icon} style={[{color: color}]} />
	)
