import {beforeEach, describe, expect, jest, test} from '@jest/globals'

const mockSteps: string[] = []
const mockStored = {etag: 'old' as string | null}
const mockRunner = {
	exec: jest.fn((sql: string) => void mockSteps.push(sql)),
	run: jest.fn((stmt: {sql: string}) => void mockSteps.push(stmt.sql)),
	all: jest.fn(() => [{name: 'main'}, {name: 'catalog'}]),
	transaction: jest.fn((task: () => void) => task()),
}
const mockCheck = jest.fn((..._args: unknown[]) => void mockSteps.push('check'))
const mockBuild = jest.fn((_runner: unknown, schema: string) => {
	mockSteps.push(`index ${schema}`)
	return 10
})
const mockBump = jest.fn()
const mockDownload = jest.fn((..._args: unknown[]) => {
	mockFiles.incoming.exists = true
	return Promise.resolve()
})
const mockFiles = {
	current: {exists: true, uri: 'file:///docs/course-catalog.db', delete: jest.fn()},
	incoming: {
		exists: false,
		uri: 'file:///docs/course-catalog.next.db',
		delete: jest.fn(),
		move: jest.fn((..._args: unknown[]) => void mockSteps.push('move')),
	},
}

jest.mock('../../client', () => ({getRunner: () => mockRunner}))
jest.mock('../check', () => ({checkCatalog: (...args: unknown[]) => mockCheck(...args)}))
jest.mock('../index-build', () => ({
	buildCourseIndex: (runner: unknown, schema: string) => mockBuild(runner, schema),
	storedEtag: () => mockStored.etag,
	storeEtag: (_runner: unknown, etag: string) => {
		mockStored.etag = etag
		mockSteps.push(`store ${etag}`)
	},
}))
jest.mock('../revision', () => ({bumpCourseRevision: () => mockBump()}))
jest.mock('../catalog-file', () => ({
	catalogFile: () => mockFiles.current,
	incomingCatalogFile: () => mockFiles.incoming,
	filePath: (file: {uri: string}) => file.uri.replace('file://', ''),
}))
jest.mock('expo-file-system', () => ({
	File: {downloadFileAsync: (...args: unknown[]) => mockDownload(...args)},
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

import {refreshCatalog} from '../refresh'

function publishedEtag(etag: string) {
	global.fetch = jest.fn(() =>
		Promise.resolve({
			ok: true,
			status: 200,
			headers: new Headers({etag}),
		}),
	) as unknown as typeof fetch
}

beforeEach(() => {
	jest.clearAllMocks()
	mockSteps.length = 0
	mockCheck.mockImplementation(() => void mockSteps.push('check'))
	mockStored.etag = 'old'
	mockFiles.incoming.exists = false
})

describe('refreshCatalog', () => {
	test('downloads nothing when the ETag is unchanged', async () => {
		publishedEtag('old')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'old', changed: false})
		expect(mockDownload).not.toHaveBeenCalled()
	})

	test('checks and indexes the new file before swapping it in', async () => {
		publishedEtag('new')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'new', changed: true})
		let order = ['check', 'index incoming', 'move', 'store new'].map((step) =>
			mockSteps.indexOf(step),
		)
		expect(order.every((at) => at >= 0)).toBe(true)
		expect(order).toEqual([...order].sort((a, b) => a - b))
		expect(mockBump).toHaveBeenCalledTimes(1)
	})

	// The old file stays in place until the new one replaces it in one move.
	test('replaces the old file in a single move', async () => {
		publishedEtag('new')
		await refreshCatalog()
		expect(mockFiles.incoming.move).toHaveBeenCalledWith(mockFiles.current, {overwrite: true})
		expect(mockFiles.current.delete).not.toHaveBeenCalled()
	})

	test('keeps the old catalog when the new file fails its check', async () => {
		publishedEtag('new')
		mockCheck.mockImplementation(() => {
			throw new Error('The course catalog has no section_full.prerequisites')
		})
		await expect(refreshCatalog()).rejects.toThrow('prerequisites')
		expect(mockFiles.incoming.move).not.toHaveBeenCalled()
		expect(mockFiles.incoming.delete).toHaveBeenCalled()
		expect(mockStored.etag).toBe('old')
		expect(mockBump).not.toHaveBeenCalled()
	})

	test('downloads when no ETag is recorded', async () => {
		publishedEtag('old')
		mockStored.etag = null
		await expect(refreshCatalog()).resolves.toEqual({etag: 'old', changed: true})
		expect(mockDownload).toHaveBeenCalledTimes(1)
	})
})
