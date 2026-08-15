import {fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {endOfDay, isAfter, isBefore, startOfDay} from 'date-fns'
import ICAL from 'ical.js'
import {z} from 'zod'
import type {WireEvent} from './tec-events'

function toWireEvent(event: ICAL.Event, now: Date): WireEvent {
	let startTime = new Date(event.startDate.toString()).toISOString()
	let endTime = new Date(event.endDate.toString()).toISOString()
	let descriptionHtml = event.description ?? ''
	let description = fastGetTrimmedText(descriptionHtml)

	let links = htmlToSegments(descriptionHtml).flatMap((segment) =>
		segment.type === 'link' ? [segment.url] : [],
	)

	return {
		dataSource: 'ical',
		startTime,
		endTime,
		title: event.summary ?? '',
		description,
		location: event.location ?? '',
		isOngoing: isBefore(new Date(startTime), startOfDay(now)),
		links,
		config: {
			startTime: true,
			endTime: true,
			subtitle: 'location',
		},
	}
}

/// The outer shape stays strict: a body that isn't a string at all, or isn't
/// parseable iCalendar, means the source is wrong, and that should throw.
/// Each `VEVENT` is then converted on its own, so one event this feed can't
/// fully describe (a missing `DTSTART`, for instance) doesn't blank the rest
/// of the calendar.
///
/// But a non-empty calendar that drops down to zero events means the feed's
/// shape changed out from under us, not that one event was malformed — that
/// must throw rather than render a silently blank calendar. A calendar with
/// no `VEVENT`s at all is a legitimate "no events" and stays empty.
///
/// That "malformed" check happens before the future-only filter below, on
/// purpose: a calendar whose events are all in the past is legitimately
/// empty, not a parsing failure, and must not throw.
export function parseIcalEvents(body: unknown, now = new Date()): WireEvent[] {
	let text = z.string().parse(body)
	let calendar = ICAL.Component.fromString(text)
	let vevents = calendar.getAllSubcomponents('vevent')

	let events = vevents.flatMap((vevent) => {
		try {
			return [toWireEvent(new ICAL.Event(vevent), now)]
		} catch {
			return []
		}
	})

	if (vevents.length > 0 && events.length === 0) {
		throw new Error('every ical event was malformed')
	}

	let endOfToday = endOfDay(now)
	let future = events.filter((event) => isAfter(new Date(event.endTime), endOfToday))

	return future.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0))
}
