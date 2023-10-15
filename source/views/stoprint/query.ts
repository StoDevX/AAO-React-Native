import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {useUsername} from '../../lib/login'
import {useMockedStoprint} from '../../lib/stoprint'
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
	let {data: username = ''} = useUsername()
	const useMockPrintData = useMockedStoprint()

	return useQuery({
		queryKey: keys.jobs(username),
		enabled: Boolean(username),
		queryFn: ({signal}) => fetchJobs(username, {signal}, useMockPrintData),
	})
}

export function useAllPrinters(): UseQueryResult<AllPrintersResponse, unknown> {
	let {data: username = ''} = useUsername()
	const useMockPrintData = useMockedStoprint()

	return useQuery({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) =>
			fetchAllPrinters(username, {signal}, useMockPrintData),
	})
}

export function useRecentPrinters(): UseQueryResult<
	RecentPopularPrintersResponse,
	unknown
> {
	let {data: username = ''} = useUsername()
	const useMockPrintData = useMockedStoprint()

	return useQuery({
		queryKey: keys.printers(username),
		enabled: Boolean(username),
		queryFn: ({signal}) =>
			fetchRecentPrinters(username, {signal}, useMockPrintData),
	})
}

export function useColorPrinters(): UseQueryResult<string[], unknown> {
	return useQuery({
		queryKey: keys.colorPrinters,
		queryFn: ({signal}) => fetchColorPrinters({signal}),
	})
}

export function useHeldJobs(
	printerName: string | undefined,
): UseQueryResult<HeldJobsResponse, unknown> {
	let {data: username = ''} = useUsername()
	const useMockPrintData = useMockedStoprint()

	let usablePrinterName = printerName || 'undefined'

	return useQuery({
		enabled: Boolean(username) && printerName !== undefined,
		queryKey: keys.heldJobs({username, printerName: usablePrinterName}),
		queryFn: ({signal}) =>
			heldJobsAvailableAtPrinterForUser(
				usablePrinterName,
				username,
				{signal},
				useMockPrintData,
			),
	})
}
