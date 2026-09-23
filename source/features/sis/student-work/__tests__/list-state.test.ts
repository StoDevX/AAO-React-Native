import {listState} from '../lib'

describe('listState', () => {
	test('shows the list while a refetch fails, if there are saved postings', () => {
		expect(listState({isError: true, isLoading: false, isPaused: false, hasPostings: true})).toBe(
			'list',
		)
	})

	test('shows the error when a load fails with nothing saved', () => {
		expect(listState({isError: true, isLoading: false, isPaused: false, hasPostings: false})).toBe(
			'error',
		)
	})

	test('shows the spinner for a first load', () => {
		expect(listState({isError: false, isLoading: true, isPaused: false, hasPostings: false})).toBe(
			'loading',
		)
	})

	test('shows the list once postings arrive', () => {
		expect(listState({isError: false, isLoading: false, isPaused: false, hasPostings: true})).toBe(
			'list',
		)
	})

	test('shows the list, and its empty state, for a board with no postings', () => {
		expect(listState({isError: false, isLoading: false, isPaused: false, hasPostings: false})).toBe(
			'list',
		)
	})

	// Offline with nothing saved, the board waits for a connection; that is
	// not an empty board, and saying "no open job postings" would be false.
	test('says it is offline when the board is waiting for a connection', () => {
		expect(listState({isError: false, isLoading: false, isPaused: true, hasPostings: false})).toBe(
			'offline',
		)
	})

	test('shows saved postings while offline', () => {
		expect(listState({isError: false, isLoading: false, isPaused: true, hasPostings: true})).toBe(
			'list',
		)
	})
})
