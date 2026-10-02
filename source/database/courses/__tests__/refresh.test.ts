import {beforeEach, describe, expect, jest, test} from '@jest/globals'

const mockSteps: string[] = []
const mockStored = {etag: 'old' as string | null, failToStore: false}
const mockRunner = {
	exec: jest.fn((sql: string) => void mockSteps.push(sql)),
	run: jest.fn((stmt: {sql: string}) => void mockSteps.push(stmt.sql)),
	all: jest.fn(() => [{name: 'main'}, {name: 'catalog'}]),
	transaction: jest.fn((task: () => void) => task()),
}
const mockCheck = jest.fn((..._args: unknown[]) => void mockSteps.push('check'))
const mockBuild = jest.fn(function* (_runner: unknown, schema: string) {
	mockSteps.push(`index ${schema}`)
	yield 1000
	mockSteps.push('index batch 2')
	yield 1500
})
const mockBump = jest.fn()
const CURRENT = 'file:///docs/course-catalog.db'
const INCOMING = 'file:///docs/course-catalog.next.db'

/**
 * Files on disk, by uri, and every uri deleted. A stand-in `File` behaves as
 * expo-file-system 57's does: `exists` reads the disk, and moving one points
 * that same object at its destination.
 */
const mockDisk = {files: new Set<string>(), deleted: [] as string[]}
function mockFile(start: string) {
	let file = {
		uri: start,
		get exists() {
			return mockDisk.files.has(file.uri)
		},
		delete: jest.fn(() => {
			mockDisk.files.delete(file.uri)
			mockDisk.deleted.push(file.uri)
		}),
		write: jest.fn((_bytes: Uint8Array) => {
			mockDisk.files.add(file.uri)
		}),
		moveSync: jest.fn((destination: {uri: string}, _options?: unknown) => {
			mockDisk.files.delete(file.uri)
			mockDisk.files.add(destination.uri)
			file.uri = destination.uri
			mockSteps.push('move')
		}),
		move: jest.fn(async (destination: {uri: string}, options?: unknown) => {
			await Promise.resolve()
			file.moveSync(destination, options)
		}),
	}
	return file
}
const mockMoves: Array<ReturnType<typeof mockFile>> = []
/** Each catalog body read from the network: a whole download. */
const mockDownload = jest.fn()

jest.mock('../../client', () => ({getRunner: () => mockRunner}))
jest.mock('../check', () => ({checkCatalog: (...args: unknown[]) => mockCheck(...args)}))
jest.mock('../index-build', () => ({
	// The real check, read through the stand-in runner.
	isAttached: jest.requireActual<{isAttached: unknown}>('../index-build').isAttached,
	courseIndexBatches: (runner: unknown, schema: string) => mockBuild(runner, schema),
	storedEtag: () => mockStored.etag,
	storeEtag: (_runner: unknown, _schema: string, etag: string) => {
		if (mockStored.failToStore) throw new Error('disk full')
		mockStored.etag = etag
		mockSteps.push(`store ${etag}`)
	},
}))
jest.mock('../revision', () => ({bumpCourseRevision: () => mockBump()}))
jest.mock('../catalog-file', () => ({
	catalogFile: () => mockFile(CURRENT),
	incomingCatalogFile: () => {
		let file = mockFile(INCOMING)
		mockMoves.push(file)
		return file
	},
	filePath: (file: {uri: string}) => file.uri.replace('file://', ''),
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

type RefreshModule = typeof import('../refresh')
// Loaded fresh for each test: the module remembers rejected files and the
// refresh under way, which must not leak from one test into the next.
let refreshCatalog: RefreshModule['refreshCatalog']
let shouldRetryCatalog: RefreshModule['shouldRetryCatalog']
let CatalogRejectedError: RefreshModule['CatalogRejectedError']

/** Every request the refresh made, by its headers. */
let mockRequests: Array<Record<string, string>> = []

/**
 * The server publishes a file with `etag`, and answers a request for the copy
 * it already has with 304 unless `ignoresIfNoneMatch`.
 */
function publishedEtag(etag: string, {ignoresIfNoneMatch = false} = {}) {
	global.fetch = jest.fn((_url: unknown, init?: {headers?: Record<string, string>}) => {
		let headers = init?.headers ?? {}
		mockRequests.push(headers)
		let known = (headers['If-None-Match'] ?? '').split(', ')
		if (!ignoresIfNoneMatch && known.includes(etag)) {
			return Promise.resolve({ok: false, status: 304, headers: new Headers({etag})})
		}
		return Promise.resolve({
			ok: true,
			status: 200,
			headers: new Headers({etag}),
			arrayBuffer: () => {
				mockDownload()
				return Promise.resolve(new ArrayBuffer(8))
			},
		})
	}) as unknown as typeof fetch
}

beforeEach(() => {
	jest.isolateModules(() => {
		;({refreshCatalog, shouldRetryCatalog, CatalogRejectedError} =
			jest.requireActual<RefreshModule>('../refresh'))
	})
	jest.clearAllMocks()
	mockRunner.run.mockImplementation(
		(statement: {sql: string}) => void mockSteps.push(statement.sql),
	)
	mockSteps.length = 0
	mockCheck.mockImplementation(() => void mockSteps.push('check'))
	mockStored.etag = 'old'
	mockStored.failToStore = false
	mockDisk.files = new Set([CURRENT])
	mockDisk.deleted = []
	mockMoves.length = 0
	mockRequests = []
})

describe('refreshCatalog', () => {
	test('downloads nothing when the ETag is unchanged', async () => {
		publishedEtag('old')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'old', changed: false})
		expect(mockDownload).not.toHaveBeenCalled()
	})

	test('asks the server only for a file newer than the one it has', async () => {
		publishedEtag('old')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'old', changed: false})
		expect(mockRequests).toEqual([{'If-None-Match': 'old'}])
		expect(mockDownload).not.toHaveBeenCalled()
	})

	test('downloads nothing new from a server that ignores If-None-Match', async () => {
		publishedEtag('old', {ignoresIfNoneMatch: true})
		await expect(refreshCatalog()).resolves.toEqual({etag: 'old', changed: false})
		expect(mockDownload).not.toHaveBeenCalled()
	})

	// One response carries both the file and its ETag, so a republish between
	// two requests cannot pair the new ETag with the old file.
	test('makes one request for a changed file', async () => {
		publishedEtag('new')
		await refreshCatalog()
		expect(mockRequests).toHaveLength(1)
		expect(mockDownload).toHaveBeenCalledTimes(1)
	})

	test('checks and indexes the new file before swapping it in', async () => {
		publishedEtag('new')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'new', changed: true})
		let order = ['check', 'index incoming', 'store new', 'move'].map((step) =>
			mockSteps.indexOf(step),
		)
		expect(order.every((at) => at >= 0)).toBe(true)
		expect(order).toEqual([...order].sort((a, b) => a - b))
		expect(mockBump).toHaveBeenCalledTimes(1)
	})

	// The old file stays in place until the new one replaces it in one move.
	// Attaching before the move lands opens an empty file at that path, and the
	// connection keeps it after the move replaces it.
	test('attaches the new file only once its move has finished', async () => {
		publishedEtag('new')
		await refreshCatalog()
		let moved = mockSteps.indexOf('move')
		let attached = mockSteps.findIndex((step) => step.includes('attach database ? as catalog'))
		expect(moved).toBeGreaterThanOrEqual(0)
		expect(attached).toBeGreaterThan(moved)
	})

	test('replaces the old file in a single move', async () => {
		publishedEtag('new')
		await refreshCatalog()
		let [incoming] = mockMoves
		expect(incoming?.moveSync).toHaveBeenCalledWith(expect.objectContaining({uri: CURRENT}), {
			overwrite: true,
		})
		expect(mockDisk.deleted).not.toContain(CURRENT)
	})

	test('keeps the old catalog when the new file fails its check', async () => {
		publishedEtag('new')
		mockCheck.mockImplementation(() => {
			throw new Error('The course catalog has no section_full.prerequisites')
		})
		await expect(refreshCatalog()).rejects.toThrow('prerequisites')
		expect(mockSteps).not.toContain('move')
		expect(mockDisk.files.has(INCOMING)).toBe(false)
		expect(mockDisk.files.has(CURRENT)).toBe(true)
		expect(mockStored.etag).toBe('old')
		expect(mockBump).not.toHaveBeenCalled()
	})

	test('downloads when no ETag is recorded', async () => {
		publishedEtag('old')
		mockStored.etag = null
		await expect(refreshCatalog()).resolves.toEqual({etag: 'old', changed: true})
		expect(mockDownload).toHaveBeenCalledTimes(1)
	})

	// A download cut short, or a page of HTML from a misconfigured server, is
	// not a database at all, and SQLite refuses to attach it.
	test('keeps the old catalog when the download is not a database', async () => {
		publishedEtag('new')
		mockRunner.run.mockImplementationOnce((statement: {sql: string}) => {
			mockSteps.push(statement.sql)
			if (statement.sql.includes('as incoming')) throw new Error('file is not a database')
		})
		await expect(refreshCatalog()).rejects.toThrow('file is not a database')
		expect(mockDisk.files.has(CURRENT)).toBe(true)
		expect(mockDisk.files.has(INCOMING)).toBe(false)
		expect(mockSteps).not.toContain('move')
	})

	// Unlike a file that fails its check, a broken download may be fine next time.
	test('tries again after a download that would not open', async () => {
		publishedEtag('new')
		mockRunner.run.mockImplementationOnce(() => {
			throw new Error('file is not a database')
		})
		await expect(refreshCatalog()).rejects.toThrow('file is not a database')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'new', changed: true})
	})

	test('keeps the old catalog when recording the download fails', async () => {
		publishedEtag('new')
		mockStored.failToStore = true
		await expect(refreshCatalog()).rejects.toThrow('disk full')
		expect(mockSteps).not.toContain('move')
		expect(mockDisk.files.has(CURRENT)).toBe(true)
	})

	// The move repoints the incoming file at the catalog's own path, so a
	// failure after it must not clean up "incoming" by that object.
	test('keeps the swapped-in catalog when attaching it fails', async () => {
		publishedEtag('new')
		mockRunner.run.mockImplementation((statement: {sql: string}) => {
			mockSteps.push(statement.sql)
			if (statement.sql.includes('as catalog')) throw new Error('database is locked')
		})
		await expect(refreshCatalog()).rejects.toThrow('database is locked')
		expect(mockDisk.files.has(CURRENT)).toBe(true)
		expect(mockDisk.deleted).not.toContain(CURRENT)
		mockRunner.run.mockImplementation(
			(statement: {sql: string}) => void mockSteps.push(statement.sql),
		)
	})

	// Building the index takes most of a second; the app keeps running between batches.
	test('lets the app run between index batches', async () => {
		publishedEtag('new')
		let refreshing = refreshCatalog()
		setTimeout(() => mockSteps.push('app'), 0)
		await refreshing
		let at = (step: string) => mockSteps.indexOf(step)
		expect(at('index incoming')).toBeLessThan(at('app'))
		expect(at('app')).toBeLessThan(at('index batch 2'))
	})

	// Leaving course search mid-download and coming back starts a second
	// refresh; both would download into, attach and move the same file.
	test('runs one refresh at a time', async () => {
		publishedEtag('new')
		let [first, second] = await Promise.all([refreshCatalog(), refreshCatalog()])
		expect(mockDownload).toHaveBeenCalledTimes(1)
		expect(first).toEqual(second)
	})

	// A publish that fails the check fails it every time.
	test('does not download a file it has already rejected', async () => {
		publishedEtag('bad')
		mockCheck.mockImplementation(() => {
			throw new Error('The course catalog has no section_full.prerequisites')
		})
		await expect(refreshCatalog()).rejects.toThrow(CatalogRejectedError)
		await expect(refreshCatalog()).rejects.toThrow(CatalogRejectedError)
		// React Native's fetch reads a whole response before resolving, so only
		// asking for something else spares the second download.
		expect(mockRequests[1]?.['If-None-Match']?.split(', ')).toContain('bad')
		expect(mockDownload).toHaveBeenCalledTimes(1)
	})

	// A full disk or an I/O error says nothing about the file, which may index
	// fine next time.
	test('tries the same file again after its index build fails', async () => {
		publishedEtag('new')
		mockBuild.mockImplementationOnce(() => {
			throw new Error('database or disk is full')
		})
		await expect(refreshCatalog()).rejects.toThrow('database or disk is full')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'new', changed: true})
		expect(mockDownload).toHaveBeenCalledTimes(2)
	})

	test('tries a newly published file after rejecting the last', async () => {
		publishedEtag('bad')
		mockCheck.mockImplementationOnce(() => {
			throw new Error('The course catalog has no sections')
		})
		await expect(refreshCatalog()).rejects.toThrow(CatalogRejectedError)
		publishedEtag('fixed')
		await expect(refreshCatalog()).resolves.toEqual({etag: 'fixed', changed: true})
	})
})

describe('shouldRetryCatalog', () => {
	test('retries a failed download a few times', () => {
		expect(shouldRetryCatalog(0, new Error('Network request failed'))).toBe(true)
		expect(shouldRetryCatalog(3, new Error('Network request failed'))).toBe(false)
	})

	test('never retries a file it rejected', () => {
		expect(shouldRetryCatalog(0, new CatalogRejectedError('bad', 'no sections'))).toBe(false)
	})
})
