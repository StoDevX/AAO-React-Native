// @flow

import {createStore, applyMiddleware, combineReducers} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {homescreen, type State as HomescreenState} from './parts/homescreen'
import {settings, type State as SettingsState} from './parts/settings'
import {balances, type State as BalancesState} from './parts/balances'
import {buildings, type State as BuildingsState} from './parts/buildings'
import {help, type State as HelpState} from './parts/help'
import {courses, type State as CoursesState} from './parts/courses'
import {stoprint, type State as StoPrintState} from './parts/stoprint'
import {
	notifications,
	type State as NotificationsState,
} from './parts/notifications'

export {init as initRedux} from './init'

export type ReduxState = {
	courses?: CoursesState,
	homescreen?: HomescreenState,
	settings?: SettingsState,
	balances?: BalancesState,
	buildings?: BuildingsState,
	help?: HelpState,
	stoprint?: StoPrintState,
	notifications?: NotificationsState,
}

export const makeStore = () => {
	const aao: any = combineReducers({
		courses,
		homescreen,
		settings,
		balances,
		buildings,
		help,
		stoprint,
		notifications,
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
