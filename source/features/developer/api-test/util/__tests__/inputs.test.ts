import {describe, expect, test} from '@jest/globals'

import {recordRequest} from '../history'
import {
	bodyProblem,
	initialValues,
	inputSummary,
	missingInputs,
	nextStep,
	startingRequest,
	suggestionsFor,
} from '../inputs'

describe('inputSummary', () => {
	test('says nothing of a route without path params', () => {
		expect(inputSummary([])).toBeUndefined()
	})

	test('names each path param', () => {
		expect(inputSummary(['cafeId'])).toBe('cafeId')
		expect(inputSummary(['resource', 'id'])).toBe('resource · id')
	})
})

describe('nextStep', () => {
	test('sends a route without path params straight away', () => {
		expect(nextStep({method: 'GET', params: []})).toBe('send')
		expect(nextStep({method: 'QUERY', params: []})).toBe('send')
	})

	test('asks before a DELETE without path params', () => {
		expect(nextStep({method: 'DELETE', params: []})).toBe('confirm')
	})

	test('opens the form for a route with path params, whatever its method', () => {
		expect(nextStep({method: 'GET', params: ['cafeId']})).toBe('form')
		expect(nextStep({method: 'DELETE', params: ['id']})).toBe('form')
	})
})

describe('initialValues', () => {
	test('starts a route never sent with each path param empty', () => {
		expect(initialValues(['cafeId'], undefined)).toEqual({pathValues: {cafeId: ''}, query: []})
	})

	test('starts from the last request sent to the route', () => {
		let last = {pathValues: {cafeId: '262'}, query: [{name: 'date', value: 'today'}], body: '{}'}
		expect(initialValues(['cafeId'], last)).toEqual(last)
	})

	test('keeps to the path params the route has now', () => {
		expect(initialValues(['id'], {pathValues: {old: 'x', id: '7'}, query: []})).toEqual({
			pathValues: {id: '7'},
			query: [],
		})
	})
})

describe('missingInputs', () => {
	test('names the path params still without a value', () => {
		expect(
			missingInputs(['resource', 'id'], {pathValues: {resource: 'posts', id: '  '}, query: []}),
		).toEqual(['id'])
	})

	test('is empty once every path param has a value', () => {
		expect(missingInputs(['cafeId'], {pathValues: {cafeId: '262'}, query: []})).toEqual([])
	})
})

describe('suggestionsFor', () => {
	const route = 'edu.stolaf GET /v1/food/menu/:cafeId'

	test('offers what this route sent for a path param before, newest first, each once', () => {
		let history = recordRequest([], route, {pathValues: {cafeId: '261'}, query: []})
		history = recordRequest(history, route, {pathValues: {cafeId: '262'}, query: []})
		expect(suggestionsFor('cafeId', history, route)).toEqual(['262', '261'])
	})

	test('offers nothing another route sent under the same name', () => {
		let history = recordRequest([], 'edu.stolaf GET /v1/food/cafe/:cafeId', {
			pathValues: {cafeId: '35'},
			query: [],
		})
		expect(suggestionsFor('cafeId', history, route)).toEqual([])
	})
})

describe('bodyProblem', () => {
	test('finds nothing wrong with an empty body or with JSON', () => {
		expect(bodyProblem('')).toBeUndefined()
		expect(bodyProblem('  ')).toBeUndefined()
		expect(bodyProblem('{"text": "<b>hi</b>"}')).toBeUndefined()
	})

	test('says a body that is not JSON cannot be sent as JSON', () => {
		expect(bodyProblem('{text: hi}')).toBe('The body is not valid JSON.')
	})
})

describe('startingRequest', () => {
	const recent = [{pathValues: {cafeId: '262'}, query: []}]

	test('starts from the request just sent, when the form was opened from its result', () => {
		let sent = {pathValues: {}, query: [{name: 'sort', value: 'descending'}], body: '{"a":1}'}
		expect(startingRequest(JSON.stringify(sent), recent)).toEqual(sent)
	})

	test('starts from the last request remembered, when nothing was just sent', () => {
		expect(startingRequest(undefined, recent)).toEqual(recent[0])
	})

	test('falls back to what is remembered when the request it was handed is not one', () => {
		expect(startingRequest('{not json', recent)).toEqual(recent[0])
		expect(startingRequest('{"query": 3}', recent)).toEqual(recent[0])
		expect(startingRequest('{"pathValues": {}, "query": [], "body": 3}', recent)).toEqual(recent[0])
	})
})
