// @flow

import {PAPERCUT_MOBILE_RELEASE_API, PAPERCUT_API, PAPERCUT} from './urls'
import querystring from 'query-string'
import {encode} from 'base-64'
import type {
	PrintJob,
	Printer,
	RecentPopularPrintersResponse,
	ReleaseResponseOrErrorType,
	CancelResponseOrErrorType,
	HeldJobsResponseOrErrorType,
	LoginResponseOrErrorType,
} from './types'

const PAPERCUT_API_HEADERS = new Headers({
	'Content-Type': 'application/x-www-form-urlencoded',
	Origin: PAPERCUT,
})

export async function logIn(
	username: string,
	password: string,
): Promise<'success' | string> {
	const now = new Date().getTime()
	const url = `${PAPERCUT_API}/webclient/users/${username}/log-in?nocache=${now}`
	const body = querystring.stringify({password: encode(password)})
	const result: LoginResponseOrErrorType = await fetchJson(url, {
		method: 'POST',
		body: body,
		headers: PAPERCUT_API_HEADERS,
	})
		.then(response => ({
			error: false,
			value: response,
		}))
		.catch(error => ({
			error: true,
			value: error,
		}))

	if (result.error) {
		return 'The print server seems to be having some issues'
	}

	if (!result.value.success) {
		return 'The username and password appear to be invalid'
	}

	return 'success'
}

export const fetchJobs = (username: string): Promise<{jobs: Array<PrintJob>}> =>
	fetchJson(`${PAPERCUT_API}/webclient/users/${username}/jobs/status`)

export const fetchAllPrinters = (username: string): Promise<Array<Printer>> =>
	fetchJson(`${PAPERCUT_MOBILE_RELEASE_API}/all-printers?username=${username}`)

export const fetchRecentPrinters = (
	username: string,
): Promise<RecentPopularPrintersResponse> =>
	fetchJson(
		`${PAPERCUT_MOBILE_RELEASE_API}/recent-popular-printers?username=${username}`,
	)

export const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
): Promise<HeldJobsResponseOrErrorType> =>
	// https://PAPERCUT_API.stolaf.edu/rpc/api/rest/internal/mobilerelease/api/held-jobs/?username=rives&printerName=printers%5Cmfc-it
	fetchJson(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/?username=${username}&printerName=printers%5C${printerName}`,
	)
		.then(response => ({
			error: false,
			value: response,
		}))
		.catch(error => ({
			error: true,
			value: error,
		}))

export const cancelPrintJobForUser = (
	jobId: string,
	username: string,
): CancelResponseOrErrorType =>
	fetch(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/cancel?username=${username}`,
		{
			method: 'POST',
			body: querystring.stringify(
				{
					jobIds: [jobId],
				},
				{arrayFormat: 'bracket'},
			),
			headers: PAPERCUT_API_HEADERS,
		},
	)
		.then(response => ({
			error: false,
			value: response,
		}))
		.catch(error => ({
			error: true,
			value: error,
		}))

export const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
}: {
	jobId: any,
	printerName: string,
	username: string,
}): Promise<ReleaseResponseOrErrorType> =>
	fetchJson(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/release?username=${username}`,
		{
			method: 'POST',
			body: querystring.stringify(
				{
					printerName: `printers\\${printerName}`,
					jobIds: [jobId],
				},
				{arrayFormat: 'bracket'},
			),
			headers: PAPERCUT_API_HEADERS,
		},
	)
		.then(response => {
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
		.catch(error => ({
			error: true,
			value: error,
		}))
