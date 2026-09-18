/**
 * A `YYYY-MM-DD` string for a `Date`, read in local time.
 *
 * Shared by the write side and the read side because their date strings are
 * compared against each other: `retentionFor`'s cutoff and `dayWindow`'s back
 * edge have to name the same day, or the window asks for days retention has
 * already pruned. Two copies of this could drift apart without a test noticing.
 *
 * Local, never UTC: these are the dates an all-day occurrence is stored and
 * queried by, and an all-day event names the calendar date the reader sees.
 */
export function localDate(date: Date): string {
	let year = date.getFullYear()
	let month = String(date.getMonth() + 1).padStart(2, '0')
	let day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}
