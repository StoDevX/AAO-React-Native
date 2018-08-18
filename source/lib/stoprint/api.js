// @flow

import {PAPERCUT_MOBILE_RELEASE_API, PAPERCUT_API, PAPERCUT} from './urls'
import querystring from 'query-string'
import {encode} from 'base-64'

const PAPERCUT_API_HEADERS = new Headers({
	'Content-Type': 'application/x-www-form-urlencoded',
	Origin: PAPERCUT,
})

export async function logIn(
	username: string,
	password: string,
): Promise<'success' | string> {
	try {
		const now = new Date().getTime()
		const url = `${PAPERCUT_API}/webclient/users/${username}/log-in?nocache=${now}`
		const body = querystring.stringify({password: encode(password)})
		const result = await fetchJson(url, {
			method: 'POST',
			body: body,
			headers: PAPERCUT_API_HEADERS,
		})

		if (!result.success) {
			return 'The username and password appear to be invalid'
		}

		return 'success'
	} catch (err) {
		console.error(err)
		return 'The print server seems to be having some issues'
	}
}

export const fetchJobs = (username: string): Promise<Array<PrintJob>> =>
  fetchJson(`${PAPERCUT_API}/webclient/users/${username}/jobs/status`)

export const fetchAllPrinters = (username: string): Promise<Array<Printer>> =>
	fetchJson(`${PAPERCUT_MOBILE_RELEASE_API}/all-printers?username=${username}`)

export const fetchRecentPrinters = (
	username: string,
): Promise<RecentPrinters> =>
	fetchJson(
		`${PAPERCUT_MOBILE_RELEASE_API}/recent-popular-printers?username=${username}`,
	)

export const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
): Promise<Array<HeldJob>> =>
	// https://PAPERCUT_API.stolaf.edu/rpc/api/rest/internal/mobilerelease/api/held-jobs/?username=rives&printerName=printers%5Cmfc-it
	fetchJson(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/?username=${username}&printerName=printers%5C${printerName}`,
	)

export const cancelPrintJobForUser = (jobId, username) =>
	fetchJson(
		`${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/cancel?username=${username}`,
		{
			method: 'POST',
			body: querystring.stringify({
				jobIds: [jobId],
			},
      {arrayFormat: 'bracket'},
    ),
    headers: PAPERCUT_API_HEADERS,
		},
	)

export const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
}: {
	jobId: any,
	printerName: string,
	username: string,
}) => {
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
}
