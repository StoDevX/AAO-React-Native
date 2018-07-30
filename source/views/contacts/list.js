// @flow

import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {ListEmpty} from '../components/list'
import {ContactRow} from './row'
import {NoticeView} from '../components/notice'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import * as c from '../components/colors'
import type {ContactType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {aaoGh} from '@app/fetch'
import {DataFetcher} from '@frogpond/data-fetcher'
import {age} from '@frogpond/age'
import mem from 'mem'
import QuickLRU from 'quick-lru'

let importantContacts = aaoGh({
	file: 'contact-info.json',
	version: 2,
	cacheControl: {
		maxAge: age.days(1),
		staleWhileRevalidate: true,
		staleIfOffline: true,
	},
})

function groupContacts(contacts: Array<ContactType>) {
	const grouped = groupBy(contacts, c => c.category)
	return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

let memGroupContacts = mem(groupContacts, {cache: new QuickLRU({maxSize: 1})})

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
})

type Props = TopLevelViewPropsType

type DataFetcherProps = {
	importantContacts: {
		data: Array<ContactType>,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
}

export class ContactsListView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Important Contacts',
		headerBackTitle: 'Contacts',
	}

	onPressContact = (contact: ContactType) => {
		this.props.navigation.navigate('ContactsDetailView', {
			contact,
		})
	}

	renderSectionHeader = ({section: {title}}: any) => {
		return <ListSectionHeader title={title} />
	}

	renderItem = ({item}: {item: ContactType}) => {
		return <ContactRow contact={item} onPress={this.onPressContact} />
	}

	keyExtractor = (item: ContactType) => item.title

	renderList = ({importantContacts}: DataFetcherProps) => {
		let {data: contacts, loading, refresh} = importantContacts
		let grouped = memGroupContacts(contacts)

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<ListEmpty mode="bug" />}
				contentContainerStyle={styles.listContainer}
				keyExtractor={this.keyExtractor}
				onRefresh={refresh}
				refreshing={loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={grouped}
			/>
		)
	}

	render() {
		return (
			<DataFetcher
				error={NoticeView}
				render={this.renderList}
				resources={{importantContacts}}
			/>
		)
	}
}
