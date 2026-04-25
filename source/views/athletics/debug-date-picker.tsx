import * as React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import DateTimePicker, {
	DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import * as c from '@frogpond/colors'
import {useIsDevMode} from '../../lib/use-is-dev-mode'

type Props = {
	date: Date
	onDateChange: (date: Date) => void
	onReset: () => void
	isOverridden: boolean
}

export function DebugDatePicker({
	date,
	onDateChange,
	onReset,
	isOverridden,
}: Props): React.ReactNode {
	const isDev = useIsDevMode()
	if (!isDev) {
		return null
	}

	const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
		if (selected) {
			onDateChange(selected)
		}
	}

	return (
		<View style={styles.container}>
			<Text style={styles.label}>DEBUG: today =</Text>
			<DateTimePicker
				display="compact"
				mode="date"
				onChange={handleChange}
				style={styles.picker}
				value={date}
			/>
			{isOverridden && (
				<TouchableOpacity onPress={onReset} style={styles.resetButton}>
					<Text style={styles.reset}>Reset</Text>
				</TouchableOpacity>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		backgroundColor: c.systemYellow,
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	label: {
		color: c.black,
		fontSize: 12,
		fontWeight: '500',
	},
	picker: {
		flex: 1,
	},
	resetButton: {
		paddingHorizontal: 8,
		paddingVertical: 2,
	},
	reset: {
		color: c.systemRed,
		fontSize: 12,
		fontWeight: '500',
	},
})
