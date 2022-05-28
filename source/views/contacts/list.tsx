import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader, ListEmpty} from '@frogpond/lists'
import {ContactRow} from './row'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import * as c from '@frogpond/colors'
import type {ContactType} from './types'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {DetailNavigationKey} from './detail'
import delay from 'delay'

const fetchContacts = (forReload?: boolean): Promise<Array<ContactType>> =>
	fetch(API('/contacts'), {
		delay: forReload ? 500 : 0,
	})
		.json<{data: Array<ContactType>}>()
		.then((body) => body.data)

const groupContacts = (contacts: ContactType[]) => {
	let grouped = groupBy(contacts, (c) => c.category)
	return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

export let ContactsListView = (): JSX.Element => {
	let navigation = useNavigation()

	let [contacts, setContacts] = React.useState<Array<ContactType>>([])
	let [loading, setLoading] = React.useState(false)

	React.useEffect(() => {
		fetchData()
	}, [])

	let refresh = async (): Promise<void> => {
		const start = Date.now()
		setLoading(true)
		setContacts(await fetchContacts())

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		setLoading(false)
	}

	let fetchData = async () => {
		setContacts(await fetchContacts())
	}

	let onPressContact = React.useCallback(
		(data: ContactType) =>
			navigation.navigate(DetailNavigationKey, {
				contact: data,
			}),
		[navigation],
	)

	let renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	let renderItem = ({item}: {item: ContactType}) => (
		<ContactRow contact={item} onPress={onPressContact} />
	)

	let keyExtractor = (item: ContactType) => item.title

	let groupedData = groupContacts(contacts)

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<ListEmpty mode="bug" />}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={keyExtractor}
			onRefresh={refresh}
			refreshing={loading}
			renderItem={renderItem}
			renderSectionHeader={renderSectionHeader}
			sections={groupedData}
			style={styles.listContainer}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Important Contacts',
}
