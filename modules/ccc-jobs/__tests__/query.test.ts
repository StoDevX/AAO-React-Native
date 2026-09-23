import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest, fetchSourceBody} from '@frogpond/data-sources'
import {jobDetailOptions, jobPostingsOptions, unitPostingsOptions} from '../query'
import {
	UITEST_JOB_CATEGORIES,
	UITEST_JOB_DETAILS,
	UITEST_UNIT_POSTINGS,
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

	test('answers a unit search from the UI-test fixtures', async () => {
		await expect(run(unitPostingsOptions('22005'))).resolves.toEqual(UITEST_UNIT_POSTINGS['22005'])
		expect(UITEST_UNIT_POSTINGS['22005']).toEqual(['uitest-3'])
		expect(fetchSourceBody).not.toHaveBeenCalled()
	})

	test('answers a unit with no fixture postings with none', async () => {
		await expect(run(unitPostingsOptions('99999'))).resolves.toEqual([])
	})

	test('a posting missing from the fixture is an error', async () => {
		await expect(run(jobDetailOptions('not-a-fixture'))).rejects.toThrow('not-a-fixture')
	})
})
