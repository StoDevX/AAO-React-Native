import * as React from 'react'
import {
	DynamicColorIOS,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
	type LayoutChangeEvent,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
} from 'react-native'
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'

const selectionCircleFill = DynamicColorIOS({light: '#000000', dark: '#FFFFFF'})
const selectionTextColor = DynamicColorIOS({light: '#FFFFFF', dark: '#000000'})

import type {SourcedEvent} from './types'

/**
 * Each day cell is identified by its own ISO date, so a UI test can reach a
 * specific day without depending on where it sits in the strip. Mirrored by
 * `TestIdentifiers.Calendar.dayCellPrefix`.
 */
export const DAY_CELL_PREFIX = 'day-cell-'

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

	// Start from Sunday of the current week so the strip always opens on a
	// week boundary.
	let sunday = today.clone().startOf('week')

	let days: Moment[] = []
	let current = sunday.clone()

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
	/**
	 * The day the strip came to rest on after a drag. Distinct from
	 * `onSelectDay` because the strip is already in position by the time this
	 * fires -- scrolling it again would fight the gesture that just ended.
	 */
	onScrollSettle: (day: Moment) => void
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
			// The selection is drawn as a filled circle, which carries no meaning
			// to VoiceOver. This is what actually announces the active day.
			accessibilityState={{selected: isSelected}}
			hitSlop={4}
			onPress={onPress}
			style={styles.cell}
			testID={`${DAY_CELL_PREFIX}${day.format('YYYY-MM-DD')}`}
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
	{days, selectedDay, onSelectDay, onScrollSettle, now},
	ref,
) {
	let scrollRef = React.useRef<ScrollView>(null)
	let [containerWidth, setContainerWidth] = React.useState(0)

	// Only a drag may move the selection. A programmatic scroll raises the same
	// momentum events, and acting on those would let the list and the strip
	// drive each other in a loop.
	let isDragging = React.useRef(false)

	let handleLayout = React.useCallback((event: LayoutChangeEvent) => {
		setContainerWidth(event.nativeEvent.layout.width)
	}, [])

	let maxScroll = Math.max(
		0,
		PADDING_HORIZONTAL * 2 + days.length * CELL_TOTAL_WIDTH - containerWidth,
	)

	let offsetForIndex = React.useCallback(
		(index: number) => {
			let x = PADDING_HORIZONTAL + index * CELL_TOTAL_WIDTH - CELL_MARGIN
			return Math.max(0, Math.min(x, maxScroll))
		},
		[maxScroll],
	)

	/**
	 * Where each week begins, as a scroll offset paired with the day it lands
	 * on. The range starts at today rather than at a Sunday, so these are found
	 * by walking the days rather than by a fixed stride.
	 */
	let weekStarts = React.useMemo(() => {
		return days
			.map((day, index) => ({day, index}))
			.filter(({day, index}) => index === 0 || day.day() === 0)
			.map(({day, index}) => ({day, offset: offsetForIndex(index)}))
	}, [days, offsetForIndex])

	let scrollToDay = React.useCallback(
		(day: Moment) => {
			if (!scrollRef.current || containerWidth === 0) {
				return
			}

			let sundayOfWeek = day.clone().startOf('week')
			let sundayIndex = days.findIndex((d) => d.isSame(sundayOfWeek, 'day'))

			scrollRef.current.scrollTo({
				x: offsetForIndex(sundayIndex >= 0 ? sundayIndex : 0),
				animated: true,
			})
		},
		[days, containerWidth, offsetForIndex],
	)

	React.useImperativeHandle(ref, () => ({scrollToDay}), [scrollToDay])

	// The strip rests on a snap offset, so the nearest week start is the one
	// filling the viewport.
	let settleAt = React.useCallback(
		(offsetX: number) => {
			if (!isDragging.current || weekStarts.length === 0) {
				return
			}
			isDragging.current = false

			let nearest = weekStarts.reduce((best, candidate) => {
				return Math.abs(candidate.offset - offsetX) < Math.abs(best.offset - offsetX)
					? candidate
					: best
			})

			if (!selectedDay || !nearest.day.isSame(selectedDay, 'day')) {
				onScrollSettle(nearest.day)
			}
		},
		[weekStarts, selectedDay, onScrollSettle],
	)

	let handleScrollBeginDrag = React.useCallback(() => {
		isDragging.current = true
	}, [])

	// A lift with velocity is followed by momentum, and the offset here is still
	// mid-flight -- settling on it would pick a week the strip is only passing
	// through. That case is left to `onMomentumScrollEnd`.
	let handleScrollEndDrag = React.useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			if (event.nativeEvent.velocity?.x) {
				return
			}
			settleAt(event.nativeEvent.contentOffset.x)
		},
		[settleAt],
	)

	let handleMomentumScrollEnd = React.useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			settleAt(event.nativeEvent.contentOffset.x)
		},
		[settleAt],
	)

	if (days.length === 0) {
		return null
	}

	return (
		<View style={styles.container} onLayout={handleLayout}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				decelerationRate="fast"
				horizontal={true}
				onMomentumScrollEnd={handleMomentumScrollEnd}
				onScrollBeginDrag={handleScrollBeginDrag}
				onScrollEndDrag={handleScrollEndDrag}
				ref={scrollRef}
				showsHorizontalScrollIndicator={false}
				snapToOffsets={weekStarts.map((week) => week.offset)}
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
