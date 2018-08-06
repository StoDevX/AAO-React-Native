// @flow
import * as React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import moment from 'moment'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import * as c from '../components/colors'
import type {StudentOrgType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {openUrl} from '../components/open-url'
import {sendEmail} from '../components/send-email'
import {cleanOrg, showNameOrEmail} from './util'
import {SelectableCell} from '../components/cells/selectable'

const styles = StyleSheet.create({
	name: {
		textAlign: 'center',
		marginTop: 20,
		marginBottom: 15,
		paddingHorizontal: 5,
		color: c.black,
		fontSize: 32,
		fontWeight: '300',
	},
	footer: {
		fontSize: 10,
		color: c.iosDisabledText,
		textAlign: 'center',
	},
	lastUpdated: {
		paddingBottom: 10,
	},
	poweredBy: {
		paddingBottom: 20,
	},
})

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {org: StudentOrgType}}},
}

export class StudentOrgsDetailView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: any) => {
		const {org} = navigation.state.params
		return {
			title: org.name,
		}
	}

	render() {
		const {
			name: orgName,
			category,
			meetings,
			website,
			contacts,
			advisors,
			description,
			lastUpdated: orgLastUpdated,
		} = cleanOrg(this.props.navigation.state.params.org)

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
							<SelectableCell text={meetings} />
						</Section>
					) : null}

					{website ? (
						<Section header="WEBSITE">
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="Basic"
								onPress={() => openUrl(website)}
								title={website}
							/>
						</Section>
					) : null}

					{contacts.length ? (
						<Section header="CONTACT">
							{contacts.map((c, i) => (
								<Cell
									key={i}
									accessory="DisclosureIndicator"
									cellStyle={c.title ? 'Subtitle' : 'Basic'}
									detail={c.title}
									onPress={() => sendEmail({to: [c.email], subject: orgName})}
									title={showNameOrEmail(c)}
								/>
							))}
						</Section>
					) : null}

					{advisors.length ? (
						<Section header={advisors.length === 1 ? 'ADVISOR' : 'ADVISORS'}>
							{advisors.map((c, i) => (
								<Cell
									key={i}
									accessory="DisclosureIndicator"
									cellStyle="Basic"
									onPress={() => sendEmail({to: [c.email], subject: orgName})}
									title={c.name}
								/>
							))}
						</Section>
					) : null}

					{description ? (
						<Section header="DESCRIPTION">
							<SelectableCell text={description} />
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
}
