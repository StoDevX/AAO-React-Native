// @flow

import {loadLoginCredentials} from '../../lib/login'
import querystring from 'querystring'
import {encode} from 'base-64'
import {type ReduxState} from '../index'
import type {
	PrintJob,
	Printer,
	RecentPopularPrintersResponse as RecentPrinters,
} from '../../views/stoprint/types'

const PAPERCUT = 'https://papercut.stolaf.edu:9192/rpc/api/rest/internal'

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

async function logIn(
	username: string,
	password: string,
): Promise<'success' | string> {
	try {
		const now = new Date().getTime()
		const url = `${PAPERCUT}/webclient/users/${username}/log-in?nocache=${now}`
		const headers = new Headers({
			'Content-Type': 'application/x-www-form-urlencoded',
		})
		const body = querystring.stringify({password: encode(password)})
		const result = await fetchJson(url, {method: 'POST', body, headers})

		if (!result.success) {
			return 'The username and password appear to be invalid'
		}

		return 'success'
	} catch (err) {
		console.error(err)
		return 'The print server seems to be having some issues'
	}
}

const mobileRelease = `${PAPERCUT}/mobilerelease/api`

const fetchAllPrinters = (username: string): Promise<Array<Printer>> =>
	fetchJson(`${mobileRelease}/all-printers?username=${username}`)

const fetchRecentPrinters = (username: string): Promise<RecentPrinters> =>
	fetchJson(`${mobileRelease}/recent-popular-printers?username=${username}`)

const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
): Promise<{}> =>
	// https://papercut.stolaf.edu/rpc/api/rest/internal/mobilerelease/api/held-jobs/?username=rives&printerName=printers%5Cmfc-it
	fetchJson(
		`${mobileRelease}/held-jobs/?username=${username}&printerName=printers%5c\\${printerName}`,
	)

const cancelPrintJobForUser = (jobId, username) =>
	// url: '/rpc/api/rest/internal/mobilerelease/api/held-jobs/cancel?username=' + MRApp.session.get('username'),
	// data: {
	//   jobIds: selectedJobIds
	// },
	fetchJson(`${mobileRelease}/held-jobs/cancel?username=${username}`, {
		method: 'POST',
		body: JSON.stringify({
			jobIds: [jobId],
		}),
	})

const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
}: {
	jobId: any,
	printerName: string,
	username: string,
}) =>
	// url: '/rpc/api/rest/internal/mobilerelease/api/held-jobs/release?username=' + MRApp.session.get('username'),
	// data: {
	//   printerName: this.model._printerName,
	//   jobIds: selectedJobIds
	// },
	fetchJson(`${mobileRelease}/held-jobs/release?username=${username}`, {
		method: 'POST',
		body: JSON.stringify({
			printerName,
			jobIds: [jobId],
		}),
	})

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

		const url = `https://papercut.stolaf.edu:9192/rpc/api/rest/internal/webclient/users/${username}/jobs/status`
		const {jobs} = await fetchJson(url)

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
