/* globals Headers */

import {ExpandedFetchArgs, fetch as fpFetch} from '@frogpond/fetch'
import {PAPERCUT_MOBILE_RELEASE_API, PAPERCUT_API, PAPERCUT} from './urls'
import querystring from 'query-string'
import {encode} from 'base-64'
import {API} from '@frogpond/api'
import {
	fetchAllPrinters as mockFetchAllPrinters,
	fetchRecentPrinters as mockFetchRecentPrinters,
	fetchJobs as mockFetchJobs,
	heldJobsAvailableAtPrinterForUser as mockHeldJobsAvailableAtPrinterForUser,
	logIn as mockLogIn,
	releasePrintJobToPrinterForUser as mockReleasePrintJobToPrinterForUser,
} from './__mocks__/api'
import {isStoprintMocked} from '../../lib/stoprint'

import type {
	PrintJobsResponseOrErrorType,
	AllPrintersResponseOrErrorType,
	ColorPrintersResponseOrErrorType,
	RecentPopularPrintersResponseOrErrorType,
	ReleaseResponseOrErrorType,
	CancelResponseOrErrorType,
	HeldJobsResponseOrErrorType,
	LoginResponse,
	LoginResponseOrErrorType,
	PrintJobsResponse,
	AllPrintersResponse,
	RecentPopularPrintersResponse,
	ColorPrintersReponse,
	HeldJobsResponse,
	ReleaseResponse,
} from './types'

const PAPERCUT_API_HEADERS = {
	'Content-Type': 'application/x-www-form-urlencoded',
	Origin: PAPERCUT,
}

function papercut<T>(url: string, opts?: ExpandedFetchArgs): Promise<T> {
	return fpFetch(url, {cache: 'no-store', ...opts}).json<T>()
}

export async function logIn(
	username: string,
	password: string,
): Promise<'success' | string> {
	if (isStoprintMocked) {
		return mockLogIn(username, password)
	}

	const now = new Date().getTime()
	const url = `${PAPERCUT_API}/webclient/users/${username}/log-in?nocache=${now}`
	const body = querystring.stringify({password: encode(password)})
	const result: LoginResponseOrErrorType = await papercut<LoginResponse>(url, {
		method: 'POST',
		body: body,
		headers: PAPERCUT_API_HEADERS,
	})
		.then(
			(response: LoginResponse): LoginResponseOrErrorType => ({
				error: false,
				value: response,
			}),
		)
		.catch(
			(error: Error): LoginResponseOrErrorType => ({
				error: true,
				value: error,
			}),
		)

	if (result.error) {
		return 'The print server seems to be having some issues.'
	}

	if (!result.value.success) {
		return 'Your username or password appear to be invalid.'
	}

	return 'success'
}

export const fetchJobs = (
	username: string,
): Promise<PrintJobsResponseOrErrorType> => {
	if (isStoprintMocked) {
		return mockFetchJobs(username)
	}

	return papercut<PrintJobsResponse>(
		`${PAPERCUT_API}/webclient/users/${username}/jobs/status`,
	)
		.then(
			(response: PrintJobsResponse): PrintJobsResponseOrErrorType => ({
				error: false,
				value: response,
			}),
		)
		.catch(
			(): PrintJobsResponseOrErrorType => ({
				error: true,
				value: 'Unable to fetch a list of print jobs from stoPrint.',
			}),
		)
}

export const fetchAllPrinters = (
	username: string,
): Promise<AllPrintersResponseOrErrorType> => {
	if (isStoprintMocked) {
		return mockFetchAllPrinters(username)
	}

	return papercut<AllPrintersResponse>(
		`${PAPERCUT_MOBILE_RELEASE_API}/all-printers?username=${username}`,
	)
		.then(
			(response: AllPrintersResponse): AllPrintersResponseOrErrorType => ({
				error: false,
				value: response,
			}),
		)
		.catch(
			(): AllPrintersResponseOrErrorType => ({
				error: true,
				value: 'Unable to fetch the list of all printers from stoPrint.',
			}),
		)
}

export const fetchRecentPrinters = (
	username: string,
): Promise<RecentPopularPrintersResponseOrErrorType> => {
	if (isStoprintMocked) {
		return mockFetchRecentPrinters(username)
	}

	return papercut<RecentPopularPrintersResponse>(
		`${PAPERCUT_MOBILE_RELEASE_API}/recent-popular-printers?username=${username}`,
	)
		.then(
			(
				response: RecentPopularPrintersResponse,
			): RecentPopularPrintersResponseOrErrorType => ({
				error: false,
				value: response,
			}),
		)
		.catch(
			(): RecentPopularPrintersResponseOrErrorType => ({
				error: true,
				value: 'Unable to fetch a list of recent printers from stoPrint.',
			}),
		)
}

const colorPrintersUrl = API('/printing/color-printers')

export const fetchColorPrinters =
	(): Promise<ColorPrintersResponseOrErrorType> =>
		papercut<ColorPrintersReponse>(colorPrintersUrl)
			.then(
				(response: ColorPrintersReponse): ColorPrintersResponseOrErrorType => ({
					error: false,
					value: response,
				}),
			)
			.catch(() => ({
				error: true,
				value: 'Unable to fetch the list of color printers from stoPrint.',
			}))

export const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
): Promise<HeldJobsResponseOrErrorType> => {
	// https://PAPERCUT_API.stolaf.edu/rpc/api/rest/internal/mobilerelease/api/held-jobs/?username=rives&printerName=printers%5Cmfc-it
	if (isStoprintMocked) {
		return mockHeldJobsAvailableAtPrinterForUser(printerName, username)
	}

	return papercut<HeldJobsResponse>(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/?username=${username}&printerName=printers%5C${printerName}`,
	)
		.then(
			(response: HeldJobsResponse): HeldJobsResponseOrErrorType => ({
				error: false,
				value: response,
			}),
		)
		.catch(
			(error): HeldJobsResponseOrErrorType => ({error: true, value: error}),
		)
}

export const cancelPrintJobForUser = (
	jobId: string,
	username: string,
): Promise<CancelResponseOrErrorType> =>
	fetch(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/cancel?username=${username}`,
		{
			method: 'POST',
			body: querystring.stringify({'jobIds[]': jobId}),
			headers: new Headers(PAPERCUT_API_HEADERS),
		},
	)
		.then(
			(response: Response): CancelResponseOrErrorType => ({
				error: false,
				value: response,
			}),
		)
		.catch((error): CancelResponseOrErrorType => ({error: true, value: error}))

export const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
}: {
	jobId: string
	printerName: string
	username: string
}): Promise<ReleaseResponseOrErrorType> => {
	if (isStoprintMocked) {
		return mockReleasePrintJobToPrinterForUser({jobId, printerName, username})
	}

	return papercut<ReleaseResponse>(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/release?username=${username}`,
		{
			method: 'POST',
			body: querystring.stringify({
				printerName: `printers\\${printerName}`,
				'jobIds[]': jobId,
			}),
			headers: PAPERCUT_API_HEADERS,
		},
	)
		.then((response: ReleaseResponse): ReleaseResponseOrErrorType => {
			if (response.numJobsReleased === 0) {
				return {
					error: true,
					value: new Error('Problem with Papercut API releasing job'),
				}
			} else {
				return {
					error: false,
					value: response,
				}
			}
		})
		.catch(
			(error): ReleaseResponseOrErrorType => ({
				error: true,
				value: error,
			}),
		)
}
