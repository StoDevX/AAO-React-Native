import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {useUsername} from '../../lib/login'
import {useMockedStoprint} from '@frogpond/app-config'
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
	jobs: (username: string, useMockPrintData: boolean) =>
		['printing', 'jobs', 'all', username, useMockPrintData] as const,
	heldJobs: ({
		username,
		printerName,
		useMockPrintData,
	}: {
		username: string
		printerName: string
		useMockPrintData: boolean
	}) =>
		[
			'printing',
			'jobs',
			'held',
			username,
			printerName,
			useMockPrintData,
		] as const,
	printers: (username: string, useMockPrintData: boolean) =>
		['printing', 'printers', username, useMockPrintData] as const,
	recentPrinters: (username: string) =>
		['printing', 'printers', 'recent', username] as const,
	colorPrinters: ['printing', 'printers', 'color', useMockedStoprint] as const,
}

export function usePrintJobs(): UseQueryResult<PrintJobsResponse, unknown> {
	let {data: username = ''} = useUsername()
	const useMockPrintData = useMockedStoprint()

	return useQuery({
		queryKey: keys.jobs(username, useMockPrintData),
		enabled: Boolean(username) || useMockPrintData,
		queryFn: ({signal}) => fetchJobs(username, {signal}, useMockPrintData),
	})
}

export function useAllPrinters(): UseQueryResult<AllPrintersResponse, unknown> {
	let {data: username = ''} = useUsername()
	const useMockPrintData = useMockedStoprint()

	return useQuery({
		queryKey: keys.printers(username, useMockPrintData),
		enabled: Boolean(username) || useMockPrintData,
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
		queryKey: keys.printers(username, useMockPrintData),
		enabled: Boolean(username) || useMockPrintData,
		queryFn: ({signal}) =>
			fetchRecentPrinters(username, {signal}, useMockPrintData),
	})
}

export function useColorPrinters(): UseQueryResult<string[], unknown> {
	const useMockPrintData = useMockedStoprint()

	return useQuery({
		queryKey: keys.colorPrinters,
		queryFn: ({signal}) => fetchColorPrinters({signal}, useMockPrintData),
	})
}

export function useHeldJobs(
	printerName: string | undefined,
): UseQueryResult<HeldJobsResponse, unknown> {
	let {data: username = ''} = useUsername()
	const useMockPrintData = useMockedStoprint()

	let usablePrinterName = printerName || 'undefined'

	return useQuery({
		enabled:
			(Boolean(username) && printerName !== undefined) || useMockPrintData,
		queryKey: keys.heldJobs({
			username,
			printerName: usablePrinterName,
			useMockPrintData,
		}),
		queryFn: ({signal}) =>
			heldJobsAvailableAtPrinterForUser(
				usablePrinterName,
				username,
				{signal},
				useMockPrintData,
			),
	})
}
