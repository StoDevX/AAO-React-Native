import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {SymbolView, type SFSymbol} from 'expo-symbols'

import {palette} from './palette'

/**
 * How far large text may grow the labels: every label stops at the same size,
 * the most at which "Schedule" still fits a quarter of the narrowest phone.
 */
export const LABEL_MAX_SCALE = 1.4

/** How far an icon dims under a finger. */
const PRESSED_OPACITY = 0.65

/** An icon over its label. With no `onPress` it shows, dimmed, as unavailable. Only the icon dims when pressed. */
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
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={role}
			accessibilityState={{disabled: !onPress}}
			disabled={!onPress}
			onPress={onPress}
			style={styles.slot}
		>
			{({pressed}) => (
				<View style={styles.action}>
					{/* Only the icon dims under a finger, as the system's AirPlay button does. */}
					<View style={pressed ? styles.pressed : undefined}>
						<SymbolView
							name={icon}
							size={24}
							tintColor={onPress ? palette.primary : palette.tertiary}
						/>
					</View>
					<Text
						maxFontSizeMultiplier={LABEL_MAX_SCALE}
						numberOfLines={1}
						style={[styles.label, onPress ? palette.styles.primary : palette.styles.tertiary]}
					>
						{label}
					</Text>
				</View>
			)}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	// A quarter of the row each, the Pressable taking the width so the whole
	// slot answers a tap.
	slot: {flex: 1},
	action: {minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4},
	label: {fontSize: 13, textAlign: 'center'},
	pressed: {opacity: PRESSED_OPACITY},
})
