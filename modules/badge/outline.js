// @flow
import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import tinycolor from 'tinycolor2'

type Props = {
	text: string,
	accentColor?: string,
	textColor?: string,
	style?: any,
	textStyle?: any,
}

let styles = StyleSheet.create({
	accessoryBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 2,
		borderWidth: 1,
		alignSelf: 'center',
	},
	accessoryBadgeText: {
		color: c.white,
	},
})

export function OutlineBadge({
	text,
	style,
	textStyle,
	accentColor = c.goldenrod,
	textColor = 'hsl(26, 49%, 34%)',
}: Props) {
	const bgaccent = tinycolor(accentColor)
		.setAlpha(0.1)
		.toRgbString()

	return (
		<View
			style={[
				styles.accessoryBadge,
				{backgroundColor: bgaccent, borderColor: accentColor},
				style,
			]}
		>
			<Text style={[styles.accessoryBadgeText, {color: textColor}, textStyle]}>
				{text}
			</Text>
		</View>
	)
}
