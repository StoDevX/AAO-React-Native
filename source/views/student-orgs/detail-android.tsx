import * as React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'
import moment from 'moment'
import {Card} from '@frogpond/silly-card'
import * as c from '@frogpond/colors'
import {sendEmail} from '../../components/send-email'
import {openUrl} from '@frogpond/open-url'
import {showNameOrEmail} from './util'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

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
	description: {
		paddingTop: 13,
		paddingBottom: 13,
		paddingLeft: 16,
		paddingRight: 16,
		backgroundColor: c.white,
	},
	descriptionText: {
		fontSize: 16,
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

export const NavigationKey = 'StudentOrgsDetail' as const

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {name} = props.route.params.org
	return {
		title: name,
	}
}

let StudentOrgsDetailView = (): JSX.Element => {
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()

	let {
		name: orgName,
		category,
		meetings,
		website,
		contacts,
		advisors,
		description,
		lastUpdated: orgLastUpdated,
	} = route.params.org

	return (
		<ScrollView>
			<Text style={styles.name}>{orgName}</Text>

			{category ? (
				<Card header="Category" style={styles.card}>
					<Text style={styles.cardBody}>{category}</Text>
				</Card>
			) : null}

			{meetings ? (
				<Card header="Meetings" style={styles.card}>
					<Text style={styles.cardBody}>{meetings}</Text>
				</Card>
			) : null}

			{website ? (
				<Card header="Website" style={styles.card}>
					<Text onPress={() => openUrl(website)} style={styles.cardBody}>
						{website}
					</Text>
				</Card>
			) : null}

			{contacts.length ? (
				<Card header="Contact" style={styles.card}>
					{contacts.map((contact, i) => (
						<Text
							key={i}
							onPress={() => sendEmail({to: [contact.email], subject: orgName})}
							selectable={true}
							style={styles.cardBody}
						>
							{contact.title ? contact.title + ': ' : ''}
							{showNameOrEmail(contact)}
						</Text>
					))}
				</Card>
			) : null}

			{advisors.length ? (
				<Card
					header={advisors.length === 1 ? 'Advisor' : 'Advisors'}
					style={styles.card}
				>
					{advisors.map((contact, i) => (
						<Text
							key={i}
							onPress={() => sendEmail({to: [contact.email], subject: orgName})}
							selectable={true}
							style={styles.cardBody}
						>
							{contact.name} ({contact.email})
						</Text>
					))}
				</Card>
			) : null}

			{description ? (
				<Card header="Description" style={styles.card}>
					<View style={styles.description}>
						<Text style={styles.descriptionText}>{description}</Text>
					</View>
				</Card>
			) : null}

			<Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
				Last updated:{' '}
				{moment(orgLastUpdated, 'MMMM, DD YYYY HH:mm:ss').calendar()}
			</Text>

			<Text selectable={true} style={[styles.footer, styles.poweredBy]}>
				Powered by the St. Olaf Student Orgs Database
			</Text>
		</ScrollView>
	)
}

export {StudentOrgsDetailView as View}
