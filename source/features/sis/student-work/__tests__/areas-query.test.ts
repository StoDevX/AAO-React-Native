import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest} from '@frogpond/data-sources'
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
	// No areas would mean no tiles; a stale mapping still draws them.
	test('falls back to the areas the app shipped with when the manifest fails', async () => {
		;(fetchManifest as jest.Mock<() => Promise<never>>).mockRejectedValue(new Error('offline'))
		let areas = await run<Array<{slug: string}>>(studentWorkAreasOptions)
		expect(areas).toHaveLength(16)
		expect(areas[0]?.slug).toBe('dining')
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
