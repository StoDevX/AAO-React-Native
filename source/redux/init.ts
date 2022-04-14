// Functions to initialize bits of the global state, as appropriate

import NetInfo from '@react-native-community/netinfo'
import {getEnabledTools} from './parts/help'
import {loadFavoriteBuildings} from './parts/buildings'
import {loadAcknowledgement} from './parts/settings'
import {loadRecentSearches, loadRecentFilters} from './parts/courses'
import {AnyAction, Store} from 'redux'

// TODO: Perhaps restrict the any and AnyAction types a bit further?
export async function init(store: Store<any, AnyAction>): Promise<void> {
	// this function runs in two parts: the things that don't care about
	// network, and those that do.

	// kick off the parts that don't care about network in parallel
	await Promise.all([
		loadAcknowledgement().then(store.dispatch),
		loadFavoriteBuildings().then(store.dispatch),
		loadRecentSearches().then(store.dispatch),
		loadRecentFilters().then(store.dispatch),
	])

	// wait for our first connection check to happen
	await NetInfo.fetch()

	// then go do the network stuff in parallel
	await Promise.all([store.dispatch(getEnabledTools())])
}
