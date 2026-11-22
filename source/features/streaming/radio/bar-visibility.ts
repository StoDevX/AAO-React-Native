import type {StationId} from './stations'
import {useIsDevMode} from '../../../lib/use-is-dev-mode'
import {useOfferedStations} from './station-flags'
import {useRadioStore} from './store'

/**
 * Home's Now Playing bar shows while a station is loaded, or while the switch
 * asks for it. (Streaming Media's always shows: it is the radio's home.) Until
 * the saved switch has loaded it is unknown, so the idle bar waits rather than
 * showing and then vanishing. The radio mini-player is behind dev mode, so
 * nothing shows while it is off, nor while every station is switched off.
 */
export function radioBarVisible(state: {
	stationId: StationId | null
	showOnHome: boolean
	hydrated: boolean
	isDev: boolean
	anyStationOn: boolean
}): boolean {
	return (
		state.isDev &&
		state.anyStationOn &&
		(state.stationId !== null || (state.hydrated && state.showOnHome))
	)
}

export function useRadioBarVisible(): boolean {
	let hydrated = useRadioStore((state) => state.hydrated)
	let stationId = useRadioStore((state) => state.stationId)
	let showOnHome = useRadioStore((state) => state.showOnHome)
	let isDev = useIsDevMode()
	let anyStationOn = useOfferedStations().length > 0
	return radioBarVisible({stationId, showOnHome, hydrated, isDev, anyStationOn})
}
