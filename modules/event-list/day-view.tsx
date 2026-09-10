import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Host,
	LazyVStack,
	RNHostView,
	ScrollView as SwiftUIScrollView,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {background, font, foregroundStyle, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'

import {DayPickerStrip, type DayPickerStripHandle} from './day-picker-strip'
import {daysWithEvents, deriveDays, eventsOnDay} from './days'
import {EventListRow} from './event-list-row'
import {formatSectionHeader} from './times'
import type {CalendarBodyHandle, CalendarSource, SourcedEvent} from './types'

type Props = {
	events: SourcedEvent[]
	sources: CalendarSource[]
	failed: CalendarSource[]
	message?: string
	isLoading?: boolean
	refreshing: boolean
	onRefresh: () => unknown
	now: Moment
	onPressEvent: (entry: SourcedEvent) => void
}

/**
 * One day of the calendar at a time, under a day picker.
 *
 * The strip is the only thing that says what day it is. Nothing reads the
 * scroll position back, so there is no second opinion to reconcile -- which is
 * what the sectioned list and its strip used to spend their time doing.
 */
export let DayView = React.forwardRef<CalendarBodyHandle, Props>(function DayView(props, ref) {
	let stripRef = React.useRef<DayPickerStripHandle>(null)

	let colorFor = React.useMemo(() => {
		let table = new Map(props.sources.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [props.sources])

	let days = React.useMemo(() => deriveDays(props.events, props.now), [props.events, props.now])
	let marked = React.useMemo(() => daysWithEvents(props.events, days), [props.events, days])

	// `deriveDays` always yields at least the current week, so today is always
	// among the days and the view always opens somewhere real.
	let [chosenDay, setChosenDay] = React.useState<Moment | null>(null)
	let selectedDay = chosenDay ?? days.find((day) => day.isSame(props.now, 'day')) ?? days[0]

	let rows = React.useMemo(
		() => (selectedDay ? eventsOnDay(props.events, selectedDay) : []),
		[props.events, selectedDay],
	)

	let showToday = React.useCallback(() => {
		let today = days.find((day) => day.isSame(props.now, 'day'))
		if (!today) return
		setChosenDay(today)
		stripRef.current?.scrollToDay(today)
	}, [days, props.now])

	React.useImperativeHandle(ref, () => ({showToday}), [showToday])

	let notice = (): React.ReactElement => {
		if (props.message) {
			return <NoticeView text={props.message} />
		}
		if (props.sources.length === 0) {
			// No retry: there is nothing to reload, and the way out is the
			// Calendars button rather than another attempt.
			return (
				<NoticeView text="No calendars are showing. Choose some from the Calendars button below." />
			)
		}
		if (props.events.length === 0 && props.failed.length > 0) {
			return (
				<NoticeView
					buttonText="Try Again"
					onPress={props.onRefresh}
					text={`Could not load ${props.failed.map((source) => source.title).join(', ')}.`}
				/>
			)
		}
		if (props.events.length === 0 && props.isLoading) {
			return <NoticeView text="Loading…" />
		}
		return <NoticeView text="Nothing on this day." />
	}

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				<RNHostView matchContents={true}>
					<DayPickerStrip
						ref={stripRef}
						days={days}
						daysWithEvents={marked}
						now={props.now}
						onSelectDay={setChosenDay}
						selectedDay={selectedDay ?? null}
					/>
				</RNHostView>
				{rows.length === 0 ? (
					// Below the strip rather than in place of it: replacing the whole
					// view would strand someone on a blank day with nothing to
					// navigate away with.
					<RNHostView matchContents={true}>{notice()}</RNHostView>
				) : (
					<SwiftUIScrollView
						modifiers={[
							background(c.systemBackground),
							refreshable(async () => {
								await props.onRefresh()
							}),
						]}
					>
						<LazyVStack alignment="leading">
							<VStack
								alignment="leading"
								modifiers={[padding({leading: 16, trailing: 16, top: 12, bottom: 8})]}
							>
								<Text
									modifiers={[
										font({textStyle: 'headline'}),
										foregroundStyle(selectedDay?.isSame(props.now, 'day') ? c.systemRed : c.label),
									]}
								>
									{selectedDay ? formatSectionHeader(selectedDay) : ''}
								</Text>
								{rows.map((entry, index) => (
									<EventListRow
										color={colorFor(entry.sourceId)}
										event={entry.event}
										isLastInSection={index === rows.length - 1}
										key={`${entry.sourceId}|${entry.key}`}
										onPress={() => props.onPressEvent(entry)}
									/>
								))}
							</VStack>
						</LazyVStack>
					</SwiftUIScrollView>
				)}
			</VStack>
		</Host>
	)
})

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
