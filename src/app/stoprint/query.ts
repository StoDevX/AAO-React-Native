import {queryOptions} from '@tanstack/react-query'
import {
	fetchAllPrinters,
	fetchColorPrinters,
	fetchJobs,
	fetchRecentPrinters,
	heldJobsAvailableAtPrinterForUser,
} from '../../lib/stoprint/api'

export const keys = {
	jobs: <T extends string | undefined>(username: T) =>
		['printing', 'jobs', 'all', username] as const,
	heldJobs: <Username extends string | undefined, Printer extends string>({
		username,
		printerName,
	}: {
		username: Username
		printerName: Printer
	}) => ['printing', 'jobs', 'held', username, printerName] as const,
	printers: <T extends string | undefined>(username: T) =>
		['printing', 'printers', username] as const,
	recentPrinters: <T extends string | undefined>(username: T) =>
		['printing', 'recentPrinters', username] as const,
	colorPrinters: ['printing', 'colorPrinters'] as const,
}

export function printJobsQuery(username: string | undefined) {
	return queryOptions({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchJobs(username!, {signal}),
	})
}

export function allPrintersQuery(username: string | undefined) {
	return queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchAllPrinters(username!, {signal}),
	})
}

export function recentPrintersQuery(username: string | undefined) {
	return queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchRecentPrinters(username!, {signal}),
	})
}

export function colorPrintersQuery() {
	return queryOptions({
		queryKey: keys.colorPrinters,
		queryFn: ({signal}) => fetchColorPrinters({signal}),
	})
}

export function heldJobsQuery({
	username,
	printerName,
}: {
	username: string | undefined
	printerName: string | undefined
}) {
	let usablePrinterName = printerName || 'undefined'

	return queryOptions({
		enabled: Boolean(username) && printerName !== undefined,
		queryKey: keys.heldJobs({username, printerName: usablePrinterName}),
		queryFn: ({signal}) =>
			heldJobsAvailableAtPrinterForUser(usablePrinterName, username!, {signal}),
	})
}
