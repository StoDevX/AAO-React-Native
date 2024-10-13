import * as React from 'react'
import {Text, View, ScrollView, StyleSheet} from 'react-native'
import {sendEmail} from '../../../components/send-email'
import {callPhone} from '../../../components/call-phone'
import {Card} from '@frogpond/silly-card'
import moment from 'moment'
import {openUrl} from '@frogpond/open-url'
import * as c from '@frogpond/colors'
import type {JobType} from './types'
import {ShareButton} from '@frogpond/navigation-buttons'
import {shareJob} from './lib'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'

const styles = StyleSheet.create({
	name: {
		textAlign: 'center',
		marginTop: 20,
		marginBottom: 15,
		paddingHorizontal: 5,
		color: c.label,
		fontSize: 32,
		fontWeight: '300',
	},
	subtitle: {
		textAlign: 'center',
		marginBottom: 15,
		paddingHorizontal: 5,
		color: c.secondaryLabel,
		fontSize: 16,
		fontWeight: '300',
	},
	card: {
		marginBottom: 20,
	},
	cardBody: {
		color: c.label,
		paddingTop: 13,
		paddingBottom: 13,
		paddingLeft: 16,
		paddingRight: 16,
		fontSize: 16,
	},
	lastUpdated: {
		paddingBottom: 20,
	},
	footer: {
		fontSize: 10,
		color: c.secondaryLabel,
		textAlign: 'center',
	},
})

function Title({job}: {job: JobType}) {
	return job.title || job.type ? (
		<View>
			<Text style={styles.name}>{job.title}</Text>
			<Text style={styles.subtitle}>{job.type}</Text>
		</View>
	) : null
}

function ContactInformation({job}: {job: JobType}) {
	let contactName = job.contactName
	let contactEmail = job.contactEmail
	let contactNumber = job.contactPhone
	let contactOffice = job.office

	return contactName || contactEmail || contactNumber || contactOffice ? (
		<Card header="Contact Information" style={styles.card}>
			<Text style={styles.cardBody}>{contactName}</Text>

			{contactEmail ? (
				<Text
					onPress={() =>
						job.contactEmail
							? sendEmail({to: [contactEmail], subject: job.title, body: ''})
							: null
					}
					style={styles.cardBody}
				>
					{contactEmail}
				</Text>
			) : null}

			{contactNumber ? (
				<Text
					onPress={() =>
						job.contactPhone
							? callPhone(contactNumber, {title: contactName})
							: null
					}
					style={styles.cardBody}
				>
					{contactNumber}
				</Text>
			) : null}

			{contactOffice ? (
				<Text style={styles.cardBody}>{contactOffice}</Text>
			) : null}
		</Card>
	) : null
}

function Hours({job}: {job: JobType}) {
	let ending = job.hoursPerWeek === 'Full-time' ? '' : ' hrs/week'
	return job.timeOfHours && job.hoursPerWeek ? (
		<Card header="Hours" style={styles.card}>
			<Text style={styles.cardBody}>
				{job.timeOfHours}
				{'\n'}
				{job.hoursPerWeek + ending}
			</Text>
		</Card>
	) : null
}

function JobInformation({job}: {job: JobType}) {
	return job.year || job.openPositions ? (
		<Card header="Job Information" style={styles.card}>
			<Text style={styles.cardBody}>
				{job.year ? `${job.year}\n\n` : null}
				{job.openPositions ? `Positions: ${job.openPositions}\n\n` : null}
				{job.goodForIncomingStudents
					? 'Appropriate for First Year Students'
					: 'Not Appropriate for First Year Students'}
			</Text>
		</Card>
	) : null
}

function Description({job}: {job: JobType}) {
	return job.description ? (
		<Card header="Description" style={styles.card}>
			<Text style={styles.cardBody}>{job.description}</Text>
		</Card>
	) : null
}

function Skills({job}: {job: JobType}) {
	return job.skills ? (
		<Card header="Skills" style={styles.card}>
			<Text style={styles.cardBody}>{job.skills}</Text>
		</Card>
	) : null
}

function Comments({job}: {job: JobType}) {
	return job.comments ? (
		<Card header="Comments" style={styles.card}>
			<Text style={styles.cardBody}>{job.comments}</Text>
		</Card>
	) : null
}

function HowToApply({job}: {job: JobType}) {
	return job.howToApply ? (
		<Card header="How To Apply" style={styles.card}>
			<Text style={styles.cardBody}>{job.howToApply}</Text>
		</Card>
	) : null
}

function Timeline({job}: {job: JobType}) {
	return job.timeline ? (
		<Card header="Timeline" style={styles.card}>
			<Text style={styles.cardBody}>{job.timeline}</Text>
		</Card>
	) : null
}

function OpenWebpage({job}: {job: JobType}) {
	return job.url ? (
		<Card header="Webpage" style={styles.card}>
			<Text
				key={job.id}
				onPress={() => openUrl(job.url)}
				style={styles.cardBody}
			>
				Open Posting
			</Text>
		</Card>
	) : null
}

function Links({job}: {job: JobType}) {
	let {links} = job
	return links.length ? (
		<Card header="LINKS" style={styles.card}>
			{links.map((url) => (
				<Text key={url} onPress={() => openUrl(url)} style={styles.cardBody}>
					{url}
				</Text>
			))}
		</Card>
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
		headerRight: () => <ShareButton onPress={() => { shareJob(job); }} />,
	}
}

export const JobDetailView = (): React.JSX.Element => {
	let route = useRoute<RouteProp<RootStackParamList, 'JobDetail'>>()
	let {job} = route.params

	return (
		<ScrollView>
			<Title job={job} />
			<ContactInformation job={job} />
			<JobInformation job={job} />
			<Hours job={job} />
			<Description job={job} />
			<Skills job={job} />
			<Comments job={job} />
			<Timeline job={job} />
			<HowToApply job={job} />
			<Links job={job} />
			<OpenWebpage job={job} />
			<LastUpdated when={job.lastModified} />
		</ScrollView>
	)
}

export {JobDetailView as View}
