import React, {ReactElement} from 'react'
import {describe, expect, test} from '@jest/globals'
import {renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {useFeature} from '../index'
import {AppConfigEntry} from '../types'

jest.mock('../../../modules/constants', () => ({
	isDevMode: jest.fn(),
}))

jest.mock('../../../source/lib/storage', () => ({
	getFeatureFlag: jest.fn(),
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

	 
	const isDevModeMock = require('../../../modules/constants').isDevMode
	const getFeatureFlagMock =
		 
		require('../../../source/lib/storage').getFeatureFlag

	test('it should return true in dev when feature is enabled', async () => {
		isDevModeMock.mockReturnValue(true)
		getFeatureFlagMock.mockReturnValue(true)

		const {result} = renderHook(
			() => useFeature(AppConfigEntry.Courses_ShowRecentSearchScreen),
			{
				wrapper: queryWrapper,
			},
		)

		await waitFor(() => {
			expect(result.current).toBe(true)
		})
	})

	test('it should return false in dev when feature is disabled', async () => {
		isDevModeMock.mockReturnValue(true)
		getFeatureFlagMock.mockReturnValue(false)

		const {result} = renderHook(
			() => useFeature(AppConfigEntry.Courses_ShowRecentSearchScreen),
			{
				wrapper: queryWrapper,
			},
		)

		await waitFor(() => {
			expect(result.current).toBe(false)
		})
	})
})
