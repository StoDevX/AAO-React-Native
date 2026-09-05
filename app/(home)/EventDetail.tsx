import * as React from 'react'
import {router, Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {
	EventDetail,
	shareEvent,
	timelineBlocks,
	timelineEntries,
	timelineWindow,
} from '@frogpond/event-list'
import * as c from '@frogpond/colors'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import {
	deviceCalendarEventOptions,
	deviceCalendarIdFrom,
	isDeviceSourceId,
	namedCalendarEventOptions,
	useCalendarSource,
	useCalendarSources,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {STOLAF_POWERED_BY} from '../../source/features/calendar/constants'
import {KSTO_POWERED_BY, KRLX_POWERED_BY} from '../../source/features/streaming/radio/constants'

type EventSource = 'stolaf' | 'uitest' | 'ksto-schedule' | 'krlx-schedule'

const UITEST_POWERED_BY = {title: '', href: ''} as const

const POWERED_BY: Record<EventSource, {title: string; href: string}> = {
	stolaf: STOLAF_POWERED_BY,
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
const REMOTE_SOURCE_IDS = new Set(['stolaf', 'uitest'])

export default function EventDetailPage(): React.ReactNode {
	let {source, eventKey} = useLocalSearchParams<{
		source: string
		eventKey: string
	}>()

	let deviceSource = isDeviceSourceId(source)

	// Two queries, one of them switched off, rather than one `useQuery` over a
	// ternary: the two option objects have different key tuples and different
	// fetched shapes, so their union does not satisfy `useQuery` -- and picking
	// the query inside the call would still leave the hook count stable but the
	// types unresolvable. The idle one never fetches.
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
	let namedQuery = useQuery({
		...namedCalendarEventOptions(source as EventSource, eventKey),
		enabled: !deviceSource,
	})

	let {data: event, isLoading, error, refetch} = deviceSource ? deviceQuery : namedQuery

	// The same cached device-calendar query the picker reads, so a device
	// event's masthead is the colour its row had without any colour crossing
	// the route. The fallback is only for an id nothing recognises -- a stale
	// deep link to a calendar since deleted from the phone.
	let color = useCalendarSource(source)?.color ?? c.systemBlue

	// The same cached month the list reads, under the same query keys, so
	// arriving from the list costs no fetch.
	let {enabled} = useCalendarSources()
	let {events: neighbours} = useMergedEvents(enabled)

	let colorFor = React.useMemo(() => {
		let table = new Map(enabled.map((source) => [source.id, source.color]))
		return (sourceId: string) => table.get(sourceId) ?? c.systemBlue
	}, [enabled])

	// The radio schedules route here too, and their events never enter
	// `useCalendarSources` -- so there are no neighbours to draw and no timeline.
	// `timelineWindow` rules out all-day events on its own, by returning null.
	let isCalendarSource = deviceSource || REMOTE_SOURCE_IDS.has(source)
	let windowRange = event && isCalendarSource ? timelineWindow(event) : null
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
					onPress={() => router.back()}
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
				render={({message, disabled, onPress}) => (
					<Stack.Toolbar placement="bottom">
						<Stack.Toolbar.Spacer />
						<Stack.Toolbar.Button disabled={disabled} onPress={onPress} tintColor={color}>
							{message || 'Add to Calendar'}
						</Stack.Toolbar.Button>
						<Stack.Toolbar.Spacer />
					</Stack.Toolbar>
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
