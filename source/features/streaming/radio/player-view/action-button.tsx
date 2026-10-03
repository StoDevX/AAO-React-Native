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
			containerStyle={styles.slot}
			highlight={false}
			onPress={onPress}
			style={styles.action}
		>
			<SymbolView name={icon} size={24} tintColor={onPress ? palette.primary : palette.tertiary} />
			<Text
				adjustsFontSizeToFit={true}
				minimumFontScale={0.6}
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
	// slot answers a tap; large text shrinks a label to fit rather than
	// running it into its neighbour's.
	slot: {flex: 1},
	action: {minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4},
	label: {fontSize: 13, textAlign: 'center'},
})
