import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import {STATION_LIST, type StationId} from './stations'
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

	/** The station the sheet shows. Browsing it never changes playback. Persisted. */
	viewedStationId: StationId
	/** Whether the Now Playing sheet is presented. */
	sheetOpen: boolean
	/** Whether the full schedule is stacked over the Now Playing sheet. */
	fullScheduleOpen: boolean

	/** Whether Home's Now Playing bar shows while nothing is loaded. Persisted. */
	showOnHome: boolean
	/** The logo each station last showed, by its place in the station's logos. Persisted. */
	logoIndexes: Partial<Record<StationId, number>>
	/** Whether the saved preferences have been read, or could not be. */
	hydrated: boolean

	/** Starts `stationId` in a fresh player, replacing any other station. */
	play: (stationId: StationId) => void
	/** Pauses the loaded station, which stays loaded, as Control Center's does. */
	pause: () => void
	/**
	 * Starts a paused station again in the player it has, which has reloaded the
	 * stream. Playing it instead mounts a fresh player.
	 */
	resume: () => void
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
	/** Stacks the viewed station's full schedule over the sheet. */
	openFullSchedule: () => void
	closeFullSchedule: () => void
	/** Shows `stationId` in the sheet without touching playback. */
	browse: (stationId: StationId) => void

	/** Remembers which of `stationId`'s logos the record shows. */
	setLogoIndex: (stationId: StationId, index: number) => void

	/** Turning it off also stops the radio. */
	setShowOnHome: (on: boolean) => void
}

/** Whether the station is starting or playing, which is when Pause has something to do. */
function isRunning(playState: RadioPlayState): boolean {
	return playState === 'starting' || playState === 'playing'
}

/**
 * The radio that plays across the whole app. Only the Home switch, each
 * station's logo and the station last viewed are persisted: a relaunch should
 * never start audio by itself.
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
				// The first station the player offers: KSTO, as it always was.
				viewedStationId: STATION_LIST[0].id,
				sheetOpen: false,
				fullScheduleOpen: false,
				showOnHome: true,
				logoIndexes: {},
				hydrated: false,

				play: (stationId) =>
					set((state) => ({
						stationId,
						playState: 'starting',
						error: null,
						playerKey: state.playerKey + 1,
					})),
				pause: () => {
					if (isRunning(get().playState)) set({playState: 'paused'})
				},
				resume: () => {
					if (get().playState === 'paused') set({playState: 'starting'})
				},
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
					// A player that has failed goes quiet once the store has stopped it;
					// that must not hide why it failed, and a paused one already is.
					if (fromCurrentPlayer(key) && get().error === null) get().pause()
				},
				reportError: (key, error) => {
					if (fromCurrentPlayer(key)) set({error, playState: 'stopped'})
				},

				openSheet: (stationId) =>
					set((state) => ({
						sheetOpen: true,
						viewedStationId: stationId ?? state.stationId ?? state.viewedStationId,
					})),
				closeSheet: () => set({sheetOpen: false, fullScheduleOpen: false}),
				openFullSchedule: () => set({fullScheduleOpen: true}),
				closeFullSchedule: () => set({fullScheduleOpen: false}),
				browse: (stationId) => set({viewedStationId: stationId}),

				setLogoIndex: (stationId, index) =>
					set((state) => ({logoIndexes: {...state.logoIndexes, [stationId]: index}})),

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
			partialize: (state) => ({
				showOnHome: state.showOnHome,
				logoIndexes: state.logoIndexes,
				viewedStationId: state.viewedStationId,
			}),
			// Persist reports a failed read only here, never through its own
			// `hasHydrated`, so a corrupt value would otherwise leave the app waiting.
			onRehydrateStorage: () => () => useRadioStore.setState({hydrated: true}),
		},
	),
)

/**
 * What a station's control does when pressed: Pause while it starts or plays,
 * Play when it is paused or not loaded, and Stop after it fails, when
 * unloading it is the only way to clear the error.
 */
export function radioControl(
	playState: RadioPlayState,
	error: HtmlAudioError | null,
): 'play' | 'pause' | 'stop' {
	if (error !== null) {
		return 'stop'
	}
	return isRunning(playState) ? 'pause' : 'play'
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
