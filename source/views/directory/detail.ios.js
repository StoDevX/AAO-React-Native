// @flow
import React from 'react'
import {ScrollView, View, Text, StyleSheet, Image} from 'react-native'
import cleanContact from './clean-contact'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import {Title, Detail} from '@frogpond/lists'
import map from 'lodash/map'
import {
	TableView,
	Section,
	Cell,
	MultiLineLeftDetailCell,
} from '@frogpond/tableview'
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

				<TableView>
					<Contact
						email={email}
						office={office}
						officeHours={officeHours}
						phone={phone}
						profile={profile}
					/>

					<Departments departments={departments} />
				</TableView>

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
		<Cell cellStyle="LeftDetail" detail="Office" title={office} />
	) : null

	const contactPhone = phone ? (
		<Cell
			accessory="DisclosureIndicator"
			cellStyle="LeftDetail"
			detail="Phone"
			onPress={() => callPhone(phone, {prompt: false})}
			title={phone}
		/>
	) : null

	const contactEmail = email ? (
		<Cell
			accessory="DisclosureIndicator"
			cellStyle="LeftDetail"
			detail="Email"
			onPress={() => sendEmail({to: [email], subject: '', body: ''})}
			title={email}
		/>
	) : null

	const contactOfficeHours = officeHours ? (
		<MultiLineLeftDetailCell
			cellStyle="LeftDetail"
			detail="Office Hours"
			title={officeHours}
		/>
	) : null

	const contactProfile = profile ? (
		<Cell
			accessory="DisclosureIndicator"
			cellStyle="LeftDetail"
			detail="Profile"
			onPress={() => openUrl(profile)}
			title={profile}
		/>
	) : null

	return contactOfficeHours ||
		contactOffice ||
		contactPhone ||
		contactEmail ||
		contactProfile ? (
		<Section header="ABOUT">
			{contactOffice}
			{contactPhone}
			{contactEmail}
			{contactOfficeHours}
			{contactProfile}
		</Section>
	) : null
}

function Departments({departments}) {
	const header = departments.length > 1 ? 'DEPARTMENTS' : 'DEPARTMENT'
	return departments.length ? (
		<Section header={header}>
			{map(departments, (dept, key) => (
				<Cell
					key={key}
					accessory="DisclosureIndicator"
					cellStyle="Detail"
					detail="Department"
					onPress={() => openUrl(dept.href)}
					title={dept.name}
				/>
			))}
		</Section>
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
})
