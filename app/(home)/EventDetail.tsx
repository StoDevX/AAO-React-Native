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
import {
	deviceCalendarEventOptions,
	deviceCalendarIdFrom,
	isDeviceSourceId,
	scheduleEventOptions,
	useCalendarSource,
	useCalendarSources,
} from '@frogpond/ccc-calendar'
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
 * A calendar on the phone has no upstream to credit, so the attribution
 * caption is empty -- `EventDetail` omits it entirely when the title is.
 */
const NO_ATTRIBUTION = {title: '', href: ''} as const

/**
 * The sources that contribute to the merged calendar, and so have neighbours
 * to show. KSTO's and KRLX's broadcast schedules do not.
 */
const REMOTE_SOURCE_IDS = new Set(['stolaf', 'presence', 'uitest'])

/** KSTO's and KRLX's broadcast schedules -- fetched, not written into the database. */
const SCHEDULE_SOURCE_IDS = new Set(['ksto-schedule', 'krlx-schedule'])

/**
 * A window with no rows in it, ever: `1970-01-01` sits before any occurrence
 * this app's data can name. Passed to `useNeighbours` when the current event
 * has no timeline of its own (all-day, multi-day, device, or a schedule
 * source) -- `useNeighbours` has no `enabled` flag to switch off with, so a
 * window that can only ever match zero rows stands in for "don't bother".
 */
const NO_WINDOW: Window = {fromUtc: 0, toUtc: 0, fromDate: '1970-01-01', toDate: '1970-01-01'}

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

	let deviceSource = isDeviceSourceId(source)
	let scheduleSource = SCHEDULE_SOURCE_IDS.has(source)

	// Three queries, at most one of them switched on, rather than one
	// `useQuery` over a branch: the option objects have different key tuples
	// and different fetched shapes, so their union does not satisfy `useQuery`
	// -- and picking the query inside the call would still leave the hook count
	// stable but the types unresolvable. The idle ones never fetch.
	//
	// Detail lookups don't need the list's eventMapper: it only ever sets
	// config.subtitle, which the detail view never reads (only the list's
	// row does) -- passing a mapper here would just be a second copy of that
	// transform that has to stay byte-identical to the list's forever.
	//
	// `deviceCalendarIdFrom` only means anything for a device id -- run on a
	// remote one it slices the prefix off a name that never had it, so the idle
	// query would carry a key built from nonsense.
	let deviceQuery = useQuery({
		...deviceCalendarEventOptions(deviceSource ? deviceCalendarIdFrom(source) : '', eventKey),
		enabled: deviceSource,
	})
	let scheduleQuery = useQuery({
		...scheduleEventOptions(source, eventKey),
		enabled: scheduleSource,
	})
	let {enabled} = useCalendarSources()

	let enabledIds = React.useMemo(() => enabled.map((source) => source.id), [enabled])

	// A plain local SQLite read, not a fetch -- always run, since running it
	// for a device or schedule source (neither of which the database has rows
	// for) only costs a query that returns nothing. `enabledIds` scopes the
	// sponsor union the same way the list screen scopes it.
	let dbEvent = useEvent(source, eventKey, enabledIds)

	let {
		data: event,
		isLoading,
		error,
		refetch,
	} = deviceSource
		? deviceQuery
		: scheduleSource
			? scheduleQuery
			: // A local read, so there is no loading state worth a spinner -- but it
				// can fail, and a corrupt database must reach the error branch below
				// rather than the "Could not find this event" one. `undefined` with no
				// error still means exactly that: no row under this key.
				{
					data: dbEvent.event,
					isLoading: false,
					error: dbEvent.error,
					refetch: dbEvent.refetch,
				}

	// The same cached device-calendar query the picker reads, so a device
	// event's masthead is the colour its row had without any colour crossing
	// the route. The fallback is only for an id nothing recognises -- a stale
	// deep link to a calendar since deleted from the phone.
	let color = useCalendarSource(source)?.color ?? c.systemBlue

	let colorFor = React.useMemo(() => {
		let table = new Map(enabled.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [enabled])

	// The radio schedules route here too, and their events never enter
	// `useCalendarSources` -- so there are no neighbours to draw and no timeline.
	// `timelineWindow` rules out all-day events on its own, by returning null.
	let isCalendarSource = deviceSource || REMOTE_SOURCE_IDS.has(source)
	let windowRange = event && isCalendarSource ? timelineWindow(event) : null

	// A bounded read over the timeline's own span, rather than the whole
	// merged calendar: `NO_WINDOW` when there is no timeline to draw, so this
	// hook -- which has no `enabled` flag -- still runs to something that can
	// only ever answer "no neighbours".
	let neighbours = useNeighbours({
		window: windowRange ? occurrenceWindowFor(windowRange) : NO_WINDOW,
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

	let poweredBy = deviceSource
		? NO_ATTRIBUTION
		: source in POWERED_BY
			? POWERED_BY[source as EventSource]
			: undefined

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
