import React from 'react'
import {ScrollView, View, Text, StyleSheet} from 'react-native'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import {buildEmailAction, buildPhoneActions} from './helpers'
import * as c from '@frogpond/colors'
import type {
	CampusLocation,
	Department,
	DirectoryIconName,
	DirectoryIconProps,
} from './types'
import {
	Avatar,
	Title,
	Subheading,
	Chip,
	FAB,
	List,
	Portal,
} from 'react-native-paper'
import {RouteProp, useRoute, useNavigation} from 'expo-router'
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from 'expo-router-stack'
import {RootStackParamList} from '../../../source/navigation/types'

export const DetailNavigationOptions: NativeStackNavigationOptions = {
	title: 'Contact',
}

const createDirectoryIcon =
	(iconName: DirectoryIconName) => (props: DirectoryIconProps) => (
		<List.Icon {...props} icon={iconName} />
	)

export function DirectoryDetailView(): React.JSX.Element {
	// typing useNavigation's props to inform typescript about `push`
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	let route = useRoute<RouteProp<RootStackParamList, 'DirectoryDetail'>>()
	const {
		displayName,
		campusLocations,
		displayTitle,
		photo,
		officeHours,
		profileUrl,
		pronouns,
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
						icon={isFabOpen ? 'close' : 'dots-horizontal'}
						onStateChange={({open}) => {
							setIsFabOpen(open)
						}}
						open={isFabOpen}
						visible={true}
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
							icon="account-multiple-outline"
							onPress={() => {
								navigation.push('Directory', {
									queryType: 'department',
									queryParam: dept.name,
								})
							}}
							style={styles.departmentChip}
						>
							{dept.name}
						</Chip>
					))}
				</View>

				{pronouns?.length ? (
					<List.Item
						description={pronouns.join(', ').concat('')}
						left={createDirectoryIcon('handshake-outline')}
						title="Pronouns"
					/>
				) : null}

				{officeHours && (
					<List.Item
						description={officeHours.description}
						left={createDirectoryIcon('calendar-clock-outline')}
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
						left={createDirectoryIcon('email-outline')}
						onPress={() => {
							sendEmail({to: [email], subject: '', body: ''})
						}}
						title="Email"
					/>
				) : null}

				{campusLocations.map((loc: CampusLocation, i: number) => (
					<List.Item
						key={i}
						description={loc.shortLocation}
						left={createDirectoryIcon('map-marker-outline')}
						onPress={() => {
							callPhone(loc.phone)
						}}
						right={createDirectoryIcon('phone')}
						title={loc.display}
					/>
				))}

				{profileUrl ? (
					<List.Item
						description={profileUrl}
						left={createDirectoryIcon('link')}
						onPress={() => openUrl(profileUrl)}
						title="Professional Profile"
					/>
				) : null}

				{username ? (
					<List.Item
						left={createDirectoryIcon('open-in-new')}
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
		color: c.secondaryLabel,
		textAlign: 'center',
	},
	poweredBy: {
		paddingBottom: 20,
	},
})
