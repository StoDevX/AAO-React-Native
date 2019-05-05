// @flow

import React from 'react'
import {ScrollView, Text, StyleSheet, Image} from 'react-native'
import {Card} from '@frogpond/silly-card'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import {Title, Detail} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import type {DirectoryItem} from './types'
import type {TopLevelViewPropsTypeWithParams} from '../types'

type Props = TopLevelViewPropsTypeWithParams<{contact: DirectoryItem}>

export function DirectoryDetailView(props: Props) {
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
			<Image source={{uri: photo}} style={styles.image} />
			<Title style={[styles.header, styles.headerName]}>{displayName}</Title>
			<Detail style={[styles.header, styles.headerTitle]}>
				{displayTitle}
			</Detail>

			{officeHours ? (
				<Card header="Office Hours" style={styles.card}>
					<Text style={styles.cardBody}>{officeHours}</Text>
				</Card>
			) : null}

			{email ? (
				<Card header="Email" style={styles.card}>
					<Text
						onPress={() => sendEmail({to: [email], subject: '', body: ''})}
						style={styles.cardBody}
					>
						{email}
					</Text>
				</Card>
			) : null}

			{campusLocations.map((loc, i) => {
				return (
					<Card key={i} header="Office" style={styles.card}>
						<Text style={styles.cardBody}>Room: {loc.display}</Text>
						<Text
							onPress={() => callPhone(loc.phone, {prompt: false})}
							style={styles.cardBody}
						>
							Phone: {loc.phone}
						</Text>
					</Card>
				)
			})}

			{profileUrl ? (
				<Card header="Profile" style={styles.card}>
					<Text onPress={() => openUrl(profileUrl)} style={styles.cardBody}>
						{profileUrl}
					</Text>
				</Card>
			) : null}

			{departments.length ? (
				<Card
					header={departments.length > 1 ? 'Departments' : 'Department'}
					style={styles.card}
				>
					{departments.map((dept, key) => (
						<Text
							key={key}
							onPress={() => openUrl(dept.href)}
							style={styles.cardBody}
						>
							{dept.name}
						</Text>
					))}
				</Card>
			) : null}

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
		borderRadius: 50,
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
	card: {
		marginBottom: 20,
	},
	cardBody: {
		color: c.black,
		paddingTop: 13,
		paddingBottom: 13,
		paddingLeft: 16,
		paddingRight: 16,
		fontSize: 16,
	},
})
