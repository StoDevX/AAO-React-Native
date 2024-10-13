import * as React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import Entypo from '@expo/vector-icons/Entypo'
import {Touchable} from '../../../modules/touchable'
import {transparent} from '../../../modules/colors'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'

type Props = {
	title: string
	iconName: keyof (typeof Entypo)['glyphMap']
	foreground: 'light' | 'dark'
	tintColor: string
}

export function HomeScreenButton(props: Props): JSX.Element {
	let {title, iconName, foreground, tintColor} = props
	let foregroundStyle =
		foreground === 'light' ? styles.lightForeground : styles.darkForeground

	return (
		<Touchable
			accessibilityLabel={title}
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			style={[styles.button, {backgroundColor: tintColor}]}
		>
			<View style={styles.contents}>
				<Entypo
					name={iconName}
					size={32}
					style={[foregroundStyle, styles.icon]}
				/>
				<Text style={[foregroundStyle, styles.text]}>{title}</Text>
			</View>
		</Touchable>
	)
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4
// hasNotch() ? 17 : 6

const styles = StyleSheet.create({
	button: {
		elevation: 2,
		borderRadius: Platform.OS === 'ios' ? 17 : 3,

		marginBottom: CELL_MARGIN,
		marginLeft: CELL_MARGIN / 2,
		marginRight: CELL_MARGIN / 2,
	},
	contents: {
		alignItems: 'center',
		justifyContent: 'center',

		paddingTop: cellVerticalPadding,
		paddingBottom: cellVerticalPadding / 2,
		paddingHorizontal: cellHorizontalPadding,
	},
	icon: {
		backgroundColor: transparent,
	},
	text: {
		backgroundColor: transparent,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
		fontSize: 14,
	},
	lightForeground: {
		color: homescreenForegroundLight,
	},
	darkForeground: {
		color: homescreenForegroundDark,
	},
})
