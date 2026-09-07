import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {useQuery} from '@tanstack/react-query'
import {Stack, useRouter} from 'expo-router'

import {dictionaryOptions} from '../../../source/features/dictionary/query'
import {
	filterEntries,
	groupEntries,
	normalizeEntry,
} from '../../../source/features/dictionary/lib/entry'

import {
	Detail,
	largeListProps,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'

import {SearchBar} from '../../../source/components/search-bar'

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	rowDetailText: {
		fontSize: 14,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function DictionaryView(): React.ReactNode {
	let router = useRouter()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data = [], error, refetch, isLoading, isError, isRefetching} = useQuery(dictionaryOptions)

	let filtered = React.useMemo(() => {
		return groupEntries(filterEntries(data.map(normalizeEntry), searchQuery))
	}, [data, searchQuery])

	// The search chrome is bound to component state (the change handler
	// updates query), so it can't move to a static outer component.
	// Compute it once and render it in every branch, so the user always
	// has a search bar to type into or clear.
	let searchChrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />
		</>
	)

	if (isError) {
		return (
			<>
				{searchChrome}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${error}`}
				/>
			</>
		)
	}

	return (
		<>
			{searchChrome}

			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={
					searchQuery ? (
						<NoticeView text={`No results found for "${searchQuery}"`} />
					) : isLoading ? (
						<LoadingView />
					) : (
						<NoticeView text="No results found." />
					)
				}
				contentContainerStyle={styles.contentContainer}
				contentInsetAdjustmentBehavior="automatic"
				keyExtractor={(item, index) => item.word + index}
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="never"
				onRefresh={refetch}
				refreshing={isRefetching}
				renderItem={({item}) => {
					return (
						<ListRow
							arrowPosition="top"
							onPress={() =>
								router.push({
									pathname: '/Dictionary/[word]',
									params: {word: item.word},
								})
							}
						>
							<Title lines={1}>{item.word}</Title>
							<Detail lines={2} style={styles.rowDetailText}>
								{item.senses[0].definition}
							</Detail>
						</ListRow>
					)
				}}
				renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
				sections={filtered}
				style={styles.wrapper}
				{...largeListProps}
			/>
		</>
	)
}

export default function DictionaryPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Dictionary</Stack.Title>
			<DictionaryView />
		</>
	)
}
