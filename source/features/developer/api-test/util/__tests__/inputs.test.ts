import {describe, expect, test} from '@jest/globals'

import type {RouteInput} from '../../query'
import {inputSummary, nextStep} from '../inputs'

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
