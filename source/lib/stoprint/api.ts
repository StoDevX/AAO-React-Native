import {mobileReleaseApi, papercutApi} from './urls'
import {encode} from 'base-64'
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
	LoginResponse,
	PrintJobsResponse,
	AllPrintersResponse,
	RecentPopularPrintersResponse,
	ColorPrintersResponse,
	HeldJobsResponse,
	ReleaseResponse,
	CancelResponse,
} from './types'
import {Options} from 'ky'
import {SharedWebCredentials} from 'react-native-keychain'
import {LoginFailedError} from '../login'
import {client} from '@frogpond/api'

export class PapercutJobReleaseError extends Error {}

export async function logIn(
	credentials: SharedWebCredentials,
	options: Options,
	now: number = new Date().getTime(),
): Promise<void> {
	let {username, password} = credentials

	if (isStoprintMocked) {
		return mockLogIn(credentials, now)
	}

	const result = (await papercutApi
		.post(`webclient/users/${username}/log-in`, {
			...options,
			body: new URLSearchParams({password: encode(password)}),
			searchParams: new URLSearchParams({nocache: String(now)}),
		})
		.json()) as LoginResponse

	if (!result.success) {
		throw new LoginFailedError()
	}

	return
}

export async function fetchJobs(
	username: string,
	options: Options,
): Promise<PrintJobsResponse> {
	if (isStoprintMocked) {
		return mockFetchJobs(username)
	}

	return (await papercutApi
		.get(`webclient/users/${username}/jobs/status`, options)
		.json()) as PrintJobsResponse
}

export async function fetchAllPrinters(
	username: string,
	options: Options,
): Promise<AllPrintersResponse> {
	if (isStoprintMocked) {
		return mockFetchAllPrinters(username)
	}

	return (await mobileReleaseApi
		.get('all-printers', {
			...options,
			searchParams: new URLSearchParams({username: username}),
		})
		.json()) as AllPrintersResponse
}

export async function fetchRecentPrinters(
	username: string,
	options: Options,
): Promise<RecentPopularPrintersResponse> {
	if (isStoprintMocked) {
		return mockFetchRecentPrinters(username)
	}

	return (await mobileReleaseApi
		.get('recent-popular-printers', {
			...options,
			searchParams: new URLSearchParams({username: username}),
		})
		.json()) as RecentPopularPrintersResponse
}

export async function fetchColorPrinters(options: Options): Promise<string[]> {
	let response = (await client
		.get('color-printers', options)
		.json()) as ColorPrintersResponse
	return response.data.colorPrinters
}

export async function heldJobsAvailableAtPrinterForUser(
	printerName: string,
	username: string,
	options: Options,
): Promise<HeldJobsResponse> {
	// https://PAPERCUT_API.stolaf.edu/rpc/api/rest/internal/mobilerelease/api/held-jobs/?username=rives&printerName=printers%5Cmfc-it
	if (isStoprintMocked) {
		return mockHeldJobsAvailableAtPrinterForUser(printerName, username)
	}

	return (await mobileReleaseApi
		.get('held-jobs', {
			...options,
			searchParams: new URLSearchParams({
				username: username,
				printerName: `printers\\${printerName}`,
			}),
		})
		.json()) as HeldJobsResponse
}

export async function cancelPrintJobForUser(
	jobId: string,
	username: string,
	options: Options,
): Promise<CancelResponse> {
	return (await mobileReleaseApi
		.post('held-jobs/cancel', {
			...options,
			searchParams: new URLSearchParams({username: username}),
			body: new URLSearchParams({'jobIds[]': jobId}),
		})
		.json()) as CancelResponse
}

type PrintJobReleaseArgs = {
	jobId: string
	printerName: string
	username: string
}

export async function releasePrintJobToPrinterForUser(
	{jobId, printerName, username}: PrintJobReleaseArgs,
	options: Options,
): Promise<ReleaseResponse> {
	if (isStoprintMocked) {
		return mockReleasePrintJobToPrinterForUser({jobId, printerName, username})
	}

	let response = (await mobileReleaseApi
		.post('held-jobs/release', {
			...options,
			searchParams: new URLSearchParams({username: username}),
			body: new URLSearchParams({
				printerName: `printers\\${printerName}`,
				'jobIds[]': jobId,
			}),
		})
		.json()) as ReleaseResponse

	if (response.numJobsReleased === 0) {
		throw new PapercutJobReleaseError()
	}

	return response
}
