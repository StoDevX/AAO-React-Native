import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {onlineManager} from '@tanstack/react-query'

import {courseDetailState, courseListState} from '../list-state'

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

describe('courseDetailState', () => {
	const COURSE = {name: 'Abstract Algebra'}
	const CATALOG = {isError: false, isPending: false, isPaused: false}

	test('shows a stored course whatever the catalog is doing', () => {
		expect(courseDetailState(COURSE, false, {...CATALOG, isError: true})).toBe('course')
	})

	test('waits while the course is being read', () => {
		expect(courseDetailState(undefined, false, CATALOG)).toBe('loading')
	})

	test('waits for the first catalog download', () => {
		expect(courseDetailState(null, false, {...CATALOG, isPending: true})).toBe('loading')
	})

	// Offline with no catalog, the download is paused, not running, and a
	// spinner would never end.
	test('says offline when the first download is paused without a connection', () => {
		jest.spyOn(onlineManager, 'isOnline').mockReturnValue(false)
		expect(courseDetailState(null, false, {...CATALOG, isPending: true, isPaused: true})).toBe(
			'offline',
		)
	})

	test('shows the download error when there is no catalog', () => {
		expect(courseDetailState(null, false, {...CATALOG, isError: true})).toBe('catalog-error')
	})

	test('shows a failed read as an error', () => {
		expect(courseDetailState(undefined, true, CATALOG)).toBe('read-error')
	})

	test('says not found when the catalog has no such course', () => {
		expect(courseDetailState(null, false, CATALOG)).toBe('not-found')
	})
})
