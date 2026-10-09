import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {campusById} from '../../../campuses'
import {switchIconForCampus, useAppIcon} from '../use-app-icon'

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

describe('switchIconForCampus', () => {
	it('wears the penguin on choosing Carleton', async () => {
		mockAlternateIconName = 'windmill-sky'
		await switchIconForCampus(campusById('edu.carleton'))
		expect(mockAlternateIconName).toBe('carls-penguin')
	})

	it('goes back to the primary on choosing St. Olaf', async () => {
		mockAlternateIconName = 'carls-penguin'
		await switchIconForCampus(campusById('edu.stolaf'))
		expect(mockAlternateIconName).toBeNull()
	})

	it("leaves an icon of the campus's own alone", async () => {
		mockAlternateIconName = 'old-main'
		await switchIconForCampus(campusById('edu.stolaf'))
		expect(mockAlternateIconName).toBe('old-main')
	})

	it('ends on the campus chosen last, however quickly the choices come', async () => {
		let toCarleton = switchIconForCampus(campusById('edu.carleton'))
		let backToStOlaf = switchIconForCampus(campusById('edu.stolaf'))
		await Promise.all([toCarleton, backToStOlaf])
		expect(mockAlternateIconName).toBeNull()
	})

	it('keeps the icon iOS refuses to change, without throwing', async () => {
		mockRefusesChanges = true
		await expect(switchIconForCampus(campusById('edu.carleton'))).resolves.toBeUndefined()
		expect(mockAlternateIconName).toBeNull()
	})
})
