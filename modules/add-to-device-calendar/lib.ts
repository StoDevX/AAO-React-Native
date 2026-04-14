import * as Sentry from '@sentry/react-native'
import {encode as base64Encode} from 'base-64'
import {Share} from 'react-native'
import type {EventType} from '@frogpond/event-type'

function pad(n: number): string {
	return String(n).padStart(2, '0')
}

function formatICSDate(date: Date): string {
	return (
		date.getUTCFullYear().toString() +
		pad(date.getUTCMonth() + 1) +
		pad(date.getUTCDate()) +
		'T' +
		pad(date.getUTCHours()) +
		pad(date.getUTCMinutes()) +
		pad(date.getUTCSeconds()) +
		'Z'
	)
}

function escapeICSText(text: string): string {
	return text
		.replace(/\\/gu, '\\\\')
		.replace(/;/gu, '\\;')
		.replace(/,/gu, '\\,')
		.replace(/\r?\n/gu, '\\n')
}

export function buildICS(event: EventType): string {
	let uid = `aao-${Date.now()}-${Math.random().toString(36).slice(2)}@stolaf.edu`
	let lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//St. Olaf College//All About Olaf//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${formatICSDate(new Date())}`,
		`DTSTART:${formatICSDate(event.startTime.toDate())}`,
		`DTEND:${formatICSDate(event.endTime.toDate())}`,
		`SUMMARY:${escapeICSText(event.title)}`,
		`DESCRIPTION:${escapeICSText(event.description)}`,
		`LOCATION:${escapeICSText(event.location)}`,
		'END:VEVENT',
		'END:VCALENDAR',
	]
	return lines.join('\r\n')
}

export type AddToCalendarResult = 'saved' | 'cancelled' | 'error'

export async function addToCalendar(
	event: EventType,
): Promise<AddToCalendarResult> {
	try {
		let ics = buildICS(event)
		let dataUrl = `data:text/calendar;base64,${base64Encode(ics)}`

		let result = await Share.share({
			url: dataUrl,
			title: event.title,
		})

		return result.action === Share.sharedAction ? 'saved' : 'cancelled'
	} catch (error) {
		Sentry.captureException(error)
		console.error(error)
		return 'error'
	}
}
