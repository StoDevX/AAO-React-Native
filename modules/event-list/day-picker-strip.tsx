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

/**
 * Each day cell is identified by its own ISO date, so a UI test can reach a
 * specific day without depending on where it sits in the strip. Mirrored by
 * `TestIdentifiers.Calendar.dayCellPrefix`.
 */
export const DAY_CELL_PREFIX = 'day-cell-'

/**
 * A day's dot is identified by its own ISO date, the same way its cell is.
 * Mirrored by `TestIdentifiers.Calendar.dayDotPrefix`.
 */
export const DAY_DOT_PREFIX = 'day-dot-'

const DOT_SIZE = 5

const CELL_WIDTH = 44
const CELL_MARGIN = 4
const CELL_TOTAL_WIDTH = CELL_WIDTH + CELL_MARGIN * 2
const PADDING_HORIZONTAL = 8
const CIRCLE_SIZE = 32
const DAYS_PER_WEEK = 7

/**
 * Generates a continuous range of whole weeks, from Sunday of the current week
 * through the Saturday of the last event's week. Whole weeks keep every day
 * sitting under a Sunday the strip can snap to. Returns an empty array if
 * there are no future events.
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

	let sunday = today.clone().startOf('week')

	// Compared as a calendar date rather than as an instant. `now` and an
	// event's `startTime` are both device-local, but nothing in this
	// function's signature says so, and comparing two moments in different
	// zones as instants runs the range a day long or a day short. Whole weeks
	// is the contract the strip's snapping is built on.
	let lastDate = lastDay.format('YYYY-MM-DD')

	let days: Moment[] = []
	let current = sunday.clone()
	let weekEnd = ''

	do {
		for (let i = 0; i < DAYS_PER_WEEK; i++) {
			days.push(current.clone())
			weekEnd = current.format('YYYY-MM-DD')
			current.add(1, 'day')
		}
	} while (weekEnd < lastDate)

	return days
}

/**
 * Whether `day` opens its week, by the rule `deriveDays` and `scrollToDay`
 * both use. Moment's week boundary is locale-driven, so testing for Sunday
 * outright would leave a second definition to drift from this one.
 */
function isWeekStart(day: Moment): boolean {
	return day.isSame(day.clone().startOf('week'), 'day')
}

type Props = {
	days: Moment[]
	selectedDay: Moment | null
	onSelectDay: (day: Moment) => void
	daysWithEvents: ReadonlySet<string>
	now: Moment
}

export type DayPickerStripHandle = {
	scrollToDay: (day: Moment) => void
}

function DayCell({
	day,
	isToday,
	isSelected,
	hasEvents,
	onPress,
}: {
	day: Moment
	isToday: boolean
	isSelected: boolean
	hasEvents: boolean
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
			accessibilityLabel={
				hasEvents ? `${day.format('dddd, MMMM D')}, has events` : day.format('dddd, MMMM D')
			}
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
			{hasEvents ? (
				<View
					style={[styles.dot, {backgroundColor: isSelected || isToday ? textColor : c.label}]}
					testID={`${DAY_DOT_PREFIX}${day.format('YYYY-MM-DD')}`}
				/>
			) : (
				<View style={styles.dot} />
			)}
		</Pressable>
	)
}

export let DayPickerStrip = React.forwardRef<DayPickerStripHandle, Props>(function DayPickerStrip(
	{days, selectedDay, onSelectDay, daysWithEvents, now},
	ref,
) {
	let scrollRef = React.useRef<ScrollView>(null)
	let [containerWidth, setContainerWidth] = React.useState(0)

	let handleLayout = React.useCallback((event: LayoutChangeEvent) => {
		setContainerWidth(event.nativeEvent.layout.width)
	}, [])

	// Trailing room so the last week's Sunday can still pull to the leading
	// edge -- scroll inset, not day cells, so there is no empty week to swipe
	// into. A full week already fills a phone; wider screens need the rest.
	// Sized so the scroll bottoms out exactly on that Sunday's offset: any more
	// and the strip drags into blank space and rubber-bands back.
	let trailingInset = Math.max(
		0,
		containerWidth - (DAYS_PER_WEEK * CELL_TOTAL_WIDTH + PADDING_HORIZONTAL * 2 - CELL_MARGIN),
	)

	let maxScroll = Math.max(
		0,
		PADDING_HORIZONTAL * 2 + trailingInset + days.length * CELL_TOTAL_WIDTH - containerWidth,
	)

	/**
	 * Where a cell sits in the content, before the scroll range clamps it. The
	 * unclamped form is what says whether that cell can reach the leading edge
	 * at all, which is why it is separate from `offsetForIndex`.
	 */
	let rawOffsetForIndex = React.useCallback(
		(index: number) => PADDING_HORIZONTAL + index * CELL_TOTAL_WIDTH - CELL_MARGIN,
		[],
	)

	let offsetForIndex = React.useCallback(
		(index: number) => Math.max(0, Math.min(rawOffsetForIndex(index), maxScroll)),
		[rawOffsetForIndex, maxScroll],
	)

	/**
	 * Where each week begins, as a scroll offset paired with the day it lands
	 * on, and a place the strip can come to rest. A week start whose offset
	 * would clamp against `maxScroll` can't pull to the leading edge, so it is
	 * dropped -- its days still render, they are just not a snap stop. The first
	 * cell always stays, even on a strip too short to scroll.
	 */
	let weekStarts = React.useMemo(() => {
		return days
			.map((day, index) => ({day, index}))
			.filter(({day, index}) => {
				if (index === 0) return true
				if (!isWeekStart(day)) return false
				return rawOffsetForIndex(index) <= maxScroll
			})
			.map(({day, index}) => ({day, offset: offsetForIndex(index)}))
	}, [days, offsetForIndex, rawOffsetForIndex, maxScroll])

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

	if (days.length === 0) {
		return null
	}

	return (
		<View style={styles.container} onLayout={handleLayout}>
			<ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{paddingEnd: PADDING_HORIZONTAL + trailingInset},
				]}
				decelerationRate="fast"
				horizontal={true}
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
							hasEvents={daysWithEvents.has(day.format('YYYY-MM-DD'))}
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
	dot: {
		width: DOT_SIZE,
		height: DOT_SIZE,
		borderRadius: DOT_SIZE / 2,
		marginTop: 2,
	},
})
