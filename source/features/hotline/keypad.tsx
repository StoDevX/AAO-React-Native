import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {SymbolView} from 'expo-symbols'

import type {Key} from './call'

/** The keypad's rows, as a phone lays them out. */
const ROWS: Key[][] = [
	['1', '2', '3'],
	['4', '5', '6'],
	['7', '8', '9'],
	['*', '0', '#'],
]

/** The letters printed under each digit. */
const LETTERS: Partial<Record<Key, string>> = {
	'2': 'ABC',
	'3': 'DEF',
	'4': 'GHI',
	'5': 'JKL',
	'6': 'MNO',
	'7': 'PQRS',
	'8': 'TUV',
	'9': 'WXYZ',
	'0': '+',
}

/** What VoiceOver calls each key that is not a digit. */
const SPOKEN: Partial<Record<Key, string>> = {'*': 'star', '#': 'pound'}

const KEY_SIZE = 78

type KeyButtonProps = {digit: Key; onPress: (key: Key) => void}

const KeyButton = React.memo(function KeyButton({digit, onPress}: KeyButtonProps) {
	let letters = LETTERS[digit]
	let label = [SPOKEN[digit] ?? digit, letters].filter(Boolean).join(' ')
	return (
		<Pressable
			accessibilityLabel={label}
			accessibilityRole="button"
			onPress={() => onPress(digit)}
			style={({pressed}) => [styles.key, pressed && styles.keyPressed]}
		>
			<Text style={styles.digit}>{digit === '*' ? '✱' : digit}</Text>
			{letters ? <Text style={styles.letters}>{letters}</Text> : null}
		</Pressable>
	)
})

/** The twelve keys of a phone's keypad. */
export function Keypad({onPress}: {onPress: (key: Key) => void}): React.ReactNode {
	return (
		<View style={styles.grid}>
			{ROWS.map((row) => (
				<View key={row.join('')} style={styles.row}>
					{row.map((digit) => (
						<KeyButton key={digit} digit={digit} onPress={onPress} />
					))}
				</View>
			))}
		</View>
	)
}

/** The round green call button, or the red one that ends a call. */
export function CallButton({
	ending,
	onPress,
}: {
	ending: boolean
	onPress?: () => void
}): React.ReactNode {
	return (
		<Pressable
			accessibilityLabel={ending ? 'End call' : 'Call'}
			accessibilityRole="button"
			onPress={onPress}
			style={({pressed}) => [
				styles.call,
				ending ? styles.end : styles.start,
				pressed && styles.keyPressed,
			]}
		>
			<SymbolView name={ending ? 'phone.down.fill' : 'phone.fill'} size={32} tintColor={c.white} />
		</Pressable>
	)
}

const styles = StyleSheet.create({
	grid: {
		gap: 16,
	},
	row: {
		flexDirection: 'row',
		gap: 28,
	},
	key: {
		width: KEY_SIZE,
		height: KEY_SIZE,
		borderRadius: KEY_SIZE / 2,
		backgroundColor: c.tertiarySystemFill,
		alignItems: 'center',
		justifyContent: 'center',
	},
	keyPressed: {
		opacity: 0.5,
	},
	digit: {
		fontSize: 34,
		color: c.label,
	},
	letters: {
		fontSize: 10,
		fontWeight: '600',
		letterSpacing: 2,
		color: c.secondaryLabel,
	},
	call: {
		width: KEY_SIZE,
		height: KEY_SIZE,
		borderRadius: KEY_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	start: {
		backgroundColor: c.green,
	},
	end: {
		backgroundColor: c.red,
	},
})
