import {describe, expect, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {useLogoCycle} from '../player-view/use-logo-cycle'
import {STATIONS, type StationId} from '../stations'

describe('useLogoCycle', () => {
	test('starts on the first logo and cycles through the rest', async () => {
		let {result} = await renderHook(() => useLogoCycle(STATIONS.ksto))
		expect(result.current.logo.name).toBe('cow badge')
		await act(() => result.current.showNextLogo?.())
		expect(result.current.logo.name).toBe('wordmark')
	})

	test('a station with one logo has nothing to cycle', async () => {
		let {result} = await renderHook(() => useLogoCycle(STATIONS.krlx))
		expect(result.current.showNextLogo).toBeUndefined()
	})

	test('switching station starts the new one on its first logo', async () => {
		let {result, rerender} = await renderHook(
			({id}: {id: StationId}) => useLogoCycle(STATIONS[id]),
			{
				initialProps: {id: 'ksto'},
			},
		)
		await act(() => result.current.showNextLogo?.())
		await act(() => result.current.showNextLogo?.())
		await act(() => result.current.showNextLogo?.())
		await act(() => rerender({id: 'krlx'}))
		expect(result.current.logo.name).toBe('krlx 88.1')
	})
})
