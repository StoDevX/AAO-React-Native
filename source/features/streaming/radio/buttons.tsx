import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {SymbolView} from 'expo-symbols'
import type {SFSymbol} from 'sf-symbols-typescript'
import {Touchable} from '@frogpond/touchable'
import {theming} from './theme'

type ActionButtonProps = {
	icon: SFSymbol
	text: string
	/** What VoiceOver reads; defaults to the visible text. */
	accessibilityLabel?: string
	onPress: () => unknown
}

export function ActionButton(props: ActionButtonProps): React.ReactNode {
	let theme = theming.useTheme()
	let {icon, text, accessibilityLabel = text, onPress} = props
	let bg = {backgroundColor: theme.tintColor}
	let fg = {color: theme.buttonTextColor}
	let style = [styles.button, styles.largeButton, bg]

	return (
		<Touchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			highlight={false}
			onPress={onPress}
			style={style}
		>
			<View style={styles.wrapper}>
				<SymbolView name={icon} size={30} tintColor={theme.buttonTextColor} />
				<Text style={[styles.action, fg]}>{text}</Text>
			</View>
		</Touchable>
	)
}

type StationButtonProps = {
	stationName: string
	onPress: () => unknown
}

export function CallButton({stationName, onPress}: StationButtonProps): React.ReactNode {
	return (
		<SmallActionButton
			accessibilityLabel={`Call ${stationName}`}
			icon="phone.fill"
			onPress={onPress}
		/>
	)
}

export function ShowCalendarButton({stationName, onPress}: StationButtonProps): React.ReactNode {
	return (
		<SmallActionButton
			accessibilityLabel={`${stationName} schedule`}
			icon="calendar"
			onPress={onPress}
		/>
	)
}

/** An icon with no text, so VoiceOver has only the label to go on. */
type SmallActionButtonProps = Omit<ActionButtonProps, 'text' | 'accessibilityLabel'> & {
	accessibilityLabel: string
}

export function SmallActionButton(props: SmallActionButtonProps): React.ReactNode {
	let theme = theming.useTheme()
	let {icon, accessibilityLabel, onPress} = props
	let bg = {backgroundColor: theme.tintColor}
	let style = [styles.button, styles.smallButton, bg]

	return (
		<Touchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			highlight={false}
			onPress={onPress}
			style={style}
		>
			<SymbolView name={icon} size={30} tintColor={theme.buttonTextColor} />
		</Touchable>
	)
}

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 44,
		paddingVertical: 5,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: c.tertiarySystemBackground,
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
	action: {
		color: c.label,
		paddingLeft: 10,
		paddingTop: 7,
		fontWeight: '900',
	},
})
