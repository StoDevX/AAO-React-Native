import {beforeEach, describe, expect, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {useRadioStore, useStationPlayback} from '../store'

const ERROR = {code: 4, message: 'The stream could not be played.'}

function reset() {
	useRadioStore.setState({
		stationId: null,
		playState: 'stopped',
		error: null,
		playerKey: 0,
		viewedStationId: 'ksto',
		sheetOpen: false,
		showOnHome: true,
		logoIndexes: {},
	})
}

describe('playback', () => {
	beforeEach(reset)

	test('loads nothing until a station is played', () => {
		expect(useRadioStore.getState()).toMatchObject({stationId: null, playState: 'stopped'})
	})

	test('playing loads the station, waits for the player, and gives it a new key', () => {
		useRadioStore.getState().play('krlx')
		expect(useRadioStore.getState()).toMatchObject({
			stationId: 'krlx',
			playState: 'starting',
			playerKey: 1,
		})
	})

	test('playing the same station again mounts a fresh player', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().reportError(1, ERROR)
		useRadioStore.getState().play('krlx')
		expect(useRadioStore.getState()).toMatchObject({playerKey: 2, error: null})
	})

	test('stop unloads the station', () => {
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().stop()
		expect(useRadioStore.getState()).toMatchObject({stationId: null, playState: 'stopped'})
	})

	test('the current player reporting playing marks it playing', () => {
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying(1)
		expect(useRadioStore.getState().playState).toBe('playing')
	})

	test('the current player stopping on its own unloads the station', () => {
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying(1)
		useRadioStore.getState().reportStopped(1)
		expect(useRadioStore.getState().stationId).toBeNull()
	})

	test('a replaced player stopping does not unload the station that replaced it', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportStopped(1)
		expect(useRadioStore.getState()).toMatchObject({stationId: 'ksto', playState: 'starting'})
	})

	test('a replaced player cannot mark the new station playing or failed', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying(1)
		useRadioStore.getState().reportError(1, ERROR)
		expect(useRadioStore.getState()).toMatchObject({playState: 'starting', error: null})
	})

	test('the failed player pausing itself afterwards keeps the error on show', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().reportError(1, ERROR)
		useRadioStore.getState().reportStopped(1)
		expect(useRadioStore.getState()).toMatchObject({stationId: 'krlx', error: ERROR})
	})

	test('a stall while playing waits on the stream again', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().reportPlaying(1)
		useRadioStore.getState().reportWaiting(1)
		expect(useRadioStore.getState().playState).toBe('starting')
	})

	test('a stall from a replaced player changes nothing', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportPlaying(2)
		useRadioStore.getState().reportWaiting(1)
		expect(useRadioStore.getState().playState).toBe('playing')
	})

	test('an error stops the station but keeps it loaded, to retry', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().reportError(1, ERROR)
		expect(useRadioStore.getState()).toMatchObject({
			stationId: 'krlx',
			playState: 'stopped',
			error: ERROR,
		})
	})
})

describe('viewing', () => {
	beforeEach(reset)

	test('browsing changes the viewed station and never playback', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().browse('ksto')
		expect(useRadioStore.getState()).toMatchObject({
			viewedStationId: 'ksto',
			stationId: 'krlx',
			playState: 'starting',
		})
	})

	test('opening the sheet with no station named shows the loaded one', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().openSheet()
		expect(useRadioStore.getState()).toMatchObject({sheetOpen: true, viewedStationId: 'krlx'})
	})

	test('opening the sheet with nothing loaded shows the last station viewed', () => {
		useRadioStore.getState().browse('krlx')
		useRadioStore.getState().openSheet()
		expect(useRadioStore.getState()).toMatchObject({sheetOpen: true, viewedStationId: 'krlx'})
	})

	test('opening the sheet on a named station shows that one', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().openSheet('ksto')
		expect(useRadioStore.getState().viewedStationId).toBe('ksto')
	})

	test('closing the sheet leaves playback alone', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().openSheet()
		useRadioStore.getState().closeSheet()
		expect(useRadioStore.getState()).toMatchObject({sheetOpen: false, stationId: 'krlx'})
	})
})

describe('showOnHome', () => {
	beforeEach(reset)

	test('is on by default', () => {
		expect(useRadioStore.getState().showOnHome).toBe(true)
	})

	test('turning it off stops a loaded station', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().setShowOnHome(false)
		expect(useRadioStore.getState()).toMatchObject({showOnHome: false, stationId: null})
	})

	test('and the logo each station shows are the only state that reaches storage', () => {
		useRadioStore.getState().play('krlx')
		useRadioStore.getState().setLogoIndex('ksto', 1)
		let {partialize} = useRadioStore.persist.getOptions()
		expect(partialize?.(useRadioStore.getState())).toStrictEqual({
			showOnHome: true,
			logoIndexes: {ksto: 1},
		})
	})
})

describe('useStationPlayback', () => {
	beforeEach(reset)

	test('shows the loaded station as it is', async () => {
		let {result} = await renderHook(() => useStationPlayback('krlx'))
		await act(() => {
			useRadioStore.getState().play('krlx')
			useRadioStore.getState().reportError(1, ERROR)
		})
		expect(result.current).toEqual({playState: 'stopped', error: ERROR})
	})

	test('shows any other station as stopped, without the loaded one’s error', async () => {
		let {result} = await renderHook(() => useStationPlayback('ksto'))
		await act(() => {
			useRadioStore.getState().play('krlx')
			useRadioStore.getState().reportError(1, ERROR)
		})
		expect(result.current).toEqual({playState: 'stopped', error: null})
	})
})
