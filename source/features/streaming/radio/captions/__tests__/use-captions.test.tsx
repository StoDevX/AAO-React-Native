import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
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
import {CAPTION_DISPLAY_DELAY_MS, useCaptions} from '../use-captions'

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

/** The timers set for the display delay so far, to check each is cancelled. */
function delayTimers(
	setTimeoutSpy: jest.SpiedFunction<typeof setTimeout>,
): ReturnType<typeof setTimeout>[] {
	let timers: ReturnType<typeof setTimeout>[] = []
	setTimeoutSpy.mock.calls.forEach((call, i) => {
		let result = setTimeoutSpy.mock.results[i]
		if (call[1] === CAPTION_DISPLAY_DELAY_MS && result?.type === 'return') timers.push(result.value)
	})
	return timers
}

/** Lets the display delay pass, so what the engine reported is shown. */
async function showDelayed(): Promise<void> {
	await act(() => {
		jest.advanceTimersByTime(CAPTION_DISPLAY_DELAY_MS)
	})
}

function play(playState: 'playing' | 'paused'): void {
	useRadioStore.setState({stationId: 'krlx', playState})
}

describe('useCaptions', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	beforeEach(() => {
		jest.useFakeTimers()
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
		await showDelayed()
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
		await showDelayed()

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
		await showDelayed()

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
		await showDelayed()

		expect(result.current.state.lines).toEqual([])
		expect(result.current.engine).toBeNull()

		await act(() => {
			captionListeners[1]?.({kind: 'final', text: 'From the new one'})
		})
		await showDelayed()

		expect(result.current.state.lines.map((line) => line.text)).toEqual(['From the new one'])
	})

	test('holds captions and engine states back for the display delay, then shows them in order', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))

		await act(() => {
			stateListeners[0]?.({kind: 'captioning'})
			captionListeners[0]?.({kind: 'final', text: 'First'})
		})
		await act(() => {
			jest.advanceTimersByTime(1000)
			captionListeners[0]?.({kind: 'final', text: 'Second'})
		})
		await act(() => {
			jest.advanceTimersByTime(CAPTION_DISPLAY_DELAY_MS - 1001)
		})

		expect(result.current.engine).toBeNull()
		expect(result.current.state.lines).toEqual([])

		await act(() => {
			jest.advanceTimersByTime(1)
		})

		expect(result.current.engine).toEqual({kind: 'captioning'})
		expect(result.current.state.lines.map((line) => line.text)).toEqual(['First'])

		await act(() => {
			jest.advanceTimersByTime(1000)
		})

		expect(result.current.state.lines.map((line) => line.text)).toEqual(['First', 'Second'])
	})

	test('shows a model download and an unavailable engine at once', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))

		await act(() => {
			stateListeners[0]?.({kind: 'downloading'})
		})
		expect(result.current.engine).toEqual({kind: 'downloading'})

		await act(() => {
			stateListeners[0]?.({kind: 'unavailable', reason: 'No speech model'})
		})
		expect(result.current.engine).toEqual({kind: 'unavailable', reason: 'No speech model'})
	})

	test('drops what is still waiting when the engine stops', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))
		await act(() => {
			captionListeners[0]?.({kind: 'final', text: 'Never shown'})
		})

		await act(() => {
			play('paused')
		})
		await act(() => {
			play('playing')
		})
		await showDelayed()

		expect(result.current.state.lines).toEqual([])
	})

	test('drops what is still waiting when the component unmounts', async () => {
		play('playing')
		let {unmount} = await renderHook(() => useCaptions(STATIONS.krlx, true))
		let setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout')
		let clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout')
		await act(() => {
			captionListeners[0]?.({kind: 'final', text: 'Never shown'})
		})
		let [pending] = delayTimers(setTimeoutSpy)
		expect(pending).toBeDefined()

		await unmount()

		expect(clearTimeoutSpy).toHaveBeenCalledWith(pending)
	})

	test("drops the old station's waiting captions when the station changes", async () => {
		play('playing')
		let {result, rerender} = await renderHook(
			({station}: {station: Station}) => useCaptions(station, true),
			{initialProps: {station: STATIONS.krlx}},
		)
		let setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout')
		let clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout')
		await act(() => {
			captionListeners[0]?.({kind: 'final', text: 'Never shown'})
		})
		let [pending] = delayTimers(setTimeoutSpy)
		expect(pending).toBeDefined()

		useRadioStore.setState({stationId: 'ksto'})
		await rerender({station: STATIONS.ksto})

		expect(clearTimeoutSpy).toHaveBeenCalledWith(pending)

		await showDelayed()

		expect(result.current.state.lines).toEqual([])
	})

	test('clears the line being spoken while reconnecting or on music', async () => {
		play('playing')
		let {result} = await renderHook(() => useCaptions(STATIONS.krlx, true))

		await act(() => {
			captionListeners[0]?.({kind: 'volatile', text: 'And now the'})
		})
		await showDelayed()
		expect(result.current.state.live).toBe('And now the')

		await act(() => {
			stateListeners[0]?.({kind: 'music'})
		})
		await showDelayed()

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
