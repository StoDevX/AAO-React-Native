import * as React from 'react'
import {ColorValue, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import type {Moment} from 'moment-timezone'
import type {DayOfWeek} from '../types'
import * as c from '@frogpond/colors'
import {HStack, Host, Image, Menu, Section, Text as SwiftUIText, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	background,
	contentShape,
	font,
	foregroundColor,
	padding,
	shapes,
	strokeBorder,
} from '@expo/ui/swift-ui/modifiers'

/// Matches TestIdentifiers.Transportation in the XCUITest target.
const DAY_PICKER_TEST_ID = 'bus-day-picker'

const ICON_SIZE = 16
/// The label was a 14pt React Native Text, which scaled with Dynamic Type.
/// A system font takes its size from the text style, so pick the style.
const LABEL_TEXT_STYLE = 'subheadline'

const HEADER_BUTTON_RADIUS = 6

const headerButtonShape = shapes.roundedRectangle({
	cornerRadius: HEADER_BUTTON_RADIUS,
	roundedCornerStyle: 'circular',
})

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

export const DAYS_OF_WEEK: Array<{day: DayOfWeek; label: string}> = [
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
}: DayPickerProps): React.ReactNode => {
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
							<Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
								{label}
							</Text>
						</TouchableOpacity>
					)
				})}
			</ScrollView>
			{isOverridden && onReset && (
				<TouchableOpacity onPress={onReset} style={styles.resetButton}>
					<Text style={styles.resetButtonText}>Reset</Text>
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

export const createMomentForDay = (baseMoment: Moment, targetDay: DayOfWeek): Moment => {
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
}: DayPickerHeaderProps): React.ReactNode => {
	const dayOptions = DAYS_OF_WEEK.map(({label}) => label)
	const selectedIndex = DAYS_OF_WEEK.findIndex(({day}) => day === selectedDay)
	const selectedLabel = DAYS_OF_WEEK[selectedIndex]?.label || 'Today'

	const isOverridden = selectedDay !== currentDay
	const displayText = isOverridden ? selectedLabel : 'Today'

	const onSelect = (label: string) => {
		const selectedDayData = DAYS_OF_WEEK.find((d) => d.label === label)
		if (selectedDayData) {
			onDaySelect(selectedDayData.day)
		}
	}

	// The trigger is built from SwiftUI views rather than hosting the React
	// Native ones: a hosted view is measured and exposed to the accessibility
	// tree differently, which leaves the trigger unfindable by the UI tests.
	return (
		<Host matchContents={true}>
			<Menu
				label={
					<HStack
						modifiers={[
							padding({horizontal: 8, vertical: 6}),
							background(c.systemBackground, headerButtonShape),
							contentShape(headerButtonShape),
							strokeBorder({
								color: accentColor,
								cornerRadius: HEADER_BUTTON_RADIUS,
								shape: 'roundedRectangle',
								style: {lineWidth: 1},
							}),
							accessibilityIdentifier(DAY_PICKER_TEST_ID),
						]}
						spacing={6}
					>
						<Image color={accentColor} size={ICON_SIZE} systemName="calendar" />
						<SwiftUIText
							modifiers={[
								font({textStyle: LABEL_TEXT_STYLE, weight: 'medium'}),
								foregroundColor(accentColor),
							]}
						>
							{displayText}
						</SwiftUIText>
					</HStack>
				}
			>
				<Section title="Pick a schedule">
					{dayOptions.map((label) => (
						<Toggle
							key={label}
							isOn={label === selectedLabel}
							label={label}
							onIsOnChange={() => onSelect(label)}
						/>
					))}
				</Section>
			</Menu>
		</Host>
	)
}
