import * as React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import moment from 'moment'
import {Cell, Section, TableView} from '@frogpond/tableview'
import {SelectableCell} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import {sendEmail} from '../../../source/components/send-email'
import {showNameOrEmail} from '../../../source/features/student-orgs/util'
import {decode} from '@frogpond/html-lib'
import {orgByNameOptions} from '../../../source/features/student-orgs/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

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
	footer: {
		fontSize: 10,
		color: c.secondaryLabel,
		textAlign: 'center',
	},
	lastUpdated: {
		paddingBottom: 10,
	},
	poweredBy: {
		paddingBottom: 20,
	},
})

export default function StudentOrgsDetailPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {data: org, isLoading, error, refetch} = useQuery(orgByNameOptions(name))

	let screen = <Stack.Screen options={{title: org?.name ?? name}} />

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
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

	if (!org) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find student org "${name}".`} />
			</>
		)
	}

	let {
		name: orgName,
		category,
		meetings,
		website,
		contacts,
		advisors,
		description,
		lastUpdated: orgLastUpdated,
	} = org

	return (
		<>
			{screen}
			<ScrollView contentInsetAdjustmentBehavior="automatic">
				<TableView>
					<Text selectable={true} style={styles.name}>
						{orgName}
					</Text>

					{category ? (
						<Section header="CATEGORY">
							<Cell cellStyle="Basic" title={category} />
						</Section>
					) : null}

					{meetings ? (
						<Section header="MEETINGS">
							<SelectableCell text={decode(meetings)} />
						</Section>
					) : null}

					{website ? (
						<Section header="WEBSITE">
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="Basic"
								onPress={() => {
									openUrl(website)
								}}
								title={website}
							/>
						</Section>
					) : null}

					{contacts.length ? (
						<Section header="CONTACT">
							{contacts.map((contact, i) => (
								<Cell
									key={i}
									accessory="DisclosureIndicator"
									cellStyle={contact.title ? 'Subtitle' : 'Basic'}
									detail={contact.title}
									onPress={() =>
										sendEmail({to: [contact.email], subject: orgName})
									}
									title={showNameOrEmail(contact)}
								/>
							))}
						</Section>
					) : null}

					{advisors.length ? (
						<Section header={advisors.length === 1 ? 'ADVISOR' : 'ADVISORS'}>
							{advisors.map((contact, i) => (
								<Cell
									key={i}
									accessory="DisclosureIndicator"
									cellStyle="Basic"
									onPress={() =>
										sendEmail({to: [contact.email], subject: orgName})
									}
									title={contact.name}
								/>
							))}
						</Section>
					) : null}

					{description ? (
						<Section header="DESCRIPTION">
							<SelectableCell text={decode(description)} />
						</Section>
					) : null}

					<Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
						Last updated:{' '}
						{moment(orgLastUpdated, 'MMMM, DD YYYY HH:mm:ss').calendar()}
					</Text>

					<Text selectable={true} style={[styles.footer, styles.poweredBy]}>
						Powered by the St. Olaf Student Orgs Database
					</Text>
				</TableView>
			</ScrollView>
		</>
	)
}
