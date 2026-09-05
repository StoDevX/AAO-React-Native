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
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'
import {DayPickerStrip, deriveDays, type DayPickerStripHandle} from './day-picker-strip'
import {EventListRow} from './event-list-row'
import {groupEvents} from './sections'
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

	// A handle on SwiftUI's own scroll position, not a React value: assigning
	// `.value` is how `scrollPosition` is driven, and every assignment below sits
	// in an event handler rather than in render. The `react/immutability`
	// disables at those three sites are for that, and nothing else.
	let scrollTarget = useNativeState<string | null>(null)
	let stripRef = React.useRef<DayPickerStripHandle>(null)

	let days = React.useMemo(() => deriveDays(props.events, props.now), [props.events, props.now])

	let sections = React.useMemo(
		() => groupEvents(props.events, props.now),
		[props.events, props.now],
	)

	let [chosenDay, setChosenDay] = React.useState<Moment | null>(null)

	// Until the user picks one, the strip rests on the list's top section, whose
	// key is 'Today', 'Ongoing', or an ISO date. Derived, so the strip has a day
	// on it from the first render that has sections to offer.
	let defaultDay = React.useMemo(() => {
		if (sections.length === 0) {
			return null
		}
		let topKey = sections[0].key
		if (topKey === 'Ongoing' || topKey === 'Today') {
			return days.find((d) => d.isSame(props.now, 'day')) ?? null
		}
		return days.find((d) => d.format('YYYY-MM-DD') === topKey) ?? null
	}, [days, sections, props.now])

	// If the chosen day no longer has events (filter changed), fall back to defaultDay.
	let chosenDayValid = React.useMemo(() => {
		if (!chosenDay) return false
		let chosenKey = chosenDay.isSame(props.now, 'day') ? 'Today' : chosenDay.format('YYYY-MM-DD')
		return sections.some((s) => s.key === chosenKey)
	}, [chosenDay, sections, props.now])

	let selectedDay = chosenDayValid ? chosenDay : defaultDay

	// Scroll strip to first event day when filter invalidates the current selection.
	let prevChosenDayValid = React.useRef(chosenDayValid)
	React.useEffect(() => {
		if (prevChosenDayValid.current && !chosenDayValid && defaultDay) {
			stripRef.current?.scrollToDay(defaultDay)
		}
		prevChosenDayValid.current = chosenDayValid
	}, [chosenDayValid, defaultDay])

	let sectionKeyFor = React.useCallback(
		(day: Moment) => (day.isSame(props.now, 'day') ? 'Today' : day.format('YYYY-MM-DD')),
		[props.now],
	)

	let sectionKeys = React.useMemo(() => new Set(sections.map((section) => section.key)), [sections])

	/**
	 * The first day from `day` onwards that the list holds a section for.
	 *
	 * The strip fills the gaps between events so it reads as a continuous
	 * calendar, which leaves it offering days the list cannot scroll to. The
	 * range ends on a day that has events, so looking forward always lands
	 * somewhere.
	 */
	let dayWithEventsFrom = React.useCallback(
		(day: Moment) =>
			days.find((d) => !d.isBefore(day, 'day') && sectionKeys.has(sectionKeyFor(d))) ?? day,
		[days, sectionKeys, sectionKeyFor],
	)

	let handleSelectDay = React.useCallback(
		(day: Moment) => {
			let target = dayWithEventsFrom(day)
			setChosenDay(target)
			// oxlint-disable-next-line react/immutability
			scrollTarget.value = sectionKeyFor(target)
			stripRef.current?.scrollToDay(target)
		},
		[scrollTarget, sectionKeyFor, dayWithEventsFrom],
	)

	// The strip has already come to rest where the drag left it, so this moves
	// the list alone.
	let handleStripSettle = React.useCallback(
		(day: Moment) => {
			let target = dayWithEventsFrom(day)
			setChosenDay(target)
			// oxlint-disable-next-line react/immutability
			scrollTarget.value = sectionKeyFor(target)
		},
		[scrollTarget, sectionKeyFor, dayWithEventsFrom],
	)

	/**
	 * Returns the list to the top. The topmost section is whatever sorts first
	 * -- `Ongoing` when something spans today, otherwise the earliest day -- and
	 * naming it beats naming `Today`, which has no section at all on a day with
	 * no events.
	 */
	let scrollToToday = React.useCallback(() => {
		let today = days.find((d) => d.isSame(props.now, 'day'))
		if (today) {
			setChosenDay(today)
			stripRef.current?.scrollToDay(today)
		}

		let topSection = sections[0]?.key
		if (topSection) {
			// oxlint-disable-next-line react/immutability
			scrollTarget.value = topSection
		}
	}, [days, props.now, scrollTarget, sections])

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

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				<RNHostView matchContents={true}>
					<DayPickerStrip
						ref={stripRef}
						days={days}
						now={props.now}
						onScrollSettle={handleStripSettle}
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
						// The `stripRef.current` read inside `onChange` runs when SwiftUI
						// reports a scroll, not during render -- but the modifier is built
						// here, which is where the rule pins it.
						// oxlint-disable-next-line react/refs
						scrollPosition(scrollTarget, {
							anchor: 'top',
							onChange: (sectionKey) => {
								if (!sectionKey) return
								let matchingDay = days.find((d) => {
									let key = d.isSame(props.now, 'day') ? 'Today' : d.format('YYYY-MM-DD')
									return key === sectionKey
								})
								if (matchingDay && (!selectedDay || !matchingDay.isSame(selectedDay, 'day'))) {
									setChosenDay(matchingDay)
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
