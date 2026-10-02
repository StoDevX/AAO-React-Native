import {beforeEach, describe, expect, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {useRadioStore, useStationPlayback} from '../store'

const ERROR = {code: 4, message: 'The stream could not be played.'}

describe('useRadioStore', () => {
	beforeEach(() => {
		useRadioStore.getState().stop()
	})

	test('loads nothing until a station is played', () => {
		expect(useRadioStore.getState().stationId).toBeNull()
		expect(useRadioStore.getState().playState).toBe('paused')
	})

	test('starting a station loads it and waits for the player', () => {
		useRadioStore.getState().play('krlx')
		expect(useRadioStore.getState().stationId).toBe('krlx')
		expect(useRadioStore.getState().playState).toBe('checking')
	})

	test('starting a second station replaces the first', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().reportPlaying()
		useRadioStore.getState().play('ksto')
		expect(useRadioStore.getState().stationId).toBe('ksto')
		expect(useRadioStore.getState().playState).toBe('checking')
	})

	test('pausing keeps the station loaded', () => {
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying()
		useRadioStore.getState().pause()
		expect(useRadioStore.getState().stationId).toBe('ksto')
		expect(useRadioStore.getState().playState).toBe('paused')
	})

	test('stopping unloads the station', () => {
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().stop()
		expect(useRadioStore.getState().stationId).toBeNull()
	})

	test('an error pauses the station but keeps it loaded, until it is played again', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().reportError(ERROR)
		expect(useRadioStore.getState()).toMatchObject({
			stationId: 'krlx',
			playState: 'paused',
			error: ERROR,
		})

		useRadioStore.getState().play('krlx')
		expect(useRadioStore.getState().error).toBeNull()
	})
})

describe('useStationPlayback', () => {
	beforeEach(() => {
		useRadioStore.getState().stop()
	})

	test('shows the loaded station as it is', async () => {
		let {result} = await renderHook(() => useStationPlayback('krlx'))
		await act(() => {
			useRadioStore.getState().play('krlx')
			useRadioStore.getState().reportError(ERROR)
		})
		expect(result.current).toEqual({playState: 'paused', error: ERROR})
	})

	test('shows any other station as paused, without the loaded one’s error', async () => {
		let {result} = await renderHook(() => useStationPlayback('ksto'))
		await act(() => {
			useRadioStore.getState().play('krlx')
		})
		expect(result.current).toEqual({playState: 'paused', error: null})
	})
})
