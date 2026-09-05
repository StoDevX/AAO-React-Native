import {z} from 'zod'

/// ccc-server emits the wire event shape already, so this is a shape check
/// rather than a transform — but it still validates, like every other parser
/// here.
///
/// The server's `EventSchema` (`source/calendar/types.ts`) types `links` as
/// `z.array(z.unknown())`, but every producer fills it with URL strings, so
/// `z.array(z.string())` is the honest type here.
const WireEventSchema = z.object({
	dataSource: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	isAllDay: z.boolean(),
	isMultiDay: z.boolean(),
	isSameInstant: z.boolean(),
	title: z.string(),
	description: z.string(),
	location: z.string().default(''),
	isOngoing: z.boolean(),
	links: z.array(z.string()),
	categories: z.array(z.string()).default([]),
	config: z.object({
		startTime: z.boolean(),
		endTime: z.boolean(),
		subtitle: z.union([z.literal('location'), z.literal('description')]),
	}),
})

export type WireEvent = z.infer<typeof WireEventSchema>

/// The outer shape stays strict: a response that isn't an array at all means
/// the source is wrong, and that should throw. Each element is then parsed
/// on its own, so one event the server can't fully describe doesn't blank
/// the rest of the calendar the way an all-or-nothing `z.array(...).parse()`
/// would.
///
/// But a non-empty response that drops down to zero events means the shape
/// changed out from under us, not that one event was malformed — that must
/// throw rather than render a silently blank calendar. A genuinely empty
/// response (no upcoming events) is legitimate and stays empty.
export function parseEvents(body: unknown): WireEvent[] {
	let items = z.array(z.unknown()).parse(body)

	let events = items.flatMap((raw) => {
		try {
			return [WireEventSchema.parse(raw)]
		} catch {
			return []
		}
	})

	if (items.length > 0 && events.length === 0) {
		throw new Error('every event was malformed')
	}

	return events
}
