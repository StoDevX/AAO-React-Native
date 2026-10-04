import {afterEach, describe, expect, it} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
import {onlineManager} from '@tanstack/react-query'

import {useImageFailure} from '../use-image-failure'

describe('useImageFailure', () => {
	afterEach(() => {
		onlineManager.setOnline(true)
	})

	it('has not failed until the image says so', async () => {
		let {result} = await renderHook(() => useImageFailure('https://example.test/a.webp'))

		expect(result.current[0]).toBe(false)
	})

	it('has failed once the image says so, for that address only', async () => {
		let {result, rerender} = await renderHook(
			(props: {uri: string}) => useImageFailure(props.uri),
			{initialProps: {uri: 'https://example.test/a.webp'}},
		)

		await act(() => {
			result.current[1]()
		})
		expect(result.current[0]).toBe(true)

		await rerender({uri: 'https://example.test/b.webp'})
		expect(result.current[0]).toBe(false)
	})

	it('tries again when the device comes back online', async () => {
		let {result} = await renderHook(() => useImageFailure('https://example.test/a.webp'))
		await act(() => {
			result.current[1]()
		})
		expect(result.current[0]).toBe(true)

		await act(() => {
			onlineManager.setOnline(false)
		})
		expect(result.current[0]).toBe(true)

		await act(() => {
			onlineManager.setOnline(true)
		})
		expect(result.current[0]).toBe(false)
	})
})
