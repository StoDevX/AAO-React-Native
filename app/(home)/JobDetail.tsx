import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Text, ScrollView, StyleSheet, TextProps} from 'react-native'
import {sendEmail} from '../../source/components/send-email'
import {callPhone} from '../../source/components/call-phone'
import {Cell, Section, TableView} from '@frogpond/tableview'
import {SelectableCell, PushButtonCell} from '@frogpond/tableview/cells'
import {openUrl} from '@frogpond/open-url'
import moment from 'moment'
import * as c from '@frogpond/colors'
import type {JobType} from '../../source/features/sis/student-work/types'
import {decode} from '@frogpond/html-lib'

import {jobByIdOptions} from '../../source/features/sis/student-work/query'
import {shareJob} from '../../source/features/sis/student-work/lib'
import {LoadingView, NoticeView} from '@frogpond/notice'

const styles = StyleSheet.create({
	lastUpdated: {
		paddingBottom: 20,
	},
	footer: {
		fontSize: 10,
		color: c.secondaryLabel,
		textAlign: 'center',
	},
	title: {
		color: c.label,
		fontSize: 36,
		textAlign: 'center',
		marginHorizontal: 18,
		marginVertical: 10,
	},
})

const Title = (props: TextProps) => <Text {...props} style={[styles.title, props.style]} />

function ContactInformation({job}: {job: JobType}) {
	let office = job.office ? (
		<Cell cellStyle="LeftDetail" detail="Office" title={job.office} />
	) : null

	let name = job.contactName
	let contactName = name ? <Cell cellStyle="LeftDetail" detail="Contact" title={name} /> : null

	let email = job.contactEmail
	let contactEmail = name ? (
		<Cell
			accessory={email ? 'DisclosureIndicator' : undefined}
			cellStyle="LeftDetail"
			detail="Email"
			onPress={() => (email ? sendEmail({to: [email], subject: job.title, body: ''}) : false)}
			title={email}
		/>
	) : null

	let contactNumber = job.contactPhone
	let contactPhone = contactNumber ? (
		<Cell
			accessory={contactNumber ? 'DisclosureIndicator' : undefined}
			cellStyle="LeftDetail"
			detail="Phone"
			onPress={() => (contactNumber ? callPhone(contactNumber, {title: name}) : false)}
			title={contactNumber}
		/>
	) : null

	return (
		<Section header="CONTACT INFORMATION">
			{office}
			{contactName}
			{contactEmail}
			{contactPhone}
		</Section>
	)
}

function JobInformation({job}: {job: JobType}) {
	let ending = job.hoursPerWeek === 'Full-time' ? '' : ' hrs/week'
	let hours = job.hoursPerWeek ? (
		<Cell cellStyle="LeftDetail" detail="Hours" title={job.hoursPerWeek + ending} />
	) : null

	let amount = job.timeOfHours ? (
		<Cell cellStyle="LeftDetail" detail="Time of Day" title={job.timeOfHours} />
	) : null

	let category = job.type ? (
		<Cell cellStyle="LeftDetail" detail="Category" title={job.type} />
	) : null

	let openPositions = job.openPositions ? (
		<Cell cellStyle="LeftDetail" detail="Positions" title={job.openPositions} />
	) : null

	let year = job.year ? <Cell cellStyle="LeftDetail" detail="Time Period" title={job.year} /> : null

	return (
		<Section header="JOB INFORMATION">
			{hours}
			{amount}
			{year}
			{category}
			{openPositions}
		</Section>
	)
}

function Description({job}: {job: JobType}) {
	return job.description ? (
		<Section header="DESCRIPTION">
			<SelectableCell text={decode(job.description)} />
		</Section>
	) : null
}

function Skills({job}: {job: JobType}) {
	return job.skills ? (
		<Section header="SKILLS">
			<SelectableCell text={decode(job.skills)} />
		</Section>
	) : null
}

function Comments({job}: {job: JobType}) {
	return job.comments ? (
		<Section header="COMMENTS">
			<SelectableCell text={decode(job.comments)} />
		</Section>
	) : null
}

function FirstYearAppropriate({job}: {job: JobType}) {
	return job.goodForIncomingStudents ? (
		<Section header="APPROPRIATE FOR FIRST-YEAR STUDENTS">
			<SelectableCell text={job.goodForIncomingStudents ? 'Yes' : 'No'} />
		</Section>
	) : null
}

function Timeline({job}: {job: JobType}) {
	return job.timeline ? (
		<Section header="TIMELINE">
			<SelectableCell text={decode(job.timeline)} />
		</Section>
	) : null
}

function OpenWebpage({job}: {job: JobType}) {
	return job.url ? (
		<Section header="">
			<PushButtonCell onPress={() => openUrl(job.url)} title="Open Posting" />
		</Section>
	) : null
}

function HowToApply({job}: {job: JobType}) {
	return job.howToApply ? (
		<Section header="HOW TO APPLY">
			<SelectableCell text={decode(job.howToApply)} />
		</Section>
	) : null
}

function LastUpdated({when}: {when: string}) {
	return when ? (
		<Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
			Last updated: {moment(when, 'MMMM D, YYYY').calendar()}
			{'\n'}
			Powered by St. Olaf Student Employment job postings
		</Text>
	) : null
}

type Props = {
	job: JobType
}

function JobDetailView({job}: Props): React.ReactNode {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<Title selectable={true}>{job.title}</Title>
			<TableView>
				<ContactInformation job={job} />
				<JobInformation job={job} />
				<FirstYearAppropriate job={job} />
				<Description job={job} />
				<Skills job={job} />
				<Comments job={job} />
				<HowToApply job={job} />
				<Timeline job={job} />
				<OpenWebpage job={job} />
			</TableView>
			<LastUpdated when={job.lastModified} />
		</ScrollView>
	)
}

export default function JobDetailPage(): React.ReactNode {
	let {jobId} = useLocalSearchParams<{jobId: string}>()

	let {data: job, isLoading, error, refetch} = useQuery(jobByIdOptions(jobId))

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
			<Stack.Toolbar>
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
