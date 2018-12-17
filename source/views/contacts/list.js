// @flow

import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader, ListEmpty} from '@frogpond/lists'
import {ContactRow} from './row'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import * as c from '@frogpond/colors'
import type {ContactType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'

const getBundledData = () =>
	Promise.resolve(require('../../../docs/contact-info.json'))
const fetchContacts = (forReload?: boolean): Promise<Array<ContactType>> =>
	fetch(API('/contacts'), {
		delay: forReload ? 500 : 0,
	})
		.json()
		.then(body => body.data)

const groupContacts = (contacts: ContactType[]) => {
	const grouped = groupBy(contacts, c => c.category)
	return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
})

type Props = TopLevelViewPropsType

type State = {
	contacts: Array<ContactType>,
	loading: boolean,
}

export class ContactsListView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Important Contacts',
		headerBackTitle: 'Contacts',
	}

	state = {
		contacts: [],
		loading: false,
	}

	componentDidMount() {
		this.fetchData()
	}

	refresh = async (): any => {
		this.setState(() => ({loading: true}))
		let contacts = await fetchContacts(true)
		this.setState(() => ({loading: false, contacts: contacts}))
	}

	fetchData = async () => {
		let contacts = await fetchContacts()
		this.setState(() => ({contacts: contacts}))
	}

	onPressContact = (contact: ContactType) => {
		this.props.navigation.navigate('ContactsDetailView', {
			contact,
		})
	}

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	renderItem = ({item}: {item: ContactType}) => (
		<ContactRow contact={item} onPress={this.onPressContact} />
	)

	keyExtractor = (item: ContactType) => item.title

	render() {
		const groupedData = groupContacts(this.state.contacts)
		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<ListEmpty mode="bug" />}
				data={groupedData}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={groupedData}
				style={styles.listContainer}
			/>
		)
	}
}
