import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {SymbolView} from 'expo-symbols'

import {palette} from './palette'

/**
 * Holds the sheet open, so a drag on the record scratches it rather than
 * closing the sheet. Tapped again, the sheet can be swiped away as before.
 */
export function LockButton({
	locked,
	onToggle,
}: {
	locked: boolean
	onToggle: () => void
}): React.ReactNode {
	return (
		<Touchable
			accessibilityLabel={locked ? 'Unlock the player' : 'Lock the player open'}
			accessibilityRole="button"
			highlight={false}
			onPress={onToggle}
			style={styles.button}
		>
			<SymbolView
				name={locked ? 'lock.fill' : 'lock.open'}
				size={20}
				tintColor={locked ? palette.primary : palette.secondary}
			/>
		</Touchable>
	)
}

const styles = StyleSheet.create({
	button: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
})
