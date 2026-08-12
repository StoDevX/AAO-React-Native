import * as c from '@frogpond/colors'
import {ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {Stack, useRouter} from 'expo-router'
import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {groupedContactsOptions} from '../../../source/features/contacts/query'
import {useQuery} from '@tanstack/react-query'
import {ContactRow} from '../../../source/features/contacts/row'
import type {ContactType} from '../../../source/features/contacts/types'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.secondarySystemGroupedBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

export default function ContactsPage(): React.ReactNode {
	let router = useRouter()

	let {
		data = [],
		error,
		refetch,
		isRefetching,
		isLoading,
	} = useQuery(groupedContactsOptions)

	let onPressContact = React.useCallback(
		(contactData: ContactType) =>
			router.push({
				pathname: '/Contacts/[title]',
				params: {title: contactData.title},
			}),
		[router],
	)

	let title = <Stack.Title>Important Contacts</Stack.Title>

	if (error) {
		return (
			<>
				{title}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	return (
		<>
			{title}
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={
					isLoading ? <LoadingView /> : <NoticeView text="No results found." />
				}
				contentContainerStyle={styles.contentContainer}
				contentInsetAdjustmentBehavior="automatic"
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
		</>
	)
}
