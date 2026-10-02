import {create} from 'zustand'
import type {StationId} from './stations'
import type {HtmlAudioError, PlayState} from './types'

type RadioStore = {
	/** The station the player has loaded, playing or paused; null when nothing is loaded. */
	stationId: StationId | null
	/** What the player is doing, or has been asked to do, with that station. */
	playState: PlayState
	/** Why that station last failed to play, until it is asked to play again. */
	error: HtmlAudioError | null

	/** Starts `stationId`, stopping any other station first. */
	play: (stationId: StationId) => void
	/** Pauses, keeping the station loaded so it resumes quickly. */
	pause: () => void
	/** Unloads the station, which ends its audio and hides the mini-player. */
	stop: () => void

	/** The player reports that audio has started arriving. */
	reportPlaying: () => void
	/** The player reports that audio has paused or ended. */
	reportPaused: () => void
	/** The player reports that the station could not be played. */
	reportError: (error: HtmlAudioError) => void
}

/**
 * The radio that plays across the whole app. Not persisted: a relaunch should
 * never start audio by itself.
 */
export const useRadioStore = create<RadioStore>()((set) => ({
	stationId: null,
	playState: 'paused',
	error: null,

	play: (stationId) => set({stationId, playState: 'checking', error: null}),
	pause: () => set({playState: 'paused'}),
	stop: () => set({stationId: null, playState: 'paused', error: null}),

	reportPlaying: () => set({playState: 'playing'}),
	reportPaused: () => set({playState: 'paused'}),
	reportError: (error) => set({error, playState: 'paused'}),
}))

/** What `stationId`'s own controls show: its state when it is loaded, and paused otherwise. */
export function useStationPlayback(stationId: StationId): {
	playState: PlayState
	error: HtmlAudioError | null
} {
	let loaded = useRadioStore((state) => state.stationId === stationId)
	let playState = useRadioStore((state) => state.playState)
	let error = useRadioStore((state) => state.error)
	return loaded ? {playState, error} : {playState: 'paused', error: null}
}
