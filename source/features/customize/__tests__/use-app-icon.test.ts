import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {useAppIcon} from '../use-app-icon'

/**
 * A stand-in for the native module, following ChangeIcon.mm: it remembers the
 * alternate icon's name, reports "Default" for none, and rejects a change to
 * the icon already set, or one iOS refuses.
 */
let mockAlternateIconName: string | null = null
let mockRefusesChanges = false

jest.mock('react-native-change-icon', () => ({
	getIcon: () => Promise.resolve(mockAlternateIconName ?? 'Default'),
	changeIcon: (name: string) => {
		if (name === mockAlternateIconName) {
			return Promise.reject(new Error('IOS:ICON_ALREADY_USED'))
		}
		if (mockRefusesChanges) {
			return Promise.reject(new Error('The operation was cancelled.'))
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
	mockRefusesChanges = false
	jest.clearAllMocks()
})

describe('useAppIcon', () => {
	it('reads the icon iOS has set', async () => {
		mockAlternateIconName = 'windmill-dawn'
		let {result} = await renderHook(() => useAppIcon())
		await waitFor(() => expect(result.current.current.type).toBe('windmill-dawn'))
	})

	it('applies another icon', async () => {
		let {result} = await renderHook(() => useAppIcon())
		await act(() => result.current.apply('windmill-dawn'))
		expect(result.current.current.type).toBe('windmill-dawn')
	})

	it('keeps showing the icon iOS kept when it refuses a change', async () => {
		mockRefusesChanges = true
		let {result} = await renderHook(() => useAppIcon())
		await act(() => result.current.apply('windmill-dawn'))
		expect(result.current.current.type).toBe('windmill')
	})

	it('does nothing when asked for the icon already set', async () => {
		mockAlternateIconName = 'windmill-dawn'
		let {result} = await renderHook(() => useAppIcon())
		await waitFor(() => expect(result.current.current.type).toBe('windmill-dawn'))
		await act(() => result.current.apply('windmill-dawn'))
		expect(result.current.current.type).toBe('windmill-dawn')
	})
})
