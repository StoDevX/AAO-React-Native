import {client} from '../api'
import {EventType} from '../event-type'
import {useQuery, type UseQueryResult} from '@tanstack/react-query'
import moment from 'moment'
import {
	GoogleCalendar,
	IcsCalendar,
	NamedCalendar,
	ReasonCalendar,
} from './types'

export const keys = {
	named: (name: string) => ['calendar', 'named', name] as const,
	google: (calendarId: string) => ['calendar', 'google', calendarId] as const,
	reason: (url: string) => ['calendar', 'reason', url] as const,
	ics: (url: string) => ['calendar', 'reason', url] as const,
}

type EventMapper = (event: EventType) => EventType

function convertEvents(
	data: EventType[],
	options: {eventMapper?: EventMapper},
): EventType[] {
	let events = data.map((event) => {
		const startTime = moment(event.startTime)
		const endTime = moment(event.endTime)

		return {
			...event,
			startTime,
			endTime,
		}
	})

	if (options.eventMapper) {
		events = events.map(options.eventMapper)
	}

	return events
}

export function useNamedCalendar(
	calendar: NamedCalendar,
	options: {eventMapper?: EventMapper} = {},
): UseQueryResult<EventType[], unknown> {
	return useQuery({
		queryKey: keys.named(calendar),
		queryFn: async ({queryKey, signal}) =>
			client.get(`calendar/named/${queryKey[2]}`, {signal}).json<EventType[]>(),
		select: (events) => convertEvents(events, options),
	})
}

export function useGoogleCalendar(
	calendar: GoogleCalendar,
	options: {eventMapper?: EventMapper} = {},
): UseQueryResult<EventType[], unknown> {
	return useQuery({
		queryKey: keys.google(calendar.id),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get('calendar/google', {signal, searchParams: {id: queryKey[2]}})
				.json()
			return response as EventType[]
		},
		select: (events) => convertEvents(events, options),
	})
}

export function useReasonCalendar(
	calendar: ReasonCalendar,
	options: {eventMapper?: EventMapper} = {},
): UseQueryResult<EventType[], unknown> {
	return useQuery({
		queryKey: keys.reason(calendar.url),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get('calendar/reason', {signal, searchParams: {url: queryKey[2]}})
				.json()
			return response as EventType[]
		},
		select: (events) => convertEvents(events, options),
	})
}

export function useIcsCalendar(
	calendar: IcsCalendar,
	options: {eventMapper?: EventMapper} = {},
): UseQueryResult<EventType[], unknown> {
	return useQuery({
		queryKey: keys.ics(calendar.url),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get('calendar/ics', {signal, searchParams: {url: queryKey[2]}})
				.json()
			return (response as {data: EventType[]}).data
		},
		select: (events) => convertEvents(events, options),
	})
}
