// @flow
import * as React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import {sendEmail} from '../../../components/send-email'
import {callPhone} from '../../../components/call-phone'
import {
	Cell,
	Section,
	TableView,
	SelectableCell,
	PushButtonCell,
} from '@frogpond/tableview'
import {openUrl} from '@frogpond/open-url'
import moment from 'moment'
import * as c from '@frogpond/colors'
import type {JobType} from './types'
import glamorous from 'glamorous-native'
import {ShareButton} from '@frogpond/navigation-buttons'
import {shareJob, createJobFullUrl} from './lib'
import {entities} from '@frogpond/html-lib'

const styles = StyleSheet.create({
	lastUpdated: {
		paddingBottom: 20,
	},
	footer: {
		fontSize: 10,
		color: c.iosDisabledText,
		textAlign: 'center',
	},
})

const Title = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginHorizontal: 18,
	marginVertical: 10,
})

function ContactInformation({job}: {job: JobType}) {
	const office = job.office ? (
		<Cell cellStyle="LeftDetail" detail="Office" title={job.office} />
	) : null

	const name = job.contactName
	const contactName = name ? (
		<Cell cellStyle="LeftDetail" detail="Contact" title={name} />
	) : null

	const email = job.contactEmail
	const contactEmail = name ? (
		<Cell
			accessory={email ? 'DisclosureIndicator' : undefined}
			cellStyle="LeftDetail"
			detail="Email"
			onPress={() =>
				email ? sendEmail({to: [email], subject: job.title, body: ''}) : null
			}
			title={email}
		/>
	) : null

	const contactNumber = job.contactPhone
	const contactPhone = contactNumber ? (
		<Cell
			accessory={contactNumber ? 'DisclosureIndicator' : undefined}
			cellStyle="LeftDetail"
			detail="Phone"
			onPress={() => (contactNumber ? callPhone(contactNumber) : null)}
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
	const ending = job.hoursPerWeek === 'Full-time' ? '' : ' hrs/week'
	const hours = job.hoursPerWeek ? (
		<Cell
			cellStyle="LeftDetail"
			detail="Hours"
			title={job.hoursPerWeek + ending}
		/>
	) : null

	const amount = job.timeOfHours ? (
		<Cell cellStyle="LeftDetail" detail="Time of Day" title={job.timeOfHours} />
	) : null

	const category = job.type ? (
		<Cell cellStyle="LeftDetail" detail="Category" title={job.type} />
	) : null

	const openPositions = job.openPositions ? (
		<Cell cellStyle="LeftDetail" detail="Positions" title={job.openPositions} />
	) : null

	const year = job.year ? (
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
			<SelectableCell text={entities.decode(job.description)} />
		</Section>
	) : null
}

function Skills({job}: {job: JobType}) {
	return job.skills ? (
		<Section header="SKILLS">
			<SelectableCell text={entities.decode(job.skills)} />
		</Section>
	) : null
}

function Comments({job}: {job: JobType}) {
	return job.comments ? (
		<Section header="COMMENTS">
			<SelectableCell text={entities.decode(job.comments)} />
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
			<SelectableCell text={entities.decode(job.timeline)} />
		</Section>
	) : null
}

function OpenWebpage({job}: {job: JobType}) {
	return job.id ? (
		<Section header="">
			<PushButtonCell
				onPress={() => openUrl(createJobFullUrl(job))}
				title="Open Posting"
			/>
		</Section>
	) : null
}

function HowToApply({job}: {job: JobType}) {
	return job.howToApply ? (
		<Section header="HOW TO APPLY">
			<SelectableCell text={entities.decode(job.howToApply)} />
		</Section>
	) : null
}

function LastUpdated({when}: {when: string}) {
	return when ? (
		<Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
			Last updated: {moment(when, 'YYYY/MM/DD').calendar()}
			{'\n'}
			Powered by St. Olaf Student Employment job postings
		</Text>
	) : null
}

type Props = {
	navigation: {state: {params: {job: JobType}}},
}

export class JobDetailView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: any) => {
		const {job} = navigation.state.params
		return {
			title: job.title,
			headerRight: <ShareButton onPress={() => shareJob(job)} />,
		}
	}

	render() {
		const job = this.props.navigation.state.params.job

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
}
