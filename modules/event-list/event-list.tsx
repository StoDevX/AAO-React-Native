import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Host,
	LazyVStack,
	ScrollView as SwiftUIScrollView,
	type ScrollGeometry,
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
	useScrollGeometryChange,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'
import {EventListRow} from './event-list-row'
import {FailureNote} from './failure-note'
import {emptyNotice} from './day-state'
import {groupEvents, todaySectionKey} from './sections'
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

	let todayKey = React.useMemo(() => todaySectionKey(sections, props.now), [sections, props.now])

	let scrollTarget = useNativeState<string | null>(null)

	/**
	 * Opens the list on today rather than at the top.
	 *
	 * The read window keeps 30 days of finished events, so the top of the list
	 * is last month; the past is meant to be reachable by scrolling up, not to
	 * be where the screen opens.
	 *
	 * Set on the UI thread the first time the list has content laid out. Not
	 * from an effect, and not as the state's starting value: measured on the
	 * simulator, SwiftUI drops a position set before the list appears, and since
	 * the state then already reads today, nothing sets it again. Not from
	 * JavaScript either: an event from the list reaches it a render late, and
	 * with a month of events above today the reader sees that month for a
	 * moment before the jump.
	 *
	 * Only while the list has no position yet. SwiftUI writes the leading
	 * section back as the reader scrolls, so a list that has been placed never
	 * reads null again; a later layout -- a refresh, a filter -- leaves the
	 * reader where they were, and going back to today is what the Today button
	 * is for.
	 */
	let openOnToday = React.useCallback(
		(geometry: ScrollGeometry) => {
			'worklet'
			if (todayKey && geometry.contentHeight > 0 && scrollTarget.get() === null) {
				scrollTarget.set(todayKey)
			}
		},
		[scrollTarget, todayKey],
	)
	let placement = useScrollGeometryChange(openOnToday)

	/** Returns the list to today -- see `todaySectionKey` for what that means. */
	let showToday = React.useCallback(() => {
		if (todayKey) {
			scrollTarget.set(todayKey)
		}
	}, [scrollTarget, todayKey])

	React.useImperativeHandle(ref, () => ({showToday}), [showToday])

	let {text, retry} = emptyNotice(props, {text: 'No events.', retry: true})

	// Each notice replaces the list, and the list is what carries
	// pull-to-refresh -- so one that can be retried has to offer it itself, or a
	// failed load leaves the screen with no way back but the back button.
	if (props.message || props.sources.length === 0 || props.events.length === 0) {
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
					scrollPosition(scrollTarget, {anchor: 'top'}),
					...(placement ? [placement] : []),
				]}
			>
				<LazyVStack alignment="leading" modifiers={[scrollTargetLayout()]}>
					{todayKey ? null : <FailureNote failed={props.failed} />}
					{sections.map((section) => (
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
})

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
