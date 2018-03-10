// @flow

import {createStore, applyMiddleware, combineReducers} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {app, type State as AppState} from './parts/app'
import {homescreen, type State as HomescreenState} from './parts/homescreen'
import {menus, type State as MenusState} from './parts/menus'
import {settings, type State as SettingsState} from './parts/settings'
import {sis, type State as SisState} from './parts/sis'
import {buildings, type State as BuildingsState} from './parts/buildings'
import {help, type State as HelpState} from './parts/help'
import {
	courseSearch,
	type State as CourseSearchState,
} from './parts/course-search'

export {init as initRedux} from './init'
export {updateMenuFilters} from './parts/menus'

export type ReduxState = {
	app?: AppState,
	courseSearch?: CourseSearchState,
	homescreen?: HomescreenState,
	menus?: MenusState,
	settings?: SettingsState,
	sis?: SisState,
	buildings?: BuildingsState,
	help?: HelpState,
}

export const makeStore = () => {
	const aao: any = combineReducers({
		app,
		courseSearch,
		homescreen,
		menus,
		settings,
		sis,
		buildings,
		help,
	})

	const middleware = [reduxPromise, reduxThunk]

	if (__DEV__) {
		const logger = createLogger({
			collapsed: true,
			duration: true,
			// avoid logging the (large) course data state twice per action
			stateTransformer: state => ({...state, courseSearch: '<omitted>'}),
		})
		middleware.push(logger)
	}

	return createStore(aao, applyMiddleware(...middleware))
}
