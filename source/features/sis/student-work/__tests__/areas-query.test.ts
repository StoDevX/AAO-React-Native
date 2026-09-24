import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'
import {studentWorkAreasOptions} from '../areas-query'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

// The live path is the one under test; the suite-wide setup runs as a UI test.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

function run<T>(options: {queryFn?: unknown}): Promise<T> {
	let queryFn = options.queryFn as (context: {signal: AbortSignal}) => Promise<T>
	return queryFn({signal: new AbortController().signal})
}

afterEach(() => {
	jest.clearAllMocks()
})

describe('studentWorkAreasOptions', () => {
	// fetchManifest never rejects -- it falls back to the manifest the app
	// ships -- so the failure that can happen is the areas file itself. It must
	// not pass the shipped copy off as the live one: React Query keeps the
	// areas it already has, shipped or published.
	test('fails when the areas file cannot be fetched', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue({
			links: [],
		} as unknown as Jrd)
		;(fetchSourceBody as jest.Mock<() => Promise<never>>).mockRejectedValue(new Error('offline'))
		await expect(run(studentWorkAreasOptions)).rejects.toThrow('offline')
	})

	// A hand edit or partial deploy that leaves an entry without its units
	// would crash every Student Work screen when counted; refusing it keeps
	// the areas the query already has.
	test('refuses an areas file whose entries are malformed', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue({
			links: [],
		} as unknown as Jrd)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
			data: [{name: 'Music', slug: 'music', icon: 'music.note', gradient: 'purple'}],
		})
		await expect(run(studentWorkAreasOptions)).rejects.toThrow()
	})

	// A query that has never run does not run offline, so a fallback inside
	// the fetch would never be reached; the shipped areas are there from the
	// start instead, and marked stale so the live copy replaces them.
	test('starts from the areas the app shipped with, already stale', () => {
		let initial = studentWorkAreasOptions.initialData
		let areas = typeof initial === 'function' ? initial() : initial
		expect(areas).toHaveLength(16)
		expect(studentWorkAreasOptions.initialDataUpdatedAt).toBe(0)
	})
})
