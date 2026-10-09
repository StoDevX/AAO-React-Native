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
	let pathValues = fieldValues(
		inputs.filter((each) => each.in === 'path'),
		recent?.pathValues,
	)

	let query = (recent?.query ?? []).map((row) => {
		let input = inputs.find((each) => each.in === 'query' && each.name === row.name)
		return input && !isAccepted(input, row.value) ? {...row, value: defaultFor(input)} : row
	})
	for (let input of inputs.filter((each) => each.in === 'query' && each.required)) {
		if (!query.some((row) => row.name === input.name)) {
			query.push({name: input.name, value: defaultFor(input)})
		}
	}

	let bodyInputs = inputs.filter((each) => each.in === 'body')
	return bodyInputs.length
		? {pathValues, query, bodyValues: fieldValues(bodyInputs, recent?.bodyValues)}
		: {pathValues, query}
}

/** Each input's remembered value when the route still accepts it, else its default. */
function fieldValues(
	inputs: RouteInput[],
	remembered: Record<string, string> | undefined,
): Record<string, string> {
	return Object.fromEntries(
		inputs.map((input) => {
			let value = remembered?.[input.name]
			return [
				input.name,
				value !== undefined && isAccepted(input, value) ? value : defaultFor(input),
			]
		}),
	)
}

/** What a request holds for an input, wherever the input goes. */
function valueOf(input: RouteInput, request: SavedRequest): string | undefined {
	if (input.in === 'path') {
		return request.pathValues[input.name]
	}
	if (input.in === 'body') {
		return request.bodyValues?.[input.name]
	}
	return request.query.find((row) => row.name === input.name && row.value.trim())?.value
}

/** The required inputs that still have no value; the request cannot go without them. */
export function missingInputs(inputs: RouteInput[], request: SavedRequest): string[] {
	return inputs
		.filter((input) => input.required)
		.filter((input) => !valueOf(input, request)?.trim())
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
		input.in === 'query'
			? request.query.filter((row) => row.name === input.name).map((row) => row.value)
			: [valueOf(input, request) ?? ''],
	)
	let fromServer = [
		...(input.values?.map((option) => option.value) ?? []),
		...(input.examples ?? []),
	]
	let dated = input.format === 'date' ? [localDate(today)] : []
	return [...new Set([...sent, ...fromServer, ...dated].filter((value) => value.trim()))]
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
	let {pathValues, query, bodyValues} = value as Record<string, unknown>
	return (
		isStringRecord(pathValues) &&
		(bodyValues === undefined || isStringRecord(bodyValues)) &&
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

/**
 * The JSON body a request sends: its values for the route's body inputs, and
 * nothing for a route that reads no body.
 */
export function requestBody(
	inputs: RouteInput[],
	bodyValues: Record<string, string> | undefined,
): Record<string, string> | undefined {
	let fields = inputs.filter((input) => input.in === 'body')
	if (!fields.length) {
		return undefined
	}
	return Object.fromEntries(fields.map((input) => [input.name, bodyValues?.[input.name] ?? '']))
}
