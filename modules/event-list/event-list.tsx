import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Host,
	LazyVStack,
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
import {EventListRow} from './event-list-row'
import {groupEvents} from './sections'
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

export let EventList = React.forwardRef<CalendarBodyHandle, Props>(function EventList(props, ref) {
	let colorFor = React.useMemo(() => {
		let table = new Map(props.sources.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [props.sources])

	let sections = React.useMemo(
		() => groupEvents(props.events, props.now),
		[props.events, props.now],
	)

	let scrollTarget = useNativeState<string | null>(null)

	/**
	 * Returns the list to the top. The topmost section is whatever sorts first
	 * -- `Ongoing` when something spans today, otherwise the earliest day.
	 */
	let showToday = React.useCallback(() => {
		let topSection = sections[0]?.key
		if (topSection) {
			// oxlint-disable-next-line react/immutability
			scrollTarget.value = topSection
		}
	}, [scrollTarget, sections])

	React.useImperativeHandle(ref, () => ({showToday}), [showToday])

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
		if (props.isLoading) {
			return <NoticeView text="Loading…" />
		}
		return <NoticeView buttonText="Try Again" onPress={props.onRefresh} text="No events." />
	}

	return (
		<Host style={styles.host}>
			<SwiftUIScrollView
				modifiers={[
					background(c.systemBackground),
					refreshable(async () => {
						await props.onRefresh()
					}),
					scrollPosition(scrollTarget, {anchor: 'top'}),
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
		</Host>
	)
})

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
