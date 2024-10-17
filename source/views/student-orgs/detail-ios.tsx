import * as React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import moment from 'moment'
import {Cell, Section, TableView} from '../../modules/tableview'
import {SelectableCell} from '../../modules/tableview/cells'
import * as c from '../../modules/colors'
import {openUrl} from '../../modules/open-url'
import {sendEmail} from '../../components/send-email'
import {showNameOrEmail} from './util'
import {decode} from '../../modules/html-lib'
import {useLocalSearchParams, useRoute} from 'expo-router'

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

export const NavigationKey = 'StudentOrgsDetail'

let StudentOrgsDetailView = (): React.JSX.Element => {
	let params = useLocalSearchParams()

	let {
		name: orgName,
		category,
		meetings,
		website,
		contacts,
		advisors,
		description,
		lastUpdated: orgLastUpdated,
	} = params.org

	return (
		<ScrollView>
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
								onPress={() => {
									sendEmail({to: [contact.email], subject: orgName})
								}}
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
								onPress={() => {
									sendEmail({to: [contact.email], subject: orgName})
								}}
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
	)
}

export {StudentOrgsDetailView as View}
