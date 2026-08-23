import * as React from 'react'
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native'
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'

import type {SourcedEvent} from './types'

/**
 * Extracts unique days from events, starting from today, sorted chronologically.
 * Excludes ongoing events (they appear in their own section, not a date).
 */
export function deriveDays(events: readonly SourcedEvent[], now: Moment): Moment[] {
	let seen = new Set<string>()
	let days: Moment[] = []

	for (let entry of events) {
		if (entry.event.isOngoing) {
			continue
		}

		let day = entry.event.startTime.clone().startOf('day')
		let key = day.format('YYYY-MM-DD')

		if (day.isBefore(now, 'day')) {
			continue
		}

		if (!seen.has(key)) {
			seen.add(key)
			days.push(day)
		}
	}

	return days.sort((a, b) => a.valueOf() - b.valueOf())
}

type Props = {
	days: Moment[]
	selectedDay: Moment | null
	onSelectDay: (day: Moment) => void
	now: Moment
}

function DayCell({
	day,
	isToday,
	isSelected,
	onPress,
}: {
	day: Moment
	isToday: boolean
	isSelected: boolean
	onPress: () => void
}): React.ReactNode {
	let weekdayLetter = day.format('dd').charAt(0).toUpperCase()
	let dateNumber = day.format('D')

	let circleColor = isToday ? c.systemRed : c.systemBlue
	let showCircle = isSelected
	let textColor = isSelected ? '#FFFFFF' : c.label
	let weekdayColor = isToday ? c.systemRed : c.secondaryLabel

	return (
		<Pressable
			accessibilityLabel={day.format('dddd, MMMM D')}
			accessibilityRole="button"
			hitSlop={4}
			onPress={onPress}
			style={styles.cell}
		>
			<Text style={[styles.weekday, {color: weekdayColor}]}>{weekdayLetter}</Text>
			<View style={styles.dateContainer}>
				{showCircle ? <View style={[styles.circle, {backgroundColor: circleColor}]} /> : null}
				<Text style={[styles.date, {color: textColor}]}>{dateNumber}</Text>
			</View>
		</Pressable>
	)
}

export function DayPickerStrip({days, selectedDay, onSelectDay, now}: Props): React.ReactNode {
	if (days.length === 0) {
		return null
	}

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				{days.map((day) => {
					let isToday = day.isSame(now, 'day')
					let isSelected = selectedDay ? day.isSame(selectedDay, 'day') : false

					return (
						<DayCell
							day={day}
							isSelected={isSelected}
							isToday={isToday}
							key={day.format('YYYY-MM-DD')}
							onPress={() => onSelectDay(day)}
						/>
					)
				})}
			</ScrollView>
		</View>
	)
}

const CELL_SIZE = 44

const styles = StyleSheet.create({
	container: {
		borderBottomColor: c.separator,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	scrollContent: {
		paddingHorizontal: 8,
		paddingVertical: 8,
	},
	cell: {
		width: CELL_SIZE,
		alignItems: 'center',
		marginHorizontal: 4,
	},
	weekday: {
		fontSize: 11,
		fontWeight: '600',
		marginBottom: 4,
	},
	dateContainer: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circle: {
		position: 'absolute',
		width: 32,
		height: 32,
		borderRadius: 16,
	},
	date: {
		fontSize: 17,
		fontWeight: '400',
	},
})
