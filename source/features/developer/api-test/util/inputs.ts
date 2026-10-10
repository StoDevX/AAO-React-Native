import type {RouteEntry} from '../query'
import {recentRequests, type RequestHistory, type SavedRequest} from './history'
import {sendsWithoutAsking} from './method'

/** A route's path params as a row's detail line: `cafeId`, or `resource · id`. */
export function inputSummary(params: string[]): string | undefined {
	return params.length ? params.join(' · ') : undefined
}

/**
 * What tapping a route does: open the form when its path needs filling in, ask
 * first when its method can change the server, and otherwise send it at once.
 */
export function nextStep(
	entry: Pick<RouteEntry, 'method' | 'params'>,
): 'send' | 'confirm' | 'form' {
	if (entry.params.length) {
		return 'form'
	}
	return sendsWithoutAsking(entry.method) ? 'send' : 'confirm'
}

/**
 * The form's first values: the last request sent to the route, kept to the
 * path params the route has now; or, for a route never sent, empty ones.
 */
export function initialValues(params: string[], recent: SavedRequest | undefined): SavedRequest {
	let pathValues = Object.fromEntries(params.map((name) => [name, recent?.pathValues[name] ?? '']))
	let query = recent?.query ?? []
	return recent?.body ? {pathValues, query, body: recent.body} : {pathValues, query}
}

/** The path params that still have no value; the request cannot go without them. */
export function missingInputs(params: string[], request: SavedRequest): string[] {
	return params.filter((name) => !request.pathValues[name]?.trim())
}

/**
 * Values to offer for a path param: what this route sent for it before, newest
 * first, each once. Another route's values are left out, since the same name
 * there can mean something else.
 */
export function suggestionsFor(name: string, history: RequestHistory, route: string): string[] {
	let sent = recentRequests(history, route).map((request) => request.pathValues[name] ?? '')
	return [...new Set(sent.filter((value) => value.trim()))]
}

/** Why a body cannot be sent as JSON, or nothing when it can: an empty one sends none. */
export function bodyProblem(body: string): string | undefined {
	if (!body.trim()) {
		return undefined
	}
	try {
		JSON.parse(body)
		return undefined
	} catch {
		return 'The body is not valid JSON.'
	}
}

function isStringRecord(value: unknown): value is Record<string, string> {
	return (
		typeof value === 'object' &&
		value !== null &&
		Object.values(value).every((each) => typeof each === 'string')
	)
}

function isSavedRequest(value: unknown): value is SavedRequest {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	let {pathValues, query, body} = value as Record<string, unknown>
	return (
		isStringRecord(pathValues) &&
		(body === undefined || typeof body === 'string') &&
		Array.isArray(query) &&
		query.every(
			(row: unknown) =>
				typeof row === 'object' &&
				row !== null &&
				typeof (row as Record<string, unknown>).name === 'string' &&
				typeof (row as Record<string, unknown>).value === 'string',
		)
	)
}

/**
 * The request a form starts from: the one just sent, when the form was opened
 * from its result, handed over as JSON; otherwise the last one remembered.
 */
export function startingRequest(
	sent: string | undefined,
	recent: SavedRequest[],
): SavedRequest | undefined {
	if (sent) {
		try {
			let parsed: unknown = JSON.parse(sent)
			if (isSavedRequest(parsed)) {
				return parsed
			}
		} catch {
			// not a request; fall back to what is remembered
		}
	}
	return recent[0]
}
