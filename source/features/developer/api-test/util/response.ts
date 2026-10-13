/**
 * What the API Tester shows of a response: its status and its body, as text,
 * as a `data:` URI when the body is an image, or only its type and size when
 * it is neither.
 */
export interface ApiResponse {
	status: number
	statusText: string
	body: string
	image?: string
	binary?: {contentType: string; size: number}
}

/** The status as a server reports it, such as `404 Not Found`. */
export function statusLine(response: Pick<ApiResponse, 'status' | 'statusText'>): string {
	return `${response.status} ${response.statusText}`.trim()
}

/** Whether the server refused the request or failed at it. */
export function isErrorStatus(status: number): boolean {
	return status >= 400
}

/// Types read as text beyond `text/*`: JSON, XML and script, and their `+json`
/// and `+xml` variants.
const TEXT_TYPE =
	/^(?:text\/|application\/(?:json|xml|javascript|ecmascript|x-www-form-urlencoded)$|[\w.-]+\/[\w.-]+\+(?:json|xml)$)/u

/**
 * How a body with this `Content-Type` is shown: an image as itself; text, and a
 * body with no type, as text; anything else -- a database, an archive -- not
 * decoded at all, since as text it is unreadable and can be too large to draw.
 */
export function bodyKind(contentType: string): 'image' | 'text' | 'binary' {
	let type = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
	if (type.startsWith('image/')) {
		return 'image'
	}
	if (!type || TEXT_TYPE.test(type)) {
		return 'text'
	}
	return 'binary'
}
