import {
	queryOptions,
	type UndefinedInitialDataOptions,
	type DataTag,
	type DefaultError,
} from '@tanstack/react-query'
import {
	fetchAllPrinters,
	fetchColorPrinters,
	fetchJobs,
	fetchRecentPrinters,
	heldJobsAvailableAtPrinterForUser,
} from '../../lib/stoprint/api'
import type {
	AllPrintersResponse,
	HeldJobsResponse,
	PrintJobsResponse,
	RecentPopularPrintersResponse,
} from '../../lib/stoprint/types'

type QueryOptionsResult<
	TData,
	TKey extends readonly unknown[],
> = UndefinedInitialDataOptions<TData, DefaultError, TData, TKey> & {
	queryKey: DataTag<TKey, TData, DefaultError>
}

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

export function printJobsQuery(
	username: string | undefined,
): QueryOptionsResult<
	PrintJobsResponse,
	readonly ['printing', 'jobs', 'all', string | undefined]
> {
	return queryOptions({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by `enabled`
		queryFn: ({signal}) => fetchJobs(username!, {signal}),
	})
}

export function allPrintersQuery(
	username: string | undefined,
): QueryOptionsResult<
	AllPrintersResponse,
	readonly ['printing', 'printers', string | undefined]
> {
	return queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by `enabled`
		queryFn: ({signal}) => fetchAllPrinters(username!, {signal}),
	})
}

export function recentPrintersQuery(
	username: string | undefined,
): QueryOptionsResult<
	RecentPopularPrintersResponse,
	readonly ['printing', 'printers', string | undefined]
> {
	return queryOptions({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by `enabled`
		queryFn: ({signal}) => fetchRecentPrinters(username!, {signal}),
	})
}

export function colorPrintersQuery(): QueryOptionsResult<
	string[],
	readonly ['printing', 'colorPrinters']
> {
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
}): QueryOptionsResult<
	HeldJobsResponse,
	readonly ['printing', 'jobs', 'held', string | undefined, string]
> {
	let usablePrinterName = printerName || 'undefined'

	return queryOptions({
		enabled: Boolean(username) && printerName !== undefined,
		queryKey: keys.heldJobs({username, printerName: usablePrinterName}),
		queryFn: ({signal}) =>
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by `enabled`
			heldJobsAvailableAtPrinterForUser(usablePrinterName, username!, {signal}),
	})
}
