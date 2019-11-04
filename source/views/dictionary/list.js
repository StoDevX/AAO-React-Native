// @flow

import * as React from 'react'
import {StyleSheet, RefreshControl, View, SectionList} from 'react-native'
import {
	Detail,
	Title,
	ListRow,
	ListSectionHeader,
	ListSeparator,
} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import {SearchBar} from '@frogpond/searchbar'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {white} from '@frogpond/colors'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import {useAsync, type AsyncState} from 'react-async'
import {useDebounce} from '@frogpond/use-debounce'

const fetchDictionaryTerms = (args: {
	signal: window.AbortController,
}): Promise<Array<WordType>> => {
	return fetch(API('/dictionary'), {signal: args.signal})
		.json()
		.then(body => body.data)
}

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function termToArray(term: WordType) {
	return Array.from(
		new Set([...splitToArray(term.word), ...splitToArray(term.definition)]),
	)
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: white,
	},
	rowDetailText: {
		fontSize: 14,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

type Props = TopLevelViewPropsType

export function DictionaryView(props: Props) {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data, error, reload, isPending}: AsyncState<?Array<WordType>> = useAsync(
		fetchDictionaryTerms,
	)

	let results = React.useMemo(() => {
		let allTerms = data || []

		if (!searchQuery) {
			return allTerms
		}

		return allTerms.filter(term =>
			termToArray(term).some(word => word.startsWith(searchQuery)),
		)
	}, [data, searchQuery])

	let grouped = React.useMemo(() => {
		return toPairs(groupBy(results, item => item.word[0])).map(([k, v]) => {
			return {title: k, data: v}
		})
	}, [results])

	// conditionals must come after all hooks
	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading the definitions"
			/>
		)
	}

	let renderRow = ({item}: {item: WordType}) => (
		<ListRow
			arrowPosition="top"
			onPress={() => props.navigation.navigate('DictionaryDetailView', {item})}
		>
			<Title lines={1}>{item.word}</Title>
			<Detail lines={2} style={styles.rowDetailText}>
				{item.definition}
			</Detail>
		</ListRow>
	)

	return (
		<View style={styles.wrapper}>
			<SearchBar onChange={setQuery} value={query} />

			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={
					<NoticeView text={`No results found for "${query}"`} />
				}
				contentContainerStyle={styles.contentContainer}
				keyExtractor={(item: WordType, index) => item.word + index}
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="never"
				refreshControl={
					<RefreshControl onRefresh={reload} refreshing={isPending} />
				}
				renderItem={renderRow}
				renderSectionHeader={({section: {title}}) => (
					<ListSectionHeader title={title} />
				)}
				sections={grouped}
				style={styles.wrapper}
			/>
		</View>
	)
}
DictionaryView.navigationOptions = {
	title: 'Campus Dictionary',
	headerBackTitle: 'Dictionary',
}
