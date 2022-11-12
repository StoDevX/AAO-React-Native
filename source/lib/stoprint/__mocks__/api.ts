/* eslint-disable @typescript-eslint/no-unused-vars */
/* stoprint and papercut api mock data */

import {mockAllPrinters} from './data/all-printers'
import {mockHeldJobs} from './data/held-jobs'
import {mockLogin} from './data/login'
import {mockJobs} from './data/jobs'
import {mockRecent} from './data/recent'
import {mockRelease} from './data/release'

import type {
	PrintJobsResponseOrErrorType,
	AllPrintersResponseOrErrorType,
	RecentPopularPrintersResponseOrErrorType,
	ReleaseResponseOrErrorType,
	HeldJobsResponseOrErrorType,
	LoginResponse,
	LoginResponseOrErrorType,
	PrintJobsResponse,
	AllPrintersResponse,
	RecentPopularPrintersResponse,
	HeldJobsResponse,
	ReleaseResponse,
} from '../types'

function papercut<T>(mockData: T): Promise<T> {
	return new Promise((resolve) => resolve(mockData))
}

export async function logIn(
	username: string,
	password: string,
): Promise<'success' | string> {
	const result = await papercut(mockLogin)
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
): Promise<PrintJobsResponseOrErrorType> =>
	papercut(mockJobs)
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

export const fetchAllPrinters = (
	username: string,
): Promise<AllPrintersResponseOrErrorType> =>
	papercut(mockAllPrinters)
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

export const fetchRecentPrinters = (
	username: string,
): Promise<RecentPopularPrintersResponseOrErrorType> =>
	papercut(mockRecent)
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

export const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
): Promise<HeldJobsResponseOrErrorType> =>
	papercut(mockHeldJobs)
		.then(
			(response: HeldJobsResponse): HeldJobsResponseOrErrorType => ({
				error: false,
				value: response,
			}),
		)
		.catch(
			(error): HeldJobsResponseOrErrorType => ({error: true, value: error}),
		)

export const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
}: {
	jobId: string
	printerName: string
	username: string
}): Promise<ReleaseResponseOrErrorType> =>
	papercut(mockRelease)
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
