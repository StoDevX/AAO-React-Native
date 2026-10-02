import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {
	fetchManifest,
	fetchSourceBody,
	ID_PROPERTY,
	REL_STUDENT_WAGES,
	type Jrd,
} from '@frogpond/data-sources'
import bundled from '../../../../../docs/student-wages.json'
import {studentWagesOptions} from '../wages-query'

// The live path is the one under test; the suite-wide setup runs as a UI test.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: false}))

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

const MANIFEST = {
	subject: 'https://stolaf.edu',
	links: [
		{
			rel: REL_STUDENT_WAGES,
			href: 'https://stolaf.dev/AAO-React-Native/student-wages.json',
			type: 'application/vnd.frogpond.student-wages+json',
			properties: {[ID_PROPERTY]: 'stolaf'},
		},
	],
} as unknown as Jrd

const PUBLISHED = {
	ST: {1: 12.25, 2: 12.75, 3: 13.25},
	NST: {1: 13.75, 2: 14.75, 3: 15.75},
	OSA: {1: 12.75, 2: 13.5, 3: 14.25},
}

function run<T>(options: {queryFn?: unknown}): Promise<T> {
	let queryFn = options.queryFn as (context: {signal: AbortSignal}) => Promise<T>
	return queryFn({signal: new AbortController().signal})
}

afterEach(() => {
	jest.clearAllMocks()
})

describe('studentWagesOptions', () => {
	test('returns the published wages', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({data: PUBLISHED})
		await expect(run(studentWagesOptions)).resolves.toEqual(PUBLISHED)
	})

	// React Query keeps the wages it already has when a fetch fails, so the
	// shipped copy must not be passed off as the live one.
	test('fails when the wages file cannot be fetched', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<never>>).mockRejectedValue(new Error('offline'))
		await expect(run(studentWagesOptions)).rejects.toThrow('offline')
	})

	test('refuses a wages file missing a tier', async () => {
		;(fetchManifest as jest.Mock<() => Promise<Jrd>>).mockResolvedValue(MANIFEST)
		;(fetchSourceBody as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
			data: {...PUBLISHED, OSA: {1: 12.75, 2: 13.5}},
		})
		await expect(run(studentWagesOptions)).rejects.toThrow()
	})

	test('starts from the wages the app shipped with, already stale', () => {
		let initial = studentWagesOptions.initialData
		let wages = typeof initial === 'function' ? initial() : initial
		expect(wages).toEqual(bundled.data)
		expect(studentWagesOptions.initialDataUpdatedAt).toBe(0)
	})
})
