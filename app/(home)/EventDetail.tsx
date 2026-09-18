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

import {useDismissOnce} from '../../source/lib/use-dismiss-once'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import {scheduleEventOptions, useCalendarSource, useCalendarSources} from '@frogpond/ccc-calendar'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {PRESENCE_POWERED_BY, STOLAF_POWERED_BY} from '../../source/features/calendar/constants'
import {KSTO_POWERED_BY, KRLX_POWERED_BY} from '../../source/features/streaming/radio/constants'
import {Host} from '@expo/ui/swift-ui'
import {useEvent, useNeighbours} from '../../source/database/calendar/read'
import type {Window} from '../../source/database/calendar/queries'

type EventSource = 'stolaf' | 'presence' | 'uitest' | 'ksto-schedule' | 'krlx-schedule'

// A stand-in for a real remote source, so its detail screen attributes exactly
// like `stolaf`'s or `presence`'s does.
const UITEST_POWERED_BY = {title: 'Powered by UI Test Fixtures', href: ''} as const

const POWERED_BY: Record<EventSource, {title: string; href: string}> = {
	stolaf: STOLAF_POWERED_BY,
	presence: PRESENCE_POWERED_BY,
	uitest: UITEST_POWERED_BY,
	'ksto-schedule': KSTO_POWERED_BY,
	'krlx-schedule': KRLX_POWERED_BY,
}

/**
 * The sources that contribute to the merged calendar, and so have neighbours
 * to show. KSTO's and KRLX's broadcast schedules do not.
 */
const REMOTE_SOURCE_IDS = new Set(['stolaf', 'presence', 'uitest'])

/** KSTO's and KRLX's broadcast schedules -- fetched, not written into the database. */
const SCHEDULE_SOURCE_IDS = new Set(['ksto-schedule', 'krlx-schedule'])

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
	let dismiss = useDismissOnce()
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
	// Detail lookups don't need the list's eventMapper: it only ever sets
	// config.subtitle, which the detail view never reads (only the list's
	// row does) -- passing a mapper here would just be a second copy of that
	// transform that has to stay byte-identical to the list's forever.
	let scheduleQuery = useQuery({
		...scheduleEventOptions(source, eventKey),
		enabled: scheduleSource,
	})
	let {enabled} = useCalendarSources()

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
	// `useCalendarSources` -- so there are no neighbours to draw and no timeline.
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
				<NoticeView text="Unknown event source." />
			</>
		)
	}

	if (isLoading) {
		return (
			<>
				<Stack.Title>Loading…</Stack.Title>
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				<Stack.Title>Error</Stack.Title>
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!event) {
		return (
			<>
				<Stack.Title>Unknown Event</Stack.Title>
				<NoticeView text="Could not find this event." />
			</>
		)
	}

	return (
		<>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Button
					accessibilityLabel="Close"
					icon="xmark"
					onPress={dismiss}
					separateBackground={true}
				/>
			</Stack.Toolbar>
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
				eventKey={`${source}|${eventKey}`}
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
