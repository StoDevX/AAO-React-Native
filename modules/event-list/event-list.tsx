import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Host,
	LazyVStack,
	RNHostView,
	ScrollView as SwiftUIScrollView,
	Text,
	useNativeState,
	VStack,
} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	id,
	padding,
	refreshable,
	scrollPosition,
	scrollTargetLayout,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'
import {DayPickerStrip, deriveDays, type DayPickerStripHandle} from './day-picker-strip'
import {EventListRow} from './event-list-row'
import {formatSectionHeader} from './times'
import {CalendarSource, PoweredBy, SourcedEvent} from './types'

type Props = {
	events: SourcedEvent[]
	sources: CalendarSource[]
	failed: CalendarSource[]
	message?: string
	refreshing: boolean
	onRefresh: () => unknown
	now: Moment
	poweredBy: PoweredBy
	onPressEvent: (entry: SourcedEvent) => void
}

export type EventListHandle = {
	scrollToToday: () => void
}

type EventSection = {
	readonly key: string
	readonly title: string
	readonly isToday: boolean
	readonly data: SourcedEvent[]
}

/**
 * Groups events into an `Ongoing` group and one group per day, with today's
 * events together regardless of the timezone quirks in `event.startTime`.
 *
 * Day groups are keyed on an unambiguous ISO date rather than on their
 * display title, which is locale-aware and computed separately below.
 */
function groupEvents(events: readonly SourcedEvent[], now: Moment): Array<EventSection> {
	let grouped = groupBy(events, (entry) => {
		if (entry.event.isOngoing) {
			return 'Ongoing'
		}
		if (entry.event.startTime.isSame(now, 'day')) {
			return 'Today'
		}
		return entry.event.startTime.format('YYYY-MM-DD') // google returns events in CST
	})

	return toPairs(grouped).map(([key, data]) => {
		if (key === 'Ongoing') {
			return {key, title: 'Ongoing', isToday: false, data}
		}
		if (key === 'Today') {
			return {key, title: formatSectionHeader(now), isToday: true, data}
		}
		return {key, title: formatSectionHeader(data[0].event.startTime), isToday: false, data}
	})
}

/**
 * Plain, leading-aligned section header text on the list background --
 * Calendar.app has no card behind it. Today's is tinted red; every other
 * day uses the normal label colour, as Calendar.app has it.
 */
function SectionHeader({title, isToday}: {title: string; isToday: boolean}): React.ReactNode {
	return (
		<Text
			modifiers={[font({textStyle: 'headline'}), foregroundStyle(isToday ? c.systemRed : c.label)]}
		>
			{title}
		</Text>
	)
}

export let EventList = React.forwardRef<EventListHandle, Props>(function EventList(props, ref) {
	let colorFor = React.useMemo(() => {
		let table = new Map(props.sources.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [props.sources])

	let scrollTarget = useNativeState<string | null>(null)
	let stripRef = React.useRef<DayPickerStripHandle>(null)

	let days = React.useMemo(() => deriveDays(props.events, props.now), [props.events, props.now])

	let [selectedDay, setSelectedDay] = React.useState<Moment | null>(() => {
		return days.length > 0 ? days[0] : null
	})

	let handleSelectDay = React.useCallback(
		(day: Moment) => {
			setSelectedDay(day)
			let sectionKey = day.isSame(props.now, 'day') ? 'Today' : day.format('YYYY-MM-DD')
			scrollTarget.value = sectionKey
			stripRef.current?.scrollToDay(day)
		},
		[props.now, scrollTarget],
	)

	let scrollToToday = React.useCallback(() => {
		scrollTarget.value = 'Ongoing'
		let today = days.find((d) => d.isSame(props.now, 'day'))
		if (today) {
			setSelectedDay(today)
			stripRef.current?.scrollToDay(today)
		}
	}, [days, props.now, scrollTarget])

	React.useImperativeHandle(
		ref,
		() => ({
			scrollToToday,
		}),
		[scrollToToday],
	)

	if (props.message) {
		return <NoticeView text={props.message} />
	}

	if (props.sources.length === 0) {
		// No retry: there is nothing to reload, and the way out is the Calendars
		// button rather than another attempt.
		return (
			<NoticeView text="No calendars are showing. Choose some from the Calendars button below." />
		)
	}

	if (props.events.length === 0) {
		// Each notice replaces the list, and the list is what carries
		// pull-to-refresh -- so each has to offer the retry itself, or a failed
		// load leaves the screen with no way back but the back button.
		//
		// A calendar that failed to load is worth naming even when it left
		// nothing else to show -- otherwise "every source errored" and "nothing
		// is on today" read as the identical bare "No events."
		if (props.failed.length > 0) {
			return (
				<NoticeView
					buttonText="Try Again"
					onPress={props.onRefresh}
					text={`Could not load ${props.failed.map((source) => source.title).join(', ')}.`}
				/>
			)
		}
		return <NoticeView buttonText="Try Again" onPress={props.onRefresh} text="No events." />
	}

	let sections = groupEvents(props.events, props.now)

	return (
		<Host style={styles.host}>
			<VStack>
				<RNHostView matchContents={true}>
					<DayPickerStrip
						ref={stripRef}
						days={days}
						now={props.now}
						onSelectDay={handleSelectDay}
						selectedDay={selectedDay}
					/>
				</RNHostView>
				<SwiftUIScrollView
					modifiers={[
						background(c.systemBackground),
						refreshable(async () => {
							await props.onRefresh()
						}),
						scrollPosition(scrollTarget, {
							anchor: 'top',
							onChange: (sectionKey) => {
								if (!sectionKey) return
								let matchingDay = days.find((d) => {
									let key = d.isSame(props.now, 'day') ? 'Today' : d.format('YYYY-MM-DD')
									return key === sectionKey
								})
								if (matchingDay && (!selectedDay || !matchingDay.isSame(selectedDay, 'day'))) {
									setSelectedDay(matchingDay)
									stripRef.current?.scrollToDay(matchingDay)
								}
							},
						}),
					]}
				>
					<LazyVStack alignment="leading" modifiers={[scrollTargetLayout()]}>
						{props.failed.length > 0 ? (
							<Text modifiers={[foregroundStyle(c.secondaryLabel), font({textStyle: 'footnote'})]}>
								{`Could not load ${props.failed.map((source) => source.title).join(', ')}.`}
							</Text>
						) : null}
						{sections.map((section) => (
							<VStack
								key={section.key}
								alignment="leading"
								modifiers={[
									id(section.key),
									padding({leading: 16, trailing: 16, top: 12, bottom: 8}),
								]}
							>
								<SectionHeader isToday={section.isToday} title={section.title} />
								{section.data.map((entry, index) => (
									<EventListRow
										color={colorFor(entry.sourceId)}
										event={entry.event}
										isLastInSection={index === section.data.length - 1}
										key={`${entry.sourceId}|${entry.key}`}
										onPress={() => props.onPressEvent(entry)}
									/>
								))}
							</VStack>
						))}
					</LazyVStack>
				</SwiftUIScrollView>
			</VStack>
		</Host>
	)
})

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
