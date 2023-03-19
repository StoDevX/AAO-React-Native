import * as React from 'react'
import {
	ColorValue,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
	ViewStyle,
} from 'react-native'
import * as c from '@frogpond/colors'

type Props = {
	text: string
	accentColor?: ColorValue
	textColor?: ColorValue
	style?: StyleProp<ViewStyle>
	textStyle?: StyleProp<TextStyle>
}

const styles = StyleSheet.create({
	accessoryBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 2,
		borderWidth: 1,
		alignSelf: 'center',
	},
	accessoryBadgeText: {
		color: c.label,
	},
})

export function OutlineBadge({
	text,
	style,
	textStyle,
	accentColor = c.systemYellow,
	textColor = c.label,
}: Props): JSX.Element {
	return (
		<View
			style={[
				styles.accessoryBadge,
				{backgroundColor: accentColor, borderColor: c.separator},
				style,
			]}
		>
			<Text style={[styles.accessoryBadgeText, {color: textColor}, textStyle]}>
				{text}
			</Text>
		</View>
	)
}
