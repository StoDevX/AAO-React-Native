import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
import {
	addCaptionListener,
	addCaptionStateListener,
	startCaptions,
	stopCaptions,
	type CaptionEvent,
	type CaptionsEngineState,
} from '@frogpond/radio-captions'

import {STATIONS, type Station} from '../../stations'
import {useRadioStore} from '../../store'
import {useCaptions} from '../use-captions'

const STREAM = 'https://stream.example/krlx.mp3'

// The manifest comes over the network; the stream's address is all the hook asks of it.
jest.mock('../../sources', () => ({
	useStationSources: () => ({streamSourceUrl: 'https://stream.example/krlx.mp3'}),
}))

type CaptionListener = (event: CaptionEvent) => void
type StateListener = (state: CaptionsEngineState) => void

/** The listeners each engine run registered, oldest first. */
let captionListeners: CaptionListener[]
let stateListeners: StateListener[]

function play(playState: 'playing' | 'paused'): void {
	useRadioStore.setState({stationId: 'krlx', playState})
}

describe('useCaptions', () => {
	beforeEach(() => {
		captionListeners = []
		stateListeners = []
		jest.mocked(startCaptions).mockReset().mockResolvedValue(undefined)
		jest.mocked(stopCaptions).mockClear()
		jest.mocked(addCaptionListener).mockImplementation((listener) => {
			captionListeners.push(listener)
			return jest.fn()
		})
		jest.mocked(addCaptionStateListener).mockImplementation((listener) => {
			stateListeners.push(listener)
			return jest.fn()
		})
		useRadioStore.setState({stationId: null, playState: 'stopped'})
	})

	test('captions the stream while the panel is showing and the station plays, and stops with it', async () => {
		play('playing')

		let {unmount} = await renderHook(() => useCaptions(STATIONS.krlx, true))

		expect(startCaptions).toHaveBeenCalledWith(STREAM, 'en-US')
		expect(stopCaptions).not.toHaveBeenCalled()

		await unmount()

		expect(stopCaptions).toHaveBeenCalledTimes(1)
	})

	test('does not start behind another panel, or for a paused or unloaded station', async () => {
		play('playing')
		let behindAnotherPanel = await renderHook(() => useCaptions(STATIONS.krlx, false))
		await behindAnotherPanel.unmount()
		play('paused')
		let paused = await renderHook(() => useCaptions(STATIONS.krlx, true))
		await paused.unmount()
		useRadioStore.setState({stationId: 'ksto', playState: 'playing'})
		let unloaded = await renderHook(() => useCaptions(STATIONS.krlx, true))
		await unloaded.unmount()

		expect(startCaptions).not.toHaveBeenCalled()
	})

	test('does not start for a station that cannot be captioned', async () => {
		useRadioStore.setState({stationId: 'ksto', playState: 'playing'})

		await renderHook(() => useCaptions(STATIONS.ksto, true))

		expect(startCaptions).not.toHaveBeenCalled()
	})

	test('stops when the station is paused, and starts again with empty captions on resuming', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))
		await act(() => {
			captionListeners[0]?.({kind: 'final', text: 'Good evening'})
		})
		expect(result.current.state.lines.map((line) => line.text)).toEqual(['Good evening'])

		await act(() => {
			play('paused')
		})

		expect(stopCaptions).toHaveBeenCalledTimes(1)

		await act(() => {
			play('playing')
		})

		expect(startCaptions).toHaveBeenCalledTimes(2)
		expect(result.current.state.lines).toEqual([])
		expect(result.current.engine).toBeNull()
	})

	test('rides out the player stalling on its buffer without restarting or clearing', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))
		await act(() => {
			captionListeners[0]?.({kind: 'final', text: 'Good evening'})
		})

		await act(() => {
			useRadioStore.setState({playState: 'starting'})
		})
		await act(() => {
			useRadioStore.setState({playState: 'playing'})
		})

		expect(stopCaptions).not.toHaveBeenCalled()
		expect(startCaptions).toHaveBeenCalledTimes(1)
		expect(result.current.running).toBe(true)
		expect(result.current.state.lines.map((line) => line.text)).toEqual(['Good evening'])
	})

	test('stops the engine and starts the next station from nothing when the station changes', async () => {
		play('playing')
		let {result, rerender} = await renderHook(
			({station}: {station: Station}) => useCaptions(station, true),
			{initialProps: {station: STATIONS.krlx}},
		)
		await act(() => {
			captionListeners[0]?.({kind: 'final', text: 'Good evening'})
		})

		useRadioStore.setState({stationId: 'ksto'})
		await rerender({station: STATIONS.ksto})

		expect(stopCaptions).toHaveBeenCalledTimes(1)
		expect(result.current.running).toBe(false)
		expect(result.current.state.lines).toEqual([])
	})

	test('ignores what an engine that has ended reports late', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))
		await act(() => {
			play('paused')
		})
		await act(() => {
			play('playing')
		})

		await act(() => {
			captionListeners[0]?.({kind: 'final', text: 'From the old engine'})
			stateListeners[0]?.({kind: 'captioning'})
		})

		expect(result.current.state.lines).toEqual([])
		expect(result.current.engine).toBeNull()

		await act(() => {
			captionListeners[1]?.({kind: 'final', text: 'From the new one'})
		})

		expect(result.current.state.lines.map((line) => line.text)).toEqual(['From the new one'])
	})

	test('clears the line being spoken while reconnecting or on music', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))

		await act(() => {
			captionListeners[0]?.({kind: 'volatile', text: 'And now the'})
		})
		expect(result.current.state.live).toBe('And now the')

		await act(() => {
			stateListeners[0]?.({kind: 'music'})
		})

		expect(result.current.state.live).toBe('')
		expect(result.current.engine).toEqual({kind: 'music'})
	})

	test('reports captions unavailable, without throwing, when the engine cannot start', async () => {
		let warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
		jest.mocked(startCaptions).mockRejectedValue(new Error('no speech model'))
		play('playing')

		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))
		await act(() => Promise.resolve())

		expect(result.current.engine).toEqual({
			kind: 'unavailable',
			reason: 'Captions could not start.',
		})
		expect(warn).toHaveBeenCalledWith('Captions failed to start', expect.any(Error))
		warn.mockRestore()
	})
})
