import type {RouteEntry, RouteInput} from '../query'
import {recentRequests, type RequestHistory, type SavedRequest} from './history'
import {isSafeMethod} from './method'

/** A route's inputs as a row's detail line: `cafeId`, or `dateFrom? · sort?`. */
export function inputSummary(inputs: RouteInput[]): string | undefined {
	if (!inputs.length) {
		return undefined
	}
	return inputs.map((input) => (input.required ? input.name : `${input.name}?`)).join(' · ')
}

/**
 * What tapping a route does: open the form when it needs something, ask first
 * when it can change the server, and otherwise send it at once.
 */
export function nextStep(
	entry: Pick<RouteEntry, 'method' | 'inputs'>,
): 'send' | 'confirm' | 'form' {
	if (entry.inputs.some((input) => input.required)) {
		return 'form'
	}
	return isSafeMethod(entry.method) ? 'send' : 'confirm'
}

/** Where an input starts: its first accepted value, else its first example, else empty. */
export function defaultFor(input: RouteInput): string {
	return input.values?.[0]?.value ?? input.examples?.[0] ?? ''
}

function isAccepted(input: RouteInput, value: string): boolean {
	return !input.values || input.values.some((option) => option.value === value)
}

/**
 * The form's first values: the last request sent to the route, brought up to
 * what the route now requires; or, for a route never sent, each required
 * input's default.
 */
export function initialValues(
	inputs: RouteInput[],
	recent: SavedRequest | undefined,
): SavedRequest {
	let pathValues: Record<string, string> = {}
	for (let input of inputs.filter((each) => each.in === 'path')) {
		let remembered = recent?.pathValues[input.name]
		pathValues[input.name] =
			remembered !== undefined && isAccepted(input, remembered) ? remembered : defaultFor(input)
	}

	let query = (recent?.query ?? []).map((row) => {
		let input = inputs.find((each) => each.in === 'query' && each.name === row.name)
		return input && !isAccepted(input, row.value) ? {...row, value: defaultFor(input)} : row
	})
	for (let input of inputs.filter((each) => each.in === 'query' && each.required)) {
		if (!query.some((row) => row.name === input.name)) {
			query.push({name: input.name, value: defaultFor(input)})
		}
	}
	return {pathValues, query}
}

/** The required inputs that still have no value; the request cannot go without them. */
export function missingInputs(inputs: RouteInput[], request: SavedRequest): string[] {
	return inputs
		.filter((input) => input.required)
		.filter((input) =>
			input.in === 'path'
				? !request.pathValues[input.name]?.trim()
				: !request.query.some((row) => row.name === input.name && row.value.trim()),
		)
		.map((input) => input.name)
}

/** A date as `YYYY-MM-DD`, on the device's calendar rather than UTC's. */
export function localDate(date: Date): string {
	let month = String(date.getMonth() + 1).padStart(2, '0')
	let day = String(date.getDate()).padStart(2, '0')
	return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Values to offer for an input: what this route sent for it before, newest
 * first, then the server's accepted values and examples, then today for a
 * date -- each once. Another route's values are left out, since the same name
 * there can mean something else.
 */
export function suggestionsFor(
	input: RouteInput,
	history: RequestHistory,
	route: string,
	today: Date,
): string[] {
	let sent = recentRequests(history, route).flatMap((request) =>
		input.in === 'path'
			? [request.pathValues[input.name] ?? '']
			: request.query.filter((row) => row.name === input.name).map((row) => row.value),
	)
	let fromServer = [
		...(input.values?.map((option) => option.value) ?? []),
		...(input.examples ?? []),
	]
	let dated = input.format === 'date' ? [localDate(today)] : []
	return [...new Set([...sent, ...fromServer, ...dated].filter((value) => value.trim()))]
}

function isSavedRequest(value: unknown): value is SavedRequest {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	let {pathValues, query} = value as Record<string, unknown>
	return (
		typeof pathValues === 'object' &&
		pathValues !== null &&
		Object.values(pathValues).every((each) => typeof each === 'string') &&
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
