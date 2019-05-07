// @flow

import * as React from 'react'
import {StyleSheet, RefreshControl, Platform} from 'react-native'
import {SearchableAlphabetListView} from '@frogpond/listview'
import {
	Detail,
	Title,
	ListRow,
	ListSectionHeader,
	ListSeparator,
} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import groupBy from 'lodash/groupBy'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import {useAsync, type Result} from 'react-async'
import {useDebounce} from '@frogpond/use-debounce'

const fetchDictionaryTerms = (args: {
	signal: window.AbortController,
}): Promise<Array<WordType>> => {
	return fetch(API('/dictionary'), {signal: args.signal})
		.json()
		.then(body => body.data)
}

const ROW_HEIGHT = Platform.OS === 'ios' ? 76 : 89
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41
const CELL_HEIGHT =
	ROW_HEIGHT +
	(Platform.OS === 'ios' ? (11 / 12) * StyleSheet.hairlineWidth : 0)

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function termToArray(term: WordType) {
	return Array.from(
		new Set([...splitToArray(term.word), ...splitToArray(term.definition)]),
	)
}

const styles = StyleSheet.create({
	row: {
		height: ROW_HEIGHT,
	},
	rowSectionHeader: {
		height: SECTION_HEADER_HEIGHT,
	},
	rowDetailText: {
		fontSize: 14,
	},
})

type Props = TopLevelViewPropsType

export function DictionaryView(props: Props) {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data, error, reload, isPending}: Result<Array<WordType>> = useAsync(
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
		return groupBy(results, item => item.word[0])
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
			arrowPosition="none"
			contentContainerStyle={styles.row}
			onPress={() => props.navigation.navigate('DictionaryDetailView', {item})}
		>
			<Title lines={1}>{item.word}</Title>
			<Detail lines={2} style={styles.rowDetailText}>
				{item.definition}
			</Detail>
		</ListRow>
	)

	return (
		<SearchableAlphabetListView
			cell={renderRow}
			cellHeight={CELL_HEIGHT}
			data={grouped}
			onSearch={setQuery}
			query={query}
			refreshControl={
				<RefreshControl onRefresh={reload} refreshing={isPending} />
			}
			renderSeparator={(sectionId: string, rowId: string) => (
				<ListSeparator key={`${sectionId}-${rowId}`} />
			)}
			sectionHeader={({title}: {title: string}) => (
				<ListSectionHeader style={styles.rowSectionHeader} title={title} />
			)}
			sectionHeaderHeight={SECTION_HEADER_HEIGHT}
		/>
	)
}
DictionaryView.navigationOptions = {
	title: 'Campus Dictionary',
	headerBackTitle: 'Dictionary',
}
