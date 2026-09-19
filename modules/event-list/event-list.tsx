import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, LazyVStack, ScrollView as SwiftUIScrollView, Text, VStack} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	id,
	onScrollPhaseChange,
	padding,
	refreshable,
	scrollTargetLayout,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'
import {EventListRow} from './event-list-row'
import {FailureNote} from './failure-note'
import {emptyNotice} from './day-state'
import {
	groupEvents,
	isNearEnd,
	sectionsToMount,
	todaySectionKey,
	upcomingSections,
} from './sections'
import type {CalendarSource, SourcedEvent} from './types'

/**
 * How many rows the list mounts at first, and how many more each time the
 * reader nears the end. A screen and a half: enough that a first scroll never
 * waits, small enough that mounting a step does not stall it.
 */
const ROWS_PER_STEP = 15

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

export function EventList(props: Props): React.ReactNode {
	let colorFor = React.useMemo(() => {
		let table = new Map(props.sources.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [props.sources])

	let sections = React.useMemo(
		() => upcomingSections(groupEvents(props.events, props.now), props.now),
		[props.events, props.now],
	)

	let todayKey = React.useMemo(() => todaySectionKey(sections, props.now), [sections, props.now])

	let [rowBudget, setRowBudget] = React.useState(ROWS_PER_STEP)
	let mounted = React.useMemo(
		() => sectionsToMount(sections, rowBudget, todayKey),
		[sections, rowBudget, todayKey],
	)
	let hasMore = mounted.length < sections.length

	/**
	 * Mounts the next step once the reader is within a screen of the end.
	 *
	 * On a change of scroll phase rather than on every frame: a phase change
	 * arrives as an ordinary JavaScript event, and a drag or a fling that ends
	 * near the bottom is exactly when more rows are wanted.
	 */
	let growNearEnd = onScrollPhaseChange((_phase, geometry) => {
		if (hasMore && isNearEnd(geometry)) {
			setRowBudget((budget) => budget + ROWS_PER_STEP)
		}
	})

	// What the list would draw, rather than everything it was handed: a window
	// whose events are all over is as empty as one with none.
	let shown = React.useMemo(() => sections.flatMap((section) => section.data), [sections])

	let {text, retry} = emptyNotice({...props, events: shown}, {text: 'No events.', retry: true})

	// Each notice replaces the list, and the list is what carries
	// pull-to-refresh -- so one that can be retried has to offer it itself, or a
	// failed load leaves the screen with no way back but the back button.
	if (props.message || props.sources.length === 0 || shown.length === 0) {
		return retry ? (
			<NoticeView buttonText="Try Again" onPress={props.onRefresh} text={text} />
		) : (
			<NoticeView text={text} />
		)
	}

	return (
		<Host style={styles.host}>
			<SwiftUIScrollView
				modifiers={[
					background(c.systemBackground),
					refreshable(async () => {
						await props.onRefresh()
					}),
					growNearEnd,
				]}
			>
				<LazyVStack alignment="leading" modifiers={[scrollTargetLayout()]}>
					{todayKey ? null : <FailureNote failed={props.failed} />}
					{mounted.map((section) => (
						<VStack
							key={section.key}
							alignment="leading"
							modifiers={[
								id(section.key),
								padding({leading: 16, trailing: 16, top: 12, bottom: 8}),
							]}
						>
							{/* The list opens on this section, so a failure named here is in view. */}
							{section.key === todayKey ? <FailureNote failed={props.failed} /> : null}
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
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
