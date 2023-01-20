import * as React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import moment from 'moment'
import {Cell, Section, TableView} from '@frogpond/tableview'
import {SelectableCell} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import {sendEmail} from '../../components/send-email'
import {showNameOrEmail} from './util'
import {decode} from '@frogpond/html-lib'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'

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
