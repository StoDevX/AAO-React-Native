import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {useSwipeBackHold} from '../swipe-back-hold'

/** Whether the swipe was last switched on, from the calls the hook made. */
function lastSetting(setEnabled: jest.Mock<(enabled: boolean) => void>): boolean | undefined {
	return setEnabled.mock.lastCall?.[0]
}

describe('useSwipeBackHold', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	test('holds the swipe off for 2s after the screen opens', async () => {
		let setEnabled = jest.fn<(enabled: boolean) => void>()
		await renderHook(() => useSwipeBackHold(setEnabled))

		expect(lastSetting(setEnabled)).toBe(false)
		await act(() => jest.advanceTimersByTime(1999))
		expect(lastSetting(setEnabled)).toBe(false)
		await act(() => jest.advanceTimersByTime(1))
		expect(lastSetting(setEnabled)).toBe(true)
	})

	test('holds it off again for 2s from each settle', async () => {
		let setEnabled = jest.fn<(enabled: boolean) => void>()
		let {result} = await renderHook(() => useSwipeBackHold(setEnabled))
		await act(() => jest.advanceTimersByTime(2000))

		await act(() => result.current.settle())
		expect(lastSetting(setEnabled)).toBe(false)
		await act(() => jest.advanceTimersByTime(1500))
		await act(() => result.current.settle())
		await act(() => jest.advanceTimersByTime(1500))
		expect(lastSetting(setEnabled)).toBe(false)
		await act(() => jest.advanceTimersByTime(500))
		expect(lastSetting(setEnabled)).toBe(true)
	})

	test('keeps it off while held, however long, until it settles', async () => {
		let setEnabled = jest.fn<(enabled: boolean) => void>()
		let {result} = await renderHook(() => useSwipeBackHold(setEnabled))

		await act(() => result.current.hold())
		await act(() => jest.advanceTimersByTime(10_000))
		expect(lastSetting(setEnabled)).toBe(false)

		await act(() => result.current.settle())
		await act(() => jest.advanceTimersByTime(2000))
		expect(lastSetting(setEnabled)).toBe(true)
	})

	test('gives the swipe back when the screen goes away', async () => {
		let setEnabled = jest.fn<(enabled: boolean) => void>()
		let {unmount} = await renderHook(() => useSwipeBackHold(setEnabled))

		await act(() => unmount())
		expect(lastSetting(setEnabled)).toBe(true)
		setEnabled.mockClear()
		await act(() => jest.advanceTimersByTime(5000))
		expect(setEnabled).not.toHaveBeenCalled()
	})
})
