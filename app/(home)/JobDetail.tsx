import * as React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Button, Form, HStack, Host, Section, Spacer, Text} from '@expo/ui/swift-ui'
import {font} from '@expo/ui/swift-ui/modifiers'
import {Markdown} from '@frogpond/markdown'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import * as c from '@frogpond/colors'
import {jobDetailOptions, type JobDetail, type JobField} from '@frogpond/ccc-jobs'
import {shareJob} from '../../source/features/sis/student-work/lib'
import {format, isValid, parseISO} from 'date-fns'

const styles = StyleSheet.create({
	screen: {
		backgroundColor: c.systemGroupedBackground,
	},
	body: {
		// Matches the horizontal inset SwiftUI gives an inset-grouped form's
		// section, so the prose lines up with the fields above it.
		paddingHorizontal: 36,
		paddingBottom: 24,
	},
})

function FieldRow({label, value}: JobField): React.ReactNode {
	return (
		<HStack>
			<Text>{label}</Text>
			<Spacer />
			<Text>{value}</Text>
		</HStack>
	)
}

function postedOn(postedDate: string | undefined): string | undefined {
	if (!postedDate) return undefined

	let parsed = parseISO(postedDate)
	return isValid(parsed) ? format(parsed, 'MMMM d, yyyy') : undefined
}

/// The screen scrolls in React Native, with the fields as a SwiftUI form sized
/// to its own content.
///
/// The other way round -- markdown hosted inside the form via `RNHostView` --
/// clips the last paragraphs of a long posting: that host's `matchContents` is
/// set once at mount and has no per-axis form, so it keeps the height the
/// markdown view reported before it had laid its text out. `Host` does take
/// `{vertical: true}`, so the nesting goes this way instead.
function JobDetailView({job}: {job: JobDetail}): React.ReactNode {
	let posted = postedOn(job.postedDate)

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
			<Host matchContents={{vertical: true}} useViewportSizeMeasurement={true}>
				<Form>
					<Section>
						<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>{job.title}</Text>
						{job.category ? <FieldRow label="Category" value={job.category} /> : null}
						{job.schedule ? <FieldRow label="Schedule" value={job.schedule} /> : null}
						{job.location ? <FieldRow label="Location" value={job.location} /> : null}
						{posted ? <FieldRow label="Posted" value={posted} /> : null}
					</Section>

					{job.fields.length > 0 ? (
						<Section title="Details">
							{job.fields.map((field) => (
								<FieldRow key={field.label} label={field.label} value={field.value} />
							))}
						</Section>
					) : null}

					<Section>
						<Button onPress={() => openUrl(job.url)}>
							<Text>View on the St. Olaf jobs site</Text>
						</Button>
					</Section>
				</Form>
			</Host>

			{job.body ? (
				<View style={styles.body}>
					<Markdown source={job.body} />
				</View>
			) : null}
		</ScrollView>
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
					text={`A problem occured while loading: ${
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
			<Stack.Title>{job.title}</Stack.Title>
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
