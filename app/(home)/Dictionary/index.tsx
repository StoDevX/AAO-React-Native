import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {useQuery} from '@tanstack/react-query'
import {Stack, useRouter} from 'expo-router'

import {dictionaryOptions} from '../../../source/features/dictionary/query'
import type {WordType, DictionaryGroup} from '../../../source/features/dictionary/types'

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

import deburr from 'lodash/deburr'
import groupBy from 'lodash/groupBy'
import words from 'lodash/words'
import {SearchBar} from '../../../source/components/search-bar'

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function termToArray(term: WordType) {
	return Array.from(new Set([...splitToArray(term.word), ...splitToArray(term.definition)]))
}

function groupWords(wordsToGroup: WordType[]): DictionaryGroup[] {
	let grouped = groupBy(wordsToGroup, (w) => w.word[0] || '?')
	return Object.entries(grouped).map(([k, v]) => ({
		title: k,
		data: v,
	}))
}

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
		let grouped = groupWords(data)
		let filteredData = []
		for (let {title, data: items} of grouped) {
			let filteredItems = items.filter((item) =>
				termToArray(item).some((value) => value.includes(searchQuery)),
			)
			if (filteredItems.length) {
				filteredData.push({title, data: filteredItems})
			}
		}
		return filteredData
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
								{item.definition}
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
