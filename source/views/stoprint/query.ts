import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {useUsername} from '../../lib/login'
import {useDemoAccount} from '../../lib/stoprint'
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

export function usePrintJobs(): UseQueryResult<PrintJobsResponse, unknown> {
	let {data} = useUsername()
	let username = data ? data.username : ''
	let isDemoAccount = useDemoAccount()

	return useQuery({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => {
			return fetchJobs(username, isDemoAccount, {signal})
		},
	})
}

export function useAllPrinters(): UseQueryResult<AllPrintersResponse, unknown> {
	let {data} = useUsername()
	let username = data ? data.username : ''
	let isDemoAccount = useDemoAccount()

	return useQuery({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchAllPrinters(username, isDemoAccount, {signal}),
	})
}

export function useRecentPrinters(): UseQueryResult<
	RecentPopularPrintersResponse,
	unknown
> {
	let {data} = useUsername()
	let username = data ? data.username : ''
	let isDemoAccount = useDemoAccount()

	return useQuery({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) =>
			fetchRecentPrinters(username, isDemoAccount, {signal}),
	})
}

export function useColorPrinters(): UseQueryResult<string[], unknown> {
	let isDemoAccount = useDemoAccount()

	return useQuery({
		queryKey: keys.colorPrinters,
		queryFn: ({signal}) => fetchColorPrinters(isDemoAccount, {signal}),
	})
}

export function useHeldJobs(
	printerName: string | undefined,
): UseQueryResult<HeldJobsResponse, unknown> {
	let {data} = useUsername()
	let username = data ? data.username : ''
	let isDemoAccount = useDemoAccount()

	let usablePrinterName = printerName || 'undefined'

	return useQuery({
		enabled: Boolean(username) && printerName !== undefined,
		queryKey: keys.heldJobs({username, printerName: usablePrinterName}),
		queryFn: ({signal}) =>
			heldJobsAvailableAtPrinterForUser(
				usablePrinterName,
				username,
				isDemoAccount,
				{signal},
			),
	})
}
