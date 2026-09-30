import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest, fetchSourceBody} from '@frogpond/data-sources'
import {jobDetailOptions, jobPostingsOptions, postingUnitsOptions} from '../query'
import {
	UITEST_JOB_CATEGORIES,
	UITEST_JOB_DETAILS,
	UITEST_POSTING_UNITS,
} from '../fixtures/uitest-postings'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

// `scripts/jest-setup.js` mocks `@frogpond/launch-arguments` to
// `isUITesting: true` for every test, so these queries are always in their
// UI-test mode here.

type QueryFn<T> = (context: {signal: AbortSignal}) => Promise<T>

function run<T>(options: {queryFn?: unknown}): Promise<T> {
	let queryFn = options.queryFn as QueryFn<T>
	return queryFn({signal: new AbortController().signal})
}

afterEach(() => {
	jest.clearAllMocks()
})

describe('under UI testing', () => {
	test('the postings are the fixture, without touching the network', async () => {
		await expect(run(jobPostingsOptions)).resolves.toEqual(UITEST_JOB_CATEGORIES)
		expect(fetchManifest).not.toHaveBeenCalled()
		expect(fetchSourceBody).not.toHaveBeenCalled()
	})

	test('every listed posting opens to its fixture detail', async () => {
		for (let job of UITEST_JOB_CATEGORIES.flatMap((category) => category.jobs)) {
			// oxlint-disable-next-line no-await-in-loop
			let detail = await run<{id: string}>(jobDetailOptions(job.id))
			expect(detail).toEqual(UITEST_JOB_DETAILS.find((d) => d.id === job.id))
		}
		expect(fetchSourceBody).not.toHaveBeenCalled()
	})

	test('a posting missing from the fixture is an error', async () => {
		await expect(run(jobDetailOptions('not-a-fixture'))).rejects.toThrow('not-a-fixture')
	})

	test('answers the units map from the UI-test fixtures', async () => {
		await expect(run(postingUnitsOptions)).resolves.toEqual(UITEST_POSTING_UNITS)
		expect(fetchSourceBody).not.toHaveBeenCalled()
	})

	// The extra posting stands for one newer than the server's last hour, so
	// the app has to read its unit from its detail.
	test('the fixture map leaves out the extra posting', () => {
		expect('uitest-extra' in UITEST_POSTING_UNITS).toBe(false)
	})
})

describe('jobPostingsOptions', () => {
	// Every Student Work screen reads the board, so a tap from the landing to a
	// list would refetch it without this.
	test('keeps the board fresh for five minutes', () => {
		expect(jobPostingsOptions.staleTime).toBe(5 * 60 * 1000)
	})
})
