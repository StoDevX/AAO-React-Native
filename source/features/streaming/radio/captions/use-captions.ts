import * as React from 'react'
import {
	addCaptionListener,
	addCaptionStateListener,
	startCaptions,
	stopCaptions,
	type CaptionsEngineState,
} from '@frogpond/radio-captions'

import {useStationSources} from '../sources'
import type {Station} from '../stations'
import {useRadioStore, useStationPlayback} from '../store'
import {captionsAvailability, shouldRunCaptions, type CaptionsAvailability} from './captions-panel'
import {CAPTION_DISPLAY_DELAY_MS} from './caption-delay'
import {EMPTY_CAPTIONS, reduceCaptions, type CaptionsState} from './reduce-captions'

export {CAPTION_DISPLAY_DELAY_MS}

/** The stations are English-language, and the app has no locale setting for speech. */
const CAPTIONS_LOCALE = 'en-US'

/** Whether `station`, the one the sheet shows, can be captioned now; see `captionsAvailability`. */
export function useCaptionsAvailability(station: Station): CaptionsAvailability {
	let {playState} = useStationPlayback(station.id)
	let viewedIsPlaying = useRadioStore((state) => state.stationId === station.id)
	return captionsAvailability({station, viewedIsPlaying, playState})
}

/**
 * Runs the caption engine on `station`'s stream while `active` (the captions
 * panel is showing) and the station is playing. The stream is the one the
 * sources name, which is what the player starts from. Stopping, pausing or
 * changing station ends the engine, whose late events are ignored, and the
 * captions start empty each time. `running` is whether the engine is wanted.
 * Captions and most engine states show `CAPTION_DISPLAY_DELAY_MS` after they
 * arrive, to line up with what the player is playing.
 *
 * Limits: the stream is the manifest's, so a player that has fallen back to
 * the shipped stream (see `StationPlayers`) is captioned from the manifest's
 * all the same. And native events carry no start id, so a late event from an
 * engine just stopped can be credited to the one that starts next.
 */
export function useCaptions(
	station: Station,
	active: boolean,
): {state: CaptionsState; engine: CaptionsEngineState | null; running: boolean} {
	let {playState} = useStationPlayback(station.id)
	let viewedIsPlaying = useRadioStore((state) => state.stationId === station.id)
	let streamUrl = useStationSources(station.id)?.streamSourceUrl
	let wanted = shouldRunCaptions({active, station, viewedIsPlaying, playState})
	let running = wanted && streamUrl !== undefined
	let [state, dispatch] = React.useReducer(reduceCaptions, EMPTY_CAPTIONS)
	let [engine, setEngine] = React.useState<CaptionsEngineState | null>(null)
	// The stream an engine starts with is the one it keeps: a manifest that
	// arrives mid-play changes the next engine, not this one, as the player does.
	let latestStreamUrl = React.useRef(streamUrl)
	React.useEffect(() => {
		latestStreamUrl.current = streamUrl
	})

	React.useEffect(() => {
		let streamUrl = latestStreamUrl.current
		if (!running || streamUrl === undefined) return
		// Each effect run is one engine: its events are dropped once it has ended.
		let current = true
		// What waits to show, oldest first. Each timer shows the oldest, so the
		// order is the engine's whatever order the timers fire in.
		let waiting: (() => void)[] = []
		let timers = new Set<ReturnType<typeof setTimeout>>()
		let showLater = (show: () => void) => {
			waiting.push(show)
			let timer = setTimeout(() => {
				timers.delete(timer)
				waiting.shift()?.()
			}, CAPTION_DISPLAY_DELAY_MS)
			timers.add(timer)
		}
		let removeCaption = addCaptionListener((event) => {
			if (current) showLater(() => dispatch(event))
		})
		let removeState = addCaptionStateListener((next) => {
			if (!current) return
			// A download or a failure is news now, not something the sound is behind.
			if (next.kind === 'downloading' || next.kind === 'unavailable') {
				setEngine(next)
				return
			}
			showLater(() => {
				setEngine(next)
				if (next.kind === 'reconnecting' || next.kind === 'music') dispatch({kind: 'clearLive'})
			})
		})
		startCaptions(streamUrl, CAPTIONS_LOCALE).catch((error: unknown) => {
			if (current) setEngine({kind: 'unavailable', reason: 'Captions could not start.'})
			console.warn('Captions failed to start', error)
		})
		return () => {
			current = false
			for (let timer of timers) clearTimeout(timer)
			timers.clear()
			waiting.length = 0
			removeCaption()
			removeState()
			stopCaptions()
			// The next engine starts from nothing, not from this one's lines.
			dispatch({kind: 'reset'})
			setEngine(null)
		}
	}, [running, station.id])

	return {state, engine, running}
}
