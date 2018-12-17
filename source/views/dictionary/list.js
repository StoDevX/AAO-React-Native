// @flow

import * as React from 'react'
import {StyleSheet, RefreshControl, Platform} from 'react-native'
import {SearchableAlphabetListView} from '@frogpond/listview'
import {Column} from '@frogpond/layout'
import {
	Detail,
	Title,
	ListRow,
	ListSectionHeader,
	ListSeparator,
} from '@frogpond/lists'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {trackDefinitionOpen} from '@frogpond/analytics'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'

const getBundledData = () =>
	Promise.resolve(require('../../../docs/dictionary.json'))
const fetchDictionaryTerms = (forReload?: boolean): Promise<Array<WordType>> =>
	fetch(API('/dictionary'), {delay: forReload ? 500 : 0})
		.json()
		.then(body => body.data)

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
	allTerms: Array<WordType>,
	loading: boolean,
}

export class DictionaryView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Campus Dictionary',
		headerBackTitle: 'Dictionary',
	}

	state = {
		query: '',
		allTerms: [],
		loading: false,
	}

	componentDidMount() {
		this.fetchData()
	}

	refresh = async () => {
		this.setState(() => ({loading: true}))
		let allTerms = await fetchDictionaryTerms(true)
		this.setState(() => ({loading: false, allTerms}))
	}

	fetchData = async () => {
		let allTerms = await fetchDictionaryTerms()
		this.setState(() => ({allTerms}))
	}

	onPressRow = (data: WordType) => {
		trackDefinitionOpen(data.word)
		this.props.navigation.navigate('DictionaryDetailView', {item: data})
	}

	renderRow = ({item}: {item: WordType}) => (
		<ListRow
			arrowPosition="none"
			contentContainerStyle={styles.row}
			onPress={() => this.onPressRow(item)}
		>
			<Column>
				<Title lines={1}>{item.word}</Title>
				<Detail lines={2} style={styles.rowDetailText}>
					{item.definition}
				</Detail>
			</Column>
		</ListRow>
	)

	renderSectionHeader = ({title}: {title: string}) => (
		<ListSectionHeader style={styles.rowSectionHeader} title={title} />
	)

	renderSeparator = (sectionId: string, rowId: string) => (
		<ListSeparator key={`${sectionId}-${rowId}`} />
	)

	performSearch = (text: string) => {
		this.setState(() => ({query: text}))
	}

	render() {
		const refreshControl = (
			<RefreshControl
				onRefresh={this.refresh}
				refreshing={this.state.loading}
			/>
		)

		let results = this.state.allTerms
		if (this.state.query) {
			let {query, allTerms} = this.state
			query = query.toLowerCase()
			results = allTerms.filter(term =>
				termToArray(term).some(word => word.startsWith(query)),
			)
		}

		return (
			<SearchableAlphabetListView
				cell={this.renderRow}
				cellHeight={
					ROW_HEIGHT +
					(Platform.OS === 'ios'
						? (11 / 12) * StyleSheet.hairlineWidth
						: 0)
				}
				data={groupBy(results, item => item.word[0])}
				onSearch={this.performSearch}
				query={this.state.query}
				refreshControl={refreshControl}
				renderSeparator={this.renderSeparator}
				sectionHeader={this.renderSectionHeader}
				sectionHeaderHeight={SECTION_HEADER_HEIGHT}
			/>
		)
	}
}
