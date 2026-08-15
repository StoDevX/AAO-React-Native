import {queryOptions} from '@tanstack/react-query'
import {
	fetchAllPrinters,
	fetchColorPrinters,
	fetchJobs,
	fetchRecentPrinters,
	heldJobsAvailableAtPrinterForUser,
} from '../../lib/stoprint/api'

export const keys = {
	jobs: (username: string) => ['printing', 'jobs', 'all', username] as const,
	heldJobs: ({username, printerName}: {username: string; printerName: string}) =>
		['printing', 'jobs', 'held', username, printerName] as const,
	printers: (username: string) => ['printing', 'printers', username] as const,
	recentPrinters: (username: string) => ['printing', 'printers', 'recent', username] as const,
	colorPrinters: ['printing', 'printers', 'color'] as const,
}

function fetchJobsForUser(username: string, signal?: AbortSignal) {
	return fetchJobs(username, {signal})
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const printJobsOptions = (username: string) =>
	queryOptions({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchJobsForUser(username, signal),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const jobByIdOptions = (username: string, jobId: string) =>
	queryOptions({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchJobsForUser(username, signal),
		select: (data) => data.jobs.find((j) => j.id.toString() === jobId),
	})

function fetchAllPrintersForUser(username: string, signal?: AbortSignal) {
	return fetchAllPrinters(username, {signal})
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const allPrintersOptions = (username: string) =>
	queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchAllPrintersForUser(username, signal),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const printerByNameOptions = (username: string, printerName: string | undefined) =>
	queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username) && printerName !== undefined,
		queryFn: ({signal}) => fetchAllPrintersForUser(username, signal),
		select: (data) => data.find((p) => p.printerName === printerName),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const recentPrintersOptions = (username: string) =>
	queryOptions({
		queryKey: keys.recentPrinters(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchRecentPrinters(username, {signal}),
	})

export const colorPrintersOptions = queryOptions({
	queryKey: keys.colorPrinters,
	queryFn: ({signal}) => fetchColorPrinters({signal}),
})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const heldJobsOptions = (username: string, printerName: string | undefined) => {
	let usablePrinterName = printerName || 'undefined'
	return queryOptions({
		enabled: Boolean(username) && printerName !== undefined,
		queryKey: keys.heldJobs({username, printerName: usablePrinterName}),
		queryFn: ({signal}) => heldJobsAvailableAtPrinterForUser(usablePrinterName, username, {signal}),
	})
}
