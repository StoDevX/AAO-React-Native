import type {EventType} from '@frogpond/event-type'

/// EventType has no id field, so this stands in for one when selecting a
/// single event out of a fetched list. Two events with the exact same
/// start time and title would collide -- `.find()` just returns the
/// first match, which is indistinguishable from correct behavior to the
/// user, so this isn't guarded against further.
export function eventKey(event: EventType): string {
	return `${event.startTime.toISOString()}|${event.title}`
}

/// Whether two events from *different* calendars are the same event. Distinct
/// from `eventKey`, which identifies one event within one source and so can
/// compare titles verbatim: the campus calendar and Presence describe the same
/// game as "Men's Soccer vs Carroll University" and "Men's Soccer vs. Carroll
/// University", differing only by a curly apostrophe and a full stop. Folding
/// the title to its letters and digits makes those agree.
///
/// Matching is exact after folding, never fuzzy. The campus calendar lists
/// men's and women's cross-country as two events where Presence lists one
/// combined listing; any similarity threshold loose enough to merge those is
/// loose enough to merge genuinely unrelated events that happen to start
/// together, and merging means deleting a real event from the list.
export function dedupeKey(event: EventType): string {
	let title = event.title
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, ' ')
		.trim()
	return `${event.startTime.toISOString()}|${title}`
}
