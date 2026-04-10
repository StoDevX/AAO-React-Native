import {queryOptions} from '@tanstack/react-query'
import {
	fetchAllPrinters,
	fetchColorPrinters,
	fetchJobs,
	fetchRecentPrinters,
	heldJobsAvailableAtPrinterForUser,
} from '../../lib/stoprint/api'
import {
	AllPrintersResponse,
	HeldJobsResponse,
	PrintJobsResponse,
	RecentPopularPrintersResponse,
} from '../../lib/stoprint/types'

export const keys = {
	jobs: (username: string) => ['printing', 'jobs', 'all', username] as const,
	heldJobs: ({
		username,
		printerName,
	}: {
		username: string
		printerName: string
	}) => ['printing', 'jobs', 'held', username, printerName] as const,
	printers: (username: string) => ['printing', 'printers', username] as const,
	recentPrinters: (username: string) =>
		['printing', 'printers', 'recent', username] as const,
	colorPrinters: ['printing', 'printers', 'color'] as const,
}

export const printJobsOptions = (username: string) =>
	queryOptions({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchJobs(username, {signal}),
	})

export const allPrintersOptions = (username: string) =>
	queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchAllPrinters(username, {signal}),
	})

export const recentPrintersOptions = (username: string) =>
	queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchRecentPrinters(username, {signal}),
	})

export const colorPrintersOptions = queryOptions({
	queryKey: keys.colorPrinters,
	queryFn: ({signal}) => fetchColorPrinters({signal}),
})

export const heldJobsOptions = (
	username: string,
	printerName: string | undefined,
) => {
	let usablePrinterName = printerName || 'undefined'
	return queryOptions({
		enabled: Boolean(username) && printerName !== undefined,
		queryKey: keys.heldJobs({username, printerName: usablePrinterName}),
		queryFn: ({signal}) =>
			heldJobsAvailableAtPrinterForUser(usablePrinterName, username, {signal}),
	})
}
