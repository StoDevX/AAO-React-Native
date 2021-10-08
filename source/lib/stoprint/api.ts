/* globals Headers */

import {fetch as fpFetch} from '@frogpond/fetch'
import {PAPERCUT_MOBILE_RELEASE_API, PAPERCUT_API, PAPERCUT} from './urls'
import querystring from 'query-string'
import {encode} from 'base-64'
import {API} from '@frogpond/api'
import type {
	PrintJobsResponseOrErrorType,
	AllPrintersResponseOrErrorType,
	ColorPrintersResponseOrErrorType,
	RecentPopularPrintersResponseOrErrorType,
	ReleaseResponseOrErrorType,
	CancelResponseOrErrorType,
	HeldJobsResponseOrErrorType,
	LoginResponseOrErrorType,
} from './types'
import {AnyObject} from '../../views/types'

const PAPERCUT_API_HEADERS = {
	'Content-Type': 'application/x-www-form-urlencoded',
	Origin: PAPERCUT,
}

const papercut = (url, opts: AnyObject = {}) =>
	fpFetch(url, {cache: 'no-store', ...opts}).json()

export async function logIn(
	username: string,
	password: string,
): Promise<'success' | string> {
	const now = new Date().getTime()
	const url = `${PAPERCUT_API}/webclient/users/${username}/log-in?nocache=${now}`
	const body = querystring.stringify({password: encode(password)})
	const result: LoginResponseOrErrorType = await papercut(url, {
		method: 'POST',
		body: body,
		headers: PAPERCUT_API_HEADERS,
	})
		.then((response) => ({error: false, value: response}))
		.catch((error) => ({error: true, value: error}))

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
): Promise<PrintJobsResponseOrErrorType> =>
	papercut(`${PAPERCUT_API}/webclient/users/${username}/jobs/status`)
		.then((response) => ({error: false, value: response}))
		.catch(() => ({
			error: true,
			value: 'Unable to fetch a list of print jobs from stoPrint.',
		}))

export const fetchAllPrinters = (
	username: string,
): Promise<AllPrintersResponseOrErrorType> =>
	papercut(`${PAPERCUT_MOBILE_RELEASE_API}/all-printers?username=${username}`)
		.then((response) => ({error: false, value: response}))
		.catch(() => ({
			error: true,
			value: 'Unable to fetch the list of all printers from stoPrint.',
		}))

export const fetchRecentPrinters = (
	username: string,
): Promise<RecentPopularPrintersResponseOrErrorType> =>
	papercut(
		`${PAPERCUT_MOBILE_RELEASE_API}/recent-popular-printers?username=${username}`,
	)
		.then((response) => ({error: false, value: response}))
		.catch(() => ({
			error: true,
			value: 'Unable to fetch a list of recent printers from stoPrint.',
		}))

const colorPrintersUrl = API('/printing/color-printers')

export const fetchColorPrinters =
	(): Promise<ColorPrintersResponseOrErrorType> =>
		papercut(colorPrintersUrl)
			.then((response) => ({error: false, value: response}))
			.catch(() => ({
				error: true,
				value: 'Unable to fetch the list of color printers from stoPrint.',
			}))

export const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
): Promise<HeldJobsResponseOrErrorType> =>
	// https://PAPERCUT_API.stolaf.edu/rpc/api/rest/internal/mobilerelease/api/held-jobs/?username=rives&printerName=printers%5Cmfc-it
	papercut(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/?username=${username}&printerName=printers%5C${printerName}`,
	)
		.then((response) => ({error: false, value: response}))
		.catch((error) => ({error: true, value: error}))

export const cancelPrintJobForUser = (
	jobId: string,
	username: string,
): CancelResponseOrErrorType =>
	fetch(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/cancel?username=${username}`,
		{
			method: 'POST',
			body: querystring.stringify({'jobIds[]': jobId}),
			headers: new Headers(PAPERCUT_API_HEADERS),
		},
	)
		.then((r) => r.json())
		.then((response) => ({error: false, value: response}))
		.catch((error) => ({error: true, value: error}))

export const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
}: {
	jobId: string
	printerName: string
	username: string
}): Promise<ReleaseResponseOrErrorType> =>
	papercut(
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
		.then((response) => {
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
		.catch((error) => ({
			error: true,
			value: error,
		}))
