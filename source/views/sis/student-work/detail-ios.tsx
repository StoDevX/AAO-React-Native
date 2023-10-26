import * as React from 'react'
import {ScrollView, StyleSheet, Text, TextProps} from 'react-native'

import {RouteProp, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {decode} from '@frogpond/html-lib'
import {ShareButton} from '@frogpond/navigation-buttons'
import {openUrl} from '@frogpond/open-url'
import {Cell, Section, TableView} from '@frogpond/tableview'
import {PushButtonCell, SelectableCell} from '@frogpond/tableview/cells'

import {callPhone} from '../../../components/call-phone'
import {sendEmail} from '../../../components/send-email'
import {RootStackParamList} from '../../../navigation/types'
import {shareJob} from './lib'
import type {JobType} from './types'
import moment from 'moment'

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

const Title = (props: TextProps) => (
	<Text {...props} style={[styles.title, props.style]} />
)

function ContactInformation({job}: {job: JobType}) {
	let office = job.office ? (
		<Cell cellStyle="LeftDetail" detail="Office" title={job.office} />
	) : null

	let name = job.contactName
	let contactName = name ? (
		<Cell cellStyle="LeftDetail" detail="Contact" title={name} />
	) : null

	let email = job.contactEmail
	let contactEmail = name ? (
		<Cell
			accessory={email ? 'DisclosureIndicator' : undefined}
			cellStyle="LeftDetail"
			detail="Email"
			onPress={() =>
				email ? sendEmail({to: [email], subject: job.title, body: ''}) : false
			}
			title={email}
		/>
	) : null

	let contactNumber = job.contactPhone
	let contactPhone = contactNumber ? (
		<Cell
			accessory={contactNumber ? 'DisclosureIndicator' : undefined}
			cellStyle="LeftDetail"
			detail="Phone"
			onPress={() =>
				contactNumber ? callPhone(contactNumber, {title: name}) : false
			}
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
		<Cell
			cellStyle="LeftDetail"
			detail="Hours"
			title={job.hoursPerWeek + ending}
		/>
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

	let year = job.year ? (
		<Cell cellStyle="LeftDetail" detail="Time Period" title={job.year} />
	) : null

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

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, 'JobDetail'>
}): NativeStackNavigationOptions => {
	let {job} = props.route.params
	return {
		title: job.title,
		headerRight: () => <ShareButton onPress={() => shareJob(job)} />,
	}
}

export const JobDetailView = (): JSX.Element => {
	let route = useRoute<RouteProp<RootStackParamList, 'JobDetail'>>()
	let {job} = route.params

	return (
		<ScrollView>
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

export {JobDetailView as View}
