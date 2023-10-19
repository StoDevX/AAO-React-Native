import React, {ReactElement} from 'react'
import {describe, expect, test} from '@jest/globals'
import {renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {useCourseSearchRecentsScreen} from '../index'

jest.mock('../../../source/lib/storage', () => ({
	getFeatureFlag: jest.fn(),
}))

jest.mock('@frogpond/constants', () => ({
	isDevMode: jest.fn(),
}))

describe('useCourseSearchRecentsScreen', () => {
	let queryClient: QueryClient

	beforeAll(() => {
		queryClient = new QueryClient()
	})

	afterAll(() => {
		queryClient.clear()
		queryClient.removeQueries()
	})

	const queryWrapper = ({children}: {children: ReactElement}) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const isDevModeMock = require('@frogpond/constants').isDevMode

	const getFeatureFlagMock =
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require('../../../source/lib/storage').getFeatureFlag

	test('it should return true in dev when feature is enabled', async () => {
		isDevModeMock.mockReturnValue(true)
		getFeatureFlagMock.mockReturnValue(true)

		const {result} = renderHook(() => useCourseSearchRecentsScreen(), {
			wrapper: queryWrapper,
		})

		await waitFor(() => {
			expect(result.current).toBe(true)
		})
	})

	test('it should return false in prod when feature is enabled', async () => {
		isDevModeMock.mockReturnValue(false)
		getFeatureFlagMock.mockReturnValue(true)

		const {result} = renderHook(() => useCourseSearchRecentsScreen(), {
			wrapper: queryWrapper,
		})

		await waitFor(() => {
			expect(result.current).toBe(false)
		})
	})
})
