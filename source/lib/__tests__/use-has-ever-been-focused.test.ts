import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {useHasEverBeenFocused} from '../use-has-ever-been-focused'

let mockIsFocused = false

jest.mock('expo-router', () => ({useIsFocused: () => mockIsFocused}))

describe('useHasEverBeenFocused', () => {
	test('is false for a screen that has never been focused', async () => {
		mockIsFocused = false
		let {result} = await renderHook(() => useHasEverBeenFocused())

		expect(result.current).toBe(false)
	})

	test('is true for a screen that is focused from the start', async () => {
		mockIsFocused = true
		let {result} = await renderHook(() => useHasEverBeenFocused())

		expect(result.current).toBe(true)
	})

	// The latch is the whole point. Gating on `useIsFocused` alone would tear
	// the screen down on every blur and rebuild it on every activation; this
	// pays that cost once.
	test('stays true after the screen is blurred again', async () => {
		mockIsFocused = false
		let {result, rerender} = await renderHook(() => useHasEverBeenFocused())
		expect(result.current).toBe(false)

		mockIsFocused = true
		await rerender({})
		expect(result.current).toBe(true)

		mockIsFocused = false
		await rerender({})
		expect(result.current).toBe(true)
	})
})
