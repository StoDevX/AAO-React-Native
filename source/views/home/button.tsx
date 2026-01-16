import * as React from 'react'
import {Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import {Touchable} from '@frogpond/touchable'
import {transparent} from '@frogpond/colors'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'
import * as Device from 'expo-device'

const hasNotch = () => {
	// Check if device has a notch by model name
	const notchModels = ['iPhone X', 'iPhone XS', 'iPhone XS Max', 'iPhone XR', 'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16']
	return notchModels.some(model => Device.modelName?.includes(model.replace('iPhone ', '')))
}

type Props = {
	view: ViewType
	onPress: () => void
}

export function HomeScreenButton({view, onPress}: Props): JSX.Element {
	let foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground

	return (
		<SafeAreaView>
			<Touchable
				accessibilityLabel={view.title}
				accessibilityRole="button"
				accessible={true}
				highlight={false}
				onPress={onPress}
				style={[styles.button, {backgroundColor: view.tint}]}
			>
				<View style={styles.contents}>
					<Icon name={view.icon} size={32} style={[foreground, styles.icon]} />
					<Text style={[foreground, styles.text]}>{view.title}</Text>
				</View>
			</Touchable>
		</SafeAreaView>
	)
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
	button: {
		elevation: 2,
		borderRadius: Platform.OS === 'ios' ? (hasNotch() ? 17 : 6) : 3,

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
