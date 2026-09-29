import {renderHook} from '@testing-library/react-native'

import {track} from '../track'
import {useScreenViews} from '../use-screen-views'

let mockSegments: string[] = []
jest.mock('expo-router', () => ({useSegments: () => mockSegments}))
jest.mock('../track', () => ({track: jest.fn()}))

beforeEach(() => {
	jest.clearAllMocks()
	mockSegments = ['(home)']
})

describe('useScreenViews', () => {
	it('counts the first screen', async () => {
		await renderHook(() => useScreenViews())

		expect(track).toHaveBeenCalledWith({name: 'screen.view', attributes: {route: '/(home)'}})
	})

	it('counts each new screen once', async () => {
		let {rerender} = await renderHook(() => useScreenViews())

		mockSegments = ['(home)', 'Menus']
		await rerender({})
		await rerender({})

		expect(track).toHaveBeenCalledTimes(2)
		expect(track).toHaveBeenLastCalledWith({
			name: 'screen.view',
			attributes: {route: '/(home)/Menus'},
		})
	})
})
