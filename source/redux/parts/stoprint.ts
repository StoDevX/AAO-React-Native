import {loadLoginCredentials} from '../../lib/login'
import type {ReduxState} from '../index'
import type {Printer, PrintJob} from '../../lib/stoprint'
import {
	fetchAllPrinters,
	fetchColorPrinters,
	fetchJobs,
	fetchRecentPrinters,
	logIn,
} from '../../lib/stoprint'

type Dispatch<A extends Action> = (
	action: A | Promise<A> | ThunkAction<A>,
) => void
type GetState = () => ReduxState
type ThunkAction<A extends Action> = (
	dispatch: Dispatch<A>,
	getState: GetState,
) => void
type Action = UpdateAllPrintersAction | UpdatePrintJobsAction

const UPDATE_ALL_PRINTERS_FAILURE = 'stoprint/UPDATE_ALL_PRINTERS/FAILURE'
const UPDATE_ALL_PRINTERS_SUCCESS = 'stoprint/UPDATE_ALL_PRINTERS/SUCCESS'
const UPDATE_PRINT_JOBS_FAILURE = 'stoprint/UPDATE_PRINT_JOBS/FAILURE'
const UPDATE_PRINT_JOBS_SUCCESS = 'stoprint/UPDATE_PRINT_JOBS/SUCCESS'

type UpdateAllPrintersFailureAction = {
	type: 'stoprint/UPDATE_ALL_PRINTERS/FAILURE'
	payload: string
}

type UpdateAllPrintersSuccessAction = {
	type: 'stoprint/UPDATE_ALL_PRINTERS/SUCCESS'
	payload: {
		allPrinters: Array<Printer>
		popularPrinters: Array<Printer>
		recentPrinters: Array<Printer>
		colorPrinters: Array<Printer>
	}
}

type UpdateAllPrintersAction =
	| UpdateAllPrintersSuccessAction
	| UpdateAllPrintersFailureAction

type UpdatePrintJobsFailureAction = {
	type: 'stoprint/UPDATE_PRINT_JOBS/FAILURE'
	payload: string
}

type UpdatePrintJobsSuccessAction = {
	type: 'stoprint/UPDATE_PRINT_JOBS/SUCCESS'
	payload: Array<PrintJob>
}

type UpdatePrintJobsAction =
	| UpdatePrintJobsSuccessAction
	| UpdatePrintJobsFailureAction

export function updatePrinters(): ThunkAction<UpdateAllPrintersAction> {
	return async (dispatch) => {
		const {username, password} = await loadLoginCredentials()
		if (!username || !password) {
			return false
		}

		const successMsg = await logIn(username, password)
		if (successMsg !== 'success') {
			return dispatch({type: UPDATE_ALL_PRINTERS_FAILURE, payload: successMsg})
		}

		const [
			allPrintersResponse,
			recentAndPopularPrintersResponse,
			colorPrintersResponse,
		] = await Promise.all([
			fetchAllPrinters(username),
			fetchRecentPrinters(username),
			fetchColorPrinters(),
		])

		if (allPrintersResponse.error) {
			return dispatch({
				type: UPDATE_ALL_PRINTERS_FAILURE,
				payload: allPrintersResponse.value,
			})
		}

		if (recentAndPopularPrintersResponse.error) {
			return dispatch({
				type: UPDATE_ALL_PRINTERS_FAILURE,
				payload: recentAndPopularPrintersResponse.value,
			})
		}

		if (colorPrintersResponse.error) {
			return dispatch({
				type: UPDATE_ALL_PRINTERS_FAILURE,
				payload: colorPrintersResponse.value,
			})
		}

		const {recentPrinters, popularPrinters} =
			recentAndPopularPrintersResponse.value
		const allPrinters = allPrintersResponse.value

		const colorPrinters = allPrinters.filter((printer) =>
			colorPrintersResponse.value.data.colorPrinters.includes(
				printer.printerName,
			),
		)

		dispatch({
			type: UPDATE_ALL_PRINTERS_SUCCESS,
			payload: {allPrinters, recentPrinters, popularPrinters, colorPrinters},
		})
	}
}

export function updatePrintJobs(): ThunkAction<UpdatePrintJobsAction> {
	return async (dispatch) => {
		const {username, password} = await loadLoginCredentials()
		if (!username || !password) {
			return false
		}

		const successMsg = await logIn(username, password)
		if (successMsg !== 'success') {
			return dispatch({type: UPDATE_PRINT_JOBS_FAILURE, payload: successMsg})
		}

		const jobsResponse = await fetchJobs(username)

		if (jobsResponse.error) {
			return dispatch({
				type: UPDATE_PRINT_JOBS_FAILURE,
				payload: jobsResponse.value,
			})
		}

		dispatch({
			type: UPDATE_PRINT_JOBS_SUCCESS,
			payload: jobsResponse.value.jobs,
		})
	}
}

export type State = {
	jobs: Array<PrintJob>
	printers: Array<Printer>
	recentPrinters: Array<Printer> // printer names
	popularPrinters: Array<Printer> // printer names
	colorPrinters: Array<Printer>
	jobsError: string | null
	printersError: string | null
}

const initialState: State = {
	jobsError: null,
	printersError: null,
	jobs: [],
	printers: [],
	recentPrinters: [],
	popularPrinters: [],
	colorPrinters: [],
}

export function stoprint(state: State = initialState, action: Action): State {
	switch (action.type) {
		case UPDATE_PRINT_JOBS_FAILURE:
			return {...state, jobsError: action.payload}

		case UPDATE_PRINT_JOBS_SUCCESS:
			return {
				...state,
				jobs: action.payload,
				jobsError: null,
			}

		case UPDATE_ALL_PRINTERS_FAILURE:
			return {...state, printersError: action.payload}

		case UPDATE_ALL_PRINTERS_SUCCESS:
			return {
				...state,
				printers: action.payload.allPrinters,
				recentPrinters: action.payload.recentPrinters,
				popularPrinters: action.payload.popularPrinters,
				colorPrinters: action.payload.colorPrinters,
				printersError: null,
			}

		default:
			return state
	}
}
