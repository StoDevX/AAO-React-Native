// @flow

import {loadLoginCredentials} from '../../lib/login'
import {encode} from 'base-64'
import {type ReduxState} from '../index'
import type {
	HeldJob,
	PrintJob,
	Printer,
	RecentPopularPrintersResponse as RecentPrinters,
} from '../../views/stoprint/types'
import {fetchAllPrinters, fetchJobs, fetchRecentPrinters, logIn} from '../../lib/stoprint'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action = UpdateAllPrintersAction | UpdatePrintJobsAction

const UPDATE_ALL_PRINTERS_START = 'stoprint/UPDATE_ALL_PRINTERS/START'
const UPDATE_ALL_PRINTERS_FAILURE = 'stoprint/UPDATE_ALL_PRINTERS/FAILURE'
const UPDATE_ALL_PRINTERS_SUCCESS = 'stoprint/UPDATE_ALL_PRINTERS/SUCCESS'
const UPDATE_PRINT_JOBS_START = 'stoprint/UPDATE_PRINT_JOBS/START'
const UPDATE_PRINT_JOBS_FAILURE = 'stoprint/UPDATE_PRINT_JOBS/FAILURE'
const UPDATE_PRINT_JOBS_SUCCESS = 'stoprint/UPDATE_PRINT_JOBS/SUCCESS'

type UpdateAllPrintersStartAction = {
	type: 'stoprint/UPDATE_ALL_PRINTERS/START',
}

type UpdateAllPrintersFailureAction = {
	type: 'stoprint/UPDATE_ALL_PRINTERS/FAILURE',
	payload: string,
}

type UpdateAllPrintersSuccessAction = {
	type: 'stoprint/UPDATE_ALL_PRINTERS/SUCCESS',
	payload: {
		allPrinters: Array<Printer>,
		popularPrinters: Array<Printer>,
		recentPrinters: Array<Printer>,
	},
}

type UpdateAllPrintersAction =
	| UpdateAllPrintersSuccessAction
	| UpdateAllPrintersFailureAction
	| UpdateAllPrintersStartAction

type UpdatePrintJobsStartAction = {
	type: 'stoprint/UPDATE_PRINT_JOBS/START',
}

type UpdatePrintJobsFailureAction = {
	type: 'stoprint/UPDATE_PRINT_JOBS/FAILURE',
	payload: string,
}

type UpdatePrintJobsSuccessAction = {
	type: 'stoprint/UPDATE_PRINT_JOBS/SUCCESS',
	payload: Array<PrintJob>,
}

type UpdatePrintJobsAction =
	| UpdatePrintJobsSuccessAction
	| UpdatePrintJobsFailureAction
	| UpdatePrintJobsStartAction

export function updatePrinters(): ThunkAction<UpdateAllPrintersAction> {
	return async dispatch => {
		const {username, password} = await loadLoginCredentials()
		if (!username || !password) {
			return false
		}

		dispatch({type: UPDATE_ALL_PRINTERS_START})

		const successMsg = await logIn(username, password)
		if (successMsg !== 'success') {
			return dispatch({type: UPDATE_ALL_PRINTERS_FAILURE, payload: successMsg})
		}

		const [allPrinters, recentAndPopularPrinters] = await Promise.all([
			fetchAllPrinters(username),
			fetchRecentPrinters(username),
		])

		const {recentPrinters, popularPrinters} = recentAndPopularPrinters

		dispatch({
			type: UPDATE_ALL_PRINTERS_SUCCESS,
			payload: {allPrinters, recentPrinters, popularPrinters},
		})
	}
}

export function updatePrintJobs(): ThunkAction<UpdatePrintJobsAction> {
	return async dispatch => {
		const {username, password} = await loadLoginCredentials()
		if (!username || !password) {
			return false
		}

		dispatch({type: UPDATE_PRINT_JOBS_START})

		const successMsg = await logIn(username, password)
		if (successMsg !== 'success') {
			return dispatch({type: UPDATE_PRINT_JOBS_FAILURE, payload: successMsg})
		}

		const {jobs} = await fetchJobs(username)

		dispatch({type: UPDATE_PRINT_JOBS_SUCCESS, payload: jobs})
	}
}

export type State = {|
	jobs: Array<PrintJob>,
	printers: Array<Printer>,
	recentPrinters: Array<Printer>, // printer names
	popularPrinters: Array<Printer>, // printer names
	error: ?string,
	loadingPrinters: boolean,
	loadingJobs: boolean,
|}

const initialState: State = {
	error: null,
	jobs: [],
	printers: [],
	recentPrinters: [],
	popularPrinters: [],
	loadingPrinters: false,
	loadingJobs: false,
}

export function stoprint(state: State = initialState, action: Action) {
	switch (action.type) {
		case UPDATE_PRINT_JOBS_START:
			return {...state, loadingJobs: true, error: null}

		case UPDATE_PRINT_JOBS_FAILURE:
			return {...state, loadingJobs: false, error: action.payload}

		case UPDATE_PRINT_JOBS_SUCCESS:
			return {
				...state,
				jobs: action.payload,
				error: null,
				loadingJobs: false,
			}

		case UPDATE_ALL_PRINTERS_START:
			return {...state, loadingPrinters: true, error: null}

		case UPDATE_ALL_PRINTERS_FAILURE:
			return {...state, loadingPrinters: false, error: action.payload}

		case UPDATE_ALL_PRINTERS_SUCCESS:
			return {
				...state,
				printers: action.payload.allPrinters,
				recentPrinters: action.payload.recentPrinters,
				popularPrinters: action.payload.popularPrinters,
				error: null,
				loadingPrinters: false,
			}

		default:
			return state
	}
}
