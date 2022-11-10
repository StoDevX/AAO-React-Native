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
} from '@frogpond/tableview'
import {MultiLineLeftDetailCell} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import type {Department, CampusLocation} from './types'
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RootStackParamList} from '../../../source/navigation/types'

export const DetailNavigationOptions: NativeStackNavigationOptions = {
	title: 'Contact',
}

export function DirectoryDetailView(): JSX.Element {
	let navigation = useNavigation()

	let route = useRoute<RouteProp<RootStackParamList, 'DirectoryDetail'>>()
	const {
		displayName,
		campusLocations,
		displayTitle,
		photo,
		officeHours,
		profileUrl,
		email,
		departments,
	} = route.params.contact

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
				{displayTitle}
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
									officeHours.href
										? () => officeHours.href && openUrl(officeHours.href)
										: undefined
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
						{Boolean(loc.display) && (
							<Cell
								cellStyle="LeftDetail"
								detail="Location"
								title={loc.display}
							/>
						)}
						{Boolean(loc.phone) && (
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="LeftDetail"
								detail="Phone"
								onPress={() => callPhone(loc.phone, {prompt: false})}
								title={loc.phone}
							/>
						)}
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
								onPress={() => {
									navigation.navigate('Directory', {
										queryType: 'Department',
										queryParam: dept.name,
									})
								}}
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
