import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import type {SqlRunner, Statement} from '../../sql'
import type {CourseFilters} from '../filters'
import {useCourse, useCourseResults} from '../read'

const mockAll = jest.fn<SqlRunner['all']>()
jest.mock('../../client', () => ({
	getRunner: () => ({all: mockAll, exec: jest.fn(), run: jest.fn(), transaction: jest.fn()}),
}))
jest.mock('../refresh', () => ({
	refreshCatalog: jest.fn(() => Promise.resolve({etag: 'e', changed: false})),
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

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

describe('useCourse', () => {
	test('a course not in the catalog reads as null, not as a failure', async () => {
		catalogWith([])
		let {result} = await renderHook(() => useCourse(7), {wrapper})
		await waitFor(() => expect(result.current.course).toBeNull())
		expect(result.current.failed).toBe(false)
	})
})
