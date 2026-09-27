import {describe, expect, jest, test} from '@jest/globals'
import {fetchSourceBody} from '@frogpond/data-sources'
import {FIXED_WAGES} from '../fixed-wages'
import {studentWagesOptions} from '../wages-query'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

// uitests/ assert exact wages, so a UI-test launch must not see a rate the
// monthly scrape changed.
describe('studentWagesOptions in a UI test', () => {
	test('starts from and returns the fixed wages without fetching', async () => {
		let initial = studentWagesOptions.initialData
		expect(typeof initial === 'function' ? initial() : initial).toBe(FIXED_WAGES)

		let queryFn = studentWagesOptions.queryFn as (c: {signal: AbortSignal}) => Promise<unknown>
		await expect(queryFn({signal: new AbortController().signal})).resolves.toBe(FIXED_WAGES)
		expect(fetchSourceBody).not.toHaveBeenCalled()
	})
})
