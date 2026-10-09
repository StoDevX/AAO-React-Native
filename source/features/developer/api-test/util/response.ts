/**
 * What the API Tester shows of a response: its status and its body, as text,
 * or as a `data:` URI when the body is an image.
 */
export interface ApiResponse {
	status: number
	statusText: string
	body: string
	image?: string
}

/** The status as a server reports it, such as `404 Not Found`. */
export function statusLine(response: Pick<ApiResponse, 'status' | 'statusText'>): string {
	return `${response.status} ${response.statusText}`.trim()
}

/** Whether the server refused the request or failed at it. */
export function isErrorStatus(status: number): boolean {
	return status >= 400
}

/** Whether a `Content-Type` is an image's, to be shown as one rather than as text. */
export function isImageType(contentType: string): boolean {
	return contentType.trim().toLowerCase().startsWith('image/')
}
