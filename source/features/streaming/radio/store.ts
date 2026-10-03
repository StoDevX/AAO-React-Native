import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import type {StationId} from './stations'
import type {HtmlAudioError, RadioPlayState} from './types'

type RadioStore = {
	/** The station the player has loaded; null when nothing is loaded. */
	stationId: StationId | null
	/** What the player is doing, or has been asked to do, with that station. */
	playState: RadioPlayState
	/** Why that station last failed to play, until it is asked to play again. */
	error: HtmlAudioError | null
	/** Identifies the current player. Each play gets a new one, so a retry never reuses a failed player. */
	playerKey: number

	/** The station the sheet shows. Browsing it never changes playback. */
	viewedStationId: StationId
	/** Whether the Now Playing sheet is presented. */
	sheetOpen: boolean

	/** Whether Home's Now Playing bar shows while nothing is loaded. Persisted. */
	showOnHome: boolean

	/** Starts `stationId` in a fresh player, replacing any other station. */
	play: (stationId: StationId) => void
	/** Unloads the station, which ends its audio. */
	stop: () => void

	/** Player `key` reports that audio has started arriving. */
	reportPlaying: (key: number) => void
	/** Player `key` reports that its buffer ran dry, waiting on data. */
	reportWaiting: (key: number) => void
	/** Player `key` reports that its audio paused or ended by itself. */
	reportStopped: (key: number) => void
	/** Player `key` reports that the station could not be played. */
	reportError: (key: number, error: HtmlAudioError) => void

	/** Presents the sheet on `stationId`, else the loaded station, else the last one viewed. */
	openSheet: (stationId?: StationId) => void
	closeSheet: () => void
	/** Shows `stationId` in the sheet without touching playback. */
	browse: (stationId: StationId) => void

	/** Turning it off also stops the radio. */
	setShowOnHome: (on: boolean) => void
}

/**
 * The radio that plays across the whole app. Only `showOnHome` is persisted:
 * a relaunch should never start audio by itself.
 */
export const useRadioStore = create<RadioStore>()(
	persist(
		(set, get) => {
			// A player that has been replaced still posts its last events as it
			// unmounts; only the current one may change the station's state.
			let fromCurrentPlayer = (key: number) => key === get().playerKey

			return {
				stationId: null,
				playState: 'stopped',
				error: null,
				playerKey: 0,
				viewedStationId: 'ksto',
				sheetOpen: false,
				showOnHome: true,

				play: (stationId) =>
					set((state) => ({
						stationId,
						playState: 'starting',
						error: null,
						playerKey: state.playerKey + 1,
					})),
				stop: () => set({stationId: null, playState: 'stopped', error: null}),

				reportPlaying: (key) => {
					if (fromCurrentPlayer(key)) set({playState: 'playing'})
				},
				// A stream whose buffer has run dry is no longer heard, so it reads as
				// starting again until audio arrives.
				reportWaiting: (key) => {
					if (fromCurrentPlayer(key) && get().playState === 'playing') set({playState: 'starting'})
				},
				reportStopped: (key) => {
					// A player that has failed pauses once the store asks it to stop;
					// that pause must not unload the station and hide why it failed.
					if (fromCurrentPlayer(key) && get().error === null) get().stop()
				},
				reportError: (key, error) => {
					if (fromCurrentPlayer(key)) set({error, playState: 'stopped'})
				},

				openSheet: (stationId) =>
					set((state) => ({
						sheetOpen: true,
						viewedStationId: stationId ?? state.stationId ?? state.viewedStationId,
					})),
				closeSheet: () => set({sheetOpen: false}),
				browse: (stationId) => set({viewedStationId: stationId}),

				setShowOnHome: (on) => {
					set({showOnHome: on})
					if (!on) get().stop()
				},
			}
		},
		{
			name: 'radio-preferences',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({showOnHome: state.showOnHome}),
		},
	),
)

/**
 * Whether a station's control offers Stop rather than Play: while it is
 * starting or playing, and after it fails, when Stop is the only way to unload
 * it.
 */
export function offersStop(playState: RadioPlayState, error: HtmlAudioError | null): boolean {
	return playState !== 'stopped' || error !== null
}

/** What `stationId`'s own controls show: its state when it is loaded, and stopped otherwise. */
export function useStationPlayback(stationId: StationId): {
	playState: RadioPlayState
	error: HtmlAudioError | null
} {
	let loaded = useRadioStore((state) => state.stationId === stationId)
	let playState = useRadioStore((state) => (loaded ? state.playState : 'stopped'))
	let error = useRadioStore((state) => (loaded ? state.error : null))
	return {playState, error}
}
