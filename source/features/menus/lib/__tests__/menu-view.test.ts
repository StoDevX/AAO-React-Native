import {describe, expect, test} from '@jest/globals'

import {menuView} from '../menu-view'

const MENU = {name: 'Stav Hall'}
const FAILURE = new Error('HTTP 503')

describe('menuView', () => {
	test('shows a cached menu when its refetch failed', () => {
		expect(menuView({data: MENU, error: FAILURE, isPending: false, isPaused: false})).toEqual({
			kind: 'content',
			data: MENU,
		})
	})

	test('shows a cached menu while its refetch waits for the network', () => {
		expect(menuView({data: MENU, error: null, isPending: false, isPaused: true})).toEqual({
			kind: 'content',
			data: MENU,
		})
	})

	test('is offline when there is nothing cached and the fetch is paused', () => {
		expect(menuView({data: undefined, error: null, isPending: true, isPaused: true})).toEqual({
			kind: 'offline',
		})
	})

	test('is loading while a first fetch runs', () => {
		expect(menuView({data: undefined, error: null, isPending: true, isPaused: false})).toEqual({
			kind: 'loading',
		})
	})

	test('is an error when the fetch failed and nothing is cached', () => {
		expect(menuView({data: undefined, error: FAILURE, isPending: false, isPaused: false})).toEqual({
			kind: 'error',
			error: FAILURE,
		})
	})
})
