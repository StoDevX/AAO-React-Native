import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {onlineManager} from '@tanstack/react-query'

import {courseListState} from '../list-state'

const READY = {isError: false, isPending: false, isPaused: false}
const NO_CATALOG = {hasCatalog: false, isPending: false, failed: false}

afterEach(() => {
	jest.restoreAllMocks()
})

describe('courseListState', () => {
	test('shows stored courses even when the refresh failed', () => {
		expect(courseListState({...READY, isError: true}, {...NO_CATALOG, hasCatalog: true})).toBe(
			'list',
		)
	})

	test('shows the error when the first download failed', () => {
		expect(courseListState({...READY, isError: true}, NO_CATALOG)).toBe('error')
	})

	test('waits for the first download', () => {
		expect(courseListState({...READY, isPending: true}, NO_CATALOG)).toBe('loading')
	})

	test('says offline when the first download is paused without a connection', () => {
		jest.spyOn(onlineManager, 'isOnline').mockReturnValue(false)
		expect(courseListState({...READY, isPending: true, isPaused: true}, NO_CATALOG)).toBe('offline')
	})

	test('shows a failed read as an error', () => {
		expect(courseListState(READY, {...NO_CATALOG, failed: true})).toBe('error')
	})
})
