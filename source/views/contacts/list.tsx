import * as c from '@frogpond/colors'
import {ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useNavigation} from 'expo-router'
import {NativeStackNavigationOptions} from 'expo-router-stack'
import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {DetailNavigationKey} from './detail'
import {useGroupedContacts} from './query'
import {ContactRow} from './row'
import type {ContactType} from './types'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.secondarySystemGroupedBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

export let ContactsListView = (): React.JSX.Element => {
	let navigation = useNavigation()

	let {
		data = [],
		error,
		refetch,
		isRefetching,
		isLoading,
	} = useGroupedContacts()

	let onPressContact = React.useCallback(
		(contactData: ContactType) => {
			navigation.navigate(DetailNavigationKey, {contact: contactData})
		},
		[navigation],
	)

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No results found." />
			}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(item) => item.title}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<ContactRow contact={item} onPress={onPressContact} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={data}
			style={styles.listContainer}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Important Contacts',
}
