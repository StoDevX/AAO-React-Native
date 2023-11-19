import * as React from 'react'
import {StyleSheet} from 'react-native'
import {default as Ionicon} from 'react-native-vector-icons/Ionicons'
import {default as MaterialCommunityIcon} from 'react-native-vector-icons/MaterialCommunityIcons'
import type * as IoniconsGlyphs from 'react-native-vector-icons/glyphmaps/Ionicons.json'
import type * as MaterialCommunityIconsGlyphs from 'react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'

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
	(icon: keyof typeof MaterialCommunityIconsGlyphs) =>
	({color}: Props): JSX.Element => (
		<MaterialCommunityIcon name={icon} style={[{color: color}]} />
	)
