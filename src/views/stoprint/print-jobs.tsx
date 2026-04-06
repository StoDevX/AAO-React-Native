import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {Platform, SectionList} from 'react-native'
import type {PrintJob} from '../../lib/stoprint'
import {STOPRINT_HELP_PAGE, isStoprintMocked} from '../../lib/stoprint'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {StoPrintErrorView, StoPrintNoticeView} from './components'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import sortBy from 'lodash/sortBy'
import {getTimeRemaining} from './lib'
import {useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'
import {printJobsQuery} from './query'
import {hasCredentialsQuery, usernameQuery} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'

export const PrintJobsView = (): React.JSX.Element => {
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let {data: hasCredentials, isLoading: hasCredentialsLoading} =
		useQuery(hasCredentialsQuery)
	let {data: username} = useQuery(usernameQuery)

	let {
		data: jobsData = {jobs: []},
		isError: jobsIsError,
		error: jobsError,
		isLoading: jobsLoading,
		refetch: jobsRefetch,
		isRefetching: jobsRefetching,
	} = useQuery(printJobsQuery(username))

	let router = useRouter()
	let openSettings = () => router.push('/settings')

	let handleJobPress = (job: PrintJob) => {
		if (job.statusFormatted === 'Pending Release') {
			router.push({
				pathname: '/stoprint/printers',
				params: {job: JSON.stringify(job)},
			})
		} else {
			router.push({
				pathname: '/stoprint/release',
				params: {job: JSON.stringify(job)},
			})
		}
	}

	if (hasCredentialsLoading) {
		return <LoadingView text="Loading…" />
	}

	if (!hasCredentials && !isStoprintMocked) {
		return (
			<StoPrintNoticeView
				buttonText="Open Settings"
				header="You are not logged in"
				onPress={openSettings}
				text="You must be logged in to your St. Olaf account to access this feature"
			/>
		)
	}

	if (jobsIsError && jobsError instanceof Error) {
		return (
			<StoPrintErrorView
				onRefresh={jobsRefetch}
				refreshing={jobsRefetching}
				statusMessage={jobsError.message}
			/>
		)
	}

	if (jobsLoading) {
		return <LoadingView text="Loading…" />
	}

	if (jobsData.jobs.length === 0) {
		let instructions =
			Platform.OS === 'android'
				? 'using the Mobility Print app'
				: 'using the Print option in the Share Sheet'
		let descriptionText = `You can print from a computer, or by ${instructions}.`

		return (
			<StoPrintNoticeView
				buttonText="Learn how to use stoPrint"
				description={descriptionText}
				header="Nothing to Print!"
				onPress={() => openUrl(STOPRINT_HELP_PAGE)}
				onRefresh={jobsRefetch}
				text="Need help getting started?"
			/>
		)
	}

	let grouped = groupBy(jobsData.jobs, (j) => j.statusFormatted || 'Other')
	let groupedJobs = toPairs(grouped).map(([title, data]) => ({
		title,
		data,
	}))
	let sortedGroupedJobs = sortBy(groupedJobs, [
		(group) => group.title !== 'Pending Release', // puts 'Pending Release' jobs at the top
	])

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			keyExtractor={(item) => item.id.toString()}
			onRefresh={jobsRefetch}
			refreshing={jobsRefetching}
			renderItem={({item}) => (
				<ListRow onPress={() => handleJobPress(item)}>
					<Title>{item.documentName}</Title>
					<Detail>
						Expires {getTimeRemaining(now, item.usageTimeFormatted)}
						{' • '}
						{item.usageCostFormatted}
						{' • '}
						{item.totalPages} {item.totalPages === 1 ? 'page' : 'pages'}
					</Detail>
				</ListRow>
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={sortedGroupedJobs}
		/>
	)
}
