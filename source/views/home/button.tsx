import * as React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import {Touchable} from '@frogpond/touchable'
import {transparent} from '@frogpond/colors'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'
import {hasNotch} from 'react-native-device-info'
import {SafeAreaView} from 'react-native-safe-area-context'

type Props = {
	view: ViewType
	onPress: () => void
}

export function HomeScreenButton({view, onPress}: Props): JSX.Element {
	let foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground

	const InternalTouchable = () => (
		<Touchable
			accessibilityLabel={view.title}
			accessibilityRole="button"
			accessible={true}
			activeOpacity={0.9}
			highlight={false}
			onPress={onPress}
			style={[styles.button, {backgroundColor: view.tint}]}
		>
			<View style={styles.contents}>
				<Icon name={view.icon} size={32} style={[foreground, styles.icon]} />
				<Text style={[foreground, styles.text]}>{view.title}</Text>
			</View>
		</Touchable>
	)

	return Platform.select({
		ios: <Internaltouchable />,
		android: (
			<SafeAreaView>
				<InternalTouchable />
			</SafeAreaView>
		),
		default: <></>,
	})
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
