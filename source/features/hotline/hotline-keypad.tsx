import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {SymbolView} from 'expo-symbols'

import type {Key} from './call'
import {CallButton, Keypad} from './keypad'

/** Home's Phone layout: a keypad to dial the hotline from. */
export function HotlineKeypad(): React.ReactNode {
	let [dialed, setDialed] = React.useState('')

	let onKey = React.useCallback((key: Key) => setDialed((number) => number + key), [])
	let onDelete = React.useCallback(() => setDialed((number) => number.slice(0, -1)), [])

	return (
		<View style={styles.screen} testID="hotline-keypad">
			<View style={styles.display}>
				<Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.number}>
					{dialed}
				</Text>
			</View>
			<Keypad onPress={onKey} />
			<View style={styles.actions}>
				<View style={styles.actionSlot} />
				<CallButton ending={false} />
				<View style={styles.actionSlot}>
					{dialed ? (
						<Pressable
							accessibilityLabel="Delete"
							accessibilityRole="button"
							hitSlop={12}
							onPress={onDelete}
						>
							<SymbolView name="delete.left.fill" size={28} tintColor={c.secondaryLabel} />
						</Pressable>
					) : null}
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 24,
		backgroundColor: c.systemBackground,
	},
	display: {
		height: 96,
		alignSelf: 'stretch',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	number: {
		fontSize: 40,
		color: c.label,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 28,
	},
	actionSlot: {
		width: 78,
		alignItems: 'center',
	},
})
