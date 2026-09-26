import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Form, Host, Section, Text} from '@expo/ui/swift-ui'
import {font} from '@expo/ui/swift-ui/modifiers'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import * as c from '@frogpond/colors'
import {jobDetailOptions, type JobDetail} from '@frogpond/ccc-jobs'
import {
	formatPostedDate,
	JOB_DESCRIPTION_TITLE,
	jobDetailFields,
	shareJob,
} from '../../source/features/sis/student-work/lib'
import {displayTitle} from '../../source/features/sis/student-work/posting'
import {DetailRow, DisclosureRow, NavigationRow} from '../../source/components/rows'

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/// The posting's fields, as a SwiftUI form that fills the screen and scrolls
/// itself, with the description a push away.
///
/// The form fills its host rather than the host sizing to the form: a host
/// sized to its content measures a wrapped field as a single line, leaving the
/// form too short for its rows, so the form scrolls inside whatever holds it
/// and a drag stops at its last row. The description is React Native markdown,
/// and hosting it in the form would need that same content-sized measurement.
function JobDetailView({job}: {job: JobDetail}): React.ReactNode {
	let router = useRouter()
	let posted = formatPostedDate(job.postedDate)
	let fields = jobDetailFields(job)

	return (
		<Host style={styles.screen}>
			<Form>
				<Section>
					<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>
						{displayTitle(job.title)}
					</Text>
					{job.category ? <DetailRow label="Category" value={job.category} /> : null}
					{job.schedule ? <DetailRow label="Schedule" value={job.schedule} /> : null}
					{job.location ? <DetailRow label="Location" value={job.location} /> : null}
					{posted ? <DetailRow label="Posted" value={posted} /> : null}
				</Section>

				{fields.length > 0 ? (
					<Section title="Details">
						{fields.map((field) => (
							<DetailRow key={field.label} label={field.label} value={field.value} />
						))}
					</Section>
				) : null}

				<Section>
					{job.body ? (
						<NavigationRow
							onPress={() =>
								router.navigate({pathname: '/JobDescription', params: {jobId: job.id}})
							}
							title={JOB_DESCRIPTION_TITLE}
						/>
					) : null}
					<DisclosureRow
						destination="external"
						onPress={() => openUrl(job.url)}
						title="View on the St. Olaf jobs site"
					/>
				</Section>
			</Form>
		</Host>
	)
}

export default function JobDetailPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()
	let {data: job, isLoading, error, refetch} = useQuery(jobDetailOptions(jobId))

	if (isLoading) {
		return (
			<>
				<Stack.Title>Loading…</Stack.Title>
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				<Stack.Title>Error</Stack.Title>
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occurred while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!job) {
		return (
			<>
				<Stack.Title>Unknown Job</Stack.Title>
				<NoticeView text="Could not find this job posting." />
			</>
		)
	}

	return (
		<>
			<Stack.Title>{displayTitle(job.title)}</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Share Job"
					icon="square.and.arrow.up"
					onPress={() => shareJob(job)}
				/>
			</Stack.Toolbar>
			<JobDetailView job={job} />
		</>
	)
}
