import React from 'react'
import {ScrollView, Text, StyleSheet, Image} from 'react-native'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import {Title, Detail} from '@frogpond/lists'
import {
	TableView,
	Section,
	Cell,
	MultiLineLeftDetailCell,
} from '@frogpond/tableview'
import * as c from '@frogpond/colors'
import {entities} from '@frogpond/html-lib'
import type {DirectoryItem, Department, CampusLocation} from './types'
import type {TopLevelViewPropsTypeWithParams} from '../types'

type Props = TopLevelViewPropsTypeWithParams<{contact: DirectoryItem}>

export function DirectoryDetailView(props: Props): JSX.Element {
	const {
		displayName,
		campusLocations,
		displayTitle,
		photo,
		officeHours,
		profileUrl,
		email,
		departments,
	} = props.navigation.state.params.contact

	return (
		<ScrollView>
			<Image
				accessibilityIgnoresInvertColors={true}
				resizeMode="cover"
				source={{uri: photo}}
				style={styles.image}
			/>
			<Title style={[styles.header, styles.headerName]}>{displayName}</Title>
			<Detail style={[styles.header, styles.headerTitle]}>
				{displayTitle && entities.decode(displayTitle)}
			</Detail>

			<TableView>
				{officeHours || email || profileUrl ? (
					<Section header="ABOUT">
						{email ? (
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="LeftDetail"
								detail="Email"
								onPress={() => sendEmail({to: [email], subject: '', body: ''})}
								title={email}
							/>
						) : null}

						{officeHours && (
							<MultiLineLeftDetailCell
								accessory={officeHours.href ? 'DisclosureIndicator' : undefined}
								detail={officeHours.title}
								onPress={
									officeHours.href ? () => openUrl(officeHours.href) : null
								}
								title={officeHours.description}
							/>
						)}

						{profileUrl ? (
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="LeftDetail"
								detail="Profile"
								onPress={() => openUrl(profileUrl)}
								title={profileUrl}
							/>
						) : null}
					</Section>
				) : null}

				{campusLocations.map((loc: CampusLocation, i: number) => (
					<Section key={i} header="OFFICE">
						<Cell
							cellStyle="LeftDetail"
							detail="Location"
							title={loc.display}
						/>
						<Cell
							accessory="DisclosureIndicator"
							cellStyle="LeftDetail"
							detail="Phone"
							onPress={() => callPhone(loc.phone, {prompt: false})}
							title={loc.phone}
						/>
					</Section>
				))}

				{departments.length ? (
					<Section
						header={departments.length !== 1 ? 'DEPARTMENTS' : 'DEPARTMENT'}
					>
						{departments.map((dept: Department, key: number) => (
							<Cell
								key={key}
								accessory="DisclosureIndicator"
								cellStyle="Basic"
								detail="Department"
								onPress={() => openUrl(dept.href)}
								title={dept.name}
							/>
						))}
					</Section>
				) : null}
			</TableView>

			<Text selectable={true} style={[styles.footer, styles.poweredBy]}>
				Powered by the St. Olaf Directory
			</Text>
		</ScrollView>
	)
}
DirectoryDetailView.navigationOptions = {
	title: 'Contact',
}

const styles = StyleSheet.create({
	image: {
		width: 100,
		height: 100,
		alignSelf: 'center',
		borderRadius: 4,
		borderWidth: 0.2,
		borderColor: c.black,
		marginTop: 10,
	},
	header: {
		justifyContent: 'center',
		textAlign: 'center',
		marginHorizontal: 30,
	},
	headerName: {
		marginTop: 10,
		fontSize: 22,
		fontWeight: 'bold',
	},
	headerTitle: {
		marginBottom: 10,
		fontSize: 14,
	},
	footer: {
		fontSize: 10,
		color: c.iosDisabledText,
		textAlign: 'center',
	},
	poweredBy: {
		paddingBottom: 20,
	},
})
