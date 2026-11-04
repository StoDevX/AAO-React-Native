import {describe, expect, test} from '@jest/globals'

import {queryScreenState} from '../query-screen-state'

describe('what a screen built on one query shows', () => {
	test('the data it has, even when refreshing it failed, so it works offline', () => {
		expect(
			queryScreenState({data: ['cached'], isPending: false, fetchStatus: 'idle', isError: true}),
		).toBe('ready')
	})

	test('a spinner while the first load is under way', () => {
		expect(
			queryScreenState({data: undefined, isPending: true, fetchStatus: 'fetching', isError: false}),
		).toBe('loading')
	})

	test('a spinner while the first load waits offline for a connection', () => {
		expect(
			queryScreenState({data: undefined, isPending: true, fetchStatus: 'paused', isError: false}),
		).toBe('loading')
	})

	test('the error when the load failed and nothing is cached', () => {
		expect(
			queryScreenState({data: undefined, isPending: false, fetchStatus: 'idle', isError: true}),
		).toBe('error')
	})

	test('its own empty or not-found state when the load worked and found nothing', () => {
		expect(
			queryScreenState({data: undefined, isPending: false, fetchStatus: 'idle', isError: false}),
		).toBe('ready')
	})

	test('its own not-found state when a cached list lacks the item and the refresh waits offline', () => {
		expect(
			queryScreenState({data: undefined, isPending: false, fetchStatus: 'paused', isError: false}),
		).toBe('ready')
	})

	test('its own empty state when the query is switched off', () => {
		expect(
			queryScreenState({data: undefined, isPending: true, fetchStatus: 'idle', isError: false}),
		).toBe('ready')
	})
})
