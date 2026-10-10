import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {
	EventDetail,
	shareEvent,
	timelineBlocks,
	timelineEntries,
	timelineWindow,
	type TimelineWindow,
} from '@frogpond/event-list'
import * as c from '@frogpond/colors'
import type {EventType} from '@frogpond/event-type'

import {SheetCloseButton} from '../../../source/components/sheet-close-button'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import {addToCalendarEvents} from '../../../source/features/telemetry/calendar-events'
import {track} from '../../../source/features/telemetry/track'
import {scheduleEventOptions, useCalendarSource} from '@frogpond/ccc-calendar'
import {useCampusCalendarSources} from '../../../source/features/calendar/use-campus-calendar'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import {
	HIDDEN_FROM_CALENDAR,
	PRESENCE_POWERED_BY,
	STOLAF_POWERED_BY,
	WIKI_MONKEYS_POWERED_BY,
} from '../../../source/features/calendar/constants'
import {
	KMNK_POWERED_BY,
	KSTO_POWERED_BY,
	KRLX_POWERED_BY,
} from '../../../source/features/streaming/radio/constants'
import {
	CARLETON_POWERED_BY,
	CONVOS_POWERED_BY,
	SUMO_POWERED_BY,
	sumoEventMapper,
} from '../../../source/features/carleton/constants'
import {Host} from '@expo/ui/swift-ui'
import {useEvent, useNeighbours} from '../../../source/database/calendar/read'
import type {Window} from '../../../source/database/calendar/queries'

type EventSource =
	| 'stolaf'
	| 'presence'
	| 'carleton'
	| 'wiki-monkeys'
	| 'uitest'
	| 'ksto-schedule'
	| 'krlx-schedule'
	| 'kmnk-schedule'
	| 'sumo-schedule'
	| 'upcoming-convos'

// A stand-in for a real remote source, so its detail screen attributes exactly
// like `stolaf`'s or `presence`'s does.
const UITEST_POWERED_BY = {title: 'Powered by UI Test Fixtures', href: ''} as const

const POWERED_BY: Record<EventSource, {title: string; href: string}> = {
	stolaf: STOLAF_POWERED_BY,
	presence: PRESENCE_POWERED_BY,
	carleton: CARLETON_POWERED_BY,
	'wiki-monkeys': WIKI_MONKEYS_POWERED_BY,
	uitest: UITEST_POWERED_BY,
	'ksto-schedule': KSTO_POWERED_BY,
	'krlx-schedule': KRLX_POWERED_BY,
	'kmnk-schedule': KMNK_POWERED_BY,
	'sumo-schedule': SUMO_POWERED_BY,
	'upcoming-convos': CONVOS_POWERED_BY,
}

/**
 * The sources that contribute to the merged calendar, and so have neighbours
 * to show. The radio schedules and Carleton's SUMO and convocation lists do not.
 */
const REMOTE_SOURCE_IDS = new Set(['stolaf', 'presence', 'carleton', 'wiki-monkeys', 'uitest'])

/**
 * KSTO's and KRLX's broadcast schedules, and Carleton's SUMO and convocation
 * lists -- fetched, not written into the database.
 */
const SCHEDULE_SOURCE_IDS = new Set([
	'ksto-schedule',
	'krlx-schedule',
	'kmnk-schedule',
	'sumo-schedule',
	'upcoming-convos',
])

/** The schedules whose list retitles its events, by the list's own mapper. */
const TITLE_MAPPERS: Partial<Record<string, (event: EventType) => EventType>> = {
	'sumo-schedule': sumoEventMapper,
}

/** `timelineWindow`'s Moment span, as the `Window` `useNeighbours` reads by value. */
function occurrenceWindowFor(range: TimelineWindow): Window {
	return {
		fromUtc: range.start.valueOf(),
		toUtc: range.end.valueOf(),
		fromDate: range.start.format('YYYY-MM-DD'),
		toDate: range.end.format('YYYY-MM-DD'),
	}
}

export default function EventDetailPage(): React.ReactNode {
	let {source, eventKey} = useLocalSearchParams<{
		source: string
		eventKey: string
	}>()

	let scheduleSource = SCHEDULE_SOURCE_IDS.has(source)

	// Two lookups, at most one of them switched on, rather than one `useQuery`
	// over a branch: the option objects have different key tuples and different
	// fetched shapes, so their union does not satisfy `useQuery` -- and picking
	// the query inside the call would still leave the hook count stable but the
	// types unresolvable. The idle one never fetches.
	//
	// Detail lookups don't need a mapper that only sets config.subtitle, which
	// the detail view never reads. A mapper that changes the title does
	// belong here: the row's key is built from the mapped title, so the
	// lookup has to map the same way to find it.
	let scheduleQuery = useQuery({
		...scheduleEventOptions(source, eventKey, {eventMapper: TITLE_MAPPERS[source]}),
		enabled: scheduleSource,
	})
	let {enabled} = useCampusCalendarSources()

	let enabledIds = React.useMemo(() => enabled.map((source) => source.id), [enabled])

	// A plain local SQLite read, not a fetch -- always run, since running it
	// for a schedule source (which the database has no rows for) only costs a
	// query that returns nothing. `enabledIds` scopes the sponsor union the
	// same way the list screen scopes it.
	let dbEvent = useEvent(source, eventKey, enabledIds)

	let {
		data: event,
		isLoading,
		error,
		refetch,
	} = scheduleSource
		? scheduleQuery
		: // A local read, but not an instant one: a failed read is retried, and
			// during a retry there is neither an event nor an error, so pending has
			// to reach the loading branch rather than "Could not find this event".
			// A corrupt database must reach the error branch below. `undefined`
			// with no error and nothing pending still means exactly that: no row
			// under this key.
			{
				data: dbEvent.event,
				isLoading: dbEvent.isPending,
				error: dbEvent.error,
				refetch: dbEvent.refetch,
			}

	// The same source list the picker reads, so an event's masthead is the
	// colour its row had without any colour crossing the route. The fallback is
	// only for an id nothing recognises -- a stale deep link, or a source the
	// app no longer ships.
	let color = useCalendarSource(source)?.color ?? c.systemBlue

	let colorFor = React.useMemo(() => {
		let table = new Map(enabled.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [enabled])

	// The radio schedules route here too, and their events never enter
	// `useCampusCalendarSources` -- so there are no neighbours to draw and no timeline.
	// `timelineWindow` rules out all-day events on its own, by returning null.
	let isCalendarSource = REMOTE_SOURCE_IDS.has(source)
	let windowRange = event && isCalendarSource ? timelineWindow(event) : null

	// A bounded read over the timeline's own span, rather than the whole merged
	// calendar. An event with no timeline of its own (all-day, multi-day, or a
	// schedule source) has no neighbours to draw, and a `null` window skips the
	// read entirely.
	let neighbours = useNeighbours({
		window: windowRange ? occurrenceWindowFor(windowRange) : null,
		sourceIds: enabledIds,
		exclude: HIDDEN_FROM_CALENDAR,
	})

	let timeline =
		windowRange && event
			? {
					window: windowRange,
					blocks: timelineBlocks(
						windowRange,
						// `eventKey` here is the route param destructured at the top of
						// the component, not the `eventKey` helper event-list exports.
						timelineEntries({sourceId: source, key: eventKey, event}, neighbours),
						`${source}|${eventKey}`,
					),
					colorFor,
				}
			: undefined

	let poweredBy = source in POWERED_BY ? POWERED_BY[source as EventSource] : undefined

	if (!poweredBy) {
		return (
			<>
				<Stack.Title>Error</Stack.Title>
				<SheetCloseButton />
				<NoticeView
					description="This event comes from a calendar the app doesn’t know."
					systemImage="questionmark.circle"
					title="Unknown Calendar"
				/>
			</>
		)
	}

	if (isLoading) {
		return (
			<>
				<Stack.Title>Loading…</Stack.Title>
				<SheetCloseButton />
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				<Stack.Title>Error</Stack.Title>
				<SheetCloseButton />
				<LoadErrorView error={error} onRetry={refetch} />
			</>
		)
	}

	if (!event) {
		return (
			<>
				<Stack.Title>Unknown Event</Stack.Title>
				<SheetCloseButton />
				<NoticeView systemImage="questionmark.circle" title="Event Not Found" />
			</>
		)
	}

	return (
		<>
			<SheetCloseButton />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Share Event"
					icon="square.and.arrow.up"
					onPress={() => shareEvent(event)}
					separateBackground={true}
				/>
			</Stack.Toolbar>
			<AddToCalendar
				compactMessages={true}
				event={event}
				onResult={(result) => {
					for (let telemetryEvent of addToCalendarEvents(result, source, event)) {
						track(telemetryEvent)
					}
				}}
				render={({message, disabled, onPress}) => (
					// Host forces a fresh SwiftUI view hierarchy on each render,
					// sidestepping expo/expo#44493 where react-native-screens reuses
					// a navigation controller and the toolbar becomes unresponsive.
					<Host>
						<Stack.Toolbar placement="bottom">
							<Stack.Toolbar.Spacer />
							<Stack.Toolbar.Button disabled={disabled} onPress={onPress} tintColor={color}>
								{message || 'Add to Calendar'}
							</Stack.Toolbar.Button>
							<Stack.Toolbar.Spacer />
						</Stack.Toolbar>
					</Host>
				)}
			/>
			<EventDetail.EventDetail
				color={color}
				event={event}
				poweredBy={poweredBy}
				timeline={timeline}
			/>
		</>
	)
}
