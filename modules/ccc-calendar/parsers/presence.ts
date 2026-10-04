import {deriveDayFlags} from '@frogpond/event-type'
import {fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {z} from 'zod'
import {parseEach} from '@frogpond/data-sources/parse-each'
import type {WireEvent} from './events'

/**
 * Presence's public API is the one its own web app reads: it builds a base of
 * `{host}/{subdomain}/v1/`, which for St. Olaf resolves to
 * `https://api.presence.io/stolaf/v1/events`. Only the fields the calendar can
 * actually show are modelled here -- RSVP counts, cover photos, and contact
 * details have nowhere to go in `EventType`.
 */
const PresenceEventSchema = z.object({
	eventName: z.string(),
	organizationName: z.string(),
	uri: z.string(),
	description: z.string().default(''),
	location: z.string().default(''),
	startDateTimeUtc: z.string(),
	endDateTimeUtc: z.string(),
	hasCoverImage: z.boolean().default(false),
	photoUriWithVersion: z.string().optional(),
})

const EVENT_PAGE = 'https://stolaf.presence.io/event/'

/**
 * Where Presence's own site loads an event's cover image from: its campus CDN
 * and the campus's `apiId`, then the event's `photoUriWithVersion`. The
 * feed's own `photoUri` names a file but not where it lives, and the
 * `cdn.presence.io/eventphotos/` link on each event page's `og:image` 404s.
 */
const EVENT_PHOTOS =
	'https://stolaf-cdn.presence.io/event-photos/09ddef77-5009-4348-8540-c9bfc6ade6bc/'

function coverImage(event: z.infer<typeof PresenceEventSchema>): string | undefined {
	return event.hasCoverImage && event.photoUriWithVersion
		? `${EVENT_PHOTOS}${event.photoUriWithVersion}`
		: undefined
}

function toWireEvent(event: z.infer<typeof PresenceEventSchema>, now: Date): WireEvent {
	// Presence already emits ISO-8601 with a `Z`, unlike TEC's naive
	// "2026-08-17 13:00:00", so these need no repair before Date can read them.
	let startTime = new Date(event.startDateTimeUtc).toISOString()
	let endTime = new Date(event.endDateTimeUtc).toISOString()

	// Presence has no field expressing an all-day event, and none of its events
	// runs midnight to midnight -- every one names real start and end times.
	let isAllDay = false
	let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, new Date(startTime), new Date(endTime))

	let descriptionLinks = htmlToSegments(event.description).flatMap((segment) =>
		segment.type === 'link' ? [segment.url] : [],
	)

	let image = coverImage(event)

	let startOfToday = new Date(now)
	startOfToday.setHours(0, 0, 0, 0)

	return {
		dataSource: 'presence',
		startTime,
		endTime,
		isAllDay,
		isMultiDay,
		isSameInstant,
		title: event.eventName,
		description: fastGetTrimmedText(event.description),
		location: event.location,
		isOngoing: new Date(startTime) < startOfToday && new Date(endTime) > now,
		// A description that already links to the event's own page would
		// otherwise produce the same href twice.
		links: [...new Set([...descriptionLinks, `${EVENT_PAGE}${event.uri}`])],
		// Presence attaches categories to the organisation, not the event, and
		// reaching them means a second request; the sponsoring organisation is
		// what this source contributes to filtering. Presence gives each event
		// exactly one, so the list it fills is always a single name.
		categories: [],
		organization: [event.organizationName],
		...(image && {image}),
		config: {
			startTime: true,
			endTime: true,
			subtitle: 'location',
		},
	}
}

/**
 * The outer shape stays strict: a response that isn't an array at all means
 * the source is wrong, and that should throw. Each element is then parsed on
 * its own, so one event Presence can't fully describe doesn't blank the rest
 * of the calendar the way an all-or-nothing `z.array(...).parse()` would.
 *
 * But a non-empty response that drops down to zero events means the shape
 * changed out from under us, not that one event was malformed -- that must
 * throw rather than render a silently blank calendar. A genuinely empty
 * response (no upcoming events) is legitimate and stays empty.
 */
export function parsePresenceEvents(body: unknown, now = new Date()): WireEvent[] {
	let items = z.array(z.unknown()).parse(body)

	return parseEach(
		items,
		(raw) => {
			let event = PresenceEventSchema.safeParse(raw)
			return event.success ? toWireEvent(event.data, now) : undefined
		},
		'Presence event',
	)
}
