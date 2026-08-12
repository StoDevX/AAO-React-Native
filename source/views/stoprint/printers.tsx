import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import type {Printer, PrintJob} from '../../lib/stoprint'
import {isStoprintMocked} from '../../lib/stoprint'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView} from '@frogpond/notice'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'
import groupBy from 'lodash/groupBy'
import {StoPrintErrorView} from './components/error'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useRouter} from 'expo-router'
import {
	allPrintersOptions,
	colorPrintersOptions,
	recentPrintersOptions,
} from './query'
import {credentialsOptions} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'
import {RecentPopularPrintersResponse} from '../../lib/stoprint/types'

const styles = StyleSheet.create({
	list: {},
})

type Props = {
	job: PrintJob
}

export const PrinterListView = ({job}: Props): React.ReactNode => {
	let router = useRouter()

	let {data: username = ''} = useQuery({
		...credentialsOptions,
		select: (data) => data?.username,
	})

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

	let isLoading =
		allPrintersLoading || recentPrintersLoading || colorPrintersLoading
	let isRefetching =
		allPrintersRefetching || recentPrintersRefetching || colorPrintersRefetching

	let openPrintRelease = React.useCallback(
		(printer: Printer) =>
			router.push({
				pathname: '/PrintJobs/[jobId]/release',
				params: {jobId: job.id.toString(), printer: printer.printerName},
			}),
		[router, job],
	)

	let refetchAll = React.useCallback(() => {
		allPrintersRefetch()
		colorPrintersRefetch()
		recentPrintersRefetch()
	}, [allPrintersRefetch, colorPrintersRefetch, recentPrintersRefetch])

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
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item: Printer) => item.printerName}
			onRefresh={refetchAll}
			refreshing={isRefetching}
			renderItem={({item}: {item: Printer}) => (
				<ListRow onPress={() => openPrintRelease(item)}>
					<Title>{item.printerName}</Title>
					<Detail>{item.location}</Detail>
				</ListRow>
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={availableGrouped}
			style={styles.list}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Select Printer',
	headerRight: () => <DebugNoticeButton shouldShow={isStoprintMocked} />,
}
