// @flow
import React from 'react'
import {ScrollView, View, Text, StyleSheet, Image} from 'react-native'
import cleanContact from './clean-contact'
import {Card} from '../../components/card'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import {Title, Detail} from '@frogpond/lists'
import map from 'lodash/map'
import * as c from '@frogpond/colors'
import type {DirectoryType} from './types'
import type {TopLevelViewPropsType} from '../types'

export class DirectoryDetailView extends React.Component {
	static navigationOptions = {
		title: 'Contact',
	}

	props: TopLevelViewPropsType & {
		navigation: {state: {params: {contact: DirectoryType}}},
	}

	render() {
		const {
			name,
			title,
			photo,
			office,
			officeHours,
			phone,
			profile,
			email,
			departments,
		} = cleanContact(this.props.navigation.state.params.contact)

		return (
			<ScrollView>
				<Header name={name} photo={photo} title={title} />

				<Contact
					email={email}
					office={office}
					officeHours={officeHours}
					phone={phone}
					profile={profile}
				/>

				<Departments departments={departments} />

				<Text selectable={true} style={[styles.footer, styles.poweredBy]}>
					Powered by the St. Olaf Directory
				</Text>
			</ScrollView>
		)
	}
}

function Header({photo, name, title}) {
	return (
		<View>
			<Image source={{uri: photo}} style={styles.image} />
			<Title style={[styles.header, styles.headerName]}>{name}</Title>
			<Detail style={[styles.header, styles.headerTitle]}>{title}</Detail>
		</View>
	)
}

function Contact({email, office, officeHours, phone, profile}) {
	const contactOffice = office ? (
		<Card header="Office" style={styles.card}>
			<Text style={styles.cardBody}>{office}</Text>
		</Card>
	) : null

	const contactPhone = phone ? (
		<Card header="Phone" style={styles.card}>
			<Text
				onPress={() => callPhone(phone, {prompt: false})}
				style={styles.cardBody}
			>
				{phone}
			</Text>
		</Card>
	) : null

	const contactEmail = email ? (
		<Card header="Email" style={styles.card}>
			<Text
				onPress={() => sendEmail({to: [email], subject: '', body: ''})}
				style={styles.cardBody}
			>
				{phone}
			</Text>
		</Card>
	) : null

	const contactOfficeHours = officeHours ? (
		<Card header="Office Hours" style={styles.card}>
			<Text style={styles.cardBody}>{officeHours}</Text>
		</Card>
	) : null

	const contactProfile = profile ? (
		<Card header="Profile" style={styles.card}>
			<Text onPress={() => openUrl(profile)} style={styles.cardBody}>
				{profile}
			</Text>
		</Card>
	) : null

	return contactPhone ||
		contactOffice ||
		contactEmail ||
		contactOfficeHours ||
		contactProfile ? (
		<View>
			{contactPhone}
			{contactOffice}
			{contactEmail}
			{contactOfficeHours}
			{contactProfile}
		</View>
	) : null
}

function Departments({departments}) {
	const header = departments.length > 1 ? 'DEPARTMENTS' : 'DEPARTMENT'
	return departments.length ? (
		<Card header={header} style={styles.card}>
			{map(departments, (dept, key) => (
				<Text
					key={key}
					onPress={() => openUrl(dept.href)}
					style={styles.cardBody}
				>
					{dept.name}
				</Text>
			))}
		</Card>
	) : null
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
