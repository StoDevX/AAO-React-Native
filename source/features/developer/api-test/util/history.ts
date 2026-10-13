import {stringify} from 'safe-stable-stringify'

import type {QueryRow} from './request-path'

/** What the API Tester fills back in for a route: its path and query values. */
export interface SavedRequest {
	pathValues: Record<string, string>
	query: QueryRow[]
	/** The JSON body, as typed, for a method that sends one. */
	body?: string
}

/** The requests sent to one route, newest first. */
interface RouteHistory {
	route: string
	requests: SavedRequest[]
}

/** Every route's sent requests, the most recently used route first. */
export type RequestHistory = RouteHistory[]

export const MAX_REQUESTS_PER_ROUTE = 5
export const MAX_ROUTES = 50

/**
 * A request as it is worth remembering: rows without a name dropped, names
 * trimmed, empty path values dropped -- so two requests that would send the
 * same thing compare equal.
 */
function normalized(request: SavedRequest): SavedRequest {
	let pathValues = Object.fromEntries(
		Object.entries(request.pathValues).filter(([, value]) => value.trim()),
	)
	let query = request.query
		.map((row) => ({name: row.name.trim(), value: row.value}))
		.filter((row) => row.name)
	let body = request.body?.trim()
	return body ? {pathValues, query, body} : {pathValues, query}
}

/** Whether two requests send the same thing, whatever order their values were given in. */
function isSame(a: SavedRequest, b: SavedRequest): boolean {
	return stringify(normalized(a)) === stringify(normalized(b))
}

/** The route's remembered requests, newest first. */
export function recentRequests(history: RequestHistory, route: string): SavedRequest[] {
	return history.find((entry) => entry.route === route)?.requests ?? []
}

/**
 * Remembers a sent request at the top of its route's list, moving it there if
 * it was already remembered, and moves the route to the front so the least
 * recently used one is the one forgotten.
 */
export function recordRequest(
	history: RequestHistory,
	route: string,
	request: SavedRequest,
): RequestHistory {
	let saved = normalized(request)
	if (!Object.keys(saved.pathValues).length && !saved.query.length && !saved.body) {
		return history
	}

	let others = recentRequests(history, route).filter((existing) => !isSame(existing, saved))
	let requests = [saved, ...others].slice(0, MAX_REQUESTS_PER_ROUTE)
	let rest = history.filter((entry) => entry.route !== route)
	return [{route, requests}, ...rest].slice(0, MAX_ROUTES)
}

/** Forgets one remembered request, and the route with it once none are left. */
export function removeRequest(
	history: RequestHistory,
	route: string,
	request: SavedRequest,
): RequestHistory {
	return history
		.map((entry) =>
			entry.route === route
				? {...entry, requests: entry.requests.filter((existing) => !isSame(existing, request))}
				: entry,
		)
		.filter((entry) => entry.requests.length)
}

/**
 * Query names to offer when adding a row, each with the newest value it was
 * sent with. Only this route's: the same name on another route can mean
 * something else, as `id` does on a calendar and on a Messenger post.
 */
export function querySuggestions(history: RequestHistory, route: string): QueryRow[] {
	let suggestions = new Map<string, string>()
	for (let request of recentRequests(history, route)) {
		for (let row of request.query) {
			if (!suggestions.has(row.name)) {
				suggestions.set(row.name, row.value)
			}
		}
	}
	return [...suggestions].map(([name, value]) => ({name, value}))
}
