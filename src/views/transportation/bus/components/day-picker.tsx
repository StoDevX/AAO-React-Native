import * as React from 'react'
import {
	ColorValue,
	ScrollView,
	StyleSheet,
	Text as RNText,
	TouchableOpacity,
	View,
} from 'react-native'
import {ContextMenu, Host, Button, Text} from '@expo/ui/swift-ui'
import type {Moment} from 'moment-timezone'
import type {DayOfWeek} from '../types'
import * as c from '@frogpond/colors'
import {Ionicons} from '@react-native-vector-icons/ionicons'

const styles = StyleSheet.create({
	dayPickerContainer: {
		backgroundColor: c.systemGroupedBackground,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	dayPickerScroll: {
		flexGrow: 0,
	},
	dayButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginRight: 8,
		borderRadius: 6,
		backgroundColor: c.secondarySystemGroupedBackground,
	},
	dayButtonSelected: {
		backgroundColor: c.systemBlue,
	},
	dayButtonText: {
		fontSize: 14,
		fontWeight: '500',
		color: c.label,
	},
	dayButtonTextSelected: {
		color: c.white,
	},
	resetButton: {
		marginTop: 8,
		alignSelf: 'center',
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	resetButtonText: {
		fontSize: 14,
		color: c.systemRed,
		fontWeight: '500',
	},
	headerButtonContainer: {
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 6,
		backgroundColor: c.systemBackground,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 6,
	},
	headerButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
})

export const DAYS_OF_WEEK: {day: DayOfWeek; label: string}[] = [
	{day: 'Su', label: 'Sunday'},
	{day: 'Mo', label: 'Monday'},
	{day: 'Tu', label: 'Tuesday'},
	{day: 'We', label: 'Wednesday'},
	{day: 'Th', label: 'Thursday'},
	{day: 'Fr', label: 'Friday'},
	{day: 'Sa', label: 'Saturday'},
]

export type DayPickerProps = {
	selectedDay: DayOfWeek
	onDaySelect: (day: DayOfWeek) => void
	currentDay: DayOfWeek
	onReset?: () => void
}

export const DayPicker = ({
	selectedDay,
	onDaySelect,
	currentDay,
	onReset,
}: DayPickerProps): React.JSX.Element => {
	const isOverridden = selectedDay !== currentDay

	return (
		<View style={styles.dayPickerContainer}>
			<ScrollView
				contentContainerStyle={styles.dayPickerScroll}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				{DAYS_OF_WEEK.map(({day, label}) => {
					const isSelected = selectedDay === day
					return (
						<TouchableOpacity
							key={day}
							onPress={() => onDaySelect(day)}
							style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
						>
							<RNText
								style={[
									styles.dayButtonText,
									isSelected && styles.dayButtonTextSelected,
								]}
							>
								{label}
							</RNText>
						</TouchableOpacity>
					)
				})}
			</ScrollView>
			{isOverridden && onReset && (
				<TouchableOpacity onPress={onReset} style={styles.resetButton}>
					<RNText style={styles.resetButtonText}>Reset</RNText>
				</TouchableOpacity>
			)}
		</View>
	)
}

export const momentToDayOfWeek = (moment: Moment): DayOfWeek => {
	const dayMap: Record<number, DayOfWeek> = {
		0: 'Su',
		1: 'Mo',
		2: 'Tu',
		3: 'We',
		4: 'Th',
		5: 'Fr',
		6: 'Sa',
	}
	return dayMap[moment.day()]
}

export const createMomentForDay = (
	baseMoment: Moment,
	targetDay: DayOfWeek,
): Moment => {
	const dayMap: Record<DayOfWeek, number> = {
		Su: 0,
		Mo: 1,
		Tu: 2,
		We: 3,
		Th: 4,
		Fr: 5,
		Sa: 6,
	}

	const targetDayNumber = dayMap[targetDay]
	const currentDayNumber = baseMoment.day()
	const diff = targetDayNumber - currentDayNumber

	return baseMoment.clone().add(diff, 'days')
}

export type DayPickerHeaderProps = {
	selectedDay: DayOfWeek
	onDaySelect: (day: DayOfWeek) => void
	currentDay: DayOfWeek
	accentColor?: ColorValue
}

export const DayPickerHeader = ({
	selectedDay,
	onDaySelect,
	currentDay,
	accentColor = c.systemBlue,
}: DayPickerHeaderProps): React.JSX.Element => {
	const dayOptions = DAYS_OF_WEEK.map(({label}) => label)
	const selectedIndex = DAYS_OF_WEEK.findIndex(({day}) => day === selectedDay)
	const selectedLabel = DAYS_OF_WEEK[selectedIndex]?.label || 'Today'

	const isOverridden = selectedDay !== currentDay
	const displayText = isOverridden ? selectedLabel : 'Today'

	return (
		<Host style={{width: 150, height: 50}}>
			<ContextMenu>
				<ContextMenu.Items>
					<Text>Pick a schedule</Text>
					{dayOptions.map((dayLabel) => (
						<Button
							key={dayLabel}
							onPress={() => {
								const selectedDayData = DAYS_OF_WEEK.find(
									({label}) => label === dayLabel,
								)
								if (selectedDayData) {
									onDaySelect(selectedDayData.day)
								}
							}}
						>
							{dayLabel}
						</Button>
					))}
				</ContextMenu.Items>
				<ContextMenu.Trigger>
					<View
						style={[styles.headerButtonContainer, {borderColor: accentColor}]}
					>
						<Ionicons color={accentColor} name="calendar" size={16} />
						<RNText style={[styles.headerButtonText, {color: accentColor}]}>
							{displayText}
						</RNText>
					</View>
				</ContextMenu.Trigger>
			</ContextMenu>
		</Host>
	)

	// return (
	// 	<ContextMenu
	// 		actions={dayOptions}
	// 		isMenuPrimaryAction={true}
	// 		onPressMenuItem={(item: string) => {
	// 			const selectedDayData = DAYS_OF_WEEK.find(({label}) => label === item)
	// 			if (selectedDayData) {
	// 				onDaySelect(selectedDayData.day)
	// 			}
	// 		}}
	// 		selectedAction={selectedLabel}
	// 		title="Pick a schedule"
	// 	>
	// 		<View style={[styles.headerButtonContainer, {borderColor: accentColor}]}>
	// 			<Ionicons color={accentColor} name="calendar" size={16} />
	// 			<Text style={[styles.headerButtonText, {color: accentColor}]}>
	// 				{displayText}
	// 			</Text>
	// 		</View>
	// 	</ContextMenu>
	// )
}
