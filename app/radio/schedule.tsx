import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {scheduleCalendarOptions, ScheduleView} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {useQuery} from '@tanstack/react-query'
import type {EventType} from '@frogpond/event-type'

import {requiresSection} from '../../source/features/campus/section-gate'
import {useCampusSection} from '../../source/features/campus/store'
import {eventMapper} from '../../source/features/streaming/radio/constants'
import {STATIONS, type StationId} from '../../source/features/streaming/radio/stations'

/** Whether `id` names a station some campus runs. */
function isStationId(id: string | undefined): id is StationId {
	return id !== undefined && id in STATIONS
}

/** A station's schedule: the one `?station=` names, else the campus's first. */
function RadioSchedulePage(): React.ReactNode {
	let router = useRouter()
	let {station: param} = useLocalSearchParams<{station?: string}>()
	let own = useCampusSection('radio')?.stations[0]
	let station = isStationId(param) ? STATIONS[param] : own
	let calendar = station?.scheduleCalendar ?? ''

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.navigate({
				pathname: '/calendar/event',
				params: {source: calendar, eventKey: eventKey(event)},
			})
		},
		[router, calendar],
	)

	return (
		<>
			<Stack.Title>{`${station?.stationName ?? 'Radio'} Schedule`}</Stack.Title>
			<ScheduleView
				onPressEvent={onPressEvent}
				query={useQuery(scheduleCalendarOptions(calendar, {eventMapper}))}
			/>
		</>
	)
}

export default requiresSection(
	'radio',
	{title: 'Radio', noun: 'a radio station', systemImage: 'radio'},
	RadioSchedulePage,
)
