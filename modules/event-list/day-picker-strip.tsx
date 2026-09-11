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

import {DAYS_PER_WEEK} from './days'

/**
 * Each day cell is identified by its own ISO date, so a UI test can reach a
 * specific day without depending on where it sits in the strip. Mirrored by
 * `TestIdentifiers.Calendar.dayCellPrefix`.
 */
export const DAY_CELL_PREFIX = 'day-cell-'

/**
 * A day's dot is identified by its own ISO date, the same way its cell is.
 */
export const DAY_DOT_PREFIX = 'day-dot-'

const DOT_SIZE = 5

const CELL_MARGIN = 4
const PADDING_HORIZONTAL = 8
const CIRCLE_SIZE = 32

/**
 * The smallest a cell is allowed to shrink to, so a narrow phone never drops
 * below the 44pt minimum tap target.
 */
const MIN_CELL_WIDTH = 44
const MIN_CELL_TOTAL_WIDTH = MIN_CELL_WIDTH + CELL_MARGIN * 2

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

// Memoized, and taking `day` plus a stable `onPress` rather than a
// ready-made closure: with 100+ cells in the strip, an unmemoized cell (or a
// fresh closure per cell per render) means every cell re-renders and crosses
// the SwiftUI bridge on every tap, just to move which cell has a circle
// behind it.
let DayCell = React.memo(function DayCell({
	day,
	isToday,
	isSelected,
	hasEvents,
	isPast,
	onPress,
	width,
}: {
	day: Moment
	isToday: boolean
	isSelected: boolean
	hasEvents: boolean
	isPast: boolean
	onPress: (day: Moment) => void
	width: number
}): React.ReactNode {
	let weekdayLetter = day.format('dd').charAt(0).toUpperCase()
	let dateNumber = day.format('D')
	let handlePress = React.useCallback(() => onPress(day), [onPress, day])

	// Today keeps its own circle only while it is also the selection -- worn
	// at all times, it competed with the selection circle and left two days
	// looking chosen at once. Off today, unselected, red carries the "today"
	// meaning on its own, the way Calendar.app does it.
	let showTodayCircle = isToday && isSelected
	let showSelectionCircle = isSelected && !isToday
	let textColor = showTodayCircle
		? '#FFFFFF'
		: isToday
			? c.systemRed
			: showSelectionCircle
				? selectionTextColor
				: c.label
	let weekdayColor = isToday ? c.systemRed : c.secondaryLabel

	// A day already gone cannot be chosen -- there is nothing behind today to
	// show, since anything that has ended never reaches this screen. It stays
	// drawn so the week it opens reads whole.
	let dimmed = isPast ? {opacity: 0.3} : null

	return (
		<Pressable
			accessibilityLabel={
				hasEvents ? `${day.format('dddd, MMMM D')}, has events` : day.format('dddd, MMMM D')
			}
			accessibilityRole="button"
			accessibilityState={{disabled: isPast, selected: isSelected}}
			disabled={isPast}
			hitSlop={4}
			onPress={handlePress}
			style={[styles.cell, {width}, dimmed]}
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
					style={[styles.dot, {backgroundColor: isToday ? c.systemRed : c.label}]}
					testID={`${DAY_DOT_PREFIX}${day.format('YYYY-MM-DD')}`}
				/>
			) : (
				<View style={styles.dot} />
			)}
		</Pressable>
	)
})

export let DayPickerStrip = React.forwardRef<DayPickerStripHandle, Props>(function DayPickerStrip(
	{days, selectedDay, onSelectDay, daysWithEvents, now},
	ref,
) {
	let scrollRef = React.useRef<ScrollView>(null)
	let [containerWidth, setContainerWidth] = React.useState(0)

	let handleLayout = React.useCallback((event: LayoutChangeEvent) => {
		setContainerWidth(event.nativeEvent.layout.width)
	}, [])

	// A week has to fill the viewport exactly, or the next week's first cell
	// sits in the leftover space and shows at the strip's trailing edge. A
	// fixed cell width can't promise that on every phone, so the width is
	// derived from what actually got measured -- floored at the 44pt minimum
	// tap target for a phone too narrow to reach it otherwise.
	let cellTotalWidth =
		containerWidth > 0
			? Math.max(MIN_CELL_TOTAL_WIDTH, (containerWidth - PADDING_HORIZONTAL * 2) / DAYS_PER_WEEK)
			: MIN_CELL_TOTAL_WIDTH
	let cellWidth = cellTotalWidth - CELL_MARGIN * 2

	// Trailing room so the last week's Sunday can still pull to the leading
	// edge -- scroll inset, not day cells, so there is no empty week to swipe
	// into. A full week already fills a phone; wider screens need the rest.
	// Sized so the scroll bottoms out exactly on that Sunday's offset: any more
	// and the strip drags into blank space and rubber-bands back.
	let trailingInset = Math.max(
		0,
		containerWidth - (DAYS_PER_WEEK * cellTotalWidth + PADDING_HORIZONTAL * 2 - CELL_MARGIN),
	)

	let maxScroll = Math.max(
		0,
		PADDING_HORIZONTAL * 2 + trailingInset + days.length * cellTotalWidth - containerWidth,
	)

	/**
	 * Where a cell sits in the content, before the scroll range clamps it. The
	 * unclamped form is what says whether that cell can reach the leading edge
	 * at all, which is why it is separate from `offsetForIndex`.
	 */
	let rawOffsetForIndex = React.useCallback(
		// Whole cells from the start, so week zero is at zero -- which is where
		// an untouched strip already rests. Counting the container's padding in
		// here put it four points along instead, and the session's first scroll
		// shifted the strip by that much before settling onto this grid and
		// never moving again.
		(index: number) => index * cellTotalWidth,
		[cellTotalWidth],
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
							isPast={day.isBefore(now, 'day')}
							isSelected={isSelected}
							isToday={isToday}
							key={day.format('YYYY-MM-DD')}
							onPress={onSelectDay}
							width={cellWidth}
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
		alignItems: 'center',
		borderRadius: 12,
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
