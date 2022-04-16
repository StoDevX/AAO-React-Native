import {createStore, applyMiddleware, combineReducers} from 'redux'
import type {Store} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {buildings} from './parts/buildings'
import type {State as BuildingsState, BuildingsAction} from './parts/buildings'
import {courses} from './parts/courses'
import type {State as CoursesState, CoursesAction} from './parts/courses'
import {help} from './parts/help'
import type {State as HelpState, HelpAction} from './parts/help'
import {login} from './parts/login'
import type {State as LoginState, LoginAction} from './parts/login'
import {settings} from './parts/settings'
import type {State as SettingsState, SettingsAction} from './parts/settings'
import {stoprint} from './parts/stoprint'
import type {State as StoPrintState, StoPrintAction} from './parts/stoprint'

export {init as initRedux} from './init'

export type ReduxState = {
	courses?: CoursesState
	settings?: SettingsState
	buildings?: BuildingsState
	help?: HelpState
	stoprint?: StoPrintState
	login?: LoginState
}

type AppAction =
	| BuildingsAction
	| CoursesAction
	| HelpAction
	| LoginAction
	| SettingsAction
	| StoPrintAction

export function makeStore(): Store<ReduxState, AppAction> {
	const aao = combineReducers({
		courses,
		settings,
		buildings,
		help,
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
