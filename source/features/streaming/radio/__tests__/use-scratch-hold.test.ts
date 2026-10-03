import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {useScratchHold} from '../player-view/use-scratch-hold'

describe('useScratchHold', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})
	afterEach(() => {
		jest.useRealTimers()
	})

	test('is off while the sheet is closed', async () => {
		let {result} = await renderHook(() => useScratchHold(false))
		expect(result.current.held).toBe(false)
	})

	test('holds for 2s after the sheet opens', async () => {
		let {result, rerender} = await renderHook(({open}: {open: boolean}) => useScratchHold(open), {
			initialProps: {open: false},
		})
		await act(() => rerender({open: true}))
		expect(result.current.held).toBe(true)

		await act(() => jest.advanceTimersByTime(1999))
		expect(result.current.held).toBe(true)

		await act(() => jest.advanceTimersByTime(1))
		expect(result.current.held).toBe(false)
	})

	test('holds while a finger is down, and for 2s after it lifts', async () => {
		let {result} = await renderHook(() => useScratchHold(true))
		await act(() => jest.advanceTimersByTime(2000))
		expect(result.current.held).toBe(false)

		await act(() => result.current.onHeldChange(true))
		await act(() => jest.advanceTimersByTime(10_000))
		expect(result.current.held).toBe(true)

		await act(() => result.current.onHeldChange(false))
		await act(() => jest.advanceTimersByTime(1999))
		expect(result.current.held).toBe(true)

		await act(() => jest.advanceTimersByTime(1))
		expect(result.current.held).toBe(false)
	})

	test('a new touch within the 2s cancels the countdown', async () => {
		let {result} = await renderHook(() => useScratchHold(true))
		await act(() => result.current.onHeldChange(true))
		await act(() => result.current.onHeldChange(false))
		await act(() => jest.advanceTimersByTime(1500))
		await act(() => result.current.onHeldChange(true))
		await act(() => jest.advanceTimersByTime(5000))
		expect(result.current.held).toBe(true)
	})

	test('closing the sheet ends the hold', async () => {
		let {result, rerender} = await renderHook(({open}: {open: boolean}) => useScratchHold(open), {
			initialProps: {open: true},
		})
		await act(() => rerender({open: false}))
		expect(result.current.held).toBe(false)
	})
})
