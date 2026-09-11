import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Host,
	LazyVStack,
	RNHostView,
	ScrollView as SwiftUIScrollView,
	TabView,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	frame,
	padding,
	refreshable,
	tabViewStyle,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'

import {DayPickerStrip, type DayPickerStripHandle} from './day-picker-strip'
import {deriveDays, eventsByDay} from './days'
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
	// One pass over the events, read by the strip for its dots and by every day
	// on screen for its rows. Neither can disagree with the other, because both
	// read the same buckets.
	let byDay = React.useMemo(() => eventsByDay(props.events, days), [props.events, days])

	let marked = React.useMemo(() => {
		let found = new Set<string>()
		for (let [iso, bucket] of byDay) {
			if (bucket.length > 0) found.add(iso)
		}
		return found
	}, [byDay])

	// `deriveDays` always yields at least the current week, so today is always
	// among the days and the view always opens somewhere real.
	let [chosenDay, setChosenDay] = React.useState<Moment | null>(null)

	// A chosen day the strip no longer offers is ignored rather than cleared.
	// Narrowing the filter can shorten the range past it, and a selection the
	// strip cannot show is the strip and the content disagreeing again -- the
	// thing this view exists to prevent. Held rather than dropped so widening
	// the filter again returns the day the reader was on.
	let chosenIsVisible = chosenDay ? days.some((day) => day.isSame(chosenDay, 'day')) : false
	let selectedDay =
		(chosenIsVisible ? chosenDay : null) ??
		days.find((day) => day.isSame(props.now, 'day')) ??
		days[0]

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
				<TabView
					modifiers={[tabViewStyle({type: 'page', indexDisplayMode: 'never'})]}
					onSelectionChange={(iso) => {
						let day = days.find((d) => d.format('YYYY-MM-DD') === iso)
						if (day) {
							setChosenDay(day)
							stripRef.current?.scrollToDay(day)
						}
					}}
					selection={selectedDay?.format('YYYY-MM-DD') ?? ''}
				>
					{days.map((day) => {
						let iso = day.format('YYYY-MM-DD')
						let dayRows = byDay.get(iso) ?? []

						return (
							<TabView.Tab key={iso} value={iso}>
								{dayRows.length === 0 ? (
									<VStack modifiers={[frame({maxHeight: Infinity})]}>
										<RNHostView matchContents={false}>{notice()}</RNHostView>
									</VStack>
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
														foregroundStyle(day.isSame(props.now, 'day') ? c.systemRed : c.label),
													]}
												>
													{formatSectionHeader(day)}
												</Text>
												{dayRows.map((entry, index) => (
													<EventListRow
														color={colorFor(entry.sourceId)}
														event={entry.event}
														isLastInSection={index === dayRows.length - 1}
														key={`${entry.sourceId}|${entry.key}`}
														onPress={() => props.onPressEvent(entry)}
													/>
												))}
											</VStack>
										</LazyVStack>
									</SwiftUIScrollView>
								)}
							</TabView.Tab>
						)
					})}
				</TabView>
			</VStack>
		</Host>
	)
})

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
