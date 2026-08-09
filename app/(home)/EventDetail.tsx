import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import type {EventType} from '@frogpond/event-type'

import {EventDetail, shareEvent} from '@frogpond/event-list'
// `EventDetail` here is the namespace `export * as EventDetail from
// './event-detail'` produces (matching `EventList.EventList`'s shape
// elsewhere in this package) -- the component itself is
// `EventDetail.EventDetail`, used below.
import {namedCalendarEventOptions} from '@frogpond/ccc-calendar'
import {ShareButton} from '@frogpond/navigation-buttons'
import {LoadingView, NoticeView} from '@frogpond/notice'

type EventSource = 'stolaf' | 'northfield' | 'ksto-schedule' | 'krlx-schedule'

function scheduleEventMapper(event: EventType): EventType {
	return {
		...event,
		config: {
			...event.config,
			subtitle: 'description',
		},
	}
}

const POWERED_BY: Record<EventSource, {title: string; href: string}> = {
	stolaf: {
		title: 'Powered by the St. Olaf calendar',
		href: 'https://wp.stolaf.edu/calendar/',
	},
	northfield: {
		title: 'Powered by VisitingNorthfield.com',
		href: 'https://visitingnorthfield.com/events/calendar/',
	},
	'ksto-schedule': {
		title: 'Powered by the KSTO team',
		href: 'https://pages.stolaf.edu/ksto/',
	},
	'krlx-schedule': {
		title: 'Powered by the KRLX team',
		href: 'https://www.krlx.org/schedule/',
	},
}

const EVENT_MAPPERS: Partial<
	Record<EventSource, (event: EventType) => EventType>
> = {
	'ksto-schedule': scheduleEventMapper,
	'krlx-schedule': scheduleEventMapper,
}

export default function EventDetailPage(): React.ReactNode {
	let {source, eventKey} = useLocalSearchParams<{
		source: EventSource
		eventKey: string
	}>()

	let {
		data: event,
		isLoading,
		error,
		refetch,
	} = useQuery(
		namedCalendarEventOptions(source, eventKey, {
			eventMapper: EVENT_MAPPERS[source],
		}),
	)

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!event) {
		return <NoticeView text="Could not find this event." />
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: event.title,
					headerRight: () => <ShareButton onPress={() => shareEvent(event)} />,
				}}
			/>
			<EventDetail.EventDetail event={event} poweredBy={POWERED_BY[source]} />
		</>
	)
}
