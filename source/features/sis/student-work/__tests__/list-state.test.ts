import {listState} from '../lib'

describe('listState', () => {
	test('shows the list while a refetch fails, if there are saved postings', () => {
		expect(listState({isError: true, isLoading: false, hasPostings: true})).toBe('list')
	})

	test('shows the error when a load fails with nothing saved', () => {
		expect(listState({isError: true, isLoading: false, hasPostings: false})).toBe('error')
	})

	test('shows the spinner for a first load', () => {
		expect(listState({isError: false, isLoading: true, hasPostings: false})).toBe('loading')
	})

	test('shows the list once postings arrive', () => {
		expect(listState({isError: false, isLoading: false, hasPostings: true})).toBe('list')
	})

	test('shows the list, and its empty state, for a board with no postings', () => {
		expect(listState({isError: false, isLoading: false, hasPostings: false})).toBe('list')
	})
})
