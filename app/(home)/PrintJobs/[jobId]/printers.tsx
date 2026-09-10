import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import * as c from '@frogpond/colors'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {isStoprintMocked, type Printer, type PrintJob} from '../../../../source/lib/stoprint'
import {stoprintUsername} from '../../../../source/features/stoprint/lib'
import {DisclosureRow} from '../../../../source/components/rows'
import {LoadingView, NoticeView} from '@frogpond/notice'
import groupBy from 'lodash/groupBy'
import {StoPrintErrorView} from '../../../../source/features/stoprint/components/error'
import {
	allPrintersOptions,
	colorPrintersOptions,
	jobByIdOptions,
	recentPrintersOptions,
} from '../../../../source/features/stoprint/query'
import {credentialsOptions} from '../../../../source/lib/login'
import {RecentPopularPrintersResponse} from '../../../../source/lib/stoprint/types'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

type PrinterListViewProps = {
	job: PrintJob
}

function PrinterListView({job}: PrinterListViewProps): React.ReactNode {
	let router = useRouter()

	let {data: credentials} = useQuery(credentialsOptions)
	let username = stoprintUsername(credentials, isStoprintMocked)

	let {
		data: allPrinters = [],
		error: allPrintersError,
		isLoading: allPrintersLoading,
		refetch: allPrintersRefetch,
		isRefetching: allPrintersRefetching,
	} = useQuery(allPrintersOptions(username))

	let {
		data: recentPrinters = {} as Partial<RecentPopularPrintersResponse>,
		error: recentPrintersError,
		isLoading: recentPrintersLoading,
		refetch: recentPrintersRefetch,
		isRefetching: recentPrintersRefetching,
	} = useQuery(recentPrintersOptions(username))

	let {
		data: colorPrinters = [],
		error: colorPrintersError,
		isLoading: colorPrintersLoading,
		refetch: colorPrintersRefetch,
		isRefetching: colorPrintersRefetching,
	} = useQuery(colorPrintersOptions)

	let isLoading = allPrintersLoading || recentPrintersLoading || colorPrintersLoading

	let openPrintRelease = React.useCallback(
		(printer: Printer) =>
			router.push({
				pathname: '/PrintJobs/[jobId]/release',
				params: {jobId: job.id.toString(), printer: printer.printerName},
			}),
		[router, job],
	)

	// Returns all three, rather than firing and forgetting them: SwiftUI's
	// `refreshable` spinner runs until the handler it was given settles, so a
	// void return would stop it the instant the pull ended.
	let refetchAll = React.useCallback(
		() => Promise.all([allPrintersRefetch(), colorPrintersRefetch(), recentPrintersRefetch()]),
		[allPrintersRefetch, colorPrintersRefetch, recentPrintersRefetch],
	)

	if (allPrintersError) {
		return (
			<StoPrintErrorView
				onRefresh={allPrintersRefetch}
				refreshing={allPrintersRefetching}
				statusMessage={String(allPrintersError)}
			/>
		)
	}
	if (recentPrintersError) {
		return (
			<StoPrintErrorView
				onRefresh={recentPrintersRefetch}
				refreshing={recentPrintersRefetching}
				statusMessage={String(recentPrintersError)}
			/>
		)
	}
	if (colorPrintersError) {
		return (
			<StoPrintErrorView
				onRefresh={colorPrintersRefetch}
				refreshing={colorPrintersRefetching}
				statusMessage={String(colorPrintersError)}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView text="Querying Available Printers…" />
	}

	let colorJob = job.grayscaleFormatted === 'No'

	let availablePrinters = colorJob
		? allPrinters.filter((p) => colorPrinters.includes(p.printerName))
		: allPrinters

	let allWithLocations = availablePrinters.map((p) => ({
		...p,
		location: p.location || 'Unknown Building',
	}))

	let allGrouped = groupBy(allWithLocations, (p) =>
		/^[A-Z]+ \d+/u.test(p.location) ? p.location.split(/\s+/u)[0] : p.location,
	)

	let groupedByBuilding = Object.entries(allGrouped).map(([title, data]) => ({
		title,
		data,
	}))

	groupedByBuilding.sort((a, b) =>
		a.title === '' && b.title !== '' ? 1 : a.title.localeCompare(b.title),
	)

	let grouped = allPrinters
		? [
				{title: 'Recent', data: recentPrinters.recentPrinters ?? []},
				{title: 'Popular', data: recentPrinters.popularPrinters ?? []},
				...groupedByBuilding,
			]
		: []

	let availableGrouped = colorJob ? groupedByBuilding : grouped

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refetchAll()
					}),
				]}
			>
				{availableGrouped.map((section) => (
					<Section key={section.title} title={section.title}>
						{section.data.map((printer) => (
							<DisclosureRow
								key={printer.printerName}
								detail={printer.location}
								image={{systemName: 'printer'}}
								onPress={() => openPrintRelease(printer)}
								title={printer.printerName}
							/>
						))}
					</Section>
				))}
			</List>
		</Host>
	)
}

function PrinterListLoader(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()

	let {data: credentials, isLoading: credentialsLoading} = useQuery(credentialsOptions)
	let username = stoprintUsername(credentials, isStoprintMocked)

	let {
		data: job,
		isLoading: jobLoading,
		error: jobError,
		refetch: jobRefetch,
	} = useQuery(jobByIdOptions(username, jobId))

	if ((credentialsLoading && !isStoprintMocked) || jobLoading) {
		return <LoadingView text="Loading…" />
	}

	if (jobError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={jobRefetch}
				text={`A problem occured while loading: ${
					jobError instanceof Error ? jobError.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!job) {
		return <NoticeView text="Could not find this print job." />
	}

	return <PrinterListView job={job} />
}

export default function PrinterListPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Select Printer</Stack.Title>
			<PrinterListLoader />
		</>
	)
}
