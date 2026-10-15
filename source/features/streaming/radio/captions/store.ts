import {create} from 'zustand'

import {useRadioStore} from '../store'
import type {StationId} from '../stations'
import {EMPTY_CAPTIONS, reduceCaptions, type CaptionsState} from './reduce-captions'

type CaptionsStore = {
	/** What has been said and is being said; never saved. */
	captions: CaptionsState
	/** The station the captions belong to; null when there are none. */
	stationId: StationId | null

	/** Applies a caption event to the transcript. */
	apply: (action: Parameters<typeof reduceCaptions>[1]) => void
	/**
	 * A caption engine starts on `stationId`: the same station's transcript
	 * carries on, with a marker where it was off; another's is dropped.
	 */
	begin: (stationId: StationId) => void
	/** Drops the transcript. */
	clear: () => void
}

/**
 * The transcript of the station being captioned. It lives outside the captions
 * panel so hiding the panel, or closing the sheet, keeps what was said; it is
 * dropped when the viewed station changes or the radio stops, and never written to disk.
 */
export const useCaptionsStore = create<CaptionsStore>()((set, get) => ({
	captions: EMPTY_CAPTIONS,
	stationId: null,
	apply: (action) => set({captions: reduceCaptions(get().captions, action)}),
	begin: (stationId) =>
		set(
			get().stationId === stationId
				? {captions: reduceCaptions(get().captions, {kind: 'gap'})}
				: {captions: EMPTY_CAPTIONS, stationId},
		),
	clear: () => set({captions: EMPTY_CAPTIONS, stationId: null}),
}))

// The transcript is dropped with the station it was for: when the sheet shows
// another station, or the player stops or unloads.
useRadioStore.subscribe((state, previous) => {
	let stopped = state.stationId === null || state.playState === 'stopped'
	if (stopped || state.viewedStationId !== previous.viewedStationId) {
		useCaptionsStore.getState().clear()
	}
})
