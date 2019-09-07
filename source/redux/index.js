// @flow

import {createStore, applyMiddleware, combineReducers, type Store} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {settings, type State as SettingsState} from './parts/settings'
import {buildings, type State as BuildingsState} from './parts/buildings'
import {help, type State as HelpState} from './parts/help'
import {courses, type State as CoursesState} from './parts/courses'
import {stoprint, type State as StoPrintState} from './parts/stoprint'
import {login, type State as LoginState} from './parts/login'

export {init as initRedux} from './init'

export type ReduxState = {
	courses?: CoursesState,
	settings?: SettingsState,
	buildings?: BuildingsState,
	help?: HelpState,
	stoprint?: StoPrintState,
	login?: LoginState,
}

export function makeStore(): Store<*, *, *> {
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
			stateTransformer: state => ({
				...state,
				courses: {...state.courses, allCourses: '<omitted>'},
			}),
		})
		middleware.push(logger)
	}

	return createStore(aao, applyMiddleware(...middleware))
}
