/** One `name=value` pair in a request's query string. */
export interface QueryRow {
	name: string
	value: string
}

/**
 * The path a request is sent to: each `:param` in the route's path filled
 * with its value, then the query rows appended in order. A parameter with no
 * value yet keeps its `:param` placeholder, so a preview shows what is left
 * to fill. Nothing is lowercased, since calendar ids and URLs are not.
 */
export function buildRequestPath(
	path: string,
	pathValues: Record<string, string>,
	query: QueryRow[],
): string {
	let filled = path.replaceAll(/:([A-Za-z0-9_]+)/gu, (placeholder, name: string) => {
		let value = pathValues[name]?.trim()
		return value ? encodeURIComponent(value) : placeholder
	})

	// Encoded by hand: React Native's URLSearchParams is only partly there.
	let pairs = query
		.filter((row) => row.name.trim())
		.map((row) => `${encodeURIComponent(row.name.trim())}=${encodeURIComponent(row.value)}`)

	return pairs.length ? `${filled}?${pairs.join('&')}` : filled
}
