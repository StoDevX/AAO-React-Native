/** A response body, read as JSON when it is JSON. */
export type ParsedBody =
	| {kind: 'empty'}
	| {kind: 'json'; value: unknown}
	| {kind: 'text'; text: string}

/**
 * Reads a response body without throwing: an endpoint may answer with text or
 * HTML, or nothing at all, and a broken or cut-off response is still worth
 * showing as it arrived.
 */
export function parseBody(body: string): ParsedBody {
	if (!body.trim()) {
		return {kind: 'empty'}
	}
	try {
		return {kind: 'json', value: JSON.parse(body) as unknown}
	} catch {
		return {kind: 'text', text: body}
	}
}
