import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {useFilters} from '../build-filters'

const mockCatalog = {
	isPending: false,
	isFetching: false,
	isPaused: false,
	error: null,
	refetch: jest.fn(),
}
jest.mock('../../../../../database/courses/read', () => ({
	useCourseCatalog: () => mockCatalog,
	useCourseFilterOptions: () => ({terms: [], gereqs: [], departments: []}),
}))

afterEach(() => {
	Object.assign(mockCatalog, {isPending: false, isFetching: false, isPaused: false})
})

describe('useFilters before the first catalog', () => {
	test('waits while the catalog is downloading', async () => {
		Object.assign(mockCatalog, {isPending: true, isFetching: true})
		let {result} = await renderHook(() => useFilters())
		expect(result.current.isLoading).toBe(true)
	})

	// Offline, the download is paused rather than running, and a spinner would
	// never end: the search screens say Offline instead.
	test('does not wait on a download that is paused for a connection', async () => {
		Object.assign(mockCatalog, {isPending: true, isFetching: false, isPaused: true})
		let {result} = await renderHook(() => useFilters())
		expect(result.current.isLoading).toBe(false)
	})
})
