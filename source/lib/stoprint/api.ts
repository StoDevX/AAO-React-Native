import {mobileReleaseApi, papercutApi} from './urls'
import {encode} from 'base-64'
import {
	fetchAllPrinters as mockFetchAllPrinters,
	fetchJobs as mockFetchJobs,
	fetchRecentPrinters as mockFetchRecentPrinters,
	heldJobsAvailableAtPrinterForUser as mockHeldJobsAvailableAtPrinterForUser,
	logIn as mockLogIn,
	releasePrintJobToPrinterForUser as mockReleasePrintJobToPrinterForUser,
} from './__mocks__/api'
import {isStoprintMocked} from '../../lib/stoprint'

import type {
	AllPrintersResponse,
	CancelResponse,
	ColorPrintersResponse,
	HeldJobsResponse,
	LoginResponse,
	PrintJobsResponse,
	RecentPopularPrintersResponse,
	ReleaseResponse,
} from './types'
import {type Options} from 'ky'
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

	const result = await papercutApi
		.post<LoginResponse>(`webclient/users/${username}/log-in`, {
			...options,
			// use URLSearchParams to auto-set Content-Type: application/x-www-form-urlencoded
			// @ts-expect-error react-native's URLSearchParams type is not compatible with RequestBody's init
			body: new URLSearchParams({password: encode(password)}),
			searchParams: {nocache: String(now)},
		})
		.json()

	if (!result.success) {
		throw new LoginFailedError()
	}

	return
}

export function fetchJobs(
	username: string,
	options: Options,
): Promise<PrintJobsResponse> {
	if (isStoprintMocked) {
		return mockFetchJobs(username)
	}

	return papercutApi
		.get<PrintJobsResponse>(`webclient/users/${username}/jobs/status`, options)
		.json()
}

export function fetchAllPrinters(
	username: string,
	options: Options,
): Promise<AllPrintersResponse> {
	if (isStoprintMocked) {
		return mockFetchAllPrinters(username)
	}

	return mobileReleaseApi
		.get<AllPrintersResponse>('all-printers', {
			...options,
			searchParams: {username: username},
		})
		.json()
}

export function fetchRecentPrinters(
	username: string,
	options: Options,
): Promise<RecentPopularPrintersResponse> {
	if (isStoprintMocked) {
		return mockFetchRecentPrinters(username)
	}

	return mobileReleaseApi
		.get<RecentPopularPrintersResponse>('recent-popular-printers', {
			...options,
			searchParams: {username: username},
		})
		.json()
}

export async function fetchColorPrinters(options: Options): Promise<string[]> {
	let response = await client
		.get<ColorPrintersResponse>('color-printers', options)
		.json()
	return response.data.colorPrinters
}

export function heldJobsAvailableAtPrinterForUser(
	printerName: string,
	username: string,
	options: Options,
): Promise<HeldJobsResponse> {
	// https://PAPERCUT_API.stolaf.edu/rpc/api/rest/internal/mobilerelease/api/held-jobs/?username=rives&printerName=printers%5Cmfc-it
	if (isStoprintMocked) {
		return mockHeldJobsAvailableAtPrinterForUser(printerName, username)
	}

	return mobileReleaseApi
		.get<HeldJobsResponse>('held-jobs', {
			...options,
			searchParams: {
				username: username,
				printerName: `printers\\${printerName}`,
			},
		})
		.json()
}

export function cancelPrintJobForUser(
	jobId: string,
	username: string,
	options: Options,
): Promise<CancelResponse> {
	return mobileReleaseApi
		.post<CancelResponse>('held-jobs/cancel', {
			...options,
			searchParams: {username: username},
			// use URLSearchParams to auto-set Content-Type: application/x-www-form-urlencoded
			// @ts-expect-error react-native's URLSearchParams type is not compatible with RequestBody's init
			body: new URLSearchParams({'jobIds[]': jobId}),
		})
		.json()
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

	let response = await mobileReleaseApi
		.post<ReleaseResponse>('held-jobs/release', {
			...options,
			searchParams: {username: username},
			// use URLSearchParams to auto-set Content-Type: application/x-www-form-urlencoded
			// @ts-expect-error react-native's URLSearchParams type is not compatible with RequestBody's init
			body: new URLSearchParams({
				printerName: `printers\\${printerName}`,
				'jobIds[]': jobId,
			}),
		})
		.json()

	if (response.numJobsReleased === 0) {
		throw new PapercutJobReleaseError()
	}

	return response
}
