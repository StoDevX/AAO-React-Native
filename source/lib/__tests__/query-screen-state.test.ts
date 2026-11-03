import {describe, expect, test} from '@jest/globals'

import {queryScreenState} from '../query-screen-state'

describe('what a screen built on one query shows', () => {
	test('the data it has, even when refreshing it failed, so it works offline', () => {
		expect(queryScreenState({data: ['cached'], isLoading: false, isError: true})).toBe('ready')
	})

	test('a spinner while the first load is under way', () => {
		expect(queryScreenState({data: undefined, isLoading: true, isError: false})).toBe('loading')
	})

	test('the error when the load failed and nothing is cached', () => {
		expect(queryScreenState({data: undefined, isLoading: false, isError: true})).toBe('error')
	})

	test('its own empty or not-found state when the load worked and found nothing', () => {
		expect(queryScreenState({data: undefined, isLoading: false, isError: false})).toBe('ready')
	})
})
