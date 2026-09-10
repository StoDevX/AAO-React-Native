import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import type {PrintJob} from '../../../source/lib/stoprint'
import {STOPRINT_HELP_PAGE, isStoprintMocked} from '../../../source/lib/stoprint'
import {LoadingView} from '@frogpond/notice'
import {DisclosureRow} from '../../../source/components/rows'
import {openUrl} from '@frogpond/open-url'
import {StoPrintErrorView, StoPrintNoticeView} from '../../../source/features/stoprint/components'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import sortBy from 'lodash/sortBy'
import {getTimeRemaining, printJobsGate} from '../../../source/features/stoprint/lib'
import {Stack, useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'
import {printJobsOptions} from '../../../source/features/stoprint/query'
import {credentialsOptions} from '../../../source/lib/login'
import {useQuery} from '@tanstack/react-query'

function PrintJobsView(): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let {data: credentials, isLoading: hasCredentialsLoading} = useQuery(credentialsOptions)

	let hasCredentials = Boolean(credentials)
	let username = credentials?.username ?? ''

	let {
		data: jobsData = {jobs: []},
		isError: jobsIsError,
		error: jobsError,
		isLoading: jobsLoading,
		refetch: jobsRefetch,
		isRefetching: jobsRefetching,
	} = useQuery(printJobsOptions(username))

	let router = useRouter()
	let openSettings = () => router.push('/SettingsRoot')

	let handleJobPress = (job: PrintJob) => {
		let jobId = job.id.toString()
		if (job.statusFormatted === 'Pending Release') {
			router.push({pathname: '/PrintJobs/[jobId]/printers', params: {jobId}})
		} else {
			router.push({pathname: '/PrintJobs/[jobId]/release', params: {jobId}})
		}
	}

	let gate = printJobsGate({
		isLoadingCredentials: hasCredentialsLoading,
		hasCredentials,
		isMocked: isStoprintMocked,
	})

	if (gate === 'loading') {
		return <LoadingView text="Loading…" />
	}

	if (gate === 'signed-out') {
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
		let instructions = 'using the Print option in the Share Sheet'
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
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await jobsRefetch()
					}),
				]}
			>
				{sortedGroupedJobs.map((section) => (
					<Section key={section.title} title={section.title}>
						{section.data.map((job) => (
							<DisclosureRow
								key={job.id.toString()}
								detail={`Expires ${getTimeRemaining(now, job.usageTimeFormatted)} • ${job.usageCostFormatted} • ${job.totalPages} ${job.totalPages === 1 ? 'page' : 'pages'}`}
								onPress={() => handleJobPress(job)}
								title={job.documentName}
							/>
						))}
					</Section>
				))}
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function PrintJobsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Print Jobs</Stack.Title>
			<PrintJobsView />
		</>
	)
}
