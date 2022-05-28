import React from 'react'
import {ScrollView, View, Text, StyleSheet} from 'react-native'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import {buildEmailAction, buildPhoneActions} from './helpers'
import * as c from '@frogpond/colors'
import type {CampusLocation, Department} from './types'
import {
	Avatar,
	Title,
	Subheading,
	Chip,
	FAB,
	List,
	Portal,
} from 'react-native-paper'
import {RouteProp, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RootStackParamList} from '../../../source/navigation/types'

export const DetailNavigationOptions: NativeStackNavigationOptions = {
	title: 'Contact',
}

export function DirectoryDetailView(): JSX.Element {
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
		username,
	} = route.params.contact

	const [isFabOpen, setIsFabOpen] = React.useState(false)

	const fabActions = [
		...campusLocations.map((loc: CampusLocation) =>
			buildPhoneActions(loc, campusLocations.length),
		),
		...buildEmailAction(email),
	]

	const showFab = fabActions.length >= 1

	return (
		<>
			{showFab ? (
				<Portal>
					<FAB.Group
						actions={fabActions}
						icon={isFabOpen ? 'close' : 'more-vert'}
						onStateChange={({open}) => setIsFabOpen(open)}
						open={isFabOpen}
					/>
				</Portal>
			) : null}

			<ScrollView contentContainerStyle={showFab ? styles.fabbedContainer : {}}>
				<Avatar.Image size={96} source={{uri: photo}} style={styles.image} />

				<Title style={[styles.header, styles.headerName]}>{displayName}</Title>

				<Subheading style={[styles.header, styles.headerTitle]}>
					{displayTitle}
				</Subheading>

				<View style={styles.departments}>
					{departments.map((dept: Department, key: number) => (
						<Chip
							key={key}
							accessibilityLabel={`Department: ${dept.name}`}
							icon="group"
							onPress={() => openUrl(dept.href)}
							style={styles.departmentChip}
						>
							{dept.name}
						</Chip>
					))}
				</View>

				{officeHours && (
					<List.Item
						description={officeHours.description}
						left={(props) => (
							<List.Icon {...props} icon="sentiment-satisfied" />
						)}
						onPress={
							officeHours.href
								? () => officeHours.href && openUrl(officeHours.href)
								: undefined
						}
						title={officeHours.title}
					/>
				)}

				{email ? (
					<List.Item
						description={email}
						left={(props) => <List.Icon {...props} icon="email" />}
						onPress={() => sendEmail({to: [email], subject: '', body: ''})}
						title="Email"
					/>
				) : null}

				{campusLocations.map((loc: CampusLocation, i: number) => (
					<List.Item
						key={i}
						description={loc.shortLocation}
						left={(props) => <List.Icon {...props} icon="room" />}
						onPress={() => callPhone(loc.phone)}
						right={(props) => <List.Icon {...props} icon="phone" />}
						title={loc.display}
					/>
				))}

				{profileUrl ? (
					<List.Item
						description={profileUrl}
						left={(props) => <List.Icon {...props} icon="link" />}
						onPress={() => openUrl(profileUrl)}
						title="Professional Profile"
					/>
				) : null}

				{username ? (
					<List.Item
						left={(props) => <List.Icon {...props} icon="open-in-new" />}
						onPress={() =>
							openUrl(
								`https://www.stolaf.edu/directory/search?lookup=${username}`,
							)
						}
						title="View on the St. Olaf Directory"
					/>
				) : null}

				<Text selectable={true} style={[styles.footer, styles.poweredBy]}>
					Powered by the St. Olaf Directory
				</Text>
			</ScrollView>
		</>
	)
}

const styles = StyleSheet.create({
	image: {
		alignSelf: 'center',
		marginTop: 10,
	},
	departments: {
		flexDirection: 'row',
		justifyContent: 'center',
		flexWrap: 'wrap',
	},
	departmentChip: {
		margin: 2,
	},
	fabbedContainer: {
		paddingBottom: 50,
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
