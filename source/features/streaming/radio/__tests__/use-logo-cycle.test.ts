import {beforeEach, describe, expect, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {useLogoCycle} from '../player-view/use-logo-cycle'
import {STATIONS, type StationId} from '../stations'
import {useRadioStore} from '../store'

describe('useLogoCycle', () => {
	beforeEach(() => {
		useRadioStore.setState({logoIndexes: {}})
	})

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

	test('each station keeps the logo it was left on', async () => {
		let {result, rerender} = await renderHook(
			({id}: {id: StationId}) => useLogoCycle(STATIONS[id]),
			{
				initialProps: {id: 'ksto'},
			},
		)
		await act(() => result.current.showNextLogo?.())
		await act(() => rerender({id: 'krlx'}))
		expect(result.current.logo.name).toBe('krlx 88.1')
		await act(() => rerender({id: 'ksto'}))
		expect(result.current.logo.name).toBe('wordmark')
	})

	test('remembers the logo across mounts', async () => {
		let first = await renderHook(() => useLogoCycle(STATIONS.ksto))
		await act(() => first.result.current.showNextLogo?.())
		await first.unmount()

		let second = await renderHook(() => useLogoCycle(STATIONS.ksto))
		expect(second.result.current.logo.name).toBe('wordmark')
	})

	test('a saved logo the station no longer has falls back to the first', async () => {
		useRadioStore.setState({logoIndexes: {krlx: 5}})
		let {result} = await renderHook(() => useLogoCycle(STATIONS.krlx))
		expect(result.current.logo.name).toBe('krlx 88.1')
	})
})
