import type {UseQueryResult} from '@tanstack/react-query'
import {unitResultOf} from '../unit-result'

function result(fields: Partial<UseQueryResult<string[]>>): UseQueryResult<string[]> {
	return {isSuccess: false, isError: false, data: undefined, ...fields} as UseQueryResult<string[]>
}

describe('unitResultOf', () => {
	test('reads a successful search', () => {
		expect(unitResultOf(result({isSuccess: true, data: ['a']}))).toEqual({
			status: 'success',
			ids: ['a'],
		})
	})

	// React Query keeps a query's data when a later refetch fails; a flaky
	// connection must not throw away postings the app already has.
	test('keeps the postings a search had when a refetch fails', () => {
		expect(unitResultOf(result({isError: true, data: ['a']}))).toEqual({
			status: 'success',
			ids: ['a'],
		})
	})

	test('calls a search failed only when it has nothing', () => {
		expect(unitResultOf(result({isError: true}))).toEqual({status: 'error'})
	})

	test('calls a search with nothing yet pending', () => {
		expect(unitResultOf(result({}))).toEqual({status: 'pending'})
		expect(unitResultOf(undefined)).toEqual({status: 'pending'})
	})
})
