/** One `name=value` pair in a request's query string. */
export interface QueryRow {
	name: string
	value: string
}

/// A path param in a route's path, as the router writes it: `:cafeId`.
const PATH_PARAM = /:([A-Za-z0-9_]+)/gu

/** The params a route's path takes, in order: `['resource', 'id']`. */
export function pathParams(path: string): string[] {
	return [...path.matchAll(PATH_PARAM)].map((match) => match[1] ?? '')
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
	let filled = path.replaceAll(PATH_PARAM, (placeholder, name: string) => {
		let value = pathValues[name]?.trim()
		return value ? encodeURIComponent(value) : placeholder
	})

	// Encoded by hand: React Native's URLSearchParams is only partly there.
	let pairs = query
		.filter((row) => row.name.trim())
		.map((row) => `${encodeURIComponent(row.name.trim())}=${encodeURIComponent(row.value)}`)

	return pairs.length ? `${filled}?${pairs.join('&')}` : filled
}

/**
 * What the client is asked for: a path from the server's root goes through the
 * client's base, which is the server's `/v1/`, so `/ping` is `../ping`. A path
 * typed relative to that base is left as it is.
 */
export function clientPath(path: string): string {
	return path.startsWith('/') ? `..${path}` : path
}

/**
 * A remembered request as its Recent row reads: its path, and its body when it
 * has one, since requests to one path can differ only there.
 */
export function requestLabel(
	path: string,
	request: {
		pathValues: Record<string, string>
		query: QueryRow[]
		body?: string
	},
): string {
	let built = buildRequestPath(path, request.pathValues, request.query)
	return request.body ? `${built} ${request.body}` : built
}
