/** What the API Tester shows of a response: its status and its body as text. */
export interface ApiResponse {
	status: number
	statusText: string
	body: string
}

/** The status as a server reports it, such as `404 Not Found`. */
export function statusLine(response: Pick<ApiResponse, 'status' | 'statusText'>): string {
	return `${response.status} ${response.statusText}`.trim()
}

/** Whether the server refused the request or failed at it. */
export function isErrorStatus(status: number): boolean {
	return status >= 400
}
