import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {reportIconChange} from '../telemetry'
import {useAppIcon} from '../use-app-icon'

/**
 * A stand-in for the native module, following ChangeIcon.mm: it remembers the
 * alternate icon's name, reports "Default" for none, and rejects a change to
 * the icon already set.
 */
let mockAlternateIconName: string | null = null

jest.mock('react-native-change-icon', () => ({
	getIcon: () => Promise.resolve(mockAlternateIconName ?? 'Default'),
	changeIcon: (name: string) => {
		if (name === mockAlternateIconName) {
			return Promise.reject(new Error('IOS:ICON_ALREADY_USED'))
		}
		mockAlternateIconName = name
		return Promise.resolve(true)
	},
	resetIcon: () => {
		mockAlternateIconName = null
		return Promise.resolve(true)
	},
}))

jest.mock('../telemetry', () => ({reportIconChange: jest.fn()}))

beforeEach(() => {
	mockAlternateIconName = null
	jest.clearAllMocks()
})

describe('useAppIcon', () => {
	it('reads the icon iOS has set', async () => {
		mockAlternateIconName = 'windmill-fog'
		let {result} = await renderHook(() => useAppIcon())
		await waitFor(() => expect(result.current.current.type).toBe('windmill-fog'))
	})

	it('applies another icon', async () => {
		let {result} = await renderHook(() => useAppIcon())
		await act(() => result.current.apply('windmill-fog'))
		expect(result.current.current.type).toBe('windmill-fog')
		expect(reportIconChange).toHaveBeenCalledWith('windmill-fog')
	})

	it('does nothing when asked for the icon already set', async () => {
		mockAlternateIconName = 'windmill-fog'
		let {result} = await renderHook(() => useAppIcon())
		await waitFor(() => expect(result.current.current.type).toBe('windmill-fog'))
		await act(() => result.current.apply('windmill-fog'))
		expect(result.current.current.type).toBe('windmill-fog')
		expect(reportIconChange).not.toHaveBeenCalled()
	})
})
