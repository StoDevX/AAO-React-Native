import * as React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import * as c from '@frogpond/colors'
import {DAY_NAMES, MONTH_NAMES} from './utils'

type Props = {
	offset: number
	onOffsetChange: (offset: number) => void
	referenceDate: Date
}

export function DebugDatePicker({
	offset,
	onOffsetChange,
	referenceDate,
}: Props): React.ReactNode {
	if (!__DEV__) {
		return null
	}

	const label = `${DAY_NAMES[referenceDate.getDay()]}, ${MONTH_NAMES[referenceDate.getMonth()]} ${referenceDate.getDate()}`

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={() => onOffsetChange(offset - 1)}
				style={styles.button}
			>
				<Text style={styles.buttonText}>‹</Text>
			</TouchableOpacity>

			<View style={styles.center}>
				<Text style={styles.label}>DEBUG: today = </Text>
				<Text style={styles.date}>{label}</Text>
				{offset !== 0 && (
					<TouchableOpacity onPress={() => onOffsetChange(0)}>
						<Text style={styles.reset}>Reset</Text>
					</TouchableOpacity>
				)}
			</View>

			<TouchableOpacity
				onPress={() => onOffsetChange(offset + 1)}
				style={styles.button}
			>
				<Text style={styles.buttonText}>›</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		backgroundColor: c.systemYellow,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	button: {
		paddingHorizontal: 12,
		paddingVertical: 4,
	},
	buttonText: {
		color: c.black,
		fontSize: 22,
		fontWeight: '600',
	},
	center: {
		alignItems: 'center',
		flex: 1,
	},
	label: {
		color: c.black,
		fontSize: 10,
	},
	date: {
		color: c.black,
		fontSize: 13,
		fontWeight: '600',
	},
	reset: {
		color: c.systemRed,
		fontSize: 11,
		marginTop: 2,
	},
})
