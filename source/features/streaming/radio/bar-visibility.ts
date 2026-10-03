import {useSyncExternalStore} from 'react'

import type {StationId} from './stations'
import {useRadioStore} from './store'

/**
 * Each Now Playing bar shows while a station is loaded, or while the switch
 * asks for it. Until the saved switch has loaded it is unknown, so the idle bar
 * waits rather than showing and then vanishing.
 */
export function radioBarVisible(state: {
	stationId: StationId | null
	showOnHome: boolean
	hydrated: boolean
}): boolean {
	return state.stationId !== null || (state.hydrated && state.showOnHome)
}

function subscribeToHydration(onChange: () => void): () => void {
	return useRadioStore.persist.onFinishHydration(onChange)
}

export function useRadioBarVisible(): boolean {
	let hydrated = useSyncExternalStore(subscribeToHydration, useRadioStore.persist.hasHydrated)
	let stationId = useRadioStore((state) => state.stationId)
	let showOnHome = useRadioStore((state) => state.showOnHome)
	return radioBarVisible({stationId, showOnHome, hydrated})
}
