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
import {EMPTY_CAPTIONS, reduceCaptions, type CaptionsState} from './reduce-captions'

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

	React.useEffect(() => {
		if (!running || streamUrl === undefined) return
		// Each effect run is one engine: its events are dropped once it has ended.
		let current = true
		let removeCaption = addCaptionListener((event) => {
			if (current) dispatch(event)
		})
		let removeState = addCaptionStateListener((next) => {
			if (!current) return
			setEngine(next)
			if (next.kind === 'reconnecting' || next.kind === 'music') dispatch({kind: 'clearLive'})
		})
		startCaptions(streamUrl, CAPTIONS_LOCALE).catch((error: unknown) => {
			if (current) setEngine({kind: 'unavailable', reason: 'Captions could not start.'})
			console.warn('Captions failed to start', error)
		})
		return () => {
			current = false
			removeCaption()
			removeState()
			stopCaptions()
			// The next engine starts from nothing, not from this one's lines.
			dispatch({kind: 'reset'})
			setEngine(null)
		}
	}, [running, streamUrl])

	return {state, engine, running}
}
