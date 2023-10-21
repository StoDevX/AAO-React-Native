/* eslint-disable @typescript-eslint/no-unused-vars */
/* stoprint and papercut api mock data */

import {SharedWebCredentials} from 'react-native-keychain'

import type {
	AllPrintersResponse,
	HeldJobsResponse,
	PrintJobsResponse,
	RecentPopularPrintersResponse,
	ReleaseResponse,
} from '../types'
import {mockAllPrinters} from './data/all-printers'
import {mockHeldJobs} from './data/held-jobs'
import {mockJobs} from './data/jobs'
import {mockRecent} from './data/recent'
import {mockRelease} from './data/release'

function papercut<T>(mockData: T): Promise<T> {
	return new Promise((resolve) => resolve(mockData))
}

export function logIn(
	credentials: SharedWebCredentials,
	now: number = new Date().getTime(),
): Promise<void> {
	return Promise.resolve()
}

export const fetchJobs = (username: string): Promise<PrintJobsResponse> =>
	Promise.resolve(mockJobs)

export const fetchAllPrinters = (
	username: string,
): Promise<AllPrintersResponse> => Promise.resolve(mockAllPrinters)

export const fetchRecentPrinters = (
	username: string,
): Promise<RecentPopularPrintersResponse> => Promise.resolve(mockRecent)

export const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
): Promise<HeldJobsResponse> => Promise.resolve(mockHeldJobs)

export const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
}: {
	jobId: string
	printerName: string
	username: string
}): Promise<ReleaseResponse> => Promise.resolve(mockRelease)
