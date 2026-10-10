import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {scheduleCalendarOptions, ScheduleView} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {NoticeView} from '@frogpond/notice'
import type {EventType} from '@frogpond/event-type'
import {useQuery} from '@tanstack/react-query'

import {campusById} from '../../source/campuses'
import {useCampusParam} from '../../source/features/campus/campus-param'
import {requiresSection} from '../../source/features/campus/section-gate'
import {scheduleEntry} from '../../source/features/schedules/entries'

/**
 * One of a campus's schedules, by the id in the path: the campus `?campus=`
 * names, as the section gate reads it, or else the active one. An id the
 * campus doesn't list says so and fetches nothing.
 */
function SchedulePage(): React.ReactNode {
	let router = useRouter()
	let {id, campus: campusParam} = useLocalSearchParams<{id: string; campus?: string}>()
	let campus = campusById(useCampusParam(campusParam))
	let entry = scheduleEntry(campus, id)
	let calendar = entry?.calendar ?? ''

	let onPressEvent = (event: EventType) => {
		router.navigate({
			pathname: '/calendar/event',
			params: {source: calendar, eventKey: eventKey(event)},
		})
	}

	let query = useQuery({
		...scheduleCalendarOptions(calendar, {eventMapper: entry?.eventMapper}),
		enabled: entry !== undefined,
	})

	if (!entry) {
		let {appName, college} = campus.branding
		return (
			<>
				<Stack.Title>Schedule</Stack.Title>
				<NoticeView
					description={`${appName} doesn't have that schedule for ${college}.`}
					systemImage="calendar"
					title="No Schedule"
				/>
			</>
		)
	}

	return (
		<>
			<Stack.Title>{entry.title}</Stack.Title>
			<ScheduleView onPressEvent={onPressEvent} query={query} />
		</>
	)
}

export default requiresSection(
	'schedules',
	{title: 'Schedule', noun: 'any schedules', systemImage: 'calendar'},
	SchedulePage,
)
