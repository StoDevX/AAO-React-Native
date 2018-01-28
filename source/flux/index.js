// @flow

import {createStore, applyMiddleware, combineReducers} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {app, type State as AppState} from './parts/app'
import {buildings, type State as BuildingsState} from './parts/buildings'
import {help, type State as HelpState} from './parts/help'
import {homescreen, type State as HomescreenState} from './parts/homescreen'
import {menus, type State as MenusState} from './parts/menus'
import {settings, type State as SettingsState} from './parts/settings'
import {sis, type State as SisState} from './parts/sis'
import {weeklyMovie, type State as WeeklyMovieState} from './parts/weekly-movie'

export {init as initRedux} from './init'
export {updateMenuFilters} from './parts/menus'

export type ReduxState = {
	app?: AppState,
	buildings?: BuildingsState,
	help?: HelpState,
	homescreen?: HomescreenState,
	menus?: MenusState,
	settings?: SettingsState,
	sis?: SisState,
	weeklyMovie?: WeeklyMovieState,
}

export const makeStore = () => {
	const aao: any = combineReducers({
		app,
		buildings,
		help,
		homescreen,
		menus,
		settings,
		sis,
		weeklyMovie,
	})

	const logger = createLogger({collapsed: () => true})
	return createStore(aao, applyMiddleware(reduxPromise, reduxThunk, logger))
}
