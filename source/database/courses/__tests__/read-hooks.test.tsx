import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import type {SqlRunner, Statement} from '../../sql'
import type {CourseFilters} from '../filters'
import {COURSE_PAGE_SIZE, useCourse, useCourseResults} from '../read'

const mockAll = jest.fn<SqlRunner['all']>()
jest.mock('../../client', () => ({
	getRunner: () => ({all: mockAll, exec: jest.fn(), run: jest.fn(), transaction: jest.fn()}),
}))
jest.mock('../refresh', () => ({
	refreshCatalog: jest.fn(() => Promise.resolve({etag: 'e', changed: false})),
}))

const NONE: CourseFilters = {
	terms: [20261],
	spaceAvailable: false,
	openOnly: false,
	labOnly: false,
	departments: [],
	levels: [],
	gereqs: [],
	gereqMode: 'AND',
}

/** Answers the "is a catalog attached with sections" reads, and `rows` for anything else. */
function catalogWith(rows: unknown[]) {
	mockAll.mockImplementation(((stmt: Statement) => {
		if (stmt.sql.includes('pragma_database_list')) return [{name: 'main'}, {name: 'catalog'}]
		if (stmt.sql.includes('limit 1')) return [{n: 1}]
		return rows
	}) as SqlRunner['all'])
}

const clients: QueryClient[] = []
function wrapper({children}: {children: React.ReactNode}) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	clients.push(client)
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

afterEach(() => {
	for (let client of clients) client.clear()
	clients.length = 0
	mockAll.mockReset()
})

describe('useCourseResults', () => {
	test('groups the rows by term', async () => {
		catalogWith([
			{
				clbid: 1,
				term: 20261,
				department: 'MATH',
				number: 1,
				section: null,
				status: 'O',
				name: 'A',
				title: null,
				notes: null,
				gereqs: null,
				instructors: null,
			},
		])
		let {result} = await renderHook(() => useCourseResults({query: '', filters: NONE}), {wrapper})
		await waitFor(() => expect(result.current.isPending).toBe(false))
		expect(result.current.hasCatalog).toBe(true)
		expect(result.current.sections.map((section) => section.title)).toEqual(['20261'])
	})

	test('says there is no catalog before the first download', async () => {
		mockAll.mockImplementation((() => [{name: 'main'}]) as SqlRunner['all'])
		let {result} = await renderHook(() => useCourseResults({query: '', filters: NONE}), {wrapper})
		await waitFor(() => expect(result.current.isPending).toBe(false))
		expect(result.current.hasCatalog).toBe(false)
	})

	test('reports a read that throws as failed', async () => {
		mockAll.mockImplementation(() => {
			throw new Error('disk I/O error')
		})
		let {result} = await renderHook(() => useCourseResults({query: '', filters: NONE}), {wrapper})
		await waitFor(() => expect(result.current.failed).toBe(true))
	})
})

/** A results row for clbid `n`. */
function row(n: number) {
	return {
		clbid: n,
		term: 20261,
		department: 'MATH',
		number: n,
		section: null,
		status: 'O',
		name: `C${n}`,
		title: null,
		notes: null,
		gereqs: null,
		instructors: null,
	}
}

// Until the filter options load there are no terms to search, and reading
// then would report no results for a catalog that has plenty.
describe('waiting for the filter options', () => {
	test('does not read results while told to wait', async () => {
		catalogWith([row(1)])
		let {result} = await renderHook(
			() => useCourseResults({query: '', filters: {...NONE, terms: []}, enabled: false}),
			{wrapper},
		)
		expect(result.current.isPending).toBe(true)
		expect(result.current.sections).toEqual([])
		expect(mockAll).not.toHaveBeenCalled()
	})
})

// A read that failed against an unchanged catalog keeps its query key, so
// refreshing the catalog alone would never run it again.
describe('retrying a failed read', () => {
	test('runs the results read again', async () => {
		mockAll.mockImplementationOnce(() => {
			throw new Error('disk I/O error')
		})
		let {result} = await renderHook(() => useCourseResults({query: '', filters: NONE}), {wrapper})
		await waitFor(() => expect(result.current.failed).toBe(true))

		catalogWith([row(1)])
		await act(() => {
			result.current.retry()
		})
		await waitFor(() => expect(result.current.failed).toBe(false))
		expect(result.current.sections[0]?.data).toHaveLength(1)
	})

	test('runs the course read again', async () => {
		mockAll.mockImplementationOnce(() => {
			throw new Error('disk I/O error')
		})
		let {result} = await renderHook(() => useCourse(7), {wrapper})
		await waitFor(() => expect(result.current.failed).toBe(true))

		catalogWith([])
		await act(() => {
			result.current.retry()
		})
		await waitFor(() => expect(result.current.course).toBeNull())
		expect(result.current.failed).toBe(false)
	})
})

describe('useCourseResults: pages', () => {
	test('reads a page at a time, and the next one when asked', async () => {
		mockAll.mockImplementation(((stmt: Statement) => {
			if (stmt.sql.includes('pragma_database_list')) return [{name: 'main'}, {name: 'catalog'}]
			if (stmt.sql.includes('limit 1)')) return [{n: 1}]
			let [limit = 0, offset = 0] = stmt.params.slice(-2) as number[]
			// One full page, then one more course.
			let total = COURSE_PAGE_SIZE + 1
			return Array.from({length: Math.max(0, Math.min(limit, total - offset))}, (_, i) =>
				row(offset + i + 1),
			)
		}) as SqlRunner['all'])

		let {result} = await renderHook(() => useCourseResults({query: '', filters: NONE}), {wrapper})
		await waitFor(() => expect(result.current.isPending).toBe(false))
		expect(result.current.sections[0]?.data).toHaveLength(COURSE_PAGE_SIZE)
		expect(result.current.hasMore).toBe(true)

		await act(() => {
			result.current.loadMore()
		})
		await waitFor(() => expect(result.current.sections[0]?.data).toHaveLength(COURSE_PAGE_SIZE + 1))
		expect(result.current.hasMore).toBe(false)
	})
})

describe('useCourse', () => {
	test('a course not in the catalog reads as null, not as a failure', async () => {
		catalogWith([])
		let {result} = await renderHook(() => useCourse(7), {wrapper})
		await waitFor(() => expect(result.current.course).toBeNull())
		expect(result.current.failed).toBe(false)
	})
})
