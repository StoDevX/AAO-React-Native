// @flow

import * as React from 'react'
import {Async} from '@frogpond/async'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import {Detail, Title, ListRow, ListSectionHeader} from '@frogpond/lists'
import {TableView} from './tableview'

const dictionaryUrl = API('/dictionary')

type WordType = {word: string, definition: string}

function fetchDictionary(): Promise<Array<WordType>> {
	return fetch(dictionaryUrl)
		.json()
		.then(({data}) => data)
}

export function DictionaryView() {
	return (
		<Async promiseFn={fetchDictionary}>
			{({data, isLoading, reload, startedAt, finishedAt}) => (
				<TableView
					cell={DictionaryRow}
					data={data}
					finishedAt={finishedAt}
					keyExtractor={term => term.word}
					onRefresh={reload}
					refreshing={isLoading}
					searchableFields={['word', 'definition']}
					sectionHeader={ListSectionHeader}
					skimmer={true}
					skimmerKeyExtractor={(item: WordType) => item.word[0]}
					startedAt={startedAt}
				/>
			)}
		</Async>
	)
}

DictionaryView.navigationOptions = {
	title: 'Campus Dictionary',
	headerBackTitle: 'Dictionary',
}

function DictionaryRow({item}: {item: WordType}) {
	let onPressRow = () => {}

	return (
		<ListRow arrowPosition="none" onPress={() => onPressRow()}>
			<Title lines={1}>{item.word}</Title>
			<Detail lines={2}>{item.definition}</Detail>
		</ListRow>
	)
}
