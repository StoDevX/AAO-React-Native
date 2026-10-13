import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'
import {studentWorkAreasOptions} from '../areas-query'

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
	// ships -- so the failure that can happen is the areas file itself.
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

	test('has no areas until they are fetched', () => {
		expect(studentWorkAreasOptions.initialData).toBeUndefined()
	})
})
