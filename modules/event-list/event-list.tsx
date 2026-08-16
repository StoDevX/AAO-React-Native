import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundColor,
	listStyle,
	refreshable,
	scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import toPairs from 'lodash/toPairs'
import type {EventType} from '@frogpond/event-type'
import groupBy from 'lodash/groupBy'
import type {Moment} from 'moment-timezone'
import {NoticeView} from '@frogpond/notice'
import {EventListRow} from './event-list-row'
import {formatSectionHeader} from './times'
import {PoweredBy} from './types'

type Props = {
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: () => unknown
	now: Moment
	poweredBy: PoweredBy
	onPressEvent: (event: EventType) => void
}

type EventSection = {
	readonly key: string
	readonly title: string
	readonly isToday: boolean
	readonly data: EventType[]
}

/// Groups events the way the list has always grouped them -- an `Ongoing`
/// group, and today's events grouped together regardless of the timezone
/// quirks in `event.startTime` -- but keys the day groups on an
/// unambiguous ISO date rather than a formatted string, since the display
/// title is now locale-aware and computed separately below.
function groupEvents(events: readonly EventType[], now: Moment): Array<EventSection> {
	let grouped = groupBy(events, (event) => {
		if (event.isOngoing) {
			return 'Ongoing'
		}
		if (event.startTime.isSame(now, 'day')) {
			return 'Today'
		}
		return event.startTime.format('YYYY-MM-DD') // google returns events in CST
	})

	return toPairs(grouped).map(([key, data]) => {
		if (key === 'Ongoing') {
			return {key, title: 'Ongoing', isToday: false, data}
		}
		if (key === 'Today') {
			return {key, title: formatSectionHeader(now), isToday: true, data}
		}
		return {key, title: formatSectionHeader(data[0].startTime), isToday: false, data}
	})
}

/// Plain, leading-aligned section header text on the list background --
/// Calendar.app has no card behind it. Today's is tinted red; every other
/// day uses the normal label colour, matching the reference screenshot.
function SectionHeader({title, isToday}: {title: string; isToday: boolean}): React.ReactNode {
	return (
		<Text
			modifiers={[font({textStyle: 'headline'}), foregroundColor(isToday ? c.systemRed : c.label)]}
		>
			{title}
		</Text>
	)
}

export function EventList(props: Props): React.ReactNode {
	if (props.message) {
		return <NoticeView text={props.message} />
	}

	if (props.events.length === 0) {
		return <NoticeView text="No events." />
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
				{sections.map((section) => (
					<Section
						header={<SectionHeader isToday={section.isToday} title={section.title} />}
						key={section.key}
					>
						{section.data.map((event, index) => (
							<EventListRow
								event={event}
								isLastInSection={index === section.data.length - 1}
								key={index}
								onPress={props.onPressEvent}
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
