import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {EventDetail, shareEvent} from '@frogpond/event-list'
// `EventDetail` here is the namespace `export * as EventDetail from
// './event-detail'` produces (matching `EventList.EventList`'s shape
// elsewhere in this package) -- the component itself is
// `EventDetail.EventDetail`, used below.
import {namedCalendarEventOptions} from '@frogpond/ccc-calendar'
import {ShareButton} from '@frogpond/navigation-buttons'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {
	STOLAF_POWERED_BY,
	NORTHFIELD_POWERED_BY,
} from '../../source/views/calendar'
import {
	KSTO_POWERED_BY,
	KRLX_POWERED_BY,
} from '../../source/views/streaming/radio/schedule'

type EventSource = 'stolaf' | 'northfield' | 'ksto-schedule' | 'krlx-schedule'

const POWERED_BY: Record<EventSource, {title: string; href: string}> = {
	stolaf: STOLAF_POWERED_BY,
	northfield: NORTHFIELD_POWERED_BY,
	'ksto-schedule': KSTO_POWERED_BY,
	'krlx-schedule': KRLX_POWERED_BY,
}

export default function EventDetailPage(): React.ReactNode {
	let {source, eventKey} = useLocalSearchParams<{
		source: EventSource
		eventKey: string
	}>()

	// Detail lookups don't need the list's eventMapper: it only ever sets
	// config.subtitle, which the detail view never reads (only event-row.tsx
	// does) -- passing a mapper here would just be a second copy of that
	// transform that has to stay byte-identical to the list's forever.
	let {
		data: event,
		isLoading,
		error,
		refetch,
	} = useQuery(namedCalendarEventOptions(source, eventKey))

	let poweredBy = source in POWERED_BY ? POWERED_BY[source] : undefined

	if (!poweredBy) {
		return (
			<>
				<Stack.Screen options={{title: 'Event'}} />
				<NoticeView text="Unknown event source." />
			</>
		)
	}

	if (isLoading) {
		return (
			<>
				<Stack.Screen options={{title: 'Event'}} />
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				<Stack.Screen options={{title: 'Event'}} />
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
				<Stack.Screen options={{title: 'Event'}} />
				<NoticeView text="Could not find this event." />
			</>
		)
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: event.title,
					headerRight: () => <ShareButton onPress={() => shareEvent(event)} />,
				}}
			/>
			<EventDetail.EventDetail event={event} poweredBy={poweredBy} />
		</>
	)
}
