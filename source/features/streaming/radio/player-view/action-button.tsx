import * as React from 'react'
import {StyleSheet, Text} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {SymbolView, type SFSymbol} from 'expo-symbols'

import {usePalette} from './palette'

/** An icon over its label. With no `onPress` it shows, dimmed, as unavailable. */
export function ActionButton({
	icon,
	label,
	accessibilityLabel,
	onPress,
}: {
	icon: SFSymbol
	label: string
	accessibilityLabel: string
	onPress?: () => void
}): React.ReactNode {
	let palette = usePalette()
	return (
		<Touchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{disabled: !onPress}}
			disabled={!onPress}
			highlight={false}
			onPress={onPress}
			style={styles.action}
		>
			<SymbolView name={icon} size={24} tintColor={onPress ? palette.primary : palette.tertiary} />
			<Text style={[styles.label, onPress ? palette.styles.primary : palette.styles.tertiary]}>
				{label}
			</Text>
		</Touchable>
	)
}

const styles = StyleSheet.create({
	action: {minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4},
	label: {fontSize: 13},
})
