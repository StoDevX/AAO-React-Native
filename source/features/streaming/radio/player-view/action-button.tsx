import * as React from 'react'
import {StyleSheet, Text} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {SymbolView, type SFSymbol} from 'expo-symbols'

import {palette} from './palette'

/**
 * How far large text may grow the labels: every label stops at the same size,
 * the most at which "Schedule" still fits a quarter of the narrowest phone.
 */
export const LABEL_MAX_SCALE = 1.4

/** An icon over its label. With no `onPress` it shows, dimmed, as unavailable. */
export function ActionButton({
	icon,
	label,
	accessibilityLabel,
	onPress,
	role = 'button',
}: {
	icon: SFSymbol
	label: string
	accessibilityLabel: string
	onPress?: () => void
	/** `link` for one that leaves the app for the web, so VoiceOver says so. */
	role?: 'button' | 'link'
}): React.ReactNode {
	return (
		<Touchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={role}
			accessibilityState={{disabled: !onPress}}
			disabled={!onPress}
			containerStyle={styles.slot}
			highlight={false}
			onPress={onPress}
			style={styles.action}
		>
			<SymbolView name={icon} size={24} tintColor={onPress ? palette.primary : palette.tertiary} />
			<Text
				maxFontSizeMultiplier={LABEL_MAX_SCALE}
				numberOfLines={1}
				style={[styles.label, onPress ? palette.styles.primary : palette.styles.tertiary]}
			>
				{label}
			</Text>
		</Touchable>
	)
}

const styles = StyleSheet.create({
	// A quarter of the row each, the Pressable taking the width so the whole
	// slot answers a tap.
	slot: {flex: 1},
	action: {minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4},
	label: {fontSize: 13, textAlign: 'center'},
})
