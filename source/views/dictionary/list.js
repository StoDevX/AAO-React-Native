// @flow

import * as React from 'react'
import {StyleSheet, RefreshControl, Platform} from 'react-native'
import {SearchableAlphabetListView} from '../components/searchable-alphabet-listview'
import {
	Detail,
	Title,
	ListRow,
	ListSectionHeader,
	ListSeparator,
} from '../components/list'
import {NoticeView} from '../components/notice'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {trackDefinitionOpen} from '../../analytics'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import {aaoGh} from '@app/fetch'
import {DataFetcher} from '@frogpond/data-fetcher'
import {age} from '@frogpond/age'

let dictionary = aaoGh({
	file: 'contact-info.json',
	version: 2,
	cacheControl: {
		maxAge: age.days(1),
		staleWhileRevalidate: true,
		staleIfOffline: true,
	},
})

const ROW_HEIGHT = Platform.OS === 'ios' ? 76 : 89
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41

const splitToArray = (str: string) => words(deburr(str.toLowerCase()))

const termToArray = (term: WordType) =>
	uniq([...splitToArray(term.word), ...splitToArray(term.definition)])

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

type State = {
	query: string,
}

type DataFetcherProps = {
	dictionary: {
		data: Array<WordType>,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
}

export class DictionaryView extends React.Component<Props, State> {
	static navigationOptions = {
		title: 'Campus Dictionary',
		headerBackTitle: 'Dictionary',
	}

	state = {
		query: '',
	}

	onPressRow = (data: WordType) => {
		trackDefinitionOpen(data.word)
		this.props.navigation.navigate('DictionaryDetailView', {item: data})
	}

	renderRow = ({item}: {item: WordType}) => {
		return (
			<ListRow
				arrowPosition="none"
				contentContainerStyle={styles.row}
				onPress={() => this.onPressRow(item)}
			>
				<Title lines={1}>{item.word}</Title>
				<Detail lines={2} style={styles.rowDetailText}>
					{item.definition}
				</Detail>
			</ListRow>
		)
	}

	renderSectionHeader = ({title}: {title: string}) => {
		return <ListSectionHeader style={styles.rowSectionHeader} title={title} />
	}

	renderSeparator = (sectionId: string, rowId: string) => {
		return <ListSeparator key={`${sectionId}-${rowId}`} />
	}

	performSearch = (text: ?string) => {
		this.setState(() => ({query: text ? text.toLowerCase() : ''}))
	}

	renderList = ({dictionary}: DataFetcherProps) => {
		let {data: allTerms, loading, refresh} = dictionary

		let refreshControl = (
			<RefreshControl onRefresh={refresh} refreshing={loading} />
		)

		let results = allTerms
		if (this.state.query) {
			let {query} = this.state
			results = allTerms.filter(term =>
				termToArray(term).some(word => word.startsWith(query)),
			)
		}

		let cellHeight =
			ROW_HEIGHT +
			(Platform.OS === 'ios' ? (11 / 12) * StyleSheet.hairlineWidth : 0)

		return (
			<SearchableAlphabetListView
				cell={this.renderRow}
				cellHeight={cellHeight}
				data={groupBy(results, item => item.word[0])}
				onSearch={this.performSearch}
				refreshControl={refreshControl}
				renderSeparator={this.renderSeparator}
				sectionHeader={this.renderSectionHeader}
				sectionHeaderHeight={SECTION_HEADER_HEIGHT}
			/>
		)
	}

	render() {
		return (
			<DataFetcher
				error={NoticeView}
				render={this.renderList}
				resources={{dictionary}}
			/>
		)
	}
}
