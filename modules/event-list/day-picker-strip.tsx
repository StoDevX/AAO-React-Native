import * as React from 'react'
import {
	DynamicColorIOS,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
	type LayoutChangeEvent,
} from 'react-native'
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'

const selectionCircleFill = DynamicColorIOS({light: '#000000', dark: '#FFFFFF'})
const selectionTextColor = DynamicColorIOS({light: '#FFFFFF', dark: '#000000'})

import type {SourcedEvent} from './types'

const CELL_WIDTH = 44
const CELL_MARGIN = 4
const CELL_TOTAL_WIDTH = CELL_WIDTH + CELL_MARGIN * 2
const PADDING_HORIZONTAL = 8
const CIRCLE_SIZE = 32

/**
 * Generates a continuous range of days from today through the last event day.
 * Returns an empty array if there are no future events.
 */
export function deriveDays(events: readonly SourcedEvent[], now: Moment): Moment[] {
	let today = now.clone().startOf('day')
	let lastDay: Moment | null = null

	for (let entry of events) {
		if (entry.event.isOngoing) {
			continue
		}

		let day = entry.event.startTime.clone().startOf('day')

		if (day.isBefore(today, 'day')) {
			continue
		}

		if (!lastDay || day.isAfter(lastDay, 'day')) {
			lastDay = day
		}
	}

	if (!lastDay) {
		return []
	}

	let days: Moment[] = []
	let current = today.clone()

	while (current.isSameOrBefore(lastDay, 'day')) {
		days.push(current.clone())
		current.add(1, 'day')
	}

	return days
}

type Props = {
	days: Moment[]
	selectedDay: Moment | null
	onSelectDay: (day: Moment) => void
	now: Moment
}

export type DayPickerStripHandle = {
	scrollToDay: (day: Moment) => void
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

	let showTodayCircle = isToday
	let showSelectionCircle = isSelected && !isToday
	let textColor = isToday ? '#FFFFFF' : showSelectionCircle ? selectionTextColor : c.label
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
				{showTodayCircle ? <View style={[styles.circle, {backgroundColor: c.systemRed}]} /> : null}
				{showSelectionCircle ? (
					<View style={[styles.circle, {backgroundColor: selectionCircleFill}]} />
				) : null}
				<Text style={[styles.date, {color: textColor}]}>{dateNumber}</Text>
			</View>
		</Pressable>
	)
}

export let DayPickerStrip = React.forwardRef<DayPickerStripHandle, Props>(function DayPickerStrip(
	{days, selectedDay, onSelectDay, now},
	ref,
) {
	let scrollRef = React.useRef<ScrollView>(null)
	let [containerWidth, setContainerWidth] = React.useState(0)

	let handleLayout = React.useCallback((event: LayoutChangeEvent) => {
		setContainerWidth(event.nativeEvent.layout.width)
	}, [])

	let scrollToDay = React.useCallback(
		(day: Moment) => {
			if (!scrollRef.current || containerWidth === 0) {
				return
			}

			let sundayOfWeek = day.clone().startOf('week')
			let sundayIndex = days.findIndex((d) => d.isSame(sundayOfWeek, 'day'))
			let scrollToIndex = sundayIndex >= 0 ? sundayIndex : 0

			let scrollX = PADDING_HORIZONTAL + scrollToIndex * CELL_TOTAL_WIDTH - CELL_MARGIN
			let maxScroll = PADDING_HORIZONTAL * 2 + days.length * CELL_TOTAL_WIDTH - containerWidth
			scrollX = Math.max(0, Math.min(scrollX, maxScroll))

			scrollRef.current.scrollTo({x: scrollX, animated: true})
		},
		[days, containerWidth],
	)

	React.useImperativeHandle(ref, () => ({scrollToDay}), [scrollToDay])

	if (days.length === 0) {
		return null
	}

	return (
		<View style={styles.container} onLayout={handleLayout}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				horizontal={true}
				ref={scrollRef}
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
})

const styles = StyleSheet.create({
	container: {
		borderBottomColor: c.separator,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	scrollContent: {
		paddingHorizontal: PADDING_HORIZONTAL,
		paddingVertical: 8,
	},
	cell: {
		width: CELL_WIDTH,
		alignItems: 'center',
		marginHorizontal: CELL_MARGIN,
	},
	weekday: {
		fontSize: 11,
		fontWeight: '600',
		marginBottom: 4,
	},
	dateContainer: {
		width: CIRCLE_SIZE,
		height: CIRCLE_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circle: {
		position: 'absolute',
		width: CIRCLE_SIZE,
		height: CIRCLE_SIZE,
		borderRadius: CIRCLE_SIZE / 2,
	},
	date: {
		fontSize: 17,
		fontWeight: '400',
	},
})
