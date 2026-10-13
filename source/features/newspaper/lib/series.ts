/**
 * The series a title names before its colon, without an episode number, such as `Mouse Friends`.
 * Text with no letter, such as the `2` of `2:46am`, names no series.
 */
export function seriesName(title: string): string | null {
	let colon = title.indexOf(':')
	if (colon <= 0) return null
	let name = title
		.slice(0, colon)
		.replace(/\s+episode\s+\S+$/iu, '')
		.trim()
	return /\p{L}/u.test(name) ? name : null
}

/** The series a title names, lowercased so that one series matches however a title capitalises it. */
export function seriesKey(title: string): string | null {
	return seriesName(title)?.toLowerCase() ?? null
}
