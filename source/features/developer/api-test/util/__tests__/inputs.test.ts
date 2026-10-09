import {describe, expect, test} from '@jest/globals'

import type {RouteInput} from '../../query'
import {recordRequest} from '../history'
import {
	defaultFor,
	initialValues,
	inputSummary,
	localDate,
	missingInputs,
	nextStep,
	requestBody,
	startingRequest,
	suggestionsFor,
} from '../inputs'

const cafeId: RouteInput = {name: 'cafeId', in: 'path', required: true}
const sort: RouteInput = {name: 'sort', in: 'query', required: false}
const dateFrom: RouteInput = {name: 'dateFrom', in: 'query', required: false}
const key: RouteInput = {name: 'key', in: 'query', required: false}

describe('inputSummary', () => {
	test('says nothing of a route without inputs', () => {
		expect(inputSummary([])).toBeUndefined()
	})

	test('names each input, marking the optional ones', () => {
		expect(inputSummary([cafeId])).toBe('cafeId')
		expect(inputSummary([dateFrom, sort])).toBe('dateFrom? · sort?')
	})
})

describe('nextStep', () => {
	test('sends a GET that needs nothing straight away', () => {
		expect(nextStep({method: 'GET', inputs: []})).toBe('send')
		expect(nextStep({method: 'GET', inputs: [dateFrom, sort]})).toBe('send')
	})

	test('asks before sending anything else that needs nothing', () => {
		expect(nextStep({method: 'DELETE', inputs: [key]})).toBe('confirm')
		expect(nextStep({method: 'POST', inputs: []})).toBe('confirm')
	})

	test('opens the form for a route with a required input', () => {
		expect(nextStep({method: 'GET', inputs: [cafeId]})).toBe('form')
		expect(nextStep({method: 'DELETE', inputs: [cafeId]})).toBe('form')
	})
})

const cafe: RouteInput = {
	name: 'cafeId',
	in: 'path',
	required: true,
	values: [
		{value: '261', label: 'stav'},
		{value: '262', label: 'cage'},
	],
}
const calendarId: RouteInput = {name: 'id', in: 'query', required: true, examples: ['krlx@x.test']}
const itemId: RouteInput = {name: 'itemId', in: 'path', required: true}

describe('defaultFor', () => {
	test('starts an input at its first accepted value, else its first example, else empty', () => {
		expect(defaultFor(cafe)).toBe('261')
		expect(defaultFor(calendarId)).toBe('krlx@x.test')
		expect(defaultFor(itemId)).toBe('')
	})
})

describe('initialValues', () => {
	test('starts a route never sent at each required input’s default', () => {
		expect(initialValues([cafe, calendarId, sort], undefined)).toEqual({
			pathValues: {cafeId: '261'},
			query: [{name: 'id', value: 'krlx@x.test'}],
		})
	})

	test('starts from the last request sent to the route', () => {
		let last = {pathValues: {cafeId: '262'}, query: [{name: 'id', value: 'mine'}]}
		expect(initialValues([cafe, calendarId], last)).toEqual(last)
	})

	test('adds a required query input the last request did not have', () => {
		expect(initialValues([calendarId], {pathValues: {}, query: []})).toEqual({
			pathValues: {},
			query: [{name: 'id', value: 'krlx@x.test'}],
		})
	})

	test('replaces a remembered value the route no longer accepts', () => {
		expect(initialValues([cafe], {pathValues: {cafeId: '999'}, query: []})).toEqual({
			pathValues: {cafeId: '261'},
			query: [],
		})
	})
})

describe('missingInputs', () => {
	test('names the required inputs still without a value', () => {
		expect(
			missingInputs([itemId, calendarId, sort], {
				pathValues: {itemId: '  '},
				query: [{name: 'id', value: ''}],
			}),
		).toEqual(['itemId', 'id'])
	})

	test('is empty once every required input has a value', () => {
		expect(
			missingInputs([itemId, calendarId], {
				pathValues: {itemId: '7'},
				query: [{name: 'id', value: 'x'}],
			}),
		).toEqual([])
	})
})

describe('localDate', () => {
	test('reads the date on the device, not in UTC', () => {
		// 23:30 local on the 8th is already the 9th in UTC for any zone west of it
		expect(localDate(new Date(2026, 9, 8, 23, 30))).toBe('2026-10-08')
		expect(localDate(new Date(2026, 0, 2, 0, 5))).toBe('2026-01-02')
	})
})

describe('suggestionsFor', () => {
	const route = 'GET /v1/calendar/google'
	const today = new Date(2026, 9, 8, 12)

	test('offers what this route sent before ahead of the server’s examples, each once', () => {
		let history = recordRequest([], route, {pathValues: {}, query: [{name: 'id', value: 'here'}]})
		history = recordRequest(history, route, {
			pathValues: {},
			query: [{name: 'id', value: 'krlx@x.test'}],
		})
		expect(suggestionsFor(calendarId, history, route, today)).toEqual(['krlx@x.test', 'here'])
	})

	test('offers nothing another route sent under the same name', () => {
		let history = recordRequest([], 'GET /v1/news/mess/wp/v2/:resource/:id', {
			pathValues: {},
			query: [{name: 'id', value: '37207'}],
		})
		expect(suggestionsFor(calendarId, history, route, today)).toEqual(['krlx@x.test'])
	})

	test('offers a path input’s past values', () => {
		let history = recordRequest([], 'GET /v1/food/item/:itemId', {
			pathValues: {itemId: '7'},
			query: [],
		})
		expect(suggestionsFor(itemId, history, 'GET /v1/food/item/:itemId', today)).toEqual(['7'])
	})

	test('offers today for a date input', () => {
		let dateTo: RouteInput = {name: 'dateTo', in: 'query', required: false, format: 'date'}
		expect(suggestionsFor(dateTo, [], route, today)).toEqual(['2026-10-08'])
	})
})

describe('startingRequest', () => {
	const recent = [{pathValues: {cafeId: '262'}, query: []}]

	test('starts from the request just sent, when the form was opened from its result', () => {
		let sent = {pathValues: {}, query: [{name: 'sort', value: 'descending'}]}
		expect(startingRequest(JSON.stringify(sent), recent)).toEqual(sent)
	})

	test('starts from the last request remembered, when nothing was just sent', () => {
		expect(startingRequest(undefined, recent)).toEqual(recent[0])
	})

	test('falls back to what is remembered when the request it was handed is not one', () => {
		expect(startingRequest('{not json', recent)).toEqual(recent[0])
		expect(startingRequest('{"query": 3}', recent)).toEqual(recent[0])
	})
})

describe('a JSON body', () => {
	const text: RouteInput = {
		name: 'text',
		in: 'body',
		required: true,
		examples: ['<p>Hello</p>'],
	}
	const route = 'POST /v1/util/html-to-md'

	test('starts a route never sent at each body input’s example', () => {
		expect(initialValues([text], undefined)).toEqual({
			pathValues: {},
			query: [],
			bodyValues: {text: '<p>Hello</p>'},
		})
	})

	test('starts from the body last sent', () => {
		let last = {pathValues: {}, query: [], bodyValues: {text: '<b>mine</b>'}}
		expect(initialValues([text], last)).toEqual(last)
	})

	test('names a required body field still without a value', () => {
		expect(missingInputs([text], {pathValues: {}, query: [], bodyValues: {text: ' '}})).toEqual([
			'text',
		])
		expect(missingInputs([text], {pathValues: {}, query: []})).toEqual(['text'])
	})

	test('offers what this route sent in its body before the server’s example', () => {
		let history = recordRequest([], route, {pathValues: {}, query: [], bodyValues: {text: 'sent'}})
		expect(suggestionsFor(text, history, route, new Date(2026, 9, 8))).toEqual([
			'sent',
			'<p>Hello</p>',
		])
	})

	test('is built from the body inputs alone, and not at all for a route without them', () => {
		expect(requestBody([text], {text: '<b>hi</b>', stray: 'x'})).toEqual({text: '<b>hi</b>'})
		expect(requestBody([], {text: '<b>hi</b>'})).toBeUndefined()
	})

	test('comes back with the request handed over from a result', () => {
		let sent = {pathValues: {}, query: [], bodyValues: {text: '<b>hi</b>'}}
		expect(startingRequest(JSON.stringify(sent), [])).toEqual(sent)
		expect(startingRequest(JSON.stringify({...sent, bodyValues: {text: 3}}), [])).toBeUndefined()
	})
})
