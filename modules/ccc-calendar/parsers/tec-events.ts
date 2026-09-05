import {deriveDayFlags} from '@frogpond/event-type'
import {decode, fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {z} from 'zod'
import type {WireEvent} from './events'

// The key is always present. A venued event carries an object; a venue-less
// one carries an empty array `[]` rather than omitting the key or nulling
// it out — TEC's REST API represents "no venue" as an empty collection.
const VenueSchema = z.union([z.object({venue: z.string().optional()}), z.tuple([])]).optional()

const TecCategorySchema = z.object({
	name: z.string(),
})

const TecEventSchema = z.object({
	title: z.string(),
	description: z.string(),
	url: z.string(),
	all_day: z.boolean(),
	utc_start_date: z.string(),
	utc_end_date: z.string(),
	venue: VenueSchema,
	categories: z.array(TecCategorySchema).default([]),
})

/**
 * Decoded like the title is: TEC sends venue names HTML-escaped, so an
 * apostrophe arrives as `&#8217;` and reaches the screen verbatim otherwise --
 * `Buntrock Commons Lion&#8217;s Pause`.
 */
function venueName(venue: z.infer<typeof VenueSchema>): string {
	return decode(Array.isArray(venue) ? '' : (venue?.venue ?? ''))
}

const TecEventsSchema = z.object({events: z.array(z.unknown())})

/**
 * TEC reports `utc_start_date` as "2026-08-17 13:00:00" — UTC, but with a
 * space separator and no zone marker. Left alone it would be read as local
 * time and shift by the offset.
 */
function toIsoString(utcDate: string): string {
	return new Date(`${utcDate.replace(' ', 'T')}Z`).toISOString()
}

function toWireEvent(event: z.infer<typeof TecEventSchema>, now: Date): WireEvent {
	let startTime = toIsoString(event.utc_start_date)
	let endTime = toIsoString(event.utc_end_date)
	let description = fastGetTrimmedText(event.description)
	let isAllDay = event.all_day
	let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, new Date(startTime), new Date(endTime))

	let descriptionLinks = htmlToSegments(event.description).flatMap((segment) =>
		segment.type === 'link' ? [segment.url] : [],
	)

	let startOfToday = new Date(now)
	startOfToday.setHours(0, 0, 0, 0)

	return {
		dataSource: 'tribe',
		startTime,
		endTime,
		isAllDay,
		isMultiDay,
		isSameInstant,
		title: decode(event.title),
		description,
		location: venueName(event.venue),
		isOngoing: new Date(startTime) < startOfToday,
		// Descriptions commonly link back to the event's own page, so the two
		// sources can produce the same href twice.
		links: [...new Set([...descriptionLinks, event.url])],
		categories: event.categories.map((c) => c.name),
		config: {
			startTime: !event.all_day,
			endTime: !event.all_day,
			subtitle: 'location',
		},
	}
}

/**
 * The outer shape stays strict: a response that isn't `{events: [...]}` at
 * all means the source is wrong, and that should throw. Each element is
 * then parsed on its own, so one event TEC can't fully describe doesn't
 * blank the rest of the calendar the way an all-or-nothing
 * `z.array(...).parse()` would.
 *
 * But a non-empty response that drops down to zero events means the shape
 * changed out from under us, not that one event was malformed — that must
 * throw rather than render a silently blank calendar. A genuinely empty
 * response (no upcoming events) is legitimate and stays empty.
 */
export function parseTecEvents(body: unknown, now = new Date()): WireEvent[] {
	let {events: items} = TecEventsSchema.parse(body)

	let events = items.flatMap((raw) => {
		try {
			return [toWireEvent(TecEventSchema.parse(raw), now)]
		} catch {
			return []
		}
	})

	if (items.length > 0 && events.length === 0) {
		throw new Error('every TEC event was malformed')
	}

	return events
}
