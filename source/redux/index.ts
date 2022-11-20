import {createStore, applyMiddleware, combineReducers} from 'redux'
import type {Store} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {settingsReducer} from './parts/settings'
import type {State as SettingsState} from './parts/settings'
import {buildingsReducer} from './parts/buildings'
import type {State as BuildingsState} from './parts/buildings'
import {coursesReducer} from './parts/courses'
import type {State as CoursesState} from './parts/courses'
import {stoprintReducer} from './parts/stoprint'
import type {State as StoPrintState} from './parts/stoprint'
import {loginReducer} from './parts/login'
import type {State as LoginState} from './parts/login'

export {init as initRedux} from './init'

export type ReduxState = {
	courses?: CoursesState
	settings?: SettingsState
	buildings?: BuildingsState
	stoprint?: StoPrintState
	login?: LoginState
}

export function makeStore(): Store {
	const aao = combineReducers({
		coursesReducer,
		settingsReducer,
		buildingsReducer,
		stoprintReducer,
		loginReducer,
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
