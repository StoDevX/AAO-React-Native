import {describe, expect, test} from '@jest/globals'

import {listState} from '../list-state'

const IDLE = {hasData: false, isError: false, isPending: false, isPaused: false, isOnline: true}

describe('listState', () => {
	test('shows the list while a refetch fails, if there is saved data', () => {
		expect(listState({...IDLE, isError: true, hasData: true})).toBe('list')
	})

	test('shows the error when a load fails with nothing saved', () => {
		expect(listState({...IDLE, isError: true})).toBe('error')
	})

	test('shows the spinner for a first load', () => {
		expect(listState({...IDLE, isPending: true})).toBe('loading')
	})

	test('shows the list once data arrives', () => {
		expect(listState({...IDLE, hasData: true})).toBe('list')
	})

	test('shows the list, and its empty state, when a load finds nothing', () => {
		expect(listState(IDLE)).toBe('list')
	})

	// Offline with nothing saved, the screen waits for a connection; that is
	// not an empty list, and saying there is nothing would be false.
	test('says it is offline when a first load waits for a connection', () => {
		expect(listState({...IDLE, isPending: true, isPaused: true, isOnline: false})).toBe('offline')
	})

	test('shows saved data while offline', () => {
		expect(listState({...IDLE, hasData: true, isPaused: true, isOnline: false})).toBe('list')
	})

	// React Query also pauses a retry while the app is inactive -- Control
	// Centre pulled down, say -- and the device is online the whole time.
	test('keeps loading, not offline, when a first load pauses while online', () => {
		expect(listState({...IDLE, isPending: true, isPaused: true, isOnline: true})).toBe('loading')
	})
})
