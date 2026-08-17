import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	listStyle,
	refreshable,
	scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'
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

export function EventList(props: Props): React.ReactNode {
	let colorFor = React.useMemo(() => {
		let table = new Map(props.sources.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [props.sources])

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
			<List
				modifiers={[
					listStyle('plain'),
					// A plain list's own background is transparent by default,
					// leaving the grouped grey of the screen behind it showing
					// through the gaps between sections and behind the headers.
					// Painting it explicitly is what makes the list read as flat
					// white like Calendar.app's, with no card behind anything.
					scrollContentBackground('hidden'),
					background(c.systemBackground),
					refreshable(async () => {
						await props.onRefresh()
					}),
				]}
			>
				{props.failed.length > 0 ? (
					<Section>
						<Text modifiers={[foregroundStyle(c.secondaryLabel), font({textStyle: 'footnote'})]}>
							{`Could not load ${props.failed.map((source) => source.title).join(', ')}.`}
						</Text>
					</Section>
				) : null}
				{sections.map((section) => (
					<Section
						header={<SectionHeader isToday={section.isToday} title={section.title} />}
						key={section.key}
					>
						{section.data.map((entry, index) => (
							<EventListRow
								color={colorFor(entry.sourceId)}
								event={entry.event}
								isLastInSection={index === section.data.length - 1}
								// `entry.key` alone (start time + title) collides once two
								// merged calendars can hold the same event at the same
								// time -- the source tag is what tells them apart.
								key={`${entry.sourceId}|${entry.key}`}
								onPress={() => props.onPressEvent(entry)}
							/>
						))}
					</Section>
				))}
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
