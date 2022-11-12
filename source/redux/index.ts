import {createStore, applyMiddleware, combineReducers} from 'redux'
import type {Store} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {buildings} from './parts/buildings'
import type {State as BuildingsState, BuildingsAction} from './parts/buildings'
import {courses} from './parts/courses'
import type {State as CoursesState, CoursesAction} from './parts/courses'
import {login} from './parts/login'
import type {State as LoginState, LoginAction} from './parts/login'
import {settings} from './parts/settings'
import type {State as SettingsState, SettingsAction} from './parts/settings'
import {stoprint} from './parts/stoprint'
import type {State as StoPrintState, StoPrintAction} from './parts/stoprint'

import NetInfo from '@react-native-community/netinfo'
import {loadFavoriteBuildings} from './parts/buildings'
import {loadAcknowledgement} from './parts/settings'
import {loadRecentSearches, loadRecentFilters} from './parts/courses'

export type ReduxState = {
	courses?: CoursesState
	settings?: SettingsState
	buildings?: BuildingsState
	stoprint?: StoPrintState
	login?: LoginState
}

export type AppAction =
	| BuildingsAction
	| CoursesAction
	| LoginAction
	| SettingsAction
	| StoPrintAction

export function makeStore(): Store<ReduxState, AppAction> {
	const aao = combineReducers({
		courses,
		settings,
		buildings,
		stoprint,
		login,
	})

	const middleware = [reduxPromise, reduxThunk]

	if (__DEV__) {
		const logger = createLogger({
			collapsed: true,
			duration: true,
			// avoid logging the (large) course data state twice per action
			stateTransformer: (state) => ({
				...state,
				courses: {...state.courses, allCourses: '<omitted>'},
			}),
		})
		middleware.push(logger)
	}

	return createStore(aao, applyMiddleware(...middleware))
}

export async function initRedux(
	store: Store<ReduxState, AppAction>,
): Promise<void> {
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
	// ... when there is stuff to do ...
}
