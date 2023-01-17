import * as c from '@frogpond/colors'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {DetailNavigationKey} from './detail'
import {useGroupedContacts} from './query'
import {ContactRow} from './row'
import type {ContactType} from './types'

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

	let {
		data = [],
		error,
		refetch,
		isRefetching,
	} = useGroupedContacts()

	let onPressContact = React.useCallback(
		(data: ContactType) =>
			navigation.navigate(DetailNavigationKey, {
				contact: data,
			}),
		[navigation],
	)

	if (status === 'error') {
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
				status === 'loading' ? (
					<LoadingView />
				) : (
					<NoticeView text="No results found." />
				)
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
