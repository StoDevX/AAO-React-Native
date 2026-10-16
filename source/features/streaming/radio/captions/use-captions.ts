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
import {useRadioDevStore} from '../dev-settings/store'
import {EMPTY_CAPTIONS, type CaptionsState} from './reduce-captions'
import {useCaptionsStore} from './store'
import {normalizeCaption} from './vocabulary'

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
 * sources name, which is what the player starts from. Hiding the panel,
 * pausing or changing station ends the engine, whose late events are ignored.
 * What was said is kept in `useCaptionsStore`, so a later run carries on from
 * it with a marker where captions were off, until the loaded station changes or
 * the radio stops. `running` is whether the engine is wanted.
 *
 * Captions and most engine states show after the radio's caption delay setting
 * (`CAPTION_DISPLAY_DELAY_MS` by default) once they arrive, to line up with
 * what the player is playing. A run that ends with the station still playing
 * shows what is still waiting at once, as nobody is watching for the sound;
 * one that ends because the station changed or the radio stopped drops it.
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
	let captions = useCaptionsStore((store) => store.captions)
	let captionsStation = useCaptionsStore((store) => store.stationId)
	let state = captionsStation === station.id ? captions : EMPTY_CAPTIONS
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
		useCaptionsStore.getState().begin(station.id)
		// What waits to show, oldest first. Each timer shows what is due, oldest first, so the
		// order is the engine's whatever order the timers fire in.
		let waiting: {due: number; show: () => void}[] = []
		let timers = new Set<ReturnType<typeof setTimeout>>()
		// Shows what is due, and wakes again for the next item if the clock is
		// not there yet: a timer can fire a little before `Date.now` reaches its time.
		let wake = () => {
			while (waiting[0] !== undefined && waiting[0].due <= Date.now()) waiting.shift()?.show()
			if (waiting[0] !== undefined) arm(Math.max(1, waiting[0].due - Date.now()))
		}
		let arm = (delay: number) => {
			let timer = setTimeout(() => {
				timers.delete(timer)
				wake()
			}, delay)
			timers.add(timer)
		}
		let showLater = (show: () => void) => {
			// The delay in force when it arrives, so a change applies to what comes
			// after it; an item never shows before the ones ahead of it.
			let delay = useRadioDevStore.getState().captionDelayMs
			waiting.push({due: Date.now() + delay, show})
			arm(delay)
		}
		let removeCaption = addCaptionListener((event) => {
			if (current) {
				let corrected = {...event, text: normalizeCaption(event.text)}
				showLater(() => useCaptionsStore.getState().apply(corrected))
			}
		})
		// The last engine state shown, to tell speech giving way to music from the
		// first buffer of a new connection, which the engine reports as music too.
		let shownKind: CaptionsEngineState['kind'] | null = null
		// An engine that reports itself unavailable does not recover, so what it
		// reported earlier, still waiting on the delay, must not overwrite that.
		let failed = false
		let removeState = addCaptionStateListener((next) => {
			if (!current) return
			// A download or a failure is news now, not something the sound is behind.
			if (next.kind === 'downloading' || next.kind === 'unavailable') {
				failed = next.kind === 'unavailable'
				setEngine(next)
				return
			}
			showLater(() => {
				if (failed) return
				setEngine(next)
				if (next.kind === 'reconnecting' || next.kind === 'music') {
					useCaptionsStore.getState().apply({kind: 'clearLive'})
				}
				// Music is marked in the transcript, after the captions it interrupts.
				if (next.kind === 'music' && shownKind === 'captioning') {
					useCaptionsStore.getState().apply({kind: 'music'})
				}
				shownKind = next.kind
			})
		})
		startCaptions(streamUrl, CAPTIONS_LOCALE).catch((error: unknown) => {
			if (current) {
				failed = true
				setEngine({kind: 'unavailable', reason: 'Captions could not start.'})
			}
			console.warn('Captions failed to start', error)
		})
		return () => {
			current = false
			for (let timer of timers) clearTimeout(timer)
			timers.clear()
			let radio = useRadioStore.getState()
			let stillPlaying = radio.stationId === station.id && radio.playState !== 'stopped'
			for (let item of stillPlaying ? waiting : []) item.show()
			waiting.length = 0
			removeCaption()
			removeState()
			stopCaptions()
			setEngine(null)
		}
	}, [running, station.id])

	return {state, engine, running}
}
