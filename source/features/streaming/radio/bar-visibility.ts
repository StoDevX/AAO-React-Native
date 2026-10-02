import type {StationId} from './stations'
import {useRadioStore} from './store'

/** Each Now Playing bar shows while a station is loaded, or while the switch asks for it. */
export function radioBarVisible(state: {
	stationId: StationId | null
	showOnHome: boolean
}): boolean {
	return state.stationId !== null || state.showOnHome
}

export function useRadioBarVisible(): boolean {
	return useRadioStore(radioBarVisible)
}
