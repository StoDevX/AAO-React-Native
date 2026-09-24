import {deriveDayFlags} from '@frogpond/event-type'
import {decode, fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {format, subDays} from 'date-fns'
import {z} from 'zod'
import type {WireEvent} from './events'

// The key is always present. A venued event carries an object; a venue-less
// one carries an empty array `[]` rather than omitting the key or nulling
// it out — TEC's REST API represents "no venue" as an empty collection.
const VenueSchema = z.union([z.object({venue: z.string().optional()}), z.tuple([])]).optional()

// The key is always present and always an array -- an event no organiser
// sponsors carries `organizer: []`. Unlike `venue`, TEC never collapses it to
// a bare object, so this needs no union.
const OrganizerSchema = z.array(z.object({organizer: z.string().optional()})).default([])

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
	organizer: OrganizerSchema,
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

/**
 * Decoded like the venue name is, and for the same reason: TEC escapes the
 * free text it sends, so an ampersand arrives as `&#038;`.
 *
 * An event no organiser sponsors names none at all rather than an empty list
 * -- absent is how `EventType` spells "unsponsored", and `[]` would be a
 * second spelling of it.
 */
function organizationNames(organizers: z.infer<typeof OrganizerSchema>): string[] | undefined {
	let names = organizers.flatMap((entry) => (entry.organizer ? [decode(entry.organizer)] : []))
	return names.length > 0 ? names : undefined
}

const TecEventsSchema = z.object({events: z.array(z.unknown())})

const TecPageSchema = z.object({
	events: z.array(z.unknown()),
	next_rest_url: z.string().optional(),
})

/**
 * The most pages `fetchTecPages` will follow: 500 events, over three times
 * what the campus calendar lists in a month of term. Reaching it means a
 * feed that never stops handing out a next page.
 */
const TEC_MAX_PAGES = 10

/** TEC's largest page. Its default is 10, which would reach the cap early. */
const TEC_PAGE_SIZE = '50'

/**
 * Every event in a TEC feed that runs on any day from `from` to `until`,
 * across all its pages, joined into the one `{events}` body `parseTecEvents`
 * reads.
 *
 * `writeSource` treats what it is handed as the whole feed: it deletes every
 * event that has not finished before today and keeps only what comes back.
 * So the feed has to send back everything still running -- an exhibition
 * that opened last month as much as a talk tomorrow -- and all of it, or
 * none. A feed longer than `TEC_MAX_PAGES` throws rather than come back
 * short, leaving the previous rows in place.
 *
 * TEC's `start_date` filters on an event's start, so it would drop anything
 * already running. `ends_after` and `starts_before` filter on overlap
 * instead. TEC rounds both up to 23:59:59 of the date given, so reaching an
 * event that ends early on `from` takes the day before it. It carries both
 * into every `next_rest_url`, so the pages it names are fetched as they come.
 */
export async function fetchTecPages(
	href: string,
	window: {from: Date; until: Date},
	fetchPage: (href: string) => Promise<unknown>,
): Promise<{events: unknown[]}> {
	// Split by hand rather than through `URL`: a proxied source's href is
	// relative, and `URL` throws on a relative href with no base.
	let [path, query = ''] = href.split('?', 2)
	let params = new URLSearchParams(query)
	params.set('per_page', TEC_PAGE_SIZE)
	params.set('ends_after', format(subDays(window.from, 1), 'yyyy-MM-dd'))
	params.set('starts_before', format(window.until, 'yyyy-MM-dd'))

	let events: unknown[] = []
	let next: string | undefined = `${path}?${params.toString()}`

	for (let count = 0; next; count++) {
		if (count === TEC_MAX_PAGES) {
			throw new Error(`the TEC feed ran past ${TEC_MAX_PAGES} pages`)
		}
		// Sequential by nature: each page names the next.
		// oxlint-disable-next-line eslint/no-await-in-loop
		let page = TecPageSchema.parse(await fetchPage(next))
		events.push(...page.events)
		next = page.next_rest_url
	}

	return {events}
}

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
		isOngoing: new Date(startTime) < startOfToday && new Date(endTime) > now,
		// Descriptions commonly link back to the event's own page, so the two
		// sources can produce the same href twice.
		links: [...new Set([...descriptionLinks, event.url])],
		categories: event.categories.map((c) => c.name),
		organization: organizationNames(event.organizer),
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
