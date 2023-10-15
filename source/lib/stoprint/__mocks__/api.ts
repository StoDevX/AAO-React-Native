/* eslint-disable @typescript-eslint/no-unused-vars */
/* stoprint and papercut api mock data */

import {mockAllPrinters} from './data/all-printers'
import {mockHeldJobs} from './data/held-jobs'
import {mockJobs} from './data/jobs'
import {mockRecent} from './data/recent'
import {mockRelease} from './data/release'

import {SharedWebCredentials} from 'react-native-keychain'
import type {
	AllPrintersResponse,
	HeldJobsResponse,
	PrintJobsResponse,
	RecentPopularPrintersResponse,
	ReleaseResponse,
} from '../types'

function papercut<T>(mockData: T): Promise<T> {
	return new Promise((resolve) => resolve(mockData))
}

export function logIn(
	credentials: SharedWebCredentials,
	now: number = new Date().getTime(),
	useMockPrintData = true,
): Promise<void> {
	return Promise.resolve()
}

export const fetchJobs = (
	username: string,
	useMockPrintData = true,
): Promise<PrintJobsResponse> => Promise.resolve(mockJobs)

export const fetchAllPrinters = (
	username: string,
	useMockPrintData = true,
): Promise<AllPrintersResponse> => Promise.resolve(mockAllPrinters)

export const fetchRecentPrinters = (
	username: string,
	useMockPrintData = true,
): Promise<RecentPopularPrintersResponse> => Promise.resolve(mockRecent)

export const heldJobsAvailableAtPrinterForUser = (
	printerName: string,
	username: string,
	useMockPrintData = true,
): Promise<HeldJobsResponse> => Promise.resolve(mockHeldJobs)

export const releasePrintJobToPrinterForUser = ({
	jobId,
	printerName,
	username,
	useMockPrintData = true,
}: {
	jobId: string
	printerName: string
	username: string
	useMockPrintData: boolean
}): Promise<ReleaseResponse> => Promise.resolve(mockRelease)
