import {describe, expect, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
import type {LayoutChangeEvent} from 'react-native'

import {useFittedArtwork} from '../player-view/use-fitted-artwork'

/** The layout event for a view of `height`, as React Native reports it. */
function layout(height: number): LayoutChangeEvent {
	return {nativeEvent: {layout: {x: 0, y: 0, width: 390, height}}} as LayoutChangeEvent
}

describe('useFittedArtwork', () => {
	test('fills the width until the player has laid out', async () => {
		let {result} = await renderHook(() => useFittedArtwork({width: 346, viewportHeight: 675}))
		expect(result.current.artwork).toBe(346)
	})

	test('shrinks to the room the rest of the player leaves', async () => {
		let {result} = await renderHook(() => useFittedArtwork({width: 346, viewportHeight: 675}))
		await act(() => result.current.onLayout(layout(779)))
		expect(result.current.artwork).toBe(242)
	})

	test('fits once the viewport is measured after the player laid out', async () => {
		// The player lays out first, with no viewport to fit to yet, and its
		// own height never changes again when the viewport arrives.
		let {result, rerender} = await renderHook(
			({viewportHeight}: {viewportHeight: number}) =>
				useFittedArtwork({width: 346, viewportHeight}),
			{initialProps: {viewportHeight: 0}},
		)
		await act(() => result.current.onLayout(layout(779)))
		expect(result.current.artwork).toBe(346)

		await act(() => rerender({viewportHeight: 675}))

		expect(result.current.artwork).toBe(242)
	})

	test('grows back when the viewport does', async () => {
		let {result, rerender} = await renderHook(
			({viewportHeight}: {viewportHeight: number}) =>
				useFittedArtwork({width: 346, viewportHeight}),
			{initialProps: {viewportHeight: 675}},
		)
		await act(() => result.current.onLayout(layout(779)))
		await act(() => result.current.onLayout(layout(675)))
		expect(result.current.artwork).toBe(242)

		await act(() => rerender({viewportHeight: 758}))

		expect(result.current.artwork).toBe(325)
	})
})
